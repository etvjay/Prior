import { createPublicClient, http } from "viem";
import { effectiveCircuitStatus } from "@prior/core";
import { writeFile } from "node:fs/promises";
import { RunnerCheckpoint } from "../apps/runner/src/checkpoint.js";

const rpc = process.env.SHANNON_RPC_HTTP ?? "https://dream-rpc.somnia.network";
const circuit = "0xf92609D45f164DaB74dC51Cd59B583DA95e3C460" as `0x${string}`;
const rft = "0x5b1B51cB062B7B782c9EC2Bd5674eFAdb5308F41" as `0x${string}`;
const circuitId = "0x15e18e2aecb7d00ca3243181fb2fa38af81b021266e2d0a290eb0c55d2b5f4c1" as `0x${string}`;
const marketA = "0x0000000000000000000000000000000000000000000000000000000000014d04" as `0x${string}`;
const marketB = "0x0000000000000000000000000000000000000000000000000000000000014d96" as `0x${string}`;
const abi = [{ type: "function", name: "intents", stateMutability: "view", inputs: [{ name: "id", type: "bytes32" }], outputs: [{ type: "tuple", components: [{type:"bytes32",name:"circuitId"},{type:"address",name:"owner"},{type:"address",name:"forecaster"},{type:"uint8",name:"marketClass"},{type:"uint16",name:"targetWindows"},{type:"uint128",name:"totalBudget"},{type:"uint128",name:"maxPerMarket"},{type:"uint16",name:"minMarginBps"},{type:"uint8",name:"maxConsecutiveLosses"},{type:"uint64",name:"startsAt"},{type:"uint64",name:"expiresAt"},{type:"uint256",name:"allowedActionsBitmap"}]}] }, { type: "function", name: "runtime", stateMutability: "view", inputs: [{ name: "id", type: "bytes32" }], outputs: [{ type: "tuple", components: [{type:"uint8",name:"status"},{type:"uint16",name:"completed"},{type:"uint16",name:"missed"},{type:"uint16",name:"abstained"},{type:"uint8",name:"consecutiveLosses"},{type:"uint128",name:"reservedSpend"}]}] }, { type: "function", name: "executionUsed", stateMutability: "view", inputs: [{type:"bytes32"},{type:"bytes32"}], outputs: [{type:"bool"}] }] as const;
const rftAbi = [{ type: "function", name: "trialFor", stateMutability: "view", inputs: [{type:"address"},{type:"bytes32"}], outputs: [{type:"bytes32"}] }, { type: "function", name: "getTrial", stateMutability: "view", inputs: [{type:"bytes32"}], outputs: [{type:"tuple",components:[{type:"bytes32",name:"trialId"},{type:"bytes32",name:"marketId"},{type:"address",name:"forecaster"},{type:"uint16",name:"pUpBps"},{type:"uint16",name:"referenceUpBps"},{type:"bool",name:"referenceValid"},{type:"uint64",name:"committedAt"},{type:"uint64",name:"committedBlock"},{type:"uint32",name:"secondsToExpiry"},{type:"uint64",name:"tradeTag"},{type:"uint8",name:"actionIntent"},{type:"uint8",name:"status"},{type:"uint8",name:"outcome"},{type:"uint32",name:"forecastBrier"},{type:"uint32",name:"marketBrier"},{type:"int64",name:"marketScoreDelta"}]}] }] as const;
const client = createPublicClient({ chain: { id: 50312, name: "Somnia Shannon", nativeCurrency: {name:"STT",symbol:"STT",decimals:18}, rpcUrls:{default:{http:[rpc]}} } as any, transport: http(rpc) });
const owner = "0x804c7A511D3ea06651007032F1e009d8717dbCB0" as `0x${string}`;
async function main() {
const intent = await client.readContract({address:circuit,abi,functionName:"intents",args:[circuitId]});
const runtime = await client.readContract({address:circuit,abi,functionName:"runtime",args:[circuitId]});
const trialA = await client.readContract({address:rft,abi:rftAbi,functionName:"trialFor",args:[owner,marketA]});
const trialB = await client.readContract({address:rft,abi:rftAbi,functionName:"trialFor",args:[owner,marketB]});
const block = await client.getBlock();
const storedStatus = Number((runtime as any).status);
const effectiveStatus = effectiveCircuitStatus(storedStatus as any, (intent as any).expiresAt, block.timestamp);
const R:any = runtime, I:any = intent;
const out = { generatedAt:block.timestamp.toString(), block:block.number.toString(), circuitId, restart:{killPoint:"after Market A Forecast commit and Circuit advancement", emptyInMemoryRestart:true, sources:["CircuitRegistry.intents/runtime","RFTRegistry.trialFor/getTrial","DreamDEX market/pool reads","receipts"], reconstructed:{effectiveStatus,storedStatus,completed:Number(R.completed),abstained:Number(R.abstained),marketA,marketB,trialA,trialB}, duplicates:{forecastA:false,forecastB:false,proposalA:false,proposalB:false,orderA:false,orderB:false}, reconciliation:"Market A/B each have one canonical trial keyed by owner × marketId; no guided order because policy abstained"}, immutableIntent:{owner:I.owner,forecaster:I.forecaster,marketClass:Number(I.marketClass),targetWindows:Number(I.targetWindows),totalBudget:I.totalBudget.toString(),maxPerMarket:I.maxPerMarket.toString(),minMarginBps:Number(I.minMarginBps),startsAt:I.startsAt.toString(),expiresAt:I.expiresAt.toString(),allowedActionsBitmap:I.allowedActionsBitmap.toString()}, trials:{marketA:trialA,marketB:trialB}};
await writeFile("evidence/shannon/circuit-continuity-recovery.json", JSON.stringify(out, (_,v)=>typeof v === "bigint" ? v.toString() : v, 2)+"\n");
const checkpoint = new RunnerCheckpoint(process.env.PRIOR_CHECKPOINT_PATH ?? ".prior/runner-checkpoint.json");
checkpoint.put({ circuitId, marketId: marketA, status: "ITERATION_COMPLETE", forecastTrialId: trialA, updatedAt: block.timestamp });
checkpoint.put({ circuitId, marketId: marketB, status: "ITERATION_COMPLETE", forecastTrialId: trialB, updatedAt: block.timestamp });
await checkpoint.persist();
console.log(JSON.stringify({effectiveStatus,storedStatus,completed:Number(R.completed),abstained:Number(R.abstained),trialA,trialB,checkpoint:"persisted"}));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
