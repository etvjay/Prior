/**
 * Prior core — shared types.
 *
 * The only place where the canonical public concepts (Forecast / RFT / Circuit)
 * are defined. Both the contracts and the web app import from here.
 *
 * INVARIANTS ENFORCED HERE BY TYPE:
 *  - INV-002: pUpBps, marketId, forecaster are fixed at commit; there is no setter.
 *  - INV-006: market identity is bytes32, never an address.
 *  - INV-013: scoring math is pure integer, deterministic.
 *  - IINV-004: no floats in canonical state.
 */

import { type Address, type Hex } from "viem";

// ---------------------------------------------------------------------------
// Public types (the on-chain evidence record).
// ---------------------------------------------------------------------------

/** Probability of Up in basis points. 0..=10000. Integer only. */
export type Bps = number; // 0..10000

/** Canonical DreamDEX market identity. Never a recycled pool address. */
export type MarketId = Hex; // bytes32

/** Canonical RFT / Forecast / Circuit ID, bytes32. */
export type TrialId = Hex;
export type CircuitId = Hex;

/** Trade tag carried in DreamDEX Order.userData. uint64, packed. */
export type TradeTag = bigint; // 0..2n**64n-1n

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const ActionIntent = {
  NONE: 0,
  BUY_UP: 1,
  BUY_DOWN: 2,
  ABSTAIN: 3,
} as const;
export type ActionIntent = (typeof ActionIntent)[keyof typeof ActionIntent];

export const Outcome = {
  NONE: 0,
  UP: 1,
  DOWN: 2,
} as const;
export type Outcome = (typeof Outcome)[keyof typeof Outcome];

export const TrialStatus = {
  NONE: 0,
  COMMITTED: 1,
  SCORED: 2,
  VOIDED: 3,
} as const;
export type TrialStatus = (typeof TrialStatus)[keyof typeof TrialStatus];

export const MarketClass = {
  BTC_15M: 0,
  BTC_1H: 1,
  ETH_15M: 2,
  ETH_1H: 3,
} as const;
export type MarketClass = (typeof MarketClass)[keyof typeof MarketClass];

export const MarketLifecycle = {
  UNKNOWN: 0,
  LISTED: 1,
  TRADING: 2,
  LOCKED: 3,
  RESOLVED: 4,
  VOIDED: 5,
} as const;
export type MarketLifecycle =
  (typeof MarketLifecycle)[keyof typeof MarketLifecycle];

export const CircuitStatus = {
  DRAFT: 0,
  AUTHORIZED: 1,
  ACTIVE: 2,
  PAUSED: 3,
  STOPPED: 4,
  COMPLETE: 5,
  EXPIRED: 6,
  REVOKED: 7,
} as const;
export type CircuitStatus =
  (typeof CircuitStatus)[keyof typeof CircuitStatus];

export const CircuitIterationStatus = {
  WAITING_FOR_MARKET: "WAITING_FOR_MARKET",
  MARKET_FOUND: "MARKET_FOUND",
  WAITING_FOR_FORECAST: "WAITING_FOR_FORECAST",
  FORECAST_COMMITTING: "FORECAST_COMMITTING",
  POLICY_EVALUATING: "POLICY_EVALUATING",
  AWAITING_OWNER_AUTHORIZATION: "AWAITING_OWNER_AUTHORIZATION",
  EXECUTING: "EXECUTING",
  ABSTAINED: "ABSTAINED",
  WAITING_FOR_RESOLUTION: "WAITING_FOR_RESOLUTION",
  FINALIZING_RFT: "FINALIZING_RFT",
  ITERATION_COMPLETE: "ITERATION_COMPLETE",
} as const;
export type CircuitIterationStatus = (typeof CircuitIterationStatus)[keyof typeof CircuitIterationStatus];

export interface CircuitIteration {
  readonly circuitId: CircuitId;
  readonly marketId: MarketId;
  readonly status: CircuitIterationStatus;
  readonly forecastTrialId?: TrialId;
  readonly executionId?: Hex;
  readonly proposal?: unknown;
  readonly updatedAt: bigint;
}


/** Captured at commit time. If invalid, `referenceValid` is false and downstream Brier-vs-market is unavailable. */
export interface MarketReference {
  /** Midpoint expressed in basis points of Up (0..10000). 10000 - pDown. */
  readonly referenceUpBps: Bps;
  readonly referenceValid: boolean;
  /** Best Up-ask in basis points, if available. */
  readonly bestAskUpBps?: Bps;
  /** Best Down-ask in basis points, if available. */
  readonly bestAskDownBps?: Bps;
}

/** A committed Forecast. Immutable. */
export interface Forecast {
  readonly trialId: TrialId;
  readonly marketId: MarketId;
  readonly forecaster: Address;
  readonly pUpBps: Bps; // 0..10000
  readonly actionIntent: ActionIntent;
  readonly reference: MarketReference;
  readonly tradeTag: TradeTag;
  readonly committedAt: bigint; // unix seconds
  readonly committedBlock: bigint;
  readonly leadSecondsToExpiry: number; // for INV-001 (min lead = 60s by default)
}

/** A finalized Resolved Forecast Trial. */
export interface RftResult {
  readonly forecast: Forecast;
  readonly status: TrialStatus;
  readonly outcome: Outcome;
  /** forecastBrier = (pUpBps - outcomeBps)^2, in bps^2. 0 if VOIDED. */
  readonly forecastBrier: bigint;
  /** marketBrier = (referenceUpBps - outcomeBps)^2, in bps^2. 0 if reference invalid or VOIDED. */
  readonly marketBrier: bigint;
  /** marketBrier - forecastBrier. Positive = beat market baseline. 0 if voided. */
  readonly marketScoreDelta: bigint;
  readonly finalizedAt: bigint;
  readonly finalizedBlock: bigint;
}

// ---------------------------------------------------------------------------
// Circuit
// ---------------------------------------------------------------------------

export interface CircuitIntent {
  readonly circuitId: CircuitId;
  readonly owner: Address;
  readonly forecaster: Address;
  readonly marketClass: MarketClass;
  readonly targetWindows: number; // 4 | 8 | 12
  readonly totalBudget: bigint; // 6-decimal USDC raw
  readonly maxPerMarket: bigint;
  readonly minDifferenceBps: Bps; // 800 = 8.00 points
  readonly maxConsecutiveLosses: number;
  readonly startsAt: bigint;
  readonly expiresAt: bigint;
  readonly allowedActionsBitmap: number;
}

export interface CircuitRuntime {
  readonly status: CircuitStatus;
  readonly consecutiveLosses: number;
  readonly marketsCompleted: number;
  readonly marketsMissed: number;
  readonly marketsAbstained: number;
  readonly spent: bigint; // running reserved spend
  readonly lastMarketId: MarketId | null;
}

// ---------------------------------------------------------------------------
// Invariant helpers (pure).
// ---------------------------------------------------------------------------

export const BPS_MAX = 10_000;

export function assertBps(p: number, field: string): void {
  if (!Number.isInteger(p) || p < 0 || p > BPS_MAX) {
    throw new Error(`${field} must be integer bps in [0, ${BPS_MAX}], got ${p}`);
  }
}

export function outcomeToBps(outcome: Outcome): Bps {
  return outcome === Outcome.UP ? BPS_MAX : 0;
}
