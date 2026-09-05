import { describe, it, expect } from "vitest";
import { evaluate } from "../src/policy.js";
import {
  ActionIntent,
  type CircuitIntent,
  type CircuitRuntime,
  MarketClass,
} from "../src/types.js";

const intent: CircuitIntent = {
  circuitId: "0x" + "11".repeat(32) as any,
  owner: "0x0000000000000000000000000000000000000011" as any,
  forecaster: "0x0000000000000000000000000000000000000011" as any,
  marketClass: MarketClass.BTC_15M,
  targetWindows: 8,
  totalBudget: 100_000_000n, // $100 (6-dec)
  maxPerMarket: 15_000_000n, // $15
  minDifferenceBps: 800, // 8 points
  maxConsecutiveLosses: 2,
  startsAt: 0n,
  expiresAt: BigInt(2 ** 32),
  allowedActionsBitmap: ActionIntent.BUY_UP | ActionIntent.BUY_DOWN | ActionIntent.ABSTAIN,
};

const runtime: CircuitRuntime = {
  status: 2 /* ACTIVE */,
  consecutiveLosses: 0,
  marketsCompleted: 0,
  marketsMissed: 0,
  marketsAbstained: 0,
  spent: 0n,
  lastMarketId: null,
};

const baseArgs = {
  intent,
  runtime,
  marketClassInScope: true,
  marketStatus: 2 /* Trading */,
  requestedQuantityRaw: 1n, // 1 outcome-token share (1e-6 USDC at par)
  oneCollateralRaw: 1_000_000n, // 1.00 USDC per share (par)
  alreadyExecuted: false,
};

describe("Circuit policy — executable-price rule (EXECUTION_POLICY.md §Up/Down rules)", () => {
  it("Forecast 72% / margin 8 / ask 63% -> BUY UP at 64% ceiling, fill <= 64", () => {
    const r = evaluate({
      ...baseArgs,
      pUpBps: 7200,
      reference: { referenceUpBps: 6100, referenceValid: true, bestAskUpBps: 6300 },
      bestAskUpBps: 6300,
      bestAskDownBps: null,
    });
    expect(r.kind).toBe("BUY_UP");
    if (r.kind === "BUY_UP") {
      expect(r.maxUpPriceBps).toBe(6400);
      expect(r.worstCaseSpendRaw).toBe(630_000n); // 0.63 * 1.00 USDC
    }
  });

  it("Forecast 72% / margin 8 / ask 65% -> ABSTAIN (over ceiling)", () => {
    const r = evaluate({
      ...baseArgs,
      pUpBps: 7200,
      reference: { referenceUpBps: 6100, referenceValid: true },
      bestAskUpBps: 6500,
      bestAskDownBps: null,
    });
    expect(r.kind).toBe("ABSTAIN");
    if (r.kind === "ABSTAIN") {
      expect(["no_ask_above_threshold_up", "both_above_threshold"]).toContain(r.reason);
    }
  });

  it("Forecast 31% / margin 8 / Down-ask 60% -> BUY DOWN at 61% ceiling, fill 60", () => {
    const r = evaluate({
      ...baseArgs,
      pUpBps: 3100,
      reference: { referenceUpBps: 6900, referenceValid: true, bestAskDownBps: 6000 },
      bestAskUpBps: null,
      bestAskDownBps: 6000,
    });
    expect(r.kind).toBe("BUY_DOWN");
    if (r.kind === "BUY_DOWN") {
      expect(r.maxDownPriceBps).toBe(6100);
      expect(r.worstCaseSpendRaw).toBe(600_000n);
    }
  });

  it("Both sides qualify -> pick side with larger edge", () => {
    const r = evaluate({
      ...baseArgs,
      pUpBps: 5000, // maxUp=4200, maxDown=4200
      reference: { referenceUpBps: 5000, referenceValid: true, bestAskUpBps: 4000, bestAskDownBps: 4100 },
      bestAskUpBps: 4000,
      bestAskDownBps: 4100,
    });
    // Up edge = 4200-4000=200, Down edge = 4200-4100=100 -> BUY UP
    expect(r.kind).toBe("BUY_UP");
  });

  it("Invalid reference -> ABSTAIN (no_forecast / reference_invalid)", () => {
    const r = evaluate({
      ...baseArgs,
      pUpBps: 7200,
      reference: { referenceUpBps: 0, referenceValid: false },
      bestAskUpBps: 6300,
      bestAskDownBps: null,
    });
    expect(r.kind).toBe("ABSTAIN");
    if (r.kind === "ABSTAIN") expect(r.reason).toBe("reference_invalid");
  });

  it("Circuit not active -> ABSTAIN (circuit_not_active)", () => {
    const r = evaluate({
      ...baseArgs,
      runtime: { ...runtime, status: 3 /* PAUSED */ },
      pUpBps: 7200,
      reference: { referenceUpBps: 6100, referenceValid: true },
      bestAskUpBps: 6300,
      bestAskDownBps: null,
    });
    expect(r.kind).toBe("ABSTAIN");
    if (r.kind === "ABSTAIN") expect(r.reason).toBe("circuit_not_active");
  });

  it("maxConsecutiveLosses reached -> ABSTAIN (stopped_consecutive_losses)", () => {
    const r = evaluate({
      ...baseArgs,
      runtime: { ...runtime, consecutiveLosses: 2 },
      pUpBps: 7200,
      reference: { referenceUpBps: 6100, referenceValid: true },
      bestAskUpBps: 6300,
      bestAskDownBps: null,
    });
    expect(r.kind).toBe("ABSTAIN");
    if (r.kind === "ABSTAIN") expect(r.reason).toBe("stopped_consecutive_losses");
  });

  it("Already executed for (circuitId, marketId) -> ABSTAIN (duplicate_execution)", () => {
    const r = evaluate({
      ...baseArgs,
      alreadyExecuted: true,
      pUpBps: 7200,
      reference: { referenceUpBps: 6100, referenceValid: true },
      bestAskUpBps: 6300,
      bestAskDownBps: null,
    });
    expect(r.kind).toBe("ABSTAIN");
    if (r.kind === "ABSTAIN") expect(r.reason).toBe("duplicate_execution");
  });

  it("Market not Trading -> ABSTAIN (circuit_paused bucket)", () => {
    const r = evaluate({
      ...baseArgs,
      marketStatus: 3 /* Locked */,
      pUpBps: 7200,
      reference: { referenceUpBps: 6100, referenceValid: true },
      bestAskUpBps: 6300,
      bestAskDownBps: null,
    });
    expect(r.kind).toBe("ABSTAIN");
    if (r.kind === "ABSTAIN") expect(r.reason).toBe("circuit_paused");
  });

  it("Market class out of scope -> ABSTAIN", () => {
    const r = evaluate({
      ...baseArgs,
      marketClassInScope: false,
      pUpBps: 7200,
      reference: { referenceUpBps: 6100, referenceValid: true },
      bestAskUpBps: 6300,
      bestAskDownBps: null,
    });
    expect(r.kind).toBe("ABSTAIN");
    if (r.kind === "ABSTAIN") expect(r.reason).toBe("market_class_not_in_scope");
  });

  it("Budget exhausted -> ABSTAIN", () => {
    const r = evaluate({
      ...baseArgs,
      runtime: { ...runtime, spent: 100_000_000n /* = total */ },
      pUpBps: 7200,
      reference: { referenceUpBps: 6100, referenceValid: true },
      bestAskUpBps: 6300,
      bestAskDownBps: null,
    });
    expect(r.kind).toBe("ABSTAIN");
    if (r.kind === "ABSTAIN") expect(r.reason).toBe("budget_exhausted");
  });
});
