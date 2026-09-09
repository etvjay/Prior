import { spawn, execFile, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";
import { createPublicClient, createWalletClient, defineChain, http, keccak256, encodeAbiParameters, parseAbi, stringToHex, type Address, type Hex } from "viem";
import type { ForkHandle, ForkLifecycleAdapter, LifecycleWrite } from "./gas-estimation.js";
import { assembleCreateIntent } from "./create-diagnosis.js";

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
const execFileAsync = promisify(execFile);

export const SOMNIA_SHANNON_CHAIN = defineChain({
  id: 50312,
  name: "Somnia Shannon",
  nativeCurrency: { name: "Somnia Testnet Token", symbol: "STT", decimals: 18 },
  rpcUrls: { default: { http: ["https://dream-rpc.somnia.network"] } },
});

export const FORK_PROCESS_START_FAILED = "FORK_PROCESS_START_FAILED" as const;
export const FORK_IDENTITY_MISMATCH = "FORK_IDENTITY_MISMATCH" as const;
export const UPSTREAM_HISTORICAL_STATE_UNAVAILABLE = "UPSTREAM_HISTORICAL_STATE_UNAVAILABLE" as const;
export const ANVIL_SHANNON_FORK_INCOMPATIBILITY = "ANVIL_SHANNON_FORK_INCOMPATIBILITY" as const;

export class ForkIsolationError extends Error {
  constructor(public readonly code: typeof FORK_PROCESS_START_FAILED | typeof FORK_IDENTITY_MISMATCH | typeof UPSTREAM_HISTORICAL_STATE_UNAVAILABLE | typeof ANVIL_SHANNON_FORK_INCOMPATIBILITY, message: string, public readonly evidence?: ForkEvidence) {
    super(`${code}:${message}`);
    this.name = "ForkIsolationError";
  }
}

export type ForkEvidence = {
  forkRunId: string;
  pid: number;
  args: string[];
  port: number;
  rpcUrl: string;
  anvilVersion: string;
  stdout: string;
  stderr: string;
  upstream: { number: bigint; hash: string; timestamp: bigint };
  actual?: { number: bigint; hash: string; timestamp: bigint; chainId: bigint };
  upstreamRegistryCode?: string;
  upstreamRftRegistry?: string;
};

export type ForkPortAllocation = { port: number; release: () => Promise<void> };

export async function allocateUnusedLocalhostPort(): Promise<ForkPortAllocation> {
  const server = createServer();
  await new Promise<void>((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", () => resolve()); });
  const address = server.address();
  if (!address || typeof address === "string") { await new Promise<void>((resolve) => server.close(() => resolve())); throw new Error("LOCALHOST_PORT_ALLOCATION_FAILED"); }
  let released = false;
  return { port: address.port, release: async () => { if (!released) { released = true; await new Promise<void>((resolve) => server.close(() => resolve())); } } };
}

const rpc = async (url: string, method: string, params: unknown[]) => {
  const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
  const body: any = await response.json();
  if (!response.ok || body.error) throw new Error(`${method}:${body.error?.message ?? response.status}`);
  return body.result;
};

export type ConcreteForkConfig = {
  rpcUrl: string; block: bigint; owner: Address; forecaster: Address;
  marketId: Hex;
  marketClass: number; observationTimestamp: bigint; startsAt: bigint; expiresAt: bigint;
  addresses: { rft: Address; registry: Address; executor: Address; binaryModule: Address };
};

export async function createConcreteForkAdapter(config: ConcreteForkConfig): Promise<ForkLifecycleAdapter> {
  const fork = await createAnvilShannonFork(config.rpcUrl, config.block, undefined, { registryAddress: config.addresses.registry });
  const publicClient = createPublicClient({ transport: http(fork.rpcUrl) });
  const shannonClient = createPublicClient({ chain: SOMNIA_SHANNON_CHAIN, transport: http(config.rpcUrl) });
  try {
    const forkBlock = await publicClient.getBlock({ blockNumber: config.block });
    if (forkBlock.timestamp !== config.observationTimestamp) throw new Error(`OBSERVATION_BLOCK_TIMESTAMP_MISMATCH:block=${config.block}:fork=${forkBlock.timestamp}:observed=${config.observationTimestamp}`);
  } catch (error) {
    await fork.close();
    throw error;
  }
  const wallet = (account: Address) => createWalletClient({ account, chain: SOMNIA_SHANNON_CHAIN, transport: http(fork.rpcUrl) });
  const chainId = BigInt(await publicClient.getChainId());
  let circuitId: Hex | undefined;
  let trialId: Hex | undefined;
  const adapter: ForkLifecycleAdapter = {
    calls: [],
    async createFork() { return fork; },
    async codeAt(address) { return await publicClient.getBytecode({ address: address as Address }) ?? "0x"; },
    async setBalance(address, amountWei) {
      if (![config.owner, config.forecaster].some((x) => x.toLowerCase() === address.toLowerCase())) throw new Error("FORK_FUNDING_ACTOR_NOT_ALLOWED");
      await rpc(fork.rpcUrl, "anvil_setBalance", [address, `0x${amountWei.toString(16)}`]);
    },
    async impersonate(address) {
      if (![config.owner, config.forecaster].some((x) => x.toLowerCase() === address.toLowerCase())) throw new Error("IMPERSONATION_ACTOR_NOT_ALLOWED");
      await rpc(fork.rpcUrl, "anvil_impersonateAccount", [address]);
    },
    async gasPrice() { return await shannonClient.getGasPrice(); },
    async write(step: LifecycleWrite) {
      let hash: Hex;
      const owner = wallet(config.owner);
      const forecaster = wallet(config.forecaster);
      if (step === "create") {
        const intent = assembleCreateIntent({ owner: config.owner, forecaster: config.forecaster, marketClass: config.marketClass, targetWindows: 1, observationTimestamp: config.observationTimestamp, tradingStart: config.startsAt, expiry: config.expiresAt });
        if (config.expiresAt <= config.startsAt) throw new Error("INVALID_OBSERVED_INTENT_WINDOW");
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
      catch (error: any) { const text = `${String(error)} ${String(error?.shortMessage ?? "")} ${String(error?.cause?.data?.errorName ?? "")}`; const actionNotAllowed = error?.cause?.data?.errorName === "ActionNotAllowed" || error?.shortMessage?.includes("ActionNotAllowed") || text.includes("ActionNotAllowed") || text.includes("0x829e3733"); return { reverted: true, reason: actionNotAllowed ? "ActionNotAllowed" : error?.shortMessage ?? String(error) }; }
    },
    async revalidate() {
      try { const direct = createPublicClient({ transport: http(config.rpcUrl) }); await direct.getBalance({ address: config.forecaster }); for (const address of [config.addresses.rft, config.addresses.registry, config.addresses.executor]) if (!(await direct.getBytecode({ address }))) return { ok: false, reason: "REVALIDATION_MISSING_SHANNON_CODE" }; await direct.readContract({ address: config.addresses.binaryModule, abi: moduleAbi, functionName: "markets", args: [config.marketId] }); return { ok: true }; }
      catch (error) { return { ok: false, reason: `REVALIDATION_SHANNON_READ_FAILED:${String(error)}` }; }
    },
  };
  return adapter;
}

function hexNumber(value: bigint): string { return `0x${value.toString(16)}`; }
function blockIdentity(value: any): { number: bigint; hash: string; timestamp: bigint } {
  if (!value?.number || !value?.hash || value.timestamp == null) throw new Error("historical block response missing identity");
  return { number: BigInt(value.number), hash: String(value.hash), timestamp: BigInt(value.timestamp) };
}
export function verifyForkIdentity(upstream: { number: bigint; hash: string; timestamp: bigint }, actual: { number: bigint; hash: string; timestamp: bigint }, chainId: bigint): void {
  if (chainId !== 50312n || actual.number !== upstream.number || actual.hash.toLowerCase() !== upstream.hash.toLowerCase() || actual.timestamp !== upstream.timestamp) throw new ForkIsolationError(FORK_IDENTITY_MISMATCH, `expected ${upstream.number}/${upstream.hash}/${upstream.timestamp}, got ${chainId}/${actual.number}/${actual.hash}/${actual.timestamp}`);
}
function closeChild(child: ChildProcess): Promise<void> {
  return new Promise((resolve) => {
    if (child.exitCode != null || child.signalCode != null) return resolve();
    let done = false;
    const finish = () => { if (!done) { done = true; clearTimeout(timer); resolve(); } };
    const timer = setTimeout(() => { if (child.exitCode == null && child.signalCode == null) child.kill("SIGKILL"); finish(); }, 2000);
    child.once("exit", finish);
    child.kill("SIGTERM");
  });
}

/** Starts one isolated child and never adopts an already-running Anvil endpoint. */
export async function createAnvilShannonFork(rpcUrl: string, block: bigint, requestedPort?: number, options?: { registryAddress?: Address }): Promise<ForkHandle & { close: () => Promise<void>; evidence: ForkEvidence }> {
  const forkRunId = randomUUID();
  const upstreamTag = hexNumber(block);
  let upstreamRaw: any;
  let upstreamRegistryCode = "";
  let upstreamRftRegistry = "";
  try {
    upstreamRaw = await rpc(rpcUrl, "eth_getBlockByNumber", [upstreamTag, false]);
    if (!upstreamRaw) throw new Error("block unavailable");
    const upstream = blockIdentity(upstreamRaw);
    if (upstream.number !== block) throw new Error(`number=${upstream.number}`);
    if (options?.registryAddress) {
      upstreamRegistryCode = await rpc(rpcUrl, "eth_getCode", [options.registryAddress, upstreamTag]);
      if (!upstreamRegistryCode || upstreamRegistryCode === "0x") throw new Error("RegistryV2 code unavailable");
      const selector = keccak256(stringToHex("rftRegistry()" as string)).slice(0, 10);
      const result = await rpc(rpcUrl, "eth_call", [{ to: options.registryAddress, data: selector }, upstreamTag]);
      if (typeof result !== "string" || result.length < 42) throw new Error("rftRegistry unavailable");
      upstreamRftRegistry = `0x${result.slice(-40)}`;
    }
  } catch (error) {
    throw new ForkIsolationError(UPSTREAM_HISTORICAL_STATE_UNAVAILABLE, String(error));
  }
  const upstream = blockIdentity(upstreamRaw);
  const allocation = await allocateUnusedLocalhostPort();
  const port = allocation.port;
  const args = ["--fork-url", rpcUrl, "--fork-block-number", block.toString(), "--port", String(port), "--silent"];
  let version = "unknown";
  try { version = (await execFileAsync("anvil", ["--version"])).stdout.trim(); } catch { /* startup evidence retains unknown version */ }
  await allocation.release();
  const child: ChildProcess = spawn("anvil", args, { stdio: ["ignore", "pipe", "pipe"] });
  const pid = child.pid;
  if (!pid) throw new ForkIsolationError(FORK_PROCESS_START_FAILED, "child has no pid");
  let stdout = ""; let stderr = "";
  child.stdout?.on("data", (chunk) => { stdout += String(chunk); });
  child.stderr?.on("data", (chunk) => { stderr += String(chunk); });
  const evidence: ForkEvidence = { forkRunId, pid, args, port, rpcUrl: `http://127.0.0.1:${port}`, anvilVersion: version, stdout, stderr, upstream, upstreamRegistryCode, upstreamRftRegistry };
  const local = evidence.rpcUrl;
  const fail = async (code: typeof FORK_PROCESS_START_FAILED | typeof FORK_IDENTITY_MISMATCH, message: string): Promise<never> => { await closeChild(child); evidence.stdout = stdout; evidence.stderr = stderr; throw new ForkIsolationError(code, message, evidence); };
  try {
    const client = createPublicClient({ transport: http(local) });
    let actual: { number: bigint; hash: string; timestamp: bigint } | undefined;
    for (let i = 0; i < 100; i++) {
      if (child.exitCode != null || child.signalCode != null) await fail(FORK_PROCESS_START_FAILED, `child exited pid=${pid}`);
      try { actual = blockIdentity(await rpc(local, "eth_getBlockByNumber", ["latest", false])); break; } catch { await new Promise((resolve) => setTimeout(resolve, 100)); }
    }
    if (!actual) { await fail(FORK_PROCESS_START_FAILED, "owned RPC did not become ready"); return undefined as never; }
    const observed: { number: bigint; hash: string; timestamp: bigint } = actual;
    const chainId = BigInt(await client.getChainId());
    evidence.actual = { ...observed, chainId };
    try { verifyForkIdentity(upstream, observed, chainId); } catch (error) { await fail(FORK_IDENTITY_MISMATCH, (error as Error).message); }
  } catch (error) {
    await closeChild(child);
    evidence.stdout = stdout; evidence.stderr = stderr;
    if (error instanceof ForkIsolationError) throw error;
    throw new ForkIsolationError(FORK_PROCESS_START_FAILED, String(error), evidence);
  }
  const close: () => Promise<void> = async () => { await closeChild(child); evidence.stdout = stdout; evidence.stderr = stderr; }; // close: async lifecycle hook
  return { block, rpcUrl: local, simulationOnly: true, close, evidence };
}
