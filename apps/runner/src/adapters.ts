import type { TrialId } from "@prior/core";
import type { ForecastRequestWire, ForecastSubmissionWire } from "@prior/forecast-protocol";
import { canonicalSettlementFromReads, binarySettlementReadAbi } from "@prior/dreamdex";
import { parseEventLogs } from "viem";

type ForecastProviderClient = {
  readonly getForecastRequest: () => Promise<ForecastRequestWire>;
  readonly submitForecast: (submission: ForecastSubmissionWire) => Promise<{ readonly chainCommitment: "NOT_SUBMITTED"; readonly probabilityUpBps: number; readonly submissionId: Id }>;
};
type UnauthorizedExecutionRequest = { readonly requestId: string; readonly marketId: string; readonly actionId: string };

export type GatewayPolicy = { readonly kind: "BUY_UP" } | { readonly kind: "BUY_DOWN" } | { readonly kind: "ABSTAIN"; readonly reason: string };
export type Id = `0x${string}`;

export interface ExternalForecastCommitter {
  commit(forecast: { readonly marketId: Id; readonly circuitId: Id; readonly pUpBps: number; readonly submissionId?: Id }): Promise<{ readonly trialId: TrialId }>;
}

/** Bridges the existing HTTP Forecast Provider Protocol to the separately injected forecaster/RFT commit authority. */
export class ExternalForecastGateway {
  public constructor(private readonly deps: {
    readonly provider: Pick<ForecastProviderClient, "getForecastRequest" | "submitForecast">;
    readonly commit: ExternalForecastCommitter["commit"];
    readonly buildSubmission?: (request: ForecastRequestWire) => ForecastSubmissionWire;
  }) {}

  public async commit(input: { readonly marketId: Id; readonly circuitId: Id }): Promise<{ readonly trialId: TrialId; readonly pUpBps: number }> {
    const request = await this.deps.provider.getForecastRequest();
    if (request.marketId !== input.marketId || request.circuitId !== input.circuitId) throw new Error("forecast request identity mismatch");
    if (!this.deps.buildSubmission) throw new Error("forecast submission signer unavailable");
    const accepted = await this.deps.provider.submitForecast(this.deps.buildSubmission(request));
    if (accepted.chainCommitment !== "NOT_SUBMITTED") throw new Error("provider claimed an onchain commitment");
    const committed = await this.deps.commit({ marketId: input.marketId, circuitId: input.circuitId, pUpBps: accepted.probabilityUpBps, submissionId: accepted.submissionId });
    return { ...committed, pUpBps: accepted.probabilityUpBps };
  }
}

/** Explicit owner-control-plane callbacks. No create/authorize/activate methods are exposed. */
export class CircuitControlGateway {
  public constructor(private readonly deps: {
    readonly bindTrial: (circuitId: Id, marketId: Id, trialId: TrialId) => Promise<void>;
    readonly advance: (circuitId: Id, marketId: Id) => Promise<void>;
  }) {}
  public bind(circuitId: Id, marketId: Id, trialId: TrialId): Promise<void> { return this.deps.bindTrial(circuitId, marketId, trialId); }
  public advance(circuitId: Id, marketId: Id): Promise<void> { return this.deps.advance(circuitId, marketId); }
}

export type ZeroActionResult =
  | { readonly status: "ABSTAINED"; readonly reason: string }
  | { readonly status: "NOT_AUTHORIZED" }
  | { readonly status: "ACTION_NOT_ALLOWED" };

/** Safe execution boundary: it can record no-action or reject, but has no DreamDEX write path. */
export class ZeroActionExecutionGateway {
  public async execute(policy: GatewayPolicy): Promise<ZeroActionResult> {
    if (policy.kind === "ABSTAIN") return { status: "ABSTAINED", reason: policy.reason };
    return { status: "NOT_AUTHORIZED" };
  }
  public async requestExecution(_request: UnauthorizedExecutionRequest): Promise<ZeroActionResult> {
    return { status: "NOT_AUTHORIZED" };
  }
}

export type ReceiptObservation = { readonly status: "CONFIRMED" | "FAILED" | "UNKNOWN"; readonly txHash?: Id };
export type ReconciledReceipt = { readonly status: "CONFIRMED" | "FAILED" | "AMBIGUOUS"; readonly txHash?: Id };

export class ReceiptReconciler {
  public reconcile(receipt: ReceiptObservation): ReconciledReceipt {
    if (receipt.status === "UNKNOWN") return { status: "AMBIGUOUS" };
    if (!receipt.txHash) throw new Error("receipt hash required for typed reconciliation");
    return { status: receipt.status, txHash: receipt.txHash };
  }
}

export type SettlementRead = { readonly finalized: boolean; readonly voided: boolean; readonly outcome: "UP" | "DOWN" | null; readonly source: "dreamdex" };
export type SettlementObservation = { readonly terminal: boolean; readonly voided: boolean; readonly outcome: "UP" | "DOWN" | null; readonly source: "dreamdex" };

/** Maps only a DreamDEX settlement read; it never derives an outcome from local policy or receipts. */
export class DreamDexSettlementReader {
  public constructor(private readonly read: (marketId: Id) => Promise<SettlementRead>) {}
  public async observe(marketId: Id): Promise<SettlementObservation> {
    const value = await this.read(marketId);
    if (value.source !== "dreamdex") throw new Error("settlement source is not DreamDEX");
    if (!value.finalized && value.outcome !== null) throw new Error("unfinalized settlement has outcome");
    if (value.finalized && !value.voided && value.outcome === null) throw new Error("finalized settlement missing outcome");
    return { terminal: value.finalized, outcome: value.outcome, voided: value.voided, source: "dreamdex" };
  }
}

const binaryModuleReadAbi = [{type:"function",name:"markets",stateMutability:"view",inputs:[{name:"marketId",type:"bytes32"}],outputs:[{type:"uint256"},{type:"uint8"},{type:"uint8"},{type:"address"},{type:"uint32"},{type:"bytes32"},{type:"address"},{type:"address"},{type:"address"},{type:"address"},{type:"uint256"},{type:"uint256"},{type:"uint64"},{type:"uint64"}]}] as const;
/** Direct Shannon reads: indexer lifecycle labels are never settlement truth. */
export class CanonicalDreamDexSettlementReader {
  constructor(private readonly d:{readonly publicClient:any;readonly binaryModule:Id;readonly settlement:Id}) {}
  async observe(marketId:Id):Promise<SettlementObservation & {readonly state:string}> {
    const m:any=await this.d.publicClient.readContract({address:this.d.binaryModule,abi:binaryModuleReadAbi,functionName:"markets",args:[marketId]});
    const yesId=BigInt(m.yesId ?? m[10]), noId=BigInt(m.noId ?? m[11]);
    const finalized=await this.d.publicClient.readContract({address:this.d.settlement,abi:binarySettlementReadAbi,functionName:"isFinalized",args:[yesId]});
    const raw=finalized?await this.d.publicClient.readContract({address:this.d.settlement,abi:binarySettlementReadAbi,functionName:"getSettlement",args:[yesId>>8n]}):null;
    const settlement=raw?{voided:Boolean(raw.voided ?? raw[3]),payoutNumerators:(raw.payoutNumerators ?? raw[8]).map((x:any)=>BigInt(x))}:null;
    const result=canonicalSettlementFromReads({market:{yesId,noId,expiry:BigInt(m.expiry ?? m[13])},finalized:Boolean(finalized),settlement});
    return {terminal:result.state==="RESOLVED_UP"||result.state==="RESOLVED_DOWN"||result.state==="VOIDED",outcome:result.outcome,voided:result.voided,source:"dreamdex",state:result.state};
  }
}

export type ReceiptExpectation={readonly contract:Id;readonly event:string;readonly identity:readonly unknown[];readonly identityFields?:readonly string[]};
/** Read-only receipt verifier requiring success, target contract, event and identity. */
export class CanonicalReceiptReader {
  constructor(private readonly client:any) {}
  async read(hash:Id, expectation:ReceiptExpectation, eventAbi:readonly unknown[]):Promise<ReceiptObservation>{
    const receipt=await this.client.getTransactionReceipt({hash});
    if(receipt.status!=="success") return {status:"FAILED",txHash:hash};
    const logs=(receipt.logs??[]).filter((l:any)=>l.address?.toLowerCase()===expectation.contract.toLowerCase());
    let parsed:any[]=[];
    try { parsed=parseEventLogs({abi:eventAbi as any,logs:logs as any,strict:true}) as any[]; } catch { return {status:"UNKNOWN"}; }
    const matching=parsed.some((l:any)=>l.eventName===expectation.event && expectation.identity.every((v:any,i)=>String(l.args?.[expectation.identityFields?.[i]??i]??"").toLowerCase()===String(v).toLowerCase()));
    return matching?{status:"CONFIRMED",txHash:hash}:{status:"UNKNOWN"};
  }
}
