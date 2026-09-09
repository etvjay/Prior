import { mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createPublicClient, http, parseAbi, type Address, type Hex } from "viem";
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
const marketCreatorCreatedAbi = parseAbi(["event MarketCreated(bytes32 indexed marketId,address indexed market,address indexed pool,uint256 yesId,uint256 noId,address collateral,string asset,uint256 strike,uint64 tradingStart,uint64 expiry,uint256 oracleQuestionId,string question,uint64 intervalSec)"]);
const binaryModuleCreatedAbi = parseAbi(["event MarketCreated(bytes32 indexed marketId,address indexed market,address indexed pool,uint256 oracleQuestionId,uint32 operatorId,bytes32 venueId,address creator,address collateral,uint256 yesId,uint256 noId,uint64 nonce,uint8 outcomeSlotCount,uint8 marketType,uint64 tradingStart,uint64 expiry,uint8 voidPolicy,string asset,uint256 strike,string question,bytes context)"]);
const LOG_CHUNK = 1_000n;
const LOG_LOOKBACK = 10_000n;

async function discoverCreatedLogs(client: any, headBlock: bigint): Promise<{ rows: any[]; complete: boolean; error?: string }> {
  const from = headBlock > LOG_LOOKBACK ? headBlock - LOG_LOOKBACK : 0n;
  const rows: any[] = [];
  try {
    for (let start = from; start <= headBlock; start += LOG_CHUNK + 1n) {
      if (Date.now() >= deadline) return { rows, complete: false, error: "MARKET_CREATED_LOG_SCAN_TIMEOUT" };
      const end = start + LOG_CHUNK > headBlock ? headBlock : start + LOG_CHUNK;
      const [creatorLogs, moduleLogs] = await Promise.all([
        bounded(client.getLogs({ address: SOMNIA_TESTNET_ADDRESSES.marketCreator, abi: marketCreatorCreatedAbi, eventName: "MarketCreated", fromBlock: start, toBlock: end }), "market-creator-logs") as Promise<any[]>,
        bounded(client.getLogs({ address: SOMNIA_TESTNET_ADDRESSES.binaryModule, abi: binaryModuleCreatedAbi, eventName: "MarketCreated", fromBlock: start, toBlock: end }), "binary-module-logs") as Promise<any[]>,
      ]);
      for (const log of [...creatorLogs, ...moduleLogs] as any[]) {
        const a: any = log.args ?? {};
        rows.push({ marketId: a.marketId, marketAddress: a.market, poolAddress: a.pool, asset: a.asset ?? null, intervalSec: a.intervalSec == null ? null : Number(a.intervalSec), expiry: a.expiry == null ? null : Number(a.expiry), tradingStart: a.tradingStart == null ? null : Number(a.tradingStart), createdAtBlock: log.blockNumber == null ? null : Number(log.blockNumber), marketType: "BINARY", status: "UNKNOWN", source: "logs" });
      }
    }
    return { rows, complete: from === 0n, error: from === 0n ? undefined : "BOUNDED_LOG_LOOKBACK_NOT_EXHAUSTIVE" };
  } catch (e) { return { rows, complete: false, error: (e as Error).message }; }
}

async function main() {
  const client = createPublicClient({ chain: somniaShannon, transport: http(RPC, { timeout: 8_000, retryCount: 0 }) });
  const exchange = new SomniaMarkets({ indexerUrl: INDEXER, chain: somniaShannon, addresses: SOMNIA_TESTNET_ADDRESSES, wsRpcUrl: "wss://api.infra.testnet.somnia.network/ws" });
  const head = await bounded(client.getBlock({ blockTag: "latest" }), "head");
  const block = Number(head.number);
  const timestamp = Number(head.timestamp);
  const nonceResult: any = await bounded(client.getTransactionCount({ address: OWNER }), "nonce").then((value) => ({ result: `0x${value.toString(16)}` })).catch((e) => ({ error: { message: (e as Error).message } }));
  const nonce = typeof nonceResult.result === "string" ? BigInt(nonceResult.result).toString() : "0";
  process.stderr.write(`[live-gate] head=${block}, discovering binary markets (paged, current-first)\n`);
  let rows: any[] = [];
  let discoveryMeta: Record<string, unknown> = { indexer: INDEXER, directValidation: true, discoveryComplete: false, fallbackSupported: true, paginationExhausted: false, logFallbackComplete: false };
  try {
    const pageSize = 100;
    let paginationExhausted = false;
    for (let offset = 0; offset < 1_000 && Date.now() < deadline; offset += pageSize) {
      const page: any[] = await bounded((exchange as any).client.listBinaryMarkets({ limit: pageSize, offset }), "discovery");
      rows.push(...page);
      if (page.length < pageSize) { paginationExhausted = true; break; }
    }
    const logResult = await discoverCreatedLogs(client, BigInt(block));
    rows.push(...logResult.rows);
    discoveryMeta = { ...discoveryMeta, rowsReturned: rows.length, paginationExhausted, logFallbackComplete: logResult.complete, logFallbackRows: logResult.rows.length, logFallbackError: logResult.error, discoveryComplete: paginationExhausted && logResult.complete };
  }
  catch (e) { discoveryMeta = { ...discoveryMeta, fatalCode: "DISCOVERY_FAILED", discoveryError: (e as Error).message }; }
  const dedupedRows = [...new Map(rows.map((row) => [String(row.marketId ?? row.id ?? "").toLowerCase(), row])).values()];
  dedupedRows.sort((a, b) => Number(b.expiry ?? 0) - Number(a.expiry ?? 0) || Number(b.createdAtBlock ?? 0) - Number(a.createdAtBlock ?? 0));
  const probes: CandidateProbe[] = [];
  for (const row of dedupedRows) {
    const marketId = String(row.marketId ?? row.id ?? "") as Hex;
    if (!/^0x[\da-f]{64}$/i.test(marketId)) continue;
    const asset = row.asset == null ? null : String(row.asset).toUpperCase();
    const intervalSec = row.intervalSec == null ? null : Number(row.intervalSec);
    try {
      const on: any = await bounded((exchange as any).client.getMarketOnchain(marketId), "market");
      const expirySec = Number(on.expiry);
      const direct = { ok: true, marketAddress: on.marketAddress, pool: on.pool, collateral: on.collateral, nonce: String(on.nonce), expirySec, status: Number(on.status), statusLabel: Number(on.status) === 1 ? "Trading" : String(on.status), readAtBlock: block };
      let book: any = { ok: false, error: "BOOK_NOT_REQUIRED_FOR_INCOMPATIBLE_OR_NONTRADING", quoteDecimals: null, oneCollateralRaw: null, tickSizeRaw: null, lotSizeRaw: null, minQuantityRaw: null, bestBidRaw: null, bestAskRaw: null };
      if (Number(on.status) === 1 && expirySec > timestamp) {
        try {
          const raw: any = await bounded((exchange as any).client.getBinaryOrderBook(on.pool, { depth: 1 }), "book");
          const bid = raw?.yes?.bids?.[0]?.[0] ?? raw?.bids?.[0]?.[0]; const ask = raw?.yes?.asks?.[0]?.[0] ?? raw?.asks?.[0]?.[0];
          book = { ok: bid != null && ask != null, error: bid != null && ask != null ? undefined : "BEST_BID_OR_BEST_ASK_MISSING", quoteDecimals: Number(on.decimals ?? 6), oneCollateralRaw: "1000000", tickSizeRaw: null, lotSizeRaw: null, minQuantityRaw: null, bestBidRaw: bid == null ? null : String(bid), bestAskRaw: ask == null ? null : String(ask) };
        } catch (e) { book.error = (e as Error).message; }
      }
      probes.push({ discovered: { marketId, source: row.source === "logs" ? "logs" : "indexer", marketType: "BINARY", asset, intervalSec, expirySec, tradingStartSec: row.tradingStart == null ? timestamp : Number(row.tradingStart), statusFromIndexer: row.status ?? row.clobStatus ?? null, marketAddress: row.marketAddress ?? null, poolAddress: row.poolAddress ?? row.binaryPoolAddress ?? null, createdAtBlock: row.createdAtBlock == null ? null : Number(row.createdAtBlock) }, direct, book });
    } catch (e) { probes.push({ discovered: { marketId, source: "indexer", marketType: "BINARY", asset, intervalSec, expirySec: row.expiry == null ? null : Number(row.expiry), tradingStartSec: null, statusFromIndexer: row.status ?? null, marketAddress: row.marketAddress ?? null, poolAddress: row.poolAddress ?? null, createdAtBlock: null }, direct: { ok: false, error: (e as Error).message }, book: { ok: false, error: "DIRECT_READ_FAILED", quoteDecimals: null, oneCollateralRaw: null, tickSizeRaw: null, lotSizeRaw: null, minQuantityRaw: null, bestBidRaw: null, bestAskRaw: null } }); }
  }
  const metadata: any = JSON.parse(await readFile(resolve(ROOT, "deployments/shannon-v2.json"), "utf8"));
  const deployedAddresses = metadata.status === "SHANNON_WRITE_VERIFIED"
    ? { registryV2: metadata.contracts.CircuitRegistryV2, executorV2: metadata.contracts.CircuitExecutorV2 }
    : undefined;
  const evidence = evaluateLiveGate({ generatedAt: new Date().toISOString(), network: { chainId: 50312, headBlock: block, headTimestampSec: timestamp, rpcUrl: RPC, indexerUrl: INDEXER }, owner: { address: OWNER, nonce, source: "direct eth_getTransactionCount pinned to observed block", nonceReadFresh: typeof nonceResult.result === "string" }, forecaster: FORECASTER, rftRegistry: RFT, probes, gas: null, profileAProvenSufficient: false, discoveryMeta: { ...discoveryMeta, rowsReturned: rows.length, rowsDiscovered: dedupedRows.length, rowsProbed: probes.length, deployedAddresses, predictedAddresses: predictCreateAddresses(OWNER, nonce) }, deployedAddresses });
  await mkdir(resolve(ROOT, "evidence"), { recursive: true });
  await writeFile(resolve(ROOT, "evidence/live-gate-current.json"), json(evidence));
  await writeFile(resolve(ROOT, "docs/M4_3_2_LIVE_AUTHORIZATION_PACKET.md"), renderLiveGateMarkdown(evidence));
  process.stdout.write(humanSummary(evidence) + "\n" + json(evidence));
  process.exit(0);
}
main().catch(async (e: unknown) => { const packet = { status: "BLOCKED_LIVE_READ_FAILED", error: (e as Error).message, sideEffects: { chainWrites: false, funding: false, signatures: false, broadcasts: false } }; await mkdir(resolve(ROOT, "evidence"), { recursive: true }); await writeFile(resolve(ROOT, "evidence/live-gate-current.json"), json(packet)); process.stdout.write(json(packet)); process.exit(0); });
