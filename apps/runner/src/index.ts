/** Prior Runner — recoverable liveness runtime, not authority. */
import { createServer } from "node:http";
import { effectiveCircuitStatus } from "@prior/core";
import { DreamDexAdapter } from "@prior/dreamdex";
import { FixtureProviderAClient, type ForecastProviderClient } from "@prior/forecast-agent";
import { RunnerCheckpoint } from "./checkpoint.js";
import { RunnerBlockedError, RunnerWorkflow, type RunnerWorkflowDeps, type RunnerCircuit, type RunnerMarket } from "./workflow.js";
import { DreamDexSettlementReader, ExternalForecastGateway, CircuitControlGateway, ReceiptReconciler, type Id } from "./adapters.js";
import type { ForecastRequestWire, ForecastSubmissionWire } from "@prior/forecast-protocol";

const circuitAbi = [{type:"function",name:"intents",stateMutability:"view",inputs:[{name:"id",type:"bytes32"}],outputs:[{type:"tuple",components:[{type:"bytes32",name:"circuitId"},{type:"address",name:"owner"},{type:"address",name:"forecaster"},{type:"uint8",name:"marketClass"},{type:"uint16",name:"targetWindows"},{type:"uint128",name:"totalBudget"},{type:"uint128",name:"maxPerMarket"},{type:"uint16",name:"minMarginBps"},{type:"uint8",name:"maxConsecutiveLosses"},{type:"uint64",name:"startsAt"},{type:"uint64",name:"expiresAt"},{type:"uint256",name:"allowedActionsBitmap"}]}]},{type:"function",name:"runtime",stateMutability:"view",inputs:[{name:"id",type:"bytes32"}],outputs:[{type:"tuple",components:[{type:"uint8",name:"status"},{type:"uint16",name:"completed"},{type:"uint16",name:"missed"},{type:"uint16",name:"abstained"},{type:"uint8",name:"consecutiveLosses"},{type:"uint128",name:"reservedSpend"}]}]}] as const;

type Options = {
  checkpoint?: RunnerCheckpoint;
  rpcUrl?: string;
  indexerUrl?: string;
  forecastBaseUrl?: string;
  provider?: ForecastProviderClient;
  circuit?: RunnerWorkflowDeps["circuit"];
  markets?: RunnerWorkflowDeps["markets"];
  buildSubmission?: (request: ForecastRequestWire) => ForecastSubmissionWire;
  commitForecast?: (input: { marketId: Id; circuitId: Id; pUpBps: number; submissionId?: Id }) => Promise<{ trialId: Id }>;
  bindTrial?: (circuitId: Id, marketId: Id, trialId: Id) => Promise<void>;
  advanceCircuit?: (circuitId: Id, marketId: Id) => Promise<void>;
  finalizeRft?: (trialId: Id, marketId: Id) => Promise<void>;
};

const external = (label: string): never => { throw new RunnerBlockedError("BLOCKED_EXTERNAL", `${label} unavailable; inject an explicitly scoped callback`); };

export function buildRunnerWorkflow(options: Options = {}): RunnerWorkflow {
  const adapter = new DreamDexAdapter({ rpcUrl: options.rpcUrl ?? process.env.SHANNON_RPC_HTTP, indexerUrl: options.indexerUrl ?? process.env.DREAMDEX_INDEXER_URL });
  const checkpoint = options.checkpoint ?? new RunnerCheckpoint(process.env.PRIOR_CHECKPOINT_PATH ?? ".prior/runner-checkpoint.json");
  const circuitAddress = process.env.PRIOR_CIRCUIT_REGISTRY as `0x${string}` | undefined;
  const circuitId = process.env.PRIOR_CIRCUIT_ID as `0x${string}` | undefined;
  const provider = options.provider ?? ((options.forecastBaseUrl ?? process.env.FORECAST_PROVIDER_URL) ? new FixtureProviderAClient(options.forecastBaseUrl ?? process.env.FORECAST_PROVIDER_URL!) : undefined);
  const forecast = provider ? {
    obtain: async (market: { marketId: string }, circuit: { circuitId: string }) => {
      const request = await provider.getForecastRequest();
      if (request.marketId !== market.marketId || request.circuitId !== circuit.circuitId) throw new RunnerBlockedError("DEPENDENCY_FAILURE", "provider request identity mismatch");
      const pUpBps = Number(process.env.PRIOR_FORECAST_PROBABILITY_BPS ?? "5000");
      if (!Number.isInteger(pUpBps) || pUpBps < 0 || pUpBps > 10000) throw new RunnerBlockedError("DEPENDENCY_FAILURE", "invalid forecast probability configuration");
      return { pUpBps };
    },
  } : undefined;
  const forecastGateway = provider ? (options.buildSubmission ? new ExternalForecastGateway({ provider, buildSubmission: options.buildSubmission, commit: options.commitForecast ?? (() => external("RFT commit")) }) : { commit: async () => external("forecast submission signer") }) : undefined;
  const settlement = new DreamDexSettlementReader(async (marketId: Id) => {
    const found = (await adapter.listRecentMarkets(100)).find((market) => market.marketId === marketId);
    if (!found) throw new RunnerBlockedError("DEPENDENCY_FAILURE", "DreamDEX market not found");
    if (found.lifecycle === "Voided") return { finalized: true, voided: true, outcome: null, source: "dreamdex" as const };
    if (found.lifecycle === "Resolved") throw new RunnerBlockedError("BLOCKED_EXTERNAL", "DreamDEX outcome read is unavailable from the verified adapter");
    return { finalized: false, voided: false, outcome: null, source: "dreamdex" as const };
  });
  const ownerGateway = new CircuitControlGateway({ bindTrial: options.bindTrial ?? (() => external("Circuit bindTrial")), advance: options.advanceCircuit ?? (() => external("Circuit advance")) });
  return new RunnerWorkflow({
    checkpoint,
    circuit: options.circuit ?? { loadActive: async () => {
      if (!circuitAddress || !circuitId) return null;
      const runtime: any = await adapter.publicClient.readContract({ address: circuitAddress, abi: circuitAbi, functionName: "runtime", args: [circuitId] });
      return { circuitId, status: Number(runtime.status) === 2 ? "ACTIVE" : "INACTIVE" };
    } },
    markets: options.markets ?? { discover: async () => (await adapter.listRecentMarkets(50)).find((m) => m.lifecycle === "Trading") ?? null },
    forecast,
    forecastGateway: forecastGateway ? { commit: async (value, market, circuit) => forecastGateway.commit({ marketId: market.marketId as Id, circuitId: circuit.circuitId as Id }).then((result) => ({ trialId: result.trialId })) } : undefined,
    policy: { evaluate: async () => ({ kind: "ABSTAIN", reason: "economic execution is not configured" }) },
    receipts: { observe: async (id) => {
      const receipt = await adapter.publicClient.getTransactionReceipt({ hash: id as `0x${string}` });
      const reconciled = new ReceiptReconciler().reconcile({ status: receipt.status === "success" ? "CONFIRMED" : "FAILED", txHash: receipt.transactionHash });
      return { status: reconciled.status === "AMBIGUOUS" ? "UNKNOWN" : reconciled.status, txHash: reconciled.txHash };
    } },
    settlement: { observe: async (market) => settlement.observe(market.marketId as Id) },
    rft: { finalize: async (trialId, market) => { const finalize = options.finalizeRft; if (!finalize) throw new RunnerBlockedError("BLOCKED_EXTERNAL", "RFT finalize unavailable; inject an explicitly scoped callback"); await finalize(trialId as Id, market.marketId as Id); } },
    circuitGateway: { bindTrial: async (circuit, market, trialId) => ownerGateway.bind(circuit.circuitId as Id, market.marketId as Id, trialId as Id), advance: async (circuit, market) => ownerGateway.advance(circuit.circuitId as Id, market.marketId as Id) },
  } satisfies RunnerWorkflowDeps);
}

let lastReconciledBlock = 0n;
let lastMarkets = 0;
let recoveryLoaded = false;
const checkpoint = new RunnerCheckpoint(process.env.PRIOR_CHECKPOINT_PATH ?? ".prior/runner-checkpoint.json");
const workflow = buildRunnerWorkflow({ checkpoint });

async function reconcile(){
  if (checkpoint) { await checkpoint.load(); recoveryLoaded = true; }
  const adapter = new DreamDexAdapter({ rpcUrl: process.env.SHANNON_RPC_HTTP, indexerUrl: process.env.DREAMDEX_INDEXER_URL });
  const markets = await adapter.listRecentMarkets(50);
  const cycle = await workflow.runOnce();
  const block = await adapter.publicClient.getBlockNumber();
  lastReconciledBlock=block; lastMarkets=markets.length;
  let circuit = null;
  const circuitAddress = process.env.PRIOR_CIRCUIT_REGISTRY as `0x${string}` | undefined;
  const circuitId = process.env.PRIOR_CIRCUIT_ID as `0x${string}` | undefined;
  if (circuitAddress && circuitId) {
    const [intent, runtime] = await Promise.all([adapter.publicClient.readContract({address:circuitAddress,abi:circuitAbi,functionName:"intents",args:[circuitId]}), adapter.publicClient.readContract({address:circuitAddress,abi:circuitAbi,functionName:"runtime",args:[circuitId]})]);
    const i:any = intent, r:any = runtime;
    circuit = { circuitId, storedStatus:Number(r.status), effectiveStatus:effectiveCircuitStatus(Number(r.status) as any, i.expiresAt, (await adapter.publicClient.getBlock()).timestamp), targetWindows:Number(i.targetWindows), completed:Number(r.completed), abstained:Number(r.abstained), expiresAt:i.expiresAt.toString() };
  }
  return { block:block.toString(), markets:markets.length, trading:markets.filter((m)=>m.lifecycle==="Trading").length, circuit, cycle };
}

if (process.env.NODE_ENV !== "test" && !process.argv.some((arg) => arg.includes("test"))) {
  const port=Number(process.env.PORT??8787);
  createServer(async (req,res)=>{
    res.setHeader("content-type","application/json");
    if(req.url==="/health"){res.end(JSON.stringify({ok:true,service:"prior-runner"}));return}
    if(req.url==="/ready"){try{const x=await reconcile();res.end(JSON.stringify({ok:true,...x}));}catch(e){res.statusCode=503;res.end(JSON.stringify({ok:false,error:e instanceof Error?e.message:"rpc unavailable"}));}return}
    if(req.url==="/runtime" || req.url==="/iterations"){res.end(JSON.stringify({iterations:checkpoint?.all() ?? []}));return}
    res.statusCode=404;res.end(JSON.stringify({error:"not found"}));
  }).listen(port,()=>console.log(`Prior Runner listening on ${port}`));
}
