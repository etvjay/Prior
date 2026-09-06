/** Prior Runner — recoverable liveness runtime, not authority. */
import { createServer } from "node:http";
import { DreamDexAdapter } from "@prior/dreamdex";

const adapter = new DreamDexAdapter({ rpcUrl: process.env.SHANNON_RPC_HTTP, indexerUrl: process.env.DREAMDEX_INDEXER_URL });
let lastReconciledBlock = 0n;
let lastMarkets = 0;

async function reconcile(){
  const markets = await adapter.listRecentMarkets(50);
  const block = await adapter.publicClient.getBlockNumber();
  lastReconciledBlock=block; lastMarkets=markets.length;
  // Canonical state is read from chain/DreamDEX. This process deliberately
  // keeps no owner key and does not invent Forecasts or outcomes.
  return { block:block.toString(), markets:markets.length, trading:markets.filter(m=>m.lifecycle==="Trading").length };
}

const port=Number(process.env.PORT??8787);
createServer(async (req,res)=>{
  res.setHeader("content-type","application/json");
  if(req.url==="/health"){res.end(JSON.stringify({ok:true,service:"prior-runner"}));return}
  if(req.url==="/ready"){try{const x=await reconcile();res.end(JSON.stringify({ok:true,...x}));}catch(e){res.statusCode=503;res.end(JSON.stringify({ok:false,error:e instanceof Error?e.message:"rpc unavailable"}));}return}
  if(req.url==="/runtime"){res.end(JSON.stringify({lastReconciledBlock:lastReconciledBlock.toString(),lastMarkets}));return}
  res.statusCode=404;res.end(JSON.stringify({error:"not found"}));
}).listen(port,()=>console.log(`Prior Runner listening on ${port}`));
