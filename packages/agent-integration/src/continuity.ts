export type ContinuitySourceMode = "LIVE" | "ACCEPTED_SNAPSHOT";
export type ContinuityDecision = "BUY_UP" | "BUY_DOWN" | "ABSTAIN" | "REFUSE" | "MISS" | "PENDING";

export interface CircuitIterationView {
  readonly schemaVersion: "prior.continuity.v1";
  readonly source: {
    readonly mode: ContinuitySourceMode;
    readonly chainId: number;
    readonly blockNumber?: string;
    readonly fetchedAt: string;
    readonly freshness?: string;
    readonly endpoint: string;
    readonly evidenceClassification: string;
  };
  readonly circuit: {
    readonly circuitId: string;
    readonly owner: string;
    readonly forecaster: string;
    readonly status: string;
    readonly scope: Record<string, unknown>;
    readonly targetWindows: number;
    readonly completed: number;
    readonly missed: number;
    readonly abstained: number;
    readonly budget?: Record<string, unknown>;
    readonly authority?: Record<string, unknown>;
    readonly stopConditions?: Record<string, unknown>;
  };
  readonly iteration: {
    readonly iterationId?: string;
    readonly index?: number;
    readonly marketId: string;
    readonly market: {
      readonly status: string;
      readonly expiry?: number;
      readonly reference?: unknown;
      readonly referenceValid?: boolean;
      readonly source: string;
    };
    readonly forecast?: {
      readonly trialId?: string;
      readonly forecaster: string;
      readonly probability: number;
      readonly status: string;
      readonly committedAt?: string;
    };
    readonly rft?: {
      readonly trialId: string;
      readonly status: string;
      readonly outcome?: string;
      readonly score?: string;
      readonly finalizedAt?: string;
    };
    readonly binding: {
      readonly bound: boolean;
      readonly processed: boolean;
    };
    readonly policy: {
      readonly state: string;
      readonly decision: ContinuityDecision;
      readonly reason?: string;
    };
    readonly execution: {
      readonly status: string;
      readonly authorized: boolean;
      readonly txHash?: string;
      readonly refusalReason?: string;
    };
    readonly resolution: {
      readonly finalized: boolean;
      readonly outcome?: string;
      readonly source: string;
    };
  };
  readonly next: {
    readonly state: string;
    readonly marketId?: string;
  };
}

export interface FixtureContinuityInput {
  readonly circuitId: string;
  readonly owner: string;
  readonly forecaster: string;
  readonly marketId: string;
  readonly targetWindows: number;
  readonly totalBudget: string;
  readonly maxPerMarket: string;
  readonly allowedActionsBitmap: string;
  readonly policyHash: string;
  readonly providerId: string;
  readonly status?: string;
  readonly completed?: number;
  readonly missed?: number;
  readonly abstained?: number;
  readonly marketStatus?: string;
  readonly expiry?: number;
  readonly reference?: unknown;
  readonly referenceValid?: boolean;
  readonly sourceMode?: ContinuitySourceMode;
  readonly fetchedAt?: string;
  readonly evidenceClassification?: string;
}

function outcomeLabel(value: unknown): string | undefined { return value === undefined ? undefined : ({ 1: "UP", 2: "DOWN", 3: "VOIDED" } as Record<number, string>)[Number(value)] ?? "UNKNOWN"; }

export function composeLiveContinuityView(input: {
  readonly circuit: Record<string, any>;
  readonly market: Record<string, any>;
  readonly forecast?: Record<string, any>;
  readonly iteration?: Record<string, any>;
  readonly blockNumber?: string;
  readonly fetchedAt: string;
  readonly endpoint?: string;
}): CircuitIterationView {
  const c = input.circuit;
  const m = input.market;
  const f = input.forecast;
  const i = input.iteration;
  const forecast = input.forecast ?? {};
  const hasForecast = Boolean(f && forecast.forecastId);
  const allowed = String(c.allowedActionsBitmap ?? "0");
  const canonicalOutcome = outcomeLabel(f?.outcome);
  const finalized = f?.status === "SCORED" || f?.status === "VOIDED";
  const decision: ContinuityDecision = !hasForecast ? "PENDING" : allowed === "0" ? "REFUSE" : "PENDING";
  return {
    schemaVersion: "prior.continuity.v1",
    source: { mode: "LIVE", chainId: 50312, blockNumber: input.blockNumber, fetchedAt: input.fetchedAt, freshness: "canonical Shannon read", endpoint: input.endpoint ?? "hosted Prior Worker", evidenceClassification: "SHANNON_READ_VERIFIED" },
    circuit: { circuitId: String(c.circuitId), owner: String(c.owner), forecaster: String(c.forecaster), status: String(c.status), scope: { marketClass: c.marketClass }, targetWindows: Number(c.targetWindows), completed: Number(c.completed), missed: Number(c.missed), abstained: Number(c.abstained), budget: { total: String(c.totalBudget), maxPerMarket: String(c.maxPerMarket) }, authority: { allowedActionsBitmap: allowed, execution: allowed === "0" ? "NONE" : "BOUNDED" }, stopConditions: { maxConsecutiveLosses: c.maxConsecutiveLosses ?? "UNAVAILABLE" } },
    iteration: { iterationId: i?.iterationId, index: undefined, marketId: String(m.marketId), market: { status: String(m.lifecycle ?? "UNKNOWN"), expiry: m.expiry, reference: m.reference, referenceValid: m.referenceValid, source: "canonical Shannon market read" }, forecast: hasForecast ? { trialId: String(forecast.forecastId), forecaster: String(forecast.forecaster), probability: Number(forecast.pUpBps), status: String(forecast.status), committedAt: String(forecast.committedAt) } : undefined, rft: hasForecast ? { trialId: String(forecast.forecastId), status: String(forecast.status), outcome: canonicalOutcome, score: forecast.forecastBrier === undefined ? undefined : String(forecast.forecastBrier) } : undefined, binding: { bound: Boolean(i?.bound), processed: Boolean(i?.processed) }, policy: { state: hasForecast ? "EVALUATED" : "WAITING_FOR_FORECAST", decision, reason: !hasForecast ? "No committed Forecast is available for this iteration." : allowed === "0" ? "This Circuit grants no economic action." : "Policy requires current executable market state." }, execution: { status: !hasForecast ? "NOT_REQUESTED" : allowed === "0" ? "DISABLED" : "BLOCKED_EXTERNAL", authorized: allowed !== "0", refusalReason: allowed === "0" ? "allowedActionsBitmap is zero." : undefined }, resolution: { finalized, outcome: canonicalOutcome, source: "canonical Shannon RFT/DreamDEX read" } },
    next: { state: c.status === "COMPLETE" ? "COMPLETE" : i?.processed ? "NEXT_MARKET" : decision === "PENDING" ? "WAITING_FOR_FORECAST" : "AWAITING_RESOLUTION" },
  };
}

export function composeFixtureContinuityView(input: FixtureContinuityInput): CircuitIterationView {
  const mode = input.sourceMode ?? "ACCEPTED_SNAPSHOT";
  const live = mode === "LIVE";
  const status = input.status ?? "ACTIVE";
  return {
    schemaVersion: "prior.continuity.v1",
    source: {
      mode,
      chainId: 50312,
      fetchedAt: input.fetchedAt ?? "2026-09-06T00:00:00.000Z",
      freshness: live ? "canonical read" : "historical accepted snapshot",
      endpoint: live ? "Somnia Shannon canonical read" : "committed repository evidence",
      evidenceClassification: input.evidenceClassification ?? (live ? "SHANNON_READ_VERIFIED" : "ACCEPTED_SNAPSHOT"),
    },
    circuit: {
      circuitId: input.circuitId,
      owner: input.owner,
      forecaster: input.forecaster,
      status,
      scope: { marketClass: "DreamDEX Event Contract", providerId: input.providerId },
      targetWindows: input.targetWindows,
      completed: input.completed ?? 0,
      missed: input.missed ?? 0,
      abstained: input.abstained ?? 0,
      budget: { total: input.totalBudget, maxPerMarket: input.maxPerMarket },
      authority: { allowedActionsBitmap: input.allowedActionsBitmap, execution: input.allowedActionsBitmap === "0" ? "NONE" : "BOUNDED" },
      stopConditions: { source: "Circuit policy", status: "canonical or unavailable" },
    },
    iteration: {
      marketId: input.marketId,
      market: { status: input.marketStatus ?? "UNKNOWN", expiry: input.expiry, reference: input.reference, referenceValid: input.referenceValid, source: live ? "canonical market read" : "accepted evidence artifact" },
      binding: { bound: false, processed: false },
      policy: { state: "WAITING_FOR_FORECAST", decision: "PENDING", reason: "Forecast has not been committed for this iteration." },
      execution: { status: "NOT_REQUESTED", authorized: false, refusalReason: "No policy decision exists yet." },
      resolution: { finalized: false, source: live ? "DreamDEX canonical settlement read" : "accepted evidence artifact" },
    },
    next: { state: status === "COMPLETE" ? "COMPLETE" : "WAITING_FOR_FORECAST" },
  };
}
