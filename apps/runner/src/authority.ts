import type { Address, Hex } from "viem";
import type { TrialId } from "@prior/core";

export const RFT_REGISTRY_ABI = [
 {type:"function",name:"commitForecast",stateMutability:"nonpayable",inputs:[{name:"marketId",type:"bytes32"},{name:"pUpBps",type:"uint16"},{name:"referenceUpBps",type:"uint16"},{name:"referenceValid",type:"bool"},{name:"tradeTag",type:"uint64"},{name:"actionIntent",type:"uint8"}],outputs:[{name:"trialId",type:"bytes32"}]},
 {type:"function",name:"finalize",stateMutability:"nonpayable",inputs:[{name:"trialId",type:"bytes32"}],outputs:[]},
 {type:"function",name:"trialFor",stateMutability:"view",inputs:[{name:"forecaster",type:"address"},{name:"marketId",type:"bytes32"}],outputs:[{type:"bytes32"}]},
 {type:"function",name:"getTrial",stateMutability:"view",inputs:[{name:"trialId",type:"bytes32"}],outputs:[{type:"tuple",components:[{name:"trialId",type:"bytes32"},{name:"marketId",type:"bytes32"},{name:"forecaster",type:"address"},{name:"pUpBps",type:"uint16"},{name:"referenceUpBps",type:"uint16"},{name:"referenceValid",type:"bool"},{name:"committedAt",type:"uint64"},{name:"committedBlock",type:"uint64"},{name:"secondsToExpiry",type:"uint32"},{name:"tradeTag",type:"uint64"},{name:"actionIntent",type:"uint8"},{name:"status",type:"uint8"},{name:"outcome",type:"uint8"},{name:"forecastBrier",type:"uint32"},{name:"marketBrier",type:"uint32"},{name:"marketScoreDelta",type:"int64"}]}]}
] as const;
export const CIRCUIT_REGISTRY_ABI = [
 {type:"function",name:"bindTrial",stateMutability:"nonpayable",inputs:[{name:"circuitId",type:"bytes32"},{name:"marketId",type:"bytes32"},{name:"trialId",type:"bytes32"}],outputs:[]},
 {type:"function",name:"advance",stateMutability:"nonpayable",inputs:[{name:"circuitId",type:"bytes32"},{name:"marketId",type:"bytes32"},{name:"missed",type:"bool"},{name:"abstained",type:"bool"},{name:"loss",type:"bool"}],outputs:[]},
 {type:"function",name:"getIteration",stateMutability:"view",inputs:[{name:"circuitId",type:"bytes32"},{name:"marketId",type:"bytes32"}],outputs:[{type:"tuple",components:[{name:"iterationId",type:"bytes32"},{name:"circuitId",type:"bytes32"},{name:"marketId",type:"bytes32"},{name:"trialId",type:"bytes32"},{name:"bound",type:"bool"},{name:"processed",type:"bool"},{name:"missed",type:"bool"}]}]}
] as const;
export type DryRunPayload={readonly target:Address;readonly function:string;readonly args:readonly unknown[];readonly expectedCaller:Address;readonly gasEstimate?:bigint};
export type WriteStatus="NOT_STARTED"|"SUBMITTED"|"CONFIRMED"|"ALREADY_CANONICAL"|"CONFLICT"|"FAILED";
export type AuthorityResult={readonly status:WriteStatus;readonly txHash?:Hex;readonly payload?:DryRunPayload;readonly reason?:string;readonly canonicalId?:Hex};
class AuthorityError extends Error { constructor(message:string){super(message);this.name="AuthorityError";} }
function requireSigner(client:any, expected:Address):void { const actual=client?.account?.address; if(!actual) throw new AuthorityError("authority unavailable: signer missing"); if(actual.toLowerCase()!==expected.toLowerCase()) throw new AuthorityError("signer mismatch"); }
async function write(client:any, payload:DryRunPayload, abi:any, functionName:string, args:readonly unknown[], dryRun?:boolean):Promise<AuthorityResult>{
 const base={address:payload.target,abi,functionName,args,account:payload.expectedCaller};
 let simulation:any; try { simulation=await client.simulateContract(base); } catch(e) { throw new AuthorityError(`simulation failed: ${e instanceof Error?e.message:"unknown"}`); }
 const enriched={...payload,gasEstimate:simulation?.request?.gas ?? simulation?.gasEstimate};
 if(dryRun) return {status:"NOT_STARTED",payload:enriched};
 try { const hash=await client.writeContract({...simulation.request,account:payload.expectedCaller}); return {status:"SUBMITTED",txHash:hash,payload:enriched}; }
 catch(e){return {status:"FAILED",payload:enriched,reason:e instanceof Error?e.message:"write failed"};}
}
export class RftCommitGateway {
 constructor(private readonly d:{readonly client:any;readonly address:Address;readonly expectedCaller:Address}){requireSigner(d.client,d.expectedCaller);}
 private payload(fn:string,args:readonly unknown[]):DryRunPayload{return {target:this.d.address,function:fn,args,expectedCaller:this.d.expectedCaller};}
 async commitForecast(i:{marketId:Hex;pUpBps:number;referenceUpBps:number;referenceValid:boolean;tradeTag:bigint;actionIntent:number;dryRun?:boolean}):Promise<AuthorityResult>{return write(this.d.client,this.payload("commitForecast",[i.marketId,i.pUpBps,i.referenceUpBps,i.referenceValid,i.tradeTag,i.actionIntent]),RFT_REGISTRY_ABI,"commitForecast",[i.marketId,i.pUpBps,i.referenceUpBps,i.referenceValid,i.tradeTag,i.actionIntent],i.dryRun)}
 async finalizeTrial(trialId:TrialId,dryRun?:boolean):Promise<AuthorityResult>{return write(this.d.client,this.payload("finalize",[trialId]),RFT_REGISTRY_ABI,"finalize",[trialId],dryRun)}
}
export class CircuitOwnerGateway {
 constructor(private readonly d:{readonly client:any;readonly address:Address;readonly expectedCaller:Address}){requireSigner(d.client,d.expectedCaller);}
 private payload(fn:string,args:readonly unknown[]):DryRunPayload{return {target:this.d.address,function:fn,args,expectedCaller:this.d.expectedCaller};}
 async bindTrial(i:{circuitId:Hex;marketId:Hex;trialId:Hex;dryRun?:boolean}):Promise<AuthorityResult>{return write(this.d.client,this.payload("bindTrial",[i.circuitId,i.marketId,i.trialId]),CIRCUIT_REGISTRY_ABI,"bindTrial",[i.circuitId,i.marketId,i.trialId],i.dryRun)}
 async advance(i:{circuitId:Hex;marketId:Hex;missed:boolean;abstained:boolean;loss:boolean;dryRun?:boolean}):Promise<AuthorityResult>{return write(this.d.client,this.payload("advance",[i.circuitId,i.marketId,i.missed,i.abstained,i.loss]),CIRCUIT_REGISTRY_ABI,"advance",[i.circuitId,i.marketId,i.missed,i.abstained,i.loss],i.dryRun)}
}
export class AuthorityUnavailable extends AuthorityError {}
