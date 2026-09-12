export type PublicTemplate = { marketClass: number; targetWindows: number };
export type ParticipantCircuitIntent = {
  owner: `0x${string}`;
  forecaster: `0x${string}`;
  marketClass: number;
  targetWindows: number;
  allowedActionsBitmap: bigint;
  totalBudget: bigint;
  maxPerMarket: bigint;
  executionMode: "FORECAST_ONLY";
  capitalRequired: false;
};

export function instantiatePublicTemplate(template: PublicTemplate, address: string): ParticipantCircuitIntent {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) throw new Error("INVALID_PARTICIPANT_ADDRESS");
  if (!Number.isInteger(template.targetWindows) || template.targetWindows < 1) throw new Error("INVALID_TARGET_WINDOWS");
  if (!Number.isInteger(template.marketClass) || template.marketClass < 0 || template.marketClass > 255) throw new Error("INVALID_MARKET_CLASS");
  return {
    owner: address as `0x${string}`,
    forecaster: address as `0x${string}`,
    marketClass: template.marketClass,
    targetWindows: template.targetWindows,
    allowedActionsBitmap: 0n,
    maxPerMarket: 1n,
    totalBudget: BigInt(template.targetWindows),
    executionMode: "FORECAST_ONLY",
    capitalRequired: false,
  };
}

export type ForecastCommitPhase = "UNCOMMITTED" | "SIGNING" | "SIGNED" | "AWAITING_RECEIPT" | "CANONICAL_READBACK" | "COMMITTED" | "FAILED";
export type ForecastCommitState = { phase: ForecastCommitPhase; error: string | null; hash: string | null; rftId: string | null };
export type ForecastCommitEvent =
  | { type: "SIGN" }
  | { type: "SIGNED" }
  | { type: "SUBMITTED"; hash: string }
  | { type: "RECEIPT_SUCCESS" }
  | { type: "RECEIPT_REVERTED" }
  | { type: "READBACK_MATCH"; rftId: string }
  | { type: "READBACK_MISMATCH" }
  | { type: "SIGNATURE_REJECTED" };

export function transitionForecastCommit(state: ForecastCommitState, event: ForecastCommitEvent): ForecastCommitState {
  if (state.phase === "UNCOMMITTED" && event.type === "SIGN") return { ...state, phase: "SIGNING", error: null };
  if (state.phase === "SIGNING" && event.type === "SIGNED") return { ...state, phase: "SIGNED" };
  if (state.phase === "SIGNED" && event.type === "SUBMITTED") return { ...state, phase: "AWAITING_RECEIPT", hash: event.hash };
  if (state.phase === "AWAITING_RECEIPT" && event.type === "RECEIPT_SUCCESS") return { ...state, phase: "CANONICAL_READBACK" };
  if (state.phase === "AWAITING_RECEIPT" && event.type === "RECEIPT_REVERTED") return { ...state, phase: "FAILED", error: "RECEIPT_REVERTED" };
  if (state.phase === "CANONICAL_READBACK" && event.type === "READBACK_MATCH") return { ...state, phase: "COMMITTED", rftId: event.rftId, error: null };
  if (state.phase === "CANONICAL_READBACK" && event.type === "READBACK_MISMATCH") return { ...state, phase: "FAILED", error: "READBACK_MISMATCH" };
  if (state.phase === "SIGNING" && event.type === "SIGNATURE_REJECTED") return { ...state, phase: "FAILED", error: "SIGNATURE_REJECTED" };
  return state;
}

export type CircuitCreationPhase = "DRAFT" | "REVIEW" | "SIGNING" | "AWAITING_RECEIPT" | "CANONICAL_READBACK" | "CREATED" | "FAILED";
export type CircuitCreationState = { phase: CircuitCreationPhase; error: string | null; hash: string | null; circuitId: string | null };
export type CircuitCreationEvent =
  | { type: "REVIEW" }
  | { type: "APPROVE" }
  | { type: "SUBMITTED"; hash: string }
  | { type: "RECEIPT_SUCCESS" }
  | { type: "RECEIPT_REVERTED" }
  | { type: "READBACK_MATCH"; circuitId: string }
  | { type: "READBACK_MISMATCH" };

export function transitionCircuitCreation(state: CircuitCreationState, event: CircuitCreationEvent): CircuitCreationState {
  if (state.phase === "DRAFT" && event.type === "REVIEW") return { ...state, phase: "REVIEW", error: null };
  if (state.phase === "REVIEW" && event.type === "APPROVE") return { ...state, phase: "SIGNING" };
  if (state.phase === "SIGNING" && event.type === "SUBMITTED") return { ...state, phase: "AWAITING_RECEIPT", hash: event.hash };
  if (state.phase === "AWAITING_RECEIPT" && event.type === "RECEIPT_SUCCESS") return { ...state, phase: "CANONICAL_READBACK" };
  if (state.phase === "AWAITING_RECEIPT" && event.type === "RECEIPT_REVERTED") return { ...state, phase: "FAILED", error: "RECEIPT_REVERTED" };
  if (state.phase === "CANONICAL_READBACK" && event.type === "READBACK_MATCH") return { ...state, phase: "CREATED", circuitId: event.circuitId, error: null };
  if (state.phase === "CANONICAL_READBACK" && event.type === "READBACK_MISMATCH") return { ...state, phase: "FAILED", error: "READBACK_MISMATCH" };
  return state;
}
