import type { CircuitIteration, CircuitIterationStatus, MarketId, TrialId } from "@prior/core";
import { RunnerCheckpoint } from "./checkpoint.js";

export type RunnerResult = { readonly kind: "COMPLETED"; readonly circuitId: string; readonly marketId: string } | { readonly kind: "BLOCKED"; readonly reason: RunnerBlockedReason };
export type RunnerBlockedReason = "NO_ACTIVE_CIRCUIT" | "NO_ELIGIBLE_MARKET" | "FORECAST_GATEWAY_UNCONFIGURED" | "EXECUTION_GATEWAY_UNCONFIGURED" | "OWNER_CONTROL_UNAVAILABLE" | "AMBIGUOUS_RECEIPT" | "DEPENDENCY_FAILURE" | "BLOCKED_EXTERNAL";

export class RunnerBlockedError extends Error {
  public constructor(public readonly reason: RunnerBlockedReason = "BLOCKED_EXTERNAL", message = "external authority unavailable") {
    super(message);
    this.name = "RunnerBlockedError";
  }
}

const blocked = (cause: unknown): RunnerResult | null => cause instanceof RunnerBlockedError ? { kind: "BLOCKED", reason: cause.reason } : null;
export interface RunnerCircuit { readonly circuitId: `0x${string}`; readonly status: string }
export interface RunnerMarket { readonly marketId: MarketId; readonly lifecycle: string }
export interface RunnerForecast { readonly trialId?: TrialId; readonly pUpBps: number }
export type RunnerPolicy = { readonly kind: "BUY_UP" | "BUY_DOWN" } | { readonly kind: "ABSTAIN"; readonly reason: string };
export type RunnerReceipt = { readonly status: "CONFIRMED" | "FAILED" | "UNKNOWN"; readonly txHash?: `0x${string}` };
export type RunnerSettlement = { readonly terminal: boolean; readonly outcome?: "UP" | "DOWN" | null; readonly voided?: boolean };

export interface RunnerWorkflowDeps {
  readonly checkpoint: RunnerCheckpoint;
  readonly circuit: { loadActive(): Promise<RunnerCircuit | null> };
  readonly markets: { discover(circuit: RunnerCircuit): Promise<RunnerMarket | null> };
  readonly forecast?: { obtain(market: RunnerMarket, circuit: RunnerCircuit): Promise<RunnerForecast> };
  readonly forecastGateway?: { commit(forecast: RunnerForecast, market: RunnerMarket, circuit: RunnerCircuit): Promise<{ trialId: TrialId }> };
  readonly policy: { evaluate(forecast: RunnerForecast, market: RunnerMarket, circuit: RunnerCircuit): Promise<RunnerPolicy> };
  readonly execution?: { submit(policy: Exclude<RunnerPolicy, { kind: "ABSTAIN" }>, market: RunnerMarket, circuit: RunnerCircuit): Promise<{ executionId: `0x${string}` }> };
  readonly receipts?: { observe(id: string): Promise<RunnerReceipt> };
  readonly settlement: { observe(market: RunnerMarket): Promise<RunnerSettlement> };
  readonly rft: { finalize(trialId: TrialId, market: RunnerMarket): Promise<void> };
  /** Owner-only bind/advance callbacks. Runner supplies no owner signer and cannot create/authorize/activate. */
  readonly circuitGateway: { bindTrial?(circuit: RunnerCircuit, market: RunnerMarket, trialId: TrialId): Promise<void>; advance(circuit: RunnerCircuit, market: RunnerMarket): Promise<void> };
}

const save = async (d: RunnerWorkflowDeps, item: CircuitIteration, status: CircuitIterationStatus, extra: Partial<CircuitIteration> = {}): Promise<CircuitIteration> => {
  const next = { ...item, ...extra, status, updatedAt: BigInt(Date.now()) } as CircuitIteration;
  d.checkpoint.put(next);
  await d.checkpoint.persist();
  return next;
};

export class RunnerWorkflow {
  public constructor(private readonly deps: RunnerWorkflowDeps) {}

  public async runOnce(): Promise<RunnerResult> {
    const d = this.deps;
    if (!d.forecast || !d.forecastGateway) return { kind: "BLOCKED", reason: "FORECAST_GATEWAY_UNCONFIGURED" };
    const circuit = await d.circuit.loadActive();
    if (!circuit) return { kind: "BLOCKED", reason: "NO_ACTIVE_CIRCUIT" };
    const market = await d.markets.discover(circuit);
    if (!market) return { kind: "BLOCKED", reason: "NO_ELIGIBLE_MARKET" };
    if (market.lifecycle !== "Trading" && !d.checkpoint.get(circuit.circuitId, market.marketId)) return { kind: "BLOCKED", reason: "DEPENDENCY_FAILURE" };

    let item = d.checkpoint.get(circuit.circuitId, market.marketId) ?? {
      circuitId: circuit.circuitId, marketId: market.marketId, status: "WAITING_FOR_MARKET" as const, updatedAt: 0n,
    };
    if (item.status === "ITERATION_COMPLETE") return { kind: "COMPLETED", circuitId: circuit.circuitId, marketId: market.marketId };
    if (item.status === "FORECAST_COMMITTING" && !item.forecastTrialId) return { kind: "BLOCKED", reason: "AMBIGUOUS_RECEIPT" };

    if (item.status === "WAITING_FOR_MARKET") item = await save(d, item, "MARKET_FOUND");
    if (item.status === "MARKET_FOUND") item = await save(d, item, "WAITING_FOR_FORECAST");

    let forecast: RunnerForecast;
    if (!item.forecastTrialId) {
      forecast = await d.forecast.obtain(market, circuit);
      item = await save(d, item, "FORECAST_COMMITTING");
      let committed: { trialId: TrialId };
      try {
        committed = await d.forecastGateway.commit(forecast, market, circuit);
      } catch (cause) {
        const result = blocked(cause);
        if (result) return result;
        throw cause;
      }
      if (!committed?.trialId) return { kind: "BLOCKED", reason: "AMBIGUOUS_RECEIPT" };
      item = await save(d, item, "FORECAST_COMMITTING", { forecastTrialId: committed.trialId });
    } else {
      forecast = await d.forecast.obtain(market, circuit);
    }

    const trialId = item.forecastTrialId;
    if (!trialId) return { kind: "BLOCKED", reason: "AMBIGUOUS_RECEIPT" };
    if (d.circuitGateway.bindTrial) {
      if (item.status === "FORECAST_COMMITTING") {
        try {
          await d.circuitGateway.bindTrial(circuit, market, trialId);
        } catch (cause) {
          const result = blocked(cause);
          if (result) return result;
          throw cause;
        }
        item = await save(d, item, "POLICY_EVALUATING");
      }
    } else {
      return { kind: "BLOCKED", reason: "OWNER_CONTROL_UNAVAILABLE" };
    }

    const decision = await d.policy.evaluate(forecast, market, circuit);
    if (decision.kind === "ABSTAIN") {
      item = await save(d, item, "ABSTAINED");
      item = await save(d, item, "WAITING_FOR_RESOLUTION");
    } else {
      if (!d.execution || !d.receipts) return { kind: "BLOCKED", reason: "EXECUTION_GATEWAY_UNCONFIGURED" };
      item = await save(d, item, "AWAITING_OWNER_AUTHORIZATION");
      const execution = await d.execution.submit(decision, market, circuit);
      if (!execution?.executionId) return { kind: "BLOCKED", reason: "AMBIGUOUS_RECEIPT" };
      item = await save(d, item, "EXECUTING", { executionId: execution.executionId });
      const receipt = await d.receipts.observe(execution.executionId);
      if (receipt.status !== "CONFIRMED") return { kind: "BLOCKED", reason: receipt.status === "UNKNOWN" ? "AMBIGUOUS_RECEIPT" : "DEPENDENCY_FAILURE" };
      item = await save(d, item, "WAITING_FOR_RESOLUTION", { executionId: execution.executionId });
    }

    const settlement = await d.settlement.observe(market);
    if (!settlement.terminal) return { kind: "BLOCKED", reason: "DEPENDENCY_FAILURE" };
    item = await save(d, item, "FINALIZING_RFT", item.executionId ? { executionId: item.executionId } : {});
    try {
      await d.rft.finalize(trialId, market);
    } catch (cause) {
      const result = blocked(cause);
      if (result) return result;
      throw cause;
    }
    await save(d, item, "ITERATION_COMPLETE", item.executionId ? { executionId: item.executionId } : {});
    try {
      await d.circuitGateway.advance(circuit, market);
    } catch (cause) {
      const result = blocked(cause);
      if (result) return result;
      throw cause;
    }
    return { kind: "COMPLETED", circuitId: circuit.circuitId, marketId: market.marketId };
  }
}

export { RunnerWorkflow as RunnerRuntime };
