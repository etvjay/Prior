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

// ---------------------------------------------------------------------------
// M4.1 Mandate and agent-authority foundation.
// ---------------------------------------------------------------------------

/** Canonical identifiers for authority and execution records. */
export type MandateId = Hex;
export type AgentId = Hex;
export type BindingId = Hex;
export type ForecastId = TrialId;
export type IterationId = Hex;
export type ActionId = Hex;
export type ExecutionId = Hex;
export type PolicyHash = Hex;

export const MandateLifecycle = {
  DRAFT: "DRAFT",
  APPROVED: "APPROVED",
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  EXPIRED: "EXPIRED",
  REVOKED: "REVOKED",
  COMPLETED: "COMPLETED",
} as const;
export type MandateLifecycle = (typeof MandateLifecycle)[keyof typeof MandateLifecycle];

export const AgentSourceType = {
  HUMAN: "HUMAN",
  AGENT: "AGENT",
  MODEL: "MODEL",
  SERVICE: "SERVICE",
} as const;
export type AgentSourceType = (typeof AgentSourceType)[keyof typeof AgentSourceType];

export const MarketVenue = {
  DREAMDEX: "DreamDEX",
} as const;
export type MarketVenue = (typeof MarketVenue)[keyof typeof MarketVenue];

export const MarketAsset = {
  BTC: "BTC",
  ETH: "ETH",
} as const;
export type MarketAsset = (typeof MarketAsset)[keyof typeof MarketAsset];

/** A new cadence can be represented in a mandate without changing Circuit contracts. */
export const MandateMarketClass = {
  BTC_5M: "BTC_5M",
} as const;
export type MandateMarketClass = MarketClass | (typeof MandateMarketClass)[keyof typeof MandateMarketClass];

/** Read capabilities are intentionally separate from Forecast and execution. */
export const ReadCapability = {
  GET_MANDATE: "getMandate",
  LIST_ELIGIBLE_MARKETS: "listEligibleMarkets",
  GET_FORECAST_REQUEST: "getForecastRequest",
  GET_AUTHORIZED_ACTION: "getAuthorizedAction",
  GET_EXECUTION_STATUS: "getExecutionStatus",
  GET_REMAINING_AUTHORITY: "getRemainingAuthority",
  GET_RFT_HISTORY: "getRftHistory",
} as const;
export type ReadCapability = (typeof ReadCapability)[keyof typeof ReadCapability];

export const ForecastCapability = {
  SUBMIT_FORECAST: "submitForecast",
} as const;
export type ForecastCapability = (typeof ForecastCapability)[keyof typeof ForecastCapability];

export const ExecuteCapability = {
  EVALUATE_ACTION: "evaluateAction",
  GET_AUTHORIZED_ACTION: "getAuthorizedAction",
  EXECUTE_AUTHORIZED_ACTION: "executeAuthorizedAction",
  GET_EXECUTION_STATUS: "getExecutionStatus",
} as const;
export type ExecuteCapability = (typeof ExecuteCapability)[keyof typeof ExecuteCapability];

export const AuthorizedActionKind = {
  BUY_UP: "BUY_UP",
  BUY_DOWN: "BUY_DOWN",
} as const;
export type AuthorizedActionKind = (typeof AuthorizedActionKind)[keyof typeof AuthorizedActionKind];

export interface AgentPrincipal {
  readonly agentId: AgentId;
  readonly displayName: string;
  readonly sourceType: AgentSourceType;
  readonly forecastAddress?: Address;
  readonly executorAddress?: Address;
}

export interface MarketScope {
  readonly venue: MarketVenue;
  readonly assets: readonly MarketAsset[];
  readonly intervalsSec: readonly number[];
  readonly marketClass: MandateMarketClass;
  /** Empty means the typed asset/cadence scope is the restriction. */
  readonly marketIds: readonly MarketId[];
}

export interface ForecastAuthority {
  readonly agentIds: readonly AgentId[];
  readonly capabilities: readonly ForecastCapability[];
  /** Defaults to one immutable submission per market for v0.1. */
  readonly maxSubmissionsPerMarket?: number;
  /** Defaults to true for external/agent submissions. */
  readonly requireAttributableSigner?: boolean;
  /** Optional stricter lead time than the policy's market expiry. */
  readonly minLeadTimeSec?: number;
}

export interface ExecutionAuthority {
  readonly agentIds: readonly AgentId[];
  readonly capabilities: readonly ExecuteCapability[];
  readonly allowedActions: readonly AuthorizedActionKind[];
  /** Minimum Forecast-implied margin, in probability basis points. */
  readonly minMarginBps: Bps;
  /** Optional maximum lifetime of an issued action envelope. */
  readonly maxActionLifetimeSec?: number;
}

export interface CapitalAuthority {
  /** Maximum collateral reservation for one market, in raw units. */
  readonly maxPerMarketRaw: import("./units.js").CollateralRaw;
  /** Maximum cumulative collateral reservation, in raw units. */
  readonly totalBudgetRaw: import("./units.js").CollateralRaw;
  /** Maximum configured cumulative loss, in raw units. */
  readonly stopLossRaw: import("./units.js").CollateralRaw;
}

export interface TemporalAuthority {
  /** Owner-approval issuance time, in unix seconds. */
  readonly issuedAt: bigint;
  /** Earliest time at which ACTIVE authority may be used, in unix seconds. */
  readonly startsAt: bigint;
  /** Exclusive expiry boundary, in unix seconds. */
  readonly expiresAt: bigint;
}

export interface RevocationPolicy {
  readonly enabled: boolean;
  readonly ownerOnly: true;
}

export interface MandatePolicy {
  readonly version: number;
  readonly mandateId: MandateId;
  readonly owner: Address;
  readonly forecasters: readonly AgentPrincipal[];
  readonly executors: readonly AgentPrincipal[];
  readonly marketScope: MarketScope;
  readonly forecastAuthority: ForecastAuthority;
  readonly executionAuthority: ExecutionAuthority;
  readonly capitalAuthority: CapitalAuthority;
  readonly temporalAuthority: TemporalAuthority;
  readonly lifecycle: MandateLifecycle;
  readonly revocation: RevocationPolicy;
}

/** Authenticated transport identity, not a capital permission. */
export const ApiTransport = {
  API: "API",
  HTTP: "HTTP",
  MCP: "MCP",
  SDK: "SDK",
} as const;
export type ApiTransport = (typeof ApiTransport)[keyof typeof ApiTransport];

export interface AuthenticatedApiPrincipal {
  readonly transport: ApiTransport;
  readonly principalId: string;
}
export type ApiPrincipal = AuthenticatedApiPrincipal;

export interface AgentBinding {
  readonly bindingId: BindingId;
  readonly agentId: AgentId;
  readonly circuitId: CircuitId;
  readonly apiPrincipal: AuthenticatedApiPrincipal;
  readonly forecastAddress?: Address;
  readonly executorAddress?: Address;
  readonly readCapabilities: readonly ReadCapability[];
  readonly forecastCapabilities: readonly ForecastCapability[];
  readonly executeCapabilities: readonly ExecuteCapability[];
  readonly issued: bigint;
  readonly expires: bigint;
  readonly mandateId: MandateId;
  readonly policyHash: PolicyHash;
}

export interface ForecastRequest {
  readonly forecastId?: ForecastId;
  readonly circuitId: CircuitId;
  readonly marketId: MarketId;
  readonly asset: MarketAsset;
  readonly intervalSec: number;
  readonly opensAt: bigint;
  readonly expiresAt: bigint;
  readonly forecastDeadline?: bigint;
  readonly reference?: MarketReference;
}

/** A signed probability only. This object deliberately has no reasoning field. */
export interface ForecastSubmission {
  readonly marketId: MarketId;
  /** Optional domain binding emitted by a provider; M4.2 validates it when present. */
  readonly circuitId?: CircuitId;
  /** Optional policy snapshot binding emitted by a provider; M4.2 validates it when present. */
  readonly policyHash?: PolicyHash;
  readonly forecaster: AgentId;
  readonly forecasterAddress: Address;
  readonly probabilityUpBps: Bps;
  readonly generatedAt: bigint;
  readonly validUntil: bigint;
  readonly sourceType: AgentSourceType;
  readonly sourceVersion: string;
  readonly signature: Hex;
}

/** Typed identity for a Forecast-producing domain adapter, not a wallet. */
export type ForecastProviderId = Hex;
export type ForecastSubmissionId = Hex;
export type ForecastIdempotencyKey = Hex;

export interface ForecastProviderIdentity {
  readonly providerId: ForecastProviderId;
  readonly displayName: string;
  /** Human-readable adapter/source identifier, not an authentication secret. */
  readonly source: string;
  readonly sourceVersion: string;
}

/** The response boundary between a provider adapter and the local workflow. */
export interface ForecastProviderResponse {
  readonly requestId: ForecastId;
  readonly providerId: ForecastProviderId;
  readonly submission: ForecastSubmission;
}

/** A provider has transport identity and forecast output, but no execution fields. */
export interface ForecastProvider {
  readonly identity: ForecastProviderIdentity;
  readonly apiPrincipal: AuthenticatedApiPrincipal;
  readonly getForecast: (request: ForecastRequest) => ForecastProviderResponse;
}

/** Immutable local acceptance of a scoped request under one policy snapshot. */
export interface AcceptedForecastRequest {
  readonly requestId: ForecastId;
  readonly iterationId: IterationId;
  readonly request: ForecastRequest;
  readonly mandateId: MandateId;
  readonly policyHash: PolicyHash;
  readonly acceptedAt: bigint;
}

/** Immutable local record. `chainCommitment` is deliberately not a receipt. */
export interface ForecastSubmissionRecord {
  readonly submissionId: ForecastSubmissionId;
  readonly idempotencyKey: ForecastIdempotencyKey;
  readonly requestId: ForecastId;
  readonly iterationId: IterationId;
  readonly circuitId: CircuitId;
  readonly marketId: MarketId;
  readonly forecaster: AgentId;
  readonly forecasterAddress: Address;
  readonly mandateId: MandateId;
  readonly bindingId: BindingId;
  readonly policyHash: PolicyHash;
  readonly provider: ForecastProviderIdentity;
  /** Transport authentication evidence, not Forecast or capital authority. */
  readonly apiPrincipal: AuthenticatedApiPrincipal;
  readonly request: ForecastRequest;
  readonly submission: ForecastSubmission;
  readonly acceptedAt: bigint;
  readonly chainCommitment: "NOT_SUBMITTED";
}

export interface AuthorizedAction {
  readonly actionId: ActionId;
  readonly circuitId: CircuitId;
  readonly marketId: MarketId;
  readonly executionId: ExecutionId;
  readonly executorAgentId: AgentId;
  readonly action: AuthorizedActionKind;
  readonly maxPriceRaw: import("./units.js").PriceRaw;
  readonly quantityRaw: import("./units.js").QuantityRaw;
  readonly maximumSpendRaw: import("./units.js").CollateralRaw;
  readonly validAfter: bigint;
  readonly expiresAt: bigint;
  readonly policyHash: PolicyHash;
}
