/** Prior Runner — recoverable liveness runtime, not authority. */
import { createServer } from "node:http";
import { effectiveCircuitStatus } from "@prior/core";
import { DreamDexAdapter } from "@prior/dreamdex";
import { RunnerCheckpoint } from "./checkpoint.js";

const adapter = new DreamDexAdapter({ rpcUrl: process.env.SHANNON_RPC_HTTP, indexerUrl: process.env.DREAMDEX_INDEXER_URL });
const checkpoint = new RunnerCheckpoint(process.env.PRIOR_CHECKPOINT_PATH ?? ".prior/runner-checkpoint.json");
const circuitAddress = process.env.PRIOR_CIRCUIT_REGISTRY as `0x${string}` | undefined;
const circuitId = process.env.PRIOR_CIRCUIT_ID as `0x${string}` | undefined;
const circuitAbi = [{type:"function",name:"intents",stateMutability:"view",inputs:[{name:"id",type:"bytes32"}],outputs:[{type:"tuple",components:[{type:"bytes32",name:"circuitId"},{type:"address",name:"owner"},{type:"address",name:"forecaster"},{type:"uint8",name:"marketClass"},{type:"uint16",name:"targetWindows"},{type:"uint128",name:"totalBudget"},{type:"uint128",name:"maxPerMarket"},{type:"uint16",name:"minMarginBps"},{type:"uint8",name:"maxConsecutiveLosses"},{type:"uint64",name:"startsAt"},{type:"uint64",name:"expiresAt"},{type:"uint256",name:"allowedActionsBitmap"}]}]},{type:"function",name:"runtime",stateMutability:"view",inputs:[{name:"id",type:"bytes32"}],outputs:[{type:"tuple",components:[{type:"uint8",name:"status"},{type:"uint16",name:"completed"},{type:"uint16",name:"missed"},{type:"uint16",name:"abstained"},{type:"uint8",name:"consecutiveLosses"},{type:"uint128",name:"reservedSpend"}]}]}] as const;

let lastReconciledBlock = 0n;
let lastMarkets = 0;
let recoveryLoaded = false;

async function reconcile(){
  await checkpoint.load(); recoveryLoaded = true;
  const markets = await adapter.listRecentMarkets(50);
  const block = await adapter.publicClient.getBlockNumber();
  lastReconciledBlock=block; lastMarkets=markets.length;
  let circuit = null;
  if (circuitAddress && circuitId) {
    const [intent, runtime] = await Promise.all([
      adapter.publicClient.readContract({address:circuitAddress,abi:circuitAbi,functionName:"intents",args:[circuitId]}),
      adapter.publicClient.readContract({address:circuitAddress,abi:circuitAbi,functionName:"runtime",args:[circuitId]}),
    ]);
    const i:any = intent, r:any = runtime;
    circuit = { circuitId, storedStatus:Number(r.status), effectiveStatus:effectiveCircuitStatus(Number(r.status) as any, i.expiresAt, (await adapter.publicClient.getBlock()).timestamp), targetWindows:Number(i.targetWindows), completed:Number(r.completed), abstained:Number(r.abstained), expiresAt:i.expiresAt.toString() };
  }
  // Canonical state is read from chain/DreamDEX. This process deliberately
  // keeps no owner key and does not invent Forecasts or outcomes.
  return { block:block.toString(), markets:markets.length, trading:markets.filter((m:any)=>m.lifecycle==="Trading").length, circuit };
}

const port=Number(process.env.PORT??8787);
createServer(async (req,res)=>{
  res.setHeader("content-type","application/json");
  if(req.url==="/health"){res.end(JSON.stringify({ok:true,service:"prior-runner"}));return}
  if(req.url==="/ready"){try{const x=await reconcile();res.end(JSON.stringify({ok:true,...x}));}catch(e){res.statusCode=503;res.end(JSON.stringify({ok:false,error:e instanceof Error?e.message:"rpc unavailable"}));}return}
  if(req.url==="/runtime"){res.end(JSON.stringify({lastReconciledBlock:lastReconciledBlock.toString(),lastMarkets,recoveryLoaded,iterations:checkpoint.all()}));return}
  if(req.url==="/iterations"){res.end(JSON.stringify({iterations:checkpoint.all()}));return}
  res.statusCode=404;res.end(JSON.stringify({error:"not found"}));
}).listen(port,()=>console.log(`Prior Runner listening on ${port}`));
