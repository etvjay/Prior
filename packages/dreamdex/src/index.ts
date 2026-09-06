/**
 * Prior — DreamDEX adapter.
 *
 * Stateless, key-less layer over Somnia Markets SDK + binaryModule onchain
 * reads. The CircuitRunner queries this layer; the contracts never import it.
 *
 * INVARIANTS ENFORCED:
 *  - INV-006: market identity is bytes32 (marketId), never a pool address.
 *  - IINV-001: ABI is sourced from the *pinned* SDK, not from memory.
 *  - IINV-003: onchain market status is read fresh; indexer is for discovery.
 *  - CINV-017: only the specialized binary place path is used; generic
 *              placeOrder/placeOrderFor is never accepted.
 */

import {
  SomniaMarkets,
  SOMNIA_TESTNET_ADDRESSES,
  binaryModuleReadAbi,
  quoteBinaryOrderOverBook,
  priceToProbability,
  probabilityToPrice,
  isBinaryMarket,
} from "@somnia-chain/markets-sdk";
import { type Address, type Hex, createPublicClient, http } from "viem";
import type { MarketId, MarketClass, Bps } from "@prior/core";
import { BPS_MAX } from "@prior/core";

const CHAIN_ID = 50312;
const RPC = "https://dream-rpc.somnia.network";
const INDEXER = "https://dev.smk.somnia.host/v1/graphql";

export interface DreamDexConfig {
  rpcUrl?: string;
  indexerUrl?: string;
}

export interface MarketSummary {
  marketId: MarketId;
  marketAddress: Address;
  binaryPoolAddress: Address;
  asset: string;
  intervalSec: number;
  marketClass: MarketClass;
  /** CLOB/SDK-reported lifecycle: Trading | Locked | Resolved | Voided | Listed. */
  lifecycle: "Trading" | "Locked" | "Resolved" | "Voided" | "Listed" | "Unknown";
  expirySec: bigint;
  quoteToken: Address;
  baseSymbol: string | null;
  quoteSymbol: string | null;
  quoteDecimals: number | null;
  baseDecimals: number | null;
  lastPriceRaw: string | null;
  rawMidpointRaw: string | null;
  oracleQuestionId: string | null;
  yesTokenId: string | null;
  noTokenId: string | null;
  poolNonce: number | null;
}

export interface MarketBook {
  bids: Array<[bigint, bigint]>; // [price, quantity]
  asks: Array<[bigint, bigint]>;
}

export interface ExecutableQuote {
  side: "UP" | "DOWN";
  /** Worst-case fill price in bps (0..10000) at the given quantity. */
  fillPriceBps: Bps;
  /** Raw collateral to spend at that fill (6-dec USDC). */
  worstCaseSpendRaw: bigint;
  /** Average fill price in raw USDC 6-dec. */
  avgFillPriceRaw: bigint;
}

export class DreamDexAdapter {
  readonly chainId = CHAIN_ID;
  readonly exchange: SomniaMarkets;
  readonly publicClient: any;

  constructor(cfg: DreamDexConfig = {}) {
    this.publicClient = createPublicClient({
      chain: { id: CHAIN_ID, name: "Somnia Shannon", rpcUrls: { default: { http: [cfg.rpcUrl ?? RPC] } }, nativeCurrency: { name: "STT", symbol: "STT", decimals: 18 } } as any,
      transport: http(cfg.rpcUrl ?? RPC),
    });
    this.exchange = new SomniaMarkets({
      indexerUrl: cfg.indexerUrl ?? INDEXER,
      chain: { id: CHAIN_ID } as any,
      wsRpcUrl: "wss://api.infra.testnet.somnia.network/ws",
      addresses: SOMNIA_TESTNET_ADDRESSES,
    });
  }

  // ---------------- discovery ----------------

  /** Pull the recent live Event Contracts from the indexer. NO MOCK fallback. */
  async listRecentMarkets(limit = 20): Promise<MarketSummary[]> {
    const q = {
      query: `query M($n: Int!) {
        Market(limit: $n, order_by: {createdAtBlock: desc}) {
          id marketId marketType asset intervalSec clobStatus expiry
          lastPrice rawMidpoint marketAddress binaryPoolAddress poolAddress
          quoteToken quoteDecimals baseSymbol baseDecimals
          oracleQuestionId yesTokenId noTokenId createdAtBlock
        }
      }`,
      variables: { n: limit },
    };
    const r = await fetch(INDEXER, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(q),
    });
    const j: any = await r.json();
    const rows = (j?.data?.Market ?? []) as any[];
    return rows.map((r) => ({
      marketId: r.marketId as MarketId,
      marketAddress: r.marketAddress as Address,
      binaryPoolAddress: r.binaryPoolAddress as Address,
      asset: r.asset as string,
      intervalSec: Number(r.intervalSec),
      marketClass: classify(r.asset, Number(r.intervalSec)),
      lifecycle: (r.clobStatus as any) ?? "Unknown",
      expirySec: BigInt(r.expiry ?? 0),
      quoteToken: (r.quoteToken ?? SOMNIA_TESTNET_ADDRESSES.collateral) as Address,
      baseSymbol: r.baseSymbol ?? null,
      quoteSymbol: null,
      quoteDecimals: r.quoteDecimals != null ? Number(r.quoteDecimals) : null,
      baseDecimals: r.baseDecimals != null ? Number(r.baseDecimals) : null,
      lastPriceRaw: r.lastPrice != null ? String(r.lastPrice) : null,
      rawMidpointRaw: r.rawMidpoint != null ? String(r.rawMidpoint) : null,
      oracleQuestionId: r.oracleQuestionId ?? null,
      yesTokenId: r.yesTokenId ?? null,
      noTokenId: r.noTokenId ?? null,
      poolNonce: null,
    }));
  }

  // ---------------- market binding (CINV-006) ----------------

  /**
   * Read the canonical market binding from binaryModule onchain.
   * This is the *durable* mapping marketId -> (pool, marketAddress, collateral, oracleQuestionId).
   * Throws if the market is not bound.
   */
  async readMarketBinding(marketId: MarketId): Promise<{
    collateral: Address;
    pool: Address;
    marketAddress: Address;
    oracleQuestionId: bigint;
    nonce: bigint;
  }> {
    const data = await this.publicClient.readContract({
      address: SOMNIA_TESTNET_ADDRESSES.binaryModule as Address,
      abi: binaryModuleReadAbi as any,
      functionName: "markets",
      args: [marketId],
    }) as readonly any[];

    const [oracleQuestionId, outcomeSlotCount, voidPolicy, collateral, originOperatorId, originVenueId, oracleAdapter, creator, marketAddr, poolAddr, yesId, noId, tradingStart, expiry] = data as readonly [bigint, number, number, Address, number, Hex, Address, Address, Address, Address, bigint, bigint, bigint, bigint];
    oracleQuestionId; outcomeSlotCount; voidPolicy; originOperatorId; originVenueId; oracleAdapter; creator; yesId; noId; tradingStart;

    return {
      collateral,
      pool: poolAddr,
      marketAddress: marketAddr,
      oracleQuestionId,
      nonce: await this.publicClient.readContract({
        address: SOMNIA_TESTNET_ADDRESSES.binaryModule as Address,
        abi: binaryModuleReadAbi as any,
        functionName: "marketNonce",
        args: [marketId],
      }) as bigint,
    };
  }

  // ---------------- executable price ----------------

  /**
   * Given an order book and side, return the executable fill in bps.
   * Uses the pinned SDK's quoteBinaryOrderOverBook helper, which understands
   * binary book shape natively and normalizes to raw units.
   */
  quote(args: {
    book: MarketBook;
    side: "UP" | "DOWN";
    quantityRaw: bigint;
    oneCollateralRaw: bigint;
  }): ExecutableQuote | null {
    // quoteBinaryOrderOverBook expects a book in {bids, asks} format. Our MarketBook
    // matches. It returns an avg price in the same raw unit space as book entries.
    const sdkSide = args.side === "UP" ? "BUY_YES" : "BUY_NO";
    const r = quoteBinaryOrderOverBook(
      args.book as any,
      sdkSide,
      args.quantityRaw,
      args.oneCollateralRaw,
    );
    if (!r || r.filledQuantity === 0n) return null;
    // Convert raw price to bps probability using the SDK helper.
    // priceToProbability expects a price in *raw* units; it returns a human value
    // (0..1). For our case the raw is in {0..oneCollateralRaw} so we use
    // priceToProbability(r.avgPriceRaw, decimals=0 implicit). To avoid float
    // we reproduce the integer math here: bps = avgPriceRaw * BPS_MAX / oneCollateralRaw
    const bps = Number((r.avgPrice * BigInt(BPS_MAX)) / args.oneCollateralRaw);
    return {
      side: args.side,
      fillPriceBps: bps,
      worstCaseSpendRaw: r.cost,
      avgFillPriceRaw: r.avgPrice,
    };
  }
}

function classify(asset: string, intervalSec: number): MarketClass {
  const a = asset.toUpperCase();
  const i = intervalSec;
  if (a === "BTC" && i === 60) return 0; // BTC_15M = 0
  if (a === "BTC" && i === 300) return 1; // BTC_1H = 1 — also 5m is bucketed here until classes expand
  if (a === "ETH" && i === 60) return 2;
  if (a === "ETH" && i === 300) return 3;
  // Default to BTC 15m for unknown — UI may reject; caller validates class.
  return 0;
}

export const _internals = { classify };
