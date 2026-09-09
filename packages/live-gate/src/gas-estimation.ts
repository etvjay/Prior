export const GAS_REASON_CODES = {
  FORK_CREATION_FAILED: "FORK_CREATION_FAILED",
  MISSING_DEPLOYED_CODE: "MISSING_DEPLOYED_CODE",
  CREATE_FAILED: "CREATE_FAILED",
  AUTHORIZE_FAILED: "AUTHORIZE_FAILED",
  ACTIVATE_FAILED: "ACTIVATE_FAILED",
  COMMIT_FAILED: "COMMIT_FAILED",
  BIND_FAILED: "BIND_FAILED",
  READBACK_FAILED: "READBACK_FAILED",
  GAS_PRICE_UNAVAILABLE: "GAS_PRICE_UNAVAILABLE",
  REVALIDATION_FAILED: "REVALIDATION_FAILED",
} as const;
export type GasReasonCode = typeof GAS_REASON_CODES[keyof typeof GAS_REASON_CODES];
export type LifecycleWrite = "create" | "authorize" | "activate" | "commit" | "bind" | "advance";
export type GasOperation = {
  name: LifecycleWrite;
  caller: string;
  target: string;
  functionName: string;
  args: unknown[];
  estimationMethod: string;
  gasUsed: bigint;
  ceilingGas: bigint;
  gasPriceWei: bigint;
  costWei: bigint;
};
export type ForkHandle = { block: bigint; rpcUrl: string; simulationOnly: true; close?: () => Promise<void> };
export type ForkLifecycleAdapter = {
  calls?: string[];
  createFork(): Promise<ForkHandle>;
  codeAt(address: string): Promise<string>;
  setBalance(address: string, amountWei: bigint): Promise<void>;
  impersonate(address: string): Promise<void>;
  gasPrice(): Promise<bigint | null>;
  write(step: LifecycleWrite): Promise<{ gasUsed: bigint }>;
  read(step: "trial" | "iteration" | "runtime"): Promise<{ step: string; value: any }>;
  simulateAction(kind: "BUY_UP" | "BUY_DOWN"): Promise<{ reverted: boolean; reason?: string }>;
  revalidate(): Promise<{ ok: boolean; reason?: string }>;
};
export type GasEstimationInput = {
  rpcUrl: string;
  block: bigint;
  addresses: { rft: string; registry: string; executor: string };
  owner: string;
  forecaster: string;
  marketId: string;
  circuitId: string;
  trialId: string;
  adapter: ForkLifecycleAdapter;
  order?: LifecycleWrite[];
  ownerFundingWei?: bigint;
  forkInjectedOwnerWei?: bigint;
  forkInjectedForecasterWei?: bigint;
  ownerLiveBalance?: bigint;
  forecasterLiveBalance?: bigint;
};
export type GasEstimationResult = {
  status: "ESTIMATED" | "BLOCKED_GAS_ESTIMATION_FAILED";
  classification: "FORK_SIMULATION_ONLY";
  fork: ForkHandle | null;
  operations: GasOperation[];
  funding: { forkInjectedOwnerWei: string; forkInjectedForecasterWei: string; ownerLiveBalance: string; forecasterLiveBalance: string; ownerAdditionalFundingWei: string; forecasterAdditionalFundingWei: string; ownerNativeWei: string; forecasterNativeWei: string; totalGasWei: string; conservativeTotalWei: string };
  zeroAction: { buyUp: { reverted: boolean; reason?: string }; buyDown: { reverted: boolean; reason?: string }; budgeted: false };
  phaseB: { status: "UNRESOLVED" | "FRESH_ESTIMATE_REQUIRED"; operations: never[]; note: string };
  failure: { code: GasReasonCode; phase: string; detail?: string } | null;
  packet: { schemaVersion: "M4.3.5A.v1"; evidenceClass: "FORK_SIMULATION_ONLY"; chainWrites: false; broadcast: false; gas: GasOperation[]; funding: GasEstimationResult["funding"]; failure: GasEstimationResult["failure"] };
};

const noopResult = (failure: GasEstimationResult["failure"]): GasEstimationResult => ({
  status: "BLOCKED_GAS_ESTIMATION_FAILED", classification: "FORK_SIMULATION_ONLY", fork: null, operations: [],
  funding: { forkInjectedOwnerWei: "0", forkInjectedForecasterWei: "0", ownerLiveBalance: "0", forecasterLiveBalance: "0", ownerAdditionalFundingWei: "0", forecasterAdditionalFundingWei: "0", ownerNativeWei: "0", forecasterNativeWei: "0", totalGasWei: "0", conservativeTotalWei: "0" },
  zeroAction: { buyUp: { reverted: false }, buyDown: { reverted: false }, budgeted: false },
  phaseB: { status: "UNRESOLVED", operations: [], note: "Phase B is forbidden until a fresh post-resolution estimate." }, failure,
  packet: { schemaVersion: "M4.3.5A.v1", evidenceClass: "FORK_SIMULATION_ONLY", chainWrites: false, broadcast: false, gas: [], funding: { forkInjectedOwnerWei: "0", forkInjectedForecasterWei: "0", ownerLiveBalance: "0", forecasterLiveBalance: "0", ownerAdditionalFundingWei: "0", forecasterAdditionalFundingWei: "0", ownerNativeWei: "0", forecasterNativeWei: "0", totalGasWei: "0", conservativeTotalWei: "0" }, failure },
});

const forkFailure = (fork: ForkHandle, failure: GasEstimationResult["failure"]): GasEstimationResult => ({ ...noopResult(failure), fork });

function callerFor(step: LifecycleWrite, owner: string, forecaster: string): string { return step === "commit" ? forecaster : owner; }
function targetFor(step: LifecycleWrite, a: GasEstimationInput["addresses"]): string { return step === "commit" ? a.rft : a.registry; }
function fnFor(step: LifecycleWrite): string { return ({ create: "create", authorize: "authorize", activate: "activate", commit: "commitForecast", bind: "bindTrial", advance: "advance" })[step]; }
function argsFor(step: LifecycleWrite, input: GasEstimationInput): unknown[] {
  if (step === "create") return [input.circuitId, input.owner, input.forecaster, 0, 1, "1", "1", 0, 1, input.block.toString(), (input.block + 3600n).toString(), "0"];
  if (step === "commit") return [input.marketId, 5000, 0, false, 0, 3];
  if (step === "bind") return [input.circuitId, input.marketId, input.trialId];
  if (step === "advance") return [input.circuitId, input.marketId, false, true, false];
  return [input.circuitId];
}

/** Executes only on an adapter-backed Shannon fork. It never imports keys or broadcasts. */
async function estimateZeroActionLifecycleUnsafe(input: GasEstimationInput): Promise<GasEstimationResult> {
  let fork: ForkHandle;
  try { fork = await input.adapter.createFork(); } catch (e) { return noopResult({ code: GAS_REASON_CODES.FORK_CREATION_FAILED, phase: "fork", detail: String(e) }); }
  if (!fork.simulationOnly) return forkFailure(fork, { code: GAS_REASON_CODES.FORK_CREATION_FAILED, phase: "fork", detail: "fork was not classified simulation-only" });
  for (const [name, address] of Object.entries(input.addresses)) {
    try { if ((await input.adapter.codeAt(address)).length <= 2) return forkFailure(fork, { code: GAS_REASON_CODES.MISSING_DEPLOYED_CODE, phase: name }); }
    catch (e) { return forkFailure(fork, { code: GAS_REASON_CODES.MISSING_DEPLOYED_CODE, phase: name, detail: String(e) }); }
  }
  const gasPrice = await input.adapter.gasPrice().catch(() => null);
  if (gasPrice == null || gasPrice <= 0n) return forkFailure(fork, { code: GAS_REASON_CODES.GAS_PRICE_UNAVAILABLE, phase: "gas-price" });
  const ownerFundingWei = input.forkInjectedOwnerWei ?? input.ownerFundingWei ?? 1_000_000_000_000_000_000n;
  const forecasterFundingWei = input.forkInjectedForecasterWei ?? 1_000_000_000_000_000_000n;
  if (ownerFundingWei <= 0n) return forkFailure(fork, { code: GAS_REASON_CODES.FORK_CREATION_FAILED, phase: "owner-funding", detail: "owner requires non-zero fork-only native balance" });
  if (forecasterFundingWei <= 0n) return forkFailure(fork, { code: GAS_REASON_CODES.FORK_CREATION_FAILED, phase: "forecaster-funding", detail: "forecaster requires non-zero fork-only native balance" });
  try { await input.adapter.setBalance(input.owner, ownerFundingWei); await input.adapter.setBalance(input.forecaster, forecasterFundingWei); await input.adapter.impersonate(input.owner); await input.adapter.impersonate(input.forecaster); }
  catch (e) { return forkFailure(fork, { code: GAS_REASON_CODES.FORK_CREATION_FAILED, phase: "impersonation-or-funding", detail: String(e) }); }
  const operations: GasOperation[] = [];
  const completed = new Set<LifecycleWrite>();
  const order = input.order ?? ["create", "authorize", "activate", "commit", "bind", "advance"];
  for (const step of order) {
    try {
      const prerequisite: Partial<Record<LifecycleWrite, LifecycleWrite>> = { authorize: "create", activate: "authorize", commit: "activate", bind: "commit", advance: "bind" };
      if (completed.has(step) || (prerequisite[step] != null && !completed.has(prerequisite[step]!))) throw new Error("dependency order or duplicate lifecycle write");
      const receipt = await input.adapter.write(step);
      const ceilingGas = (receipt.gasUsed * 125n) / 100n;
      operations.push({ name: step, caller: callerFor(step, input.owner, input.forecaster), target: targetFor(step, input.addresses), functionName: fnFor(step), args: argsFor(step, input), estimationMethod: "stateful fork eth_estimateGas + receipt gasUsed", gasUsed: receipt.gasUsed, ceilingGas, gasPriceWei: gasPrice, costWei: receipt.gasUsed * gasPrice });
      const read = step === "commit" ? "trial" : step === "bind" ? "iteration" : "runtime";
      const readback = await input.adapter.read(read);
      if (step === "commit" && (readback.value?.trialId !== input.trialId || readback.value?.marketId !== input.marketId || readback.value?.forecaster?.toLowerCase() !== input.forecaster.toLowerCase() || readback.value?.status !== "COMMITTED")) throw new Error("trial identity or commitment mismatch");
      if (step === "bind" && (readback.value?.trialId !== input.trialId || readback.value?.circuitId !== input.circuitId || readback.value?.bound !== true)) throw new Error("CircuitIteration binding mismatch");
      completed.add(step);
    } catch (e) {
      const code = ({ create: GAS_REASON_CODES.CREATE_FAILED, authorize: GAS_REASON_CODES.AUTHORIZE_FAILED, activate: GAS_REASON_CODES.ACTIVATE_FAILED, commit: GAS_REASON_CODES.COMMIT_FAILED, bind: GAS_REASON_CODES.BIND_FAILED, advance: GAS_REASON_CODES.READBACK_FAILED })[step];
      return finishFailure(fork, operations, ownerFundingWei, forecasterFundingWei, input, gasPrice, code, step, String(e));
    }
  }
  const [buyUp, buyDown] = await Promise.all([input.adapter.simulateAction("BUY_UP"), input.adapter.simulateAction("BUY_DOWN")]);
  const revalidation = await input.adapter.revalidate().catch((e) => ({ ok: false, reason: String(e) }));
  if (!revalidation.ok) return finishFailure(fork, operations, ownerFundingWei, forecasterFundingWei, input, gasPrice, GAS_REASON_CODES.REVALIDATION_FAILED, "revalidation", revalidation.reason);
  return finishSuccess(fork, operations, ownerFundingWei, forecasterFundingWei, input, gasPrice, buyUp, buyDown);
}

/** The fork is an owned process resource; close it on every normal lifecycle outcome. */
export async function estimateZeroActionLifecycle(input: GasEstimationInput): Promise<GasEstimationResult> {
  const result = await estimateZeroActionLifecycleUnsafe(input);
  await result.fork?.close?.();
  return result;
}

function fundingFor(operations: GasOperation[], ownerInjected: bigint, forecasterInjected: bigint, input: GasEstimationInput, gasPrice: bigint) {
  const ownerAdditional = operations.filter((o) => o.caller.toLowerCase() === input.owner.toLowerCase()).reduce((n, o) => n + o.ceilingGas * gasPrice, 0n);
  const commit = operations.find((o) => o.name === "commit");
  const forecasterAdditional = commit == null ? 0n : commit.ceilingGas * gasPrice;
  return { forkInjectedOwnerWei: ownerInjected.toString(), forkInjectedForecasterWei: forecasterInjected.toString(), ownerLiveBalance: (input.ownerLiveBalance ?? 0n).toString(), forecasterLiveBalance: (input.forecasterLiveBalance ?? 0n).toString(), ownerAdditionalFundingWei: ownerAdditional.toString(), forecasterAdditionalFundingWei: forecasterAdditional.toString(), ownerNativeWei: ownerInjected.toString(), forecasterNativeWei: forecasterInjected.toString(), totalGasWei: operations.reduce((n, o) => n + o.costWei, 0n).toString(), conservativeTotalWei: operations.reduce((n, o) => n + o.ceilingGas * gasPrice, 0n).toString() };
}
function finishSuccess(fork: ForkHandle, operations: GasOperation[], ownerFundingWei: bigint, forecasterFundingWei: bigint, input: GasEstimationInput, gasPrice: bigint, buyUp: any, buyDown: any): GasEstimationResult {
  const funding = fundingFor(operations, ownerFundingWei, forecasterFundingWei, input, gasPrice);
  return { status: "ESTIMATED", classification: "FORK_SIMULATION_ONLY", fork, operations, funding, zeroAction: { buyUp, buyDown, budgeted: false }, phaseB: { status: "UNRESOLVED", operations: [], note: "Phase B is post-resolution fresh-estimate-only; no success is inferred from this unresolved fork." }, failure: null, packet: { schemaVersion: "M4.3.5A.v1", evidenceClass: "FORK_SIMULATION_ONLY", chainWrites: false, broadcast: false, gas: operations, funding, failure: null } };
}
function finishFailure(fork: ForkHandle, operations: GasOperation[], ownerFundingWei: bigint, forecasterFundingWei: bigint, input: GasEstimationInput, gasPrice: bigint, code: GasReasonCode, phase: string, detail?: string): GasEstimationResult {
  const funding = fundingFor(operations, ownerFundingWei, forecasterFundingWei, input, gasPrice);
  const failure = { code, phase, detail }; return { status: "BLOCKED_GAS_ESTIMATION_FAILED", classification: "FORK_SIMULATION_ONLY", fork, operations, funding, zeroAction: { buyUp: { reverted: false }, buyDown: { reverted: false }, budgeted: false }, phaseB: { status: "UNRESOLVED", operations: [], note: "Phase B is post-resolution fresh-estimate-only; no success is inferred." }, failure, packet: { schemaVersion: "M4.3.5A.v1", evidenceClass: "FORK_SIMULATION_ONLY", chainWrites: false, broadcast: false, gas: operations, funding, failure } };
}
