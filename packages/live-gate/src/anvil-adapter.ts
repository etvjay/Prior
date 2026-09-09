import { spawn, type ChildProcess } from "node:child_process";
import { createPublicClient, createWalletClient, http, keccak256, encodeAbiParameters, parseAbi, type Address, type Hex } from "viem";
import type { ForkHandle, ForkLifecycleAdapter, LifecycleWrite } from "./gas-estimation.js";

const registryAbi = parseAbi([
  "function create((bytes32 circuitId,address owner,address forecaster,uint8 marketClass,uint16 targetWindows,uint128 totalBudget,uint128 maxPerMarket,uint16 minMarginBps,uint8 maxConsecutiveLosses,uint64 startsAt,uint64 expiresAt,uint256 allowedActionsBitmap) intent) returns (bytes32)",
  "function authorize(bytes32 circuitId)", "function activate(bytes32 circuitId)",
  "function bindTrial(bytes32 circuitId,bytes32 marketId,bytes32 trialId)",
  "function advance(bytes32 circuitId,bytes32 marketId,bool missed,bool abstained,bool loss)",
  "function getIteration(bytes32 circuitId,bytes32 marketId) view returns ((bytes32 iterationId,bytes32 circuitId,bytes32 marketId,bytes32 trialId,bool bound,bool processed,bool missed))",
  "function runtime(bytes32) view returns (uint8 status,uint16 completed,uint16 missed,uint16 abstained,uint8 consecutiveLosses,uint128 reservedSpend)",
]);
const rftAbi = parseAbi([
  "function commitForecast(bytes32 marketId,uint16 pUpBps,uint16 referenceUpBps,bool referenceValid,uint64 tradeTag,uint8 actionIntent) returns (bytes32)",
  "function getTrial(bytes32) view returns ((bytes32 trialId,bytes32 marketId,address forecaster,uint16 pUpBps,uint16 referenceUpBps,bool referenceValid,uint64 committedAt,uint64 committedBlock,uint32 secondsToExpiry,uint64 tradeTag,uint8 actionIntent,uint8 status,uint8 outcome,uint32 forecastBrier,uint32 marketBrier,int64 marketScoreDelta))",
]);
const executorAbi = parseAbi(["function execute(bytes32,bytes32,address,uint8,uint256,uint256,uint64,uint8,uint8,address,uint96,uint64,uint128) payable returns (uint128)"]);
const moduleAbi = parseAbi(["function markets(bytes32) view returns (uint256,uint8,uint8,address,uint32,bytes32,address,address,address,address,uint256,uint256,uint64,uint64)"]);

const rpc = async (url: string, method: string, params: unknown[]) => {
  const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
  const body: any = await response.json();
  if (!response.ok || body.error) throw new Error(`${method}:${body.error?.message ?? response.status}`);
  return body.result;
};

export type ConcreteForkConfig = {
  rpcUrl: string; block: bigint; owner: Address; forecaster: Address;
  marketId: Hex;
  marketClass: number; startsAt: bigint; expiresAt: bigint;
  addresses: { rft: Address; registry: Address; executor: Address; binaryModule: Address };
};

export async function createConcreteForkAdapter(config: ConcreteForkConfig): Promise<ForkLifecycleAdapter> {
  const fork = await createAnvilShannonFork(config.rpcUrl, config.block);
  const publicClient = createPublicClient({ transport: http(fork.rpcUrl) });
  const wallet = (account: Address) => createWalletClient({ account, transport: http(fork.rpcUrl) });
  const chainId = BigInt(await publicClient.getChainId());
  let circuitId: Hex | undefined;
  let trialId: Hex | undefined;
  const adapter: ForkLifecycleAdapter = {
    calls: [],
    async createFork() { return fork; },
    async codeAt(address) { return await publicClient.getBytecode({ address: address as Address }) ?? "0x"; },
    async setBalance(address, amountWei) {
      if (address.toLowerCase() !== config.owner.toLowerCase()) throw new Error("FORECASTER_FUNDING_FORBIDDEN");
      await rpc(fork.rpcUrl, "anvil_setBalance", [address, `0x${amountWei.toString(16)}`]);
    },
    async impersonate(address) {
      if (![config.owner, config.forecaster].some((x) => x.toLowerCase() === address.toLowerCase())) throw new Error("IMPERSONATION_ACTOR_NOT_ALLOWED");
      await rpc(fork.rpcUrl, "anvil_impersonateAccount", [address]);
    },
    async gasPrice() { return await publicClient.getGasPrice(); },
    async write(step: LifecycleWrite) {
      let hash: Hex;
      const owner = wallet(config.owner);
      const forecaster = wallet(config.forecaster);
      if (step === "create") {
        const intent = { circuitId: "0x0000000000000000000000000000000000000000000000000000000000000000" as Hex, owner: config.owner, forecaster: config.forecaster, marketClass: config.marketClass, targetWindows: 1, totalBudget: 1n, maxPerMarket: 1n, minMarginBps: 0, maxConsecutiveLosses: 1, startsAt: config.startsAt, expiresAt: config.expiresAt, allowedActionsBitmap: 0n } as const;
        hash = await owner.writeContract({ address: config.addresses.registry, abi: registryAbi, functionName: "create", args: [intent] } as any);
      } else if (step === "authorize") hash = await owner.writeContract({ address: config.addresses.registry, abi: registryAbi, functionName: "authorize", args: [circuitId!] } as any);
      else if (step === "activate") hash = await owner.writeContract({ address: config.addresses.registry, abi: registryAbi, functionName: "activate", args: [circuitId!] } as any);
      else if (step === "commit") hash = await forecaster.writeContract({ address: config.addresses.rft, abi: rftAbi, functionName: "commitForecast", args: [config.marketId, 5000, 0, false, 0, 3] as any } as any);
      else if (step === "bind") hash = await owner.writeContract({ address: config.addresses.registry, abi: registryAbi, functionName: "bindTrial", args: [circuitId!, config.marketId, trialId!] } as any);
      else hash = await owner.writeContract({ address: config.addresses.registry, abi: registryAbi, functionName: "advance", args: [circuitId!, config.marketId, false, true, false] } as any);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (step === "create") {
        const id = keccak256(encodeAbiParameters([{ type: "uint256" }, { type: "address" }, { type: "address" }, { type: "uint8" }, { type: "uint64" }, { type: "uint16" }], [chainId, config.addresses.registry, config.owner, config.marketClass, config.startsAt, 1]));
        circuitId = id;
      }
      if (step === "commit") trialId = keccak256(encodeAbiParameters([{ type: "uint256" }, { type: "address" }, { type: "address" }, { type: "bytes32" }], [chainId, config.addresses.rft, config.forecaster, config.marketId]));
      return { gasUsed: receipt.gasUsed };
    },
    async read(step) {
      if (step === "trial") { const value: any = await publicClient.readContract({ address: config.addresses.rft, abi: rftAbi, functionName: "getTrial", args: [trialId!] }); return { step, value: { ...value, status: Number(value.status) === 1 ? "COMMITTED" : String(value.status), trialId: value.trialId, marketId: value.marketId, forecaster: value.forecaster } }; }
      if (step === "iteration") { const value: any = await publicClient.readContract({ address: config.addresses.registry, abi: registryAbi, functionName: "getIteration", args: [circuitId!, config.marketId!] }); return { step, value }; }
      return { step, value: await publicClient.readContract({ address: config.addresses.registry, abi: registryAbi, functionName: "runtime", args: [circuitId!] }) };
    },
    async simulateAction(kind) {
      try { await publicClient.simulateContract({ address: config.addresses.executor, abi: executorAbi, functionName: "execute", account: config.owner, args: [circuitId!, config.marketId!, "0x0000000000000000000000000000000000000000", kind === "BUY_UP" ? 0 : 2, 0n, 1n, 0n, 0, 0, config.owner, 0, 0, 1n] as any }); return { reverted: false }; }
      catch (error: any) { return { reverted: true, reason: error?.cause?.data?.errorName ?? error?.shortMessage?.includes("ActionNotAllowed") ? "ActionNotAllowed" : error?.shortMessage ?? String(error) }; }
    },
    async revalidate() {
      try { const direct = createPublicClient({ transport: http(config.rpcUrl) }); await direct.getBalance({ address: config.forecaster }); for (const address of [config.addresses.rft, config.addresses.registry, config.addresses.executor]) if (!(await direct.getBytecode({ address }))) return { ok: false, reason: "REVALIDATION_MISSING_SHANNON_CODE" }; await direct.readContract({ address: config.addresses.binaryModule, abi: moduleAbi, functionName: "markets", args: [config.marketId] }); return { ok: true }; }
      catch (error) { return { ok: false, reason: `REVALIDATION_SHANNON_READ_FAILED:${String(error)}` }; }
    },
  };
  return adapter;
}

export async function createAnvilShannonFork(rpcUrl: string, block: bigint, port = 8545): Promise<ForkHandle & { close: () => Promise<void> }> {
  const child: ChildProcess = spawn("anvil", ["--fork-url", rpcUrl, "--fork-block-number", block.toString(), "--port", String(port), "--silent"], { stdio: "ignore" });
  const local = `http://127.0.0.1:${port}`;
  try { for (let i = 0; i < 30; i++) { try { const c = createPublicClient({ transport: http(local) }); if ((await c.getBlockNumber()) === block) break; } catch {} await new Promise((resolve) => setTimeout(resolve, 200)); } const c = createPublicClient({ transport: http(local) }); const actual = await c.getBlockNumber(); if (actual !== block) throw new Error(`FORK_BLOCK_MISMATCH:expected=${block}:actual=${actual}`); }
  catch (error) { child.kill("SIGTERM"); throw error; }
  return { block, rpcUrl: local, simulationOnly: true, close: async () => { if (!child.killed) { child.kill("SIGTERM"); await new Promise<void>((resolve) => { child.once("exit", () => resolve()); setTimeout(resolve, 1000); }); } } };
}
