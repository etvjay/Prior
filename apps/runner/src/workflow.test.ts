import test from "node:test";
import assert from "node:assert/strict";
import { RunnerCheckpoint } from "./checkpoint.js";
import { RunnerWorkflow, type RunnerWorkflowDeps } from "./workflow.js";
const ids={circuitId:"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as `0x${string}`,marketId:"0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" as `0x${string}`};
function deps(checkpoint:RunnerCheckpoint,calls:string[]=[]):RunnerWorkflowDeps{return {checkpoint,circuit:{loadActive:async()=>({circuitId:ids.circuitId,status:"ACTIVE"})},markets:{discover:async()=>({marketId:ids.marketId,lifecycle:"Trading"})},forecast:{obtain:async()=>({trialId:"0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",pUpBps:6000})},forecastGateway:{commit:async()=>{calls.push("commit");return {trialId:"0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"}}},policy:{evaluate:async()=>({kind:"ABSTAIN",reason:"test"})},execution:{submit:async()=>{calls.push("execute");return {executionId:"0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd"}}},receipts:{observe:async()=>({status:"CONFIRMED",txHash:"0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd"})},settlement:{observe:async()=>{calls.push("settlement");return {terminal:true,outcome:"UP",voided:false}}},rft:{finalize:async()=>{calls.push("finalize")}},circuitGateway:{bindTrial:async()=>{calls.push("bind")},advance:async()=>{calls.push("advance")}}};}
test("workflow runs one bounded cycle and persists transitions",async()=>{const c=new RunnerCheckpoint("/tmp/prior-workflow-test.json"),calls:string[]=[];const r=await new RunnerWorkflow(deps(c,calls)).runOnce();assert.equal(r.kind,"COMPLETED");assert.deepEqual(calls,["commit","bind","settlement","finalize","advance"]);assert.equal(c.get(ids.circuitId,ids.marketId)?.status,"ITERATION_COMPLETE");});
test("workflow returns typed blocked state when gateway is unconfigured",async()=>{const c=new RunnerCheckpoint("/tmp/prior-workflow-blocked.json"),d=deps(c);delete (d as any).forecastGateway;assert.deepEqual(await new RunnerWorkflow(d).runOnce(),{kind:"BLOCKED",reason:"FORECAST_GATEWAY_UNCONFIGURED"});});
test("workflow fails closed when owner bind authority is unavailable",async()=>{const c=new RunnerCheckpoint("/tmp/prior-workflow-owner-blocked.json"),d=deps(c);delete (d.circuitGateway as any).bindTrial;assert.deepEqual(await new RunnerWorkflow(d).runOnce(),{kind:"BLOCKED",reason:"OWNER_CONTROL_UNAVAILABLE"});assert.equal(c.get(ids.circuitId,ids.marketId)?.status,"FORECAST_COMMITTING");});

test("restart retries advance after RFT finalization failure without a terminal checkpoint",async()=>{
  const file="/tmp/prior-workflow-advance-recovery.json";
  const first=new RunnerCheckpoint(file), calls:string[]=[]; let d=deps(first,calls);
  let processed=false;
  d={...d,canonical:{getIteration:async()=>({bound:true,processed,trialId:ids.marketId as any}),getTrial:async()=>({marketId:ids.marketId,status:1})},circuitGateway:{bindTrial:async()=>{calls.push("bind")},advance:async()=>{calls.push("advance");if(calls.filter((x)=>x==="advance").length===1)throw new Error("advance failed")}}};
  await assert.rejects(()=>new RunnerWorkflow(d).runOnce(),/advance failed/);
  assert.deepEqual(calls,["commit","settlement","finalize","advance"]);
  assert.equal(first.get(ids.circuitId,ids.marketId)?.status,"ADVANCING_CIRCUIT");
  const restarted=new RunnerCheckpoint(file); await restarted.load();
  let recovered=false;
  const second={...d,checkpoint:restarted,circuitGateway:{advance:async()=>{calls.push("advance-retry");recovered=true;processed=true;}}};
  assert.deepEqual(await new RunnerWorkflow(second).runOnce(),{kind:"COMPLETED",circuitId:ids.circuitId,marketId:ids.marketId});
  assert.equal(recovered,true);
  assert.equal(restarted.get(ids.circuitId,ids.marketId)?.status,"ITERATION_COMPLETE");
});

test("advance only becomes terminal after confirmation or canonical acknowledgement",async()=>{
  for (const [advanceStatus, expectedKind, expectedCheckpoint] of [["SUBMITTED","BLOCKED","ADVANCING_CIRCUIT"],["CONFIRMED","COMPLETED","ITERATION_COMPLETE"],["ALREADY_CANONICAL","COMPLETED","ITERATION_COMPLETE"],["CONFLICT","BLOCKED","ADVANCING_CIRCUIT"],["FAILED","BLOCKED","ADVANCING_CIRCUIT"]] as const) {
    const file=`/tmp/prior-workflow-advance-${advanceStatus}.json`, c=new RunnerCheckpoint(file);
    c.put({circuitId:ids.circuitId,marketId:ids.marketId,status:"ADVANCING_CIRCUIT",updatedAt:0n});
    const d=deps(c);
    const result=await new RunnerWorkflow({...d,canonical:{getIteration:async()=>({bound:true,processed:false,trialId:ids.marketId as any})},circuitGateway:{advance:async()=>({status:advanceStatus})}}).runOnce();
    assert.equal(result.kind,expectedKind,advanceStatus);
    assert.equal(c.get(ids.circuitId,ids.marketId)?.status,expectedCheckpoint,advanceStatus);
  }
});
