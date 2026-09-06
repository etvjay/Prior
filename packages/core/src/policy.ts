/**
 * Prior core — Circuit policy evaluation.
 *
 * Pure deterministic function that maps a (circuit, market reference, forecast)
 * tuple to a buy/abstain decision, the max-acceptable price, and the worst-case
 * spend. The on-chain CircuitExecutor must perform an equivalent check before
 * forwarding to BinaryPool.placeBinaryOrderFor.
 *
 * CINV-018: midpoint disagreement alone cannot authorize a trade.
 * CINV-019: the actual fill price is bounded by the derived maximum.
 *   maxUpPrice   = (pUp - minMargin)                  in 0..1
 *   maxDownPrice = ((1 - pUp) - minMargin)            in 0..1
 *   If executable ask <= max -> buy; else ABSTAIN.
 *
 * The "executable price" passed in by the caller is the worst-case
 * price that the binary order book would give us for the requested
 * quantity (caller obtains this from quoteBinaryOrderOverBook).
 * We compare in basis points for integer parity with Solidity.
 */

import {
  BPS_MAX,
  type Bps,
  type CircuitIntent,
  type CircuitRuntime,
  type MarketReference,
  ActionIntent,
  assertBps,
} from "./types.js";
import { actualCollateralCostRaw, asQuantityRaw, asUnitScaleRaw, priceRawFromProbabilityBps } from "./units.js";

export type PolicyDecision =
  | { kind: "BUY_UP"; maxUpPriceBps: Bps; requestedQuantityRaw: bigint; worstCaseSpendRaw: bigint }
  | { kind: "BUY_DOWN"; maxDownPriceBps: Bps; requestedQuantityRaw: bigint; worstCaseSpendRaw: bigint }
  | { kind: "ABSTAIN"; reason: PolicyAbstainReason };

export type PolicyAbstainReason =
  | "no_forecast"
  | "reference_invalid"
  | "no_ask_above_threshold_up"
  | "no_ask_above_threshold_down"
  | "both_above_threshold"
  | "budget_exhausted"
  | "max_per_market_exceeded"
  | "market_class_not_in_scope"
  | "circuit_not_active"
  | "circuit_paused"
  | "circuit_expired"
  | "stopped_consecutive_losses"
  | "rejected_action"
  | "duplicate_execution";

export function evaluate(args: {
  intent: CircuitIntent;
  runtime: CircuitRuntime;
  marketClassInScope: boolean;
  marketStatus: number; // 0=Unknown, 1=Listed, 2=Trading, 3=Locked, 4=Resolved, 5=Voided
  pUpBps: Bps;
  reference: MarketReference;
  /** Best executable Up-ask in bps, if any. 0..10000. */
  bestAskUpBps: Bps | null;
  /** Best executable Down-ask in bps, if any. 0..10000. */
  bestAskDownBps: Bps | null;
  /** Raw quantity in the same units the contract passes to placeBinaryOrderFor. */
  requestedQuantityRaw: bigint;
  /** Raw unit price of the outcome token in 6-decimal USDC (lot=1 outcomeToken). */
  oneCollateralRaw: bigint;
  /** Has this (circuitId, marketId) iteration already executed? */
  alreadyExecuted: boolean;
}): PolicyDecision {
  // ---- structural gates ----
  if (args.runtime.status !== 2 /* ACTIVE */) {
    return { kind: "ABSTAIN", reason: "circuit_not_active" };
  }
  if (args.runtime.consecutiveLosses >= args.intent.maxConsecutiveLosses) {
    return { kind: "ABSTAIN", reason: "stopped_consecutive_losses" };
  }
  if (!args.marketClassInScope) {
    return { kind: "ABSTAIN", reason: "market_class_not_in_scope" };
  }
  if (args.marketStatus !== 2 /* Trading */) {
    return { kind: "ABSTAIN", reason: "circuit_paused" };
  }
  if (args.alreadyExecuted) {
    return { kind: "ABSTAIN", reason: "duplicate_execution" };
  }
  if (!args.reference.referenceValid) {
    return { kind: "ABSTAIN", reason: "reference_invalid" };
  }
  if (args.intent.maxPerMarket <= 0n || args.requestedQuantityRaw <= 0n) {
    return { kind: "ABSTAIN", reason: "no_forecast" };
  }

  // ---- budget / per-market caps ----
  const remainingBudget = args.intent.totalBudget - args.runtime.spent;
  if (remainingBudget <= 0n) {
    return { kind: "ABSTAIN", reason: "budget_exhausted" };
  }
  // worst-case spend = price * quantity * oneCollateral
  // (oneCollateral is the unit outcome price in raw USDC 6-dec, e.g. 1_000_000 = 1.00 USDC)
  // We don't have a single-shot fill price yet — we compare the best ask
  // the caller is willing to pay against the Circuit-derived ceiling.

  // ---- derive ceilings from p and minMargin ----
  const p = args.pUpBps;
  const e = args.intent.minDifferenceBps;
  // pUp = p/10000, pDown = 1 - p/10000. Ceiling in bps:
  //   maxUpPrice   = (p - e) clamped to [0, 10000]
  //   maxDownPrice = (10000 - p - e) clamped to [0, 10000]
  const maxUpPriceBps = clampBps(p - e);
  const maxDownPriceBps = clampBps(BPS_MAX - p - e);

  // ---- executable-price compare ----
  // For binary markets the SDK returns an "ask" expressed in bps probability.
  const upOk = args.bestAskUpBps !== null && args.bestAskUpBps <= maxUpPriceBps && maxUpPriceBps > 0;
  const downOk =
    args.bestAskDownBps !== null && args.bestAskDownBps <= maxDownPriceBps && maxDownPriceBps > 0;

  // ---- choose direction ----
  // We buy the *more* underpriced side; if both qualify, prefer the side with
  // larger implied edge. If only one, take it. If neither, abstain.
  if (!upOk && !downOk) {
    // Distinguish: maybe the market exists but our threshold is too tight.
    if (args.bestAskUpBps !== null || args.bestAskDownBps !== null) {
      return { kind: "ABSTAIN", reason: "both_above_threshold" };
    }
    return { kind: "ABSTAIN", reason: "no_ask_above_threshold_up" };
  }
  if (upOk && !downOk) {
    return finalize({
      kind: "BUY_UP",
      maxUpPriceBps,
      quantityRaw: args.requestedQuantityRaw,
      oneCollateralRaw: args.oneCollateralRaw,
      bestAskBps: args.bestAskUpBps!,
    });
  }
  if (!upOk && downOk) {
    return finalize({
      kind: "BUY_DOWN",
      maxDownPriceBps,
      quantityRaw: args.requestedQuantityRaw,
      oneCollateralRaw: args.oneCollateralRaw,
      bestAskBps: args.bestAskDownBps!,
    });
  }
  // both qualify — pick side with bigger edge.
  const upEdge = maxUpPriceBps - args.bestAskUpBps!;
  const downEdge = maxDownPriceBps - args.bestAskDownBps!;
  if (upEdge >= downEdge) {
    return finalize({
      kind: "BUY_UP",
      maxUpPriceBps,
      quantityRaw: args.requestedQuantityRaw,
      oneCollateralRaw: args.oneCollateralRaw,
      bestAskBps: args.bestAskUpBps!,
    });
  }
  return finalize({
    kind: "BUY_DOWN",
    maxDownPriceBps,
    quantityRaw: args.requestedQuantityRaw,
    oneCollateralRaw: args.oneCollateralRaw,
    bestAskBps: args.bestAskDownBps!,
  });
}

function finalize(args: {
  kind: "BUY_UP" | "BUY_DOWN";
  maxUpPriceBps?: Bps;
  maxDownPriceBps?: Bps;
  quantityRaw: bigint;
  oneCollateralRaw: bigint;
  bestAskBps: Bps;
}): PolicyDecision {
  // worstCaseSpend in raw 6-dec USDC =
  //   (bestAskBps * quantityRaw * oneCollateralRaw) / BPS_MAX
  // where bestAskBps is the per-share probability in bps, quantityRaw is the
  // count of outcome-token shares, and oneCollateralRaw is the par value of
  // one share in raw USDC (e.g. 1_000_000 = $1.00).
  const fillPriceRaw = priceRawFromProbabilityBps(args.bestAskBps, asUnitScaleRaw(args.oneCollateralRaw));
  const quantityRaw = asQuantityRaw(args.quantityRaw);
  const unitScaleRaw = asUnitScaleRaw(args.oneCollateralRaw);
  const worstCaseSpendRaw = actualCollateralCostRaw(fillPriceRaw, quantityRaw, unitScaleRaw);
  if (args.kind === "BUY_UP") {
    return {
      kind: "BUY_UP",
      maxUpPriceBps: args.maxUpPriceBps!,
      requestedQuantityRaw: args.quantityRaw,
      worstCaseSpendRaw,
    };
  }
  return {
    kind: "BUY_DOWN",
    maxDownPriceBps: args.maxDownPriceBps!,
    requestedQuantityRaw: args.quantityRaw,
    worstCaseSpendRaw,
  };
}

function clampBps(v: number): Bps {
  if (v < 0) return 0;
  if (v > BPS_MAX) return BPS_MAX;
  return v;
}

// ---- public helper for tests ----
export const _internals = { clampBps };
