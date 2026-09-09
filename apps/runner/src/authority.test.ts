import test from "node:test";
import assert from "node:assert/strict";
import { RftCommitGateway, CircuitOwnerGateway, type DryRunPayload } from "./authority.js";
const id=(c:string)=>`0x${c.repeat(64)}` as `0x${string}`;
test("authority adapters expose narrow methods and dry-run without broadcast", async()=>{
 const calls:string[]=[];
 const client={account:{address:"0x0000000000000000000000000000000000000001"},simulateContract:async(x:any)=>{calls.push("simulate");return {request:{...x}}},writeContract:async()=>{calls.push("write");return id("d")}} as any;
 const rft=new RftCommitGateway({client,address:id("a"),expectedCaller:client.account.address});
 const p=await rft.commitForecast({marketId:id("b"),pUpBps:5000,referenceUpBps:5000,referenceValid:true,tradeTag:0n,actionIntent:3,dryRun:true});
 assert.equal(p.status,"NOT_STARTED"); assert.equal((p as any).payload.function,"commitForecast"); assert.deepEqual(calls,["simulate"]);
 const owner=new CircuitOwnerGateway({client,address:id("c"),expectedCaller:client.account.address});
 const d=await owner.advance({circuitId:id("a"),marketId:id("b"),missed:false,abstained:true,loss:false,dryRun:true});
 assert.equal(d.status,"NOT_STARTED"); assert.equal((d as any).payload.function,"advance"); assert.equal("create" in owner,false);
});
test("signer mismatch fails closed",()=>{const c={account:{address:"0x0000000000000000000000000000000000000001"}} as any;assert.throws(()=>new CircuitOwnerGateway({client:c,address:id("a"),expectedCaller:"0x0000000000000000000000000000000000000002"}),/signer mismatch/)});
