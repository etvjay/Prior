/**
 * M0 live market discovery.
 *
 * Per docs/ONESHOT_BUILD_INPUTS.md §10 and docs/DREAMDEX_INTEGRATION.md M0,
 * we must resolve live state from the *pinned* SDK against Shannon testnet.
 * No dynamic state is hardcoded; everything is read from the indexer + RPC.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { createPublicClient, http, webSocket, getAddress, formatUnits } from "viem";
import { defineChain } from "viem";

import { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES } from "@somnia-chain/markets-sdk";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";

const ROOT = resolve(__dirname, "..");
const EVIDENCE_DIR = resolve(ROOT, "evidence", "shannon");
mkdirSync(EVIDENCE_DIR, { recursive: true });

const RPC = "https://dream-rpc.somnia.network";
const WS = "wss://api.infra.testnet.somnia.network/ws";
const INDEXER = "https://dev.smk.somnia.host/v1/graphql";

const chain = somniaShannon;
const publicClient = createPublicClient({ chain, transport: http(RPC) });

const exchange = new SomniaMarkets({
  indexerUrl: INDEXER,
  chain,
  wsRpcUrl: WS,
  addresses: SOMNIA_TESTNET_ADDRESSES,
});

(async () => {
  const blockNumber = await publicClient.getBlockNumber();
  console.log("chainId =", chain.id, "(hex:", "0x" + chain.id.toString(16) + ")");
  console.log("block =", blockNumber);
  console.log("indexer =", INDEXER);
  console.log("addresses keys:", Object.keys(SOMNIA_TESTNET_ADDRESSES).join(", "));

  // Try to load live markets
  let markets: any[] = [];
  let loadErr: any = null;
  try {
    // SDK API varies across versions; try the canonical method name first.
    if (typeof (exchange as any).loadMarkets === "function") {
      await (exchange as any).loadMarkets();
    }
    if (typeof (exchange as any).getMarkets === "function") {
      markets = await (exchange as any).getMarkets();
    } else if (typeof (exchange as any).markets === "function") {
      markets = await (exchange as any).markets();
    } else if (Array.isArray((exchange as any).markets)) {
      markets = (exchange as any).markets;
    } else if (typeof (exchange as any).listMarkets === "function") {
      markets = await (exchange as any).listMarkets();
    }
  } catch (e) {
    loadErr = (e as Error).message;
  }

  console.log("discovered markets =", markets.length, "loadErr:", loadErr ?? "(none)");

  // Try alternate shapes
  let alternateKeys: string[] = [];
  if (markets.length === 0) {
    alternateKeys = Object.keys(exchange).filter((k) =>
      /market|getMarket|list|find|trading|orderbook/i.test(k)
    );
    console.log("alternate exchange keys related to markets:", alternateKeys.slice(0, 20).join(", "));
  }

  // Persist raw evidence
  const evidence = {
    timestamp: new Date().toISOString(),
    chainId: chain.id,
    block: blockNumber.toString(),
    rpc: RPC,
    ws: WS,
    indexer: INDEXER,
    addresses: SOMNIA_TESTNET_ADDRESSES,
    marketsCount: markets.length,
    loadError: loadErr,
    marketsSample: markets.slice(0, 3),
    alternateKeys,
  };
  writeFileSync(
    resolve(EVIDENCE_DIR, "m0-market-discovery.json"),
    JSON.stringify(evidence, null, 2)
  );
  console.log("evidence -> evidence/shannon/m0-market-discovery.json");
})().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
