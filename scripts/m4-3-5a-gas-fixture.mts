import { writeFile } from "node:fs/promises";
import { estimateZeroActionLifecycle, type ForkLifecycleAdapter } from "../packages/live-gate/src/gas-estimation.js";
const owner = "0x82Daa64CEDfA4d15615ADC6D577Dba0d9FfccF55";
const forecaster = "0x4EbF775fb6397C1a191614CDCd0E117e04B24AB5";
const adapter: ForkLifecycleAdapter = {
  async createFork() { return { block: 0n, rpcUrl: "fixture://anvil-shannon", simulationOnly: true as const }; },
  async codeAt() { return "0x6000"; }, async setBalance() {}, async impersonate() {}, async gasPrice() { return 1_000_000_000n; },
  async write() { return { gasUsed: 100_000n }; },
  async read(step) { return { step, value: step === "trial" ? { trialId: "0xtrial", marketId: "0xmarket", forecaster, status: "COMMITTED" } : { bound: true, trialId: "0xtrial", circuitId: "0xcircuit" } }; },
  async simulateAction() { return { reverted: true, reason: "ActionNotAllowed" }; }, async revalidate() { return { ok: true }; },
};
const result = await estimateZeroActionLifecycle({ rpcUrl: "fixture://shannon", block: 0n, addresses: { rft: "0x5b1B51cB062B7B782c9EC2Bd5674eFAdb5308F41", registry: "0x1eD3B2310F369977ef82569498d5F678f8B73104", executor: "0x6e6Bf80Dc412f4DFCb59C15494C83785d54fb66d" }, owner, forecaster, marketId: "0xmarket", circuitId: "0xcircuit", trialId: "0xtrial", adapter });
await writeFile("evidence/m4-3-5a-gas-estimation-fixture.json", JSON.stringify(result, (_, v) => typeof v === "bigint" ? v.toString() : v, 2) + "\n");
console.log(JSON.stringify({ status: result.status, classification: result.classification, operations: result.operations.length, phaseB: result.phaseB.status }));
