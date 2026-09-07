import { mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createPublicClient, http, type Address, type Hex } from "viem";
import { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES } from "@somnia-chain/markets-sdk";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";
import { evaluateLiveGate, humanSummary, renderLiveGateMarkdown, predictCreateAddresses, type CandidateProbe } from "../packages/live-gate/src/index.js";

const ROOT = resolve(import.meta.dirname, "..");
const RPC = process.env.SHANNON_RPC_HTTP ?? "https://dream-rpc.somnia.network";
const INDEXER = process.env.DREAMDEX_INDEXER ?? "https://dev.smk.somnia.host/v1/graphql";
const OWNER = "0x82Daa64CEDfA4d15615ADC6D577Dba0d9FfccF55" as Address;
const FORECASTER = "0x4EbF775fb6397C1a191614CDCd0E117e04B24AB5";
const RFT = "0x5b1B51cB062B7B782c9EC2Bd5674eFAdb5308F41";
const deadline = Date.now() + 45_000;
const bounded = async <T,>(p: Promise<T>, label: string): Promise<T> => Promise.race([p, new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label}_TIMEOUT`)), Math.min(8_000, Math.max(1, deadline - Date.now()))))]);
const json = (v: unknown) => JSON.stringify(v, (_, x) => typeof x === "bigint" ? x.toString() : x, 2) + "\n";

async function main() {
  const client = createPublicClient({ chain: somniaShannon, transport: http(RPC, { timeout: 8_000, retryCount: 0 }) });
  const exchange = new SomniaMarkets({ indexerUrl: INDEXER, chain: somniaShannon, addresses: SOMNIA_TESTNET_ADDRESSES, wsRpcUrl: "wss://api.infra.testnet.somnia.network/ws" });
  const head = await bounded(client.getBlock({ blockTag: "latest" }), "head");
  const block = Number(head.number);
  const timestamp = Number(head.timestamp);
  process.stderr.write(`[live-gate] head=${block}, discovering BTC/ETH binary markets\n`);
  let rows: any[] = [];
  let discoveryMeta: Record<string, unknown> = { indexer: INDEXER, directValidation: true };
  try { rows = await bounded((exchange as any).client.listBinaryMarkets({ limit: 100 }), "discovery"); }
  catch (e) { discoveryMeta = { ...discoveryMeta, fatalCode: "BLOCKED_LIVE_READ_FAILED", discoveryError: (e as Error).message }; }
  const probes: CandidateProbe[] = [];
  for (const row of rows.slice(0, 40)) {
    const marketId = String(row.marketId ?? row.id ?? "") as Hex;
    if (!/^0x[\da-f]{64}$/i.test(marketId)) continue;
    const asset = row.asset == null ? null : String(row.asset).toUpperCase();
    const intervalSec = row.intervalSec == null ? null : Number(row.intervalSec);
    try {
      const on: any = await bounded((exchange as any).client.getMarketOnchain(marketId), "market");
      const expirySec = Number(on.expiry);
      const direct = { ok: true, marketAddress: on.marketAddress, pool: on.pool, collateral: on.collateral, nonce: String(on.nonce), expirySec, status: Number(on.status), statusLabel: Number(on.status) === 1 ? "Trading" : String(on.status), readAtBlock: block };
      let book: any = { ok: false, error: "BOOK_READ_UNAVAILABLE", quoteDecimals: null, oneCollateralRaw: null, tickSizeRaw: null, lotSizeRaw: null, minQuantityRaw: null, bestBidRaw: null, bestAskRaw: null };
      try {
        const raw: any = await bounded((exchange as any).client.getBinaryOrderBook(on.pool, { depth: 1 }), "book");
        const bid = raw?.yes?.bids?.[0]?.[0] ?? raw?.bids?.[0]?.[0]; const ask = raw?.yes?.asks?.[0]?.[0] ?? raw?.asks?.[0]?.[0];
        book = { ok: bid != null && ask != null, error: bid != null && ask != null ? undefined : "BEST_BID_OR_BEST_ASK_MISSING", quoteDecimals: Number(on.decimals ?? 6), oneCollateralRaw: "1000000", tickSizeRaw: null, lotSizeRaw: null, minQuantityRaw: null, bestBidRaw: bid == null ? null : String(bid), bestAskRaw: ask == null ? null : String(ask) };
      } catch (e) { book.error = (e as Error).message; }
      probes.push({ discovered: { marketId, source: "indexer", marketType: "BINARY", asset, intervalSec, expirySec, tradingStartSec: row.tradingStart == null ? timestamp : Number(row.tradingStart), statusFromIndexer: row.status ?? row.clobStatus ?? null, marketAddress: row.marketAddress ?? null, poolAddress: row.poolAddress ?? row.binaryPoolAddress ?? null, createdAtBlock: row.createdAtBlock == null ? null : Number(row.createdAtBlock) }, direct, book });
    } catch (e) { probes.push({ discovered: { marketId, source: "indexer", marketType: "BINARY", asset, intervalSec, expirySec: row.expiry == null ? null : Number(row.expiry), tradingStartSec: null, statusFromIndexer: row.status ?? null, marketAddress: row.marketAddress ?? null, poolAddress: row.poolAddress ?? null, createdAtBlock: null }, direct: { ok: false, error: (e as Error).message }, book: { ok: false, error: "DIRECT_READ_FAILED", quoteDecimals: null, oneCollateralRaw: null, tickSizeRaw: null, lotSizeRaw: null, minQuantityRaw: null, bestBidRaw: null, bestAskRaw: null } }); }
  }
  const nonceResult = await bounded(fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getTransactionCount", params: [OWNER, `0x${block.toString(16)}`] }) }), "nonce").then(r => r.json() as Promise<any>).catch(e => ({ error: { message: (e as Error).message } }));
  const nonce = typeof nonceResult.result === "string" ? BigInt(nonceResult.result).toString() : "0";
  const metadata: any = JSON.parse(await readFile(resolve(ROOT, "deployments/shannon-v2.json"), "utf8"));
  const deployedAddresses = metadata.status === "SHANNON_WRITE_VERIFIED"
    ? { registryV2: metadata.contracts.CircuitRegistryV2, executorV2: metadata.contracts.CircuitExecutorV2 }
    : undefined;
  const evidence = evaluateLiveGate({ generatedAt: new Date().toISOString(), network: { chainId: 50312, headBlock: block, headTimestampSec: timestamp, rpcUrl: RPC, indexerUrl: INDEXER }, owner: { address: OWNER, nonce, source: "direct eth_getTransactionCount pinned to observed block", nonceReadFresh: typeof nonceResult.result === "string" }, forecaster: FORECASTER, rftRegistry: RFT, probes, gas: null, profileAProvenSufficient: false, discoveryMeta: { ...discoveryMeta, rowsReturned: rows.length, rowsProbed: probes.length, deployedAddresses, predictedAddresses: predictCreateAddresses(OWNER, nonce) }, deployedAddresses });
  await mkdir(resolve(ROOT, "evidence"), { recursive: true });
  await writeFile(resolve(ROOT, "evidence/live-gate-current.json"), json(evidence));
  await writeFile(resolve(ROOT, "docs/M4_3_2_LIVE_AUTHORIZATION_PACKET.md"), renderLiveGateMarkdown(evidence));
  process.stdout.write(humanSummary(evidence) + "\n" + json(evidence));
  process.exit(0);
}
main().catch(async (e: unknown) => { const packet = { status: "BLOCKED_LIVE_READ_FAILED", error: (e as Error).message, sideEffects: { chainWrites: false, funding: false, signatures: false, broadcasts: false } }; await mkdir(resolve(ROOT, "evidence"), { recursive: true }); await writeFile(resolve(ROOT, "evidence/live-gate-current.json"), json(packet)); process.stdout.write(json(packet)); process.exit(0); });
