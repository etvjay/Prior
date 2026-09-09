import { describe, expect, it } from "vitest";
import {
  estimateZeroActionLifecycle,
  type ForkLifecycleAdapter,
  type GasEstimationInput,
  GAS_REASON_CODES,
} from "../src/gas-estimation.js";

const OWNER = "0x82Daa64CEDfA4d15615ADC6D577Dba0d9FfccF55";
const FORECASTER = "0x4EbF775fb6397C1a191614CDCd0E117e04B24AB5";
const ADDRESSES = { rft: "0x5b1B51cB062B7B782c9EC2Bd5674eFAdb5308F41", registry: "0x1eD3B2310F369977ef82569498d5F678f8B73104", executor: "0x6e6Bf80Dc412f4DFCb59C15494C83785d54fb66d" };

function adapter(overrides: Partial<ForkLifecycleAdapter> = {}): ForkLifecycleAdapter {
  const calls: string[] = [];
  return {
    calls,
    async createFork() { calls.push("fork"); return { block: 123n, rpcUrl: "http://127.0.0.1:8545", simulationOnly: true }; },
    async codeAt() { return "0x6000"; },
    async setBalance() { calls.push("balance"); },
    async impersonate(address) { if (![OWNER, FORECASTER].includes(address)) throw new Error("wrong actor"); calls.push(address); },
    async gasPrice() { return 1_000_000_000n; },
    async write(step) { calls.push(step); return { gasUsed: 100_000n }; },
    async read(step) { return { step, value: step === "trial" ? { trialId: "0xtrial", marketId: "0xmarket", forecaster: FORECASTER, status: "COMMITTED" } : { bound: true, trialId: "0xtrial", circuitId: "0xcircuit" } }; },
    async simulateAction() { calls.push("action-revert"); return { reverted: true, reason: "ActionNotAllowed" }; },
    async revalidate() { return { ok: true }; },
    ...overrides,
  };
}

function input(fork: ForkLifecycleAdapter = adapter()): GasEstimationInput {
  return { rpcUrl: "https://dream-rpc.somnia.network", block: 123n, addresses: ADDRESSES, owner: OWNER, forecaster: FORECASTER, marketId: "0xmarket", circuitId: "0xcircuit", trialId: "0xtrial", adapter: fork };
}

describe("M4.3.5A stateful fork gas estimation", () => {
  it("executes ordered zero-action lifecycle and records conservative funding", async () => {
    const result = await estimateZeroActionLifecycle(input());
    expect(result.status).toBe("ESTIMATED");
    expect(result.classification).toBe("FORK_SIMULATION_ONLY");
    expect(result.operations.map((x) => x.name)).toEqual(["create", "authorize", "activate", "commit", "bind", "advance"]);
    expect(result.operations.every((x) => x.gasUsed && x.ceilingGas === (x.gasUsed * 125n) / 100n)).toBe(true);
    expect(result.funding.forkInjectedOwnerWei).toBe("1000000000000000000");
    expect(result.funding.forkInjectedForecasterWei).toBe("1000000000000000000");
    expect(result.funding.ownerLiveBalance).toBe("0");
    expect(result.funding.forecasterLiveBalance).toBe("0");
    expect(result.funding.forecasterAdditionalFundingWei).toBe("125000000000000");
    expect(result.zeroAction.buyUp.reason).toBe("ActionNotAllowed");
    expect(result.zeroAction.budgeted).toBe(false);
    expect(result.phaseB.status).toBe("UNRESOLVED");
  });

  it("fails closed when owner funding is zero while forecaster funding stays exactly zero", async () => {
    const result = await estimateZeroActionLifecycle({ ...input(), ownerFundingWei: 0n });
    expect(result.failure?.phase).toBe("owner-funding");
    expect(result.funding.forecasterNativeWei).toBe("0");
  });

  it("injects both exact actors only on the fork and computes nonzero forecaster funding from commit gas", async () => {
    const seen: string[] = [];
    const result = await estimateZeroActionLifecycle({ ...input(adapter({ async setBalance(address, amountWei) { seen.push(`${address}:${amountWei}`); } })), forkInjectedOwnerWei: 11n, forkInjectedForecasterWei: 22n, ownerLiveBalance: 7n, forecasterLiveBalance: 0n });
    expect(seen).toEqual([`${OWNER}:11`, `${FORECASTER}:22`]);
    expect(result.funding.forkInjectedOwnerWei).toBe("11");
    expect(result.funding.forkInjectedForecasterWei).toBe("22");
    expect(result.funding.ownerLiveBalance).toBe("7");
    expect(result.funding.forecasterLiveBalance).toBe("0");
    expect(result.funding.forecasterAdditionalFundingWei).toBe("125000000000000");
  });

  it("rejects duplicate advance before a second write can be budgeted", async () => {
    const result = await estimateZeroActionLifecycle({ ...input(), order: ["create", "authorize", "activate", "commit", "bind", "advance", "advance"] });
    expect(result.failure?.phase).toBe("advance");
    expect(result.operations.filter((operation: { name: string }) => operation.name === "advance")).toHaveLength(1);
  });

  it("fails closed when bind precedes commit", async () => {
    const result = await estimateZeroActionLifecycle({ ...input(), order: ["create", "authorize", "activate", "bind", "commit", "advance"] });
    expect(result.status).toBe("BLOCKED_GAS_ESTIMATION_FAILED");
    expect(result.failure?.code).toBe(GAS_REASON_CODES.BIND_FAILED);
  });

  it("fails closed for missing gas price and stale revalidation", async () => {
    const noPrice = await estimateZeroActionLifecycle(input(adapter({ async gasPrice() { return null; } })));
    expect(noPrice.failure?.code).toBe(GAS_REASON_CODES.GAS_PRICE_UNAVAILABLE);
    const stale = await estimateZeroActionLifecycle(input(adapter({ async revalidate() { return { ok: false, reason: "EXPIRY_CHANGED" }; } })));
    expect(stale.failure?.code).toBe(GAS_REASON_CODES.REVALIDATION_FAILED);
  });
});
