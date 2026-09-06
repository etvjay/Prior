import { describe, expect, it } from "vitest";
import {
  AgentSourceType,
  ApiTransport,
  ForecastCapability,
  MandateLifecycle,
  MarketAsset,
  MarketClass,
  MarketVenue,
  ReadCapability,
  type AgentBinding,
  type AgentPrincipal,
  type ForecastProvider,
  type ForecastRequest,
  type ForecastSubmission,
  type ForecastProviderResponse,
  type MandatePolicy,
} from "../src/index.js";
import {
  ForecastProviderWorkflow,
  forecastRequestIdentity,
  formatForecastSubmissionRecord,
  mandatePolicyHash,
} from "../src/index.js";
import { asCollateralRaw } from "../src/units.js";

const id = (byte: string) => `0x${byte.repeat(64)}` as `0x${string}`;
const address = (suffix: string) => `0x${suffix.padStart(40, "0")}` as `0x${string}`;

const MANDATE_ID = id("1");
const CIRCUIT_ID = id("2");
const MARKET_ID = id("3");
const AGENT_ID = id("4");
const PROVIDER_ID = id("5");
const AGENT_ADDRESS = address("b1");
const OWNER = address("a1");

const forecastAgent: AgentPrincipal = {
  agentId: AGENT_ID,
  displayName: "Forecast Bot",
  sourceType: AgentSourceType.AGENT,
  forecastAddress: AGENT_ADDRESS,
};

const policy: MandatePolicy = {
  version: 1,
  mandateId: MANDATE_ID,
  owner: OWNER,
  forecasters: [forecastAgent],
  executors: [],
  marketScope: {
    venue: MarketVenue.DREAMDEX,
    assets: [MarketAsset.BTC],
    intervalsSec: [300],
    marketClass: MarketClass.BTC_15M,
    marketIds: [MARKET_ID],
  },
  forecastAuthority: {
    agentIds: [AGENT_ID],
    capabilities: [ForecastCapability.SUBMIT_FORECAST],
  },
  executionAuthority: {
    agentIds: [],
    capabilities: [],
    allowedActions: [],
    minMarginBps: 0,
  },
  capitalAuthority: {
    maxPerMarketRaw: asCollateralRaw(1_000_000n),
    totalBudgetRaw: asCollateralRaw(1_000_000n),
    stopLossRaw: asCollateralRaw(0n),
  },
  temporalAuthority: {
    issuedAt: 100n,
    startsAt: 100n,
    expiresAt: 1_000n,
  },
  lifecycle: MandateLifecycle.ACTIVE,
  revocation: { enabled: true, ownerOnly: true },
};

const binding: AgentBinding = {
  bindingId: id("6"),
  agentId: AGENT_ID,
  circuitId: CIRCUIT_ID,
  apiPrincipal: { transport: ApiTransport.API, principalId: "provider:fixture" },
  forecastAddress: AGENT_ADDRESS,
  readCapabilities: [ReadCapability.GET_FORECAST_REQUEST],
  forecastCapabilities: [ForecastCapability.SUBMIT_FORECAST],
  executeCapabilities: [],
  issued: 110n,
  expires: 900n,
  mandateId: MANDATE_ID,
  policyHash: mandatePolicyHash(policy),
};

const request: ForecastRequest = {
  circuitId: CIRCUIT_ID,
  marketId: MARKET_ID,
  asset: MarketAsset.BTC,
  intervalSec: 300,
  opensAt: 200n,
  expiresAt: 500n,
  forecastDeadline: 400n,
};

const providerIdentity = {
  providerId: PROVIDER_ID,
  displayName: "Fixture Forecast Provider",
  source: "local-fixture",
  sourceVersion: "fixture-v1",
} as const;

const provider: ForecastProvider = {
  identity: providerIdentity,
  apiPrincipal: binding.apiPrincipal,
  getForecast: (scopedRequest) => ({
    requestId: forecastRequestIdentity(scopedRequest),
    providerId: PROVIDER_ID,
    submission: {
      marketId: scopedRequest.marketId,
      forecaster: AGENT_ID,
      forecasterAddress: AGENT_ADDRESS,
      probabilityUpBps: 7_200,
      generatedAt: 250n,
      validUntil: 400n,
      sourceType: AgentSourceType.AGENT,
      sourceVersion: "model-v1",
      signature: "0x1234",
    },
  }),
};

const baseSubmission: ForecastSubmission = provider.getForecast(request).submission;

function responseForRequest(
  scopedRequest: ForecastRequest,
  submissionOverrides: Partial<ForecastSubmission> = {},
  responseOverrides: Partial<Omit<ForecastProviderResponse, "submission">> = {},
): ForecastProviderResponse {
  return {
    requestId: forecastRequestIdentity(scopedRequest),
    providerId: PROVIDER_ID,
    ...responseOverrides,
    submission: { ...baseSubmission, marketId: scopedRequest.marketId, ...submissionOverrides },
  };
}

function responseFor(
  submissionOverrides: Partial<ForecastSubmission> = {},
  responseOverrides: Partial<Omit<ForecastProviderResponse, "submission">> = {},
): ForecastProviderResponse {
  return responseForRequest(request, submissionOverrides, responseOverrides);
}

function workflowFor(): ForecastProviderWorkflow {
  return new ForecastProviderWorkflow({ policy, binding });
}

function recordGood(workflow: ForecastProviderWorkflow, recordedAt = 260n) {
  const acceptedRequest = workflow.acceptRequest(request, 220n);
  return workflow.recordProviderResponse(acceptedRequest, provider, responseFor(), recordedAt);
}

describe("M4.2 Forecast Provider/domain workflow", () => {
  it("accepts a scoped request and records one attributable local submission", () => {
    const workflow = workflowFor();
    const acceptedRequest = workflow.acceptRequest(request, 220n);
    const response = workflow.ask(provider, acceptedRequest);
    const record = workflow.recordProviderResponse(acceptedRequest, provider, response, 260n);

    expect(acceptedRequest.requestId).toBe(forecastRequestIdentity(request));
    expect(record.requestId).toBe(acceptedRequest.requestId);
    expect(record.circuitId).toBe(CIRCUIT_ID);
    expect(record.marketId).toBe(MARKET_ID);
    expect(record.forecaster).toBe(AGENT_ID);
    expect(record.provider).toEqual(providerIdentity);
    expect(record.apiPrincipal).toEqual(binding.apiPrincipal);
    expect(record.policyHash).toBe(mandatePolicyHash(policy));
    expect(record.chainCommitment).toBe("NOT_SUBMITTED");
    expect(record.submission.probabilityUpBps).toBe(7_200);
    expect(record.submissionId).toMatch(/^0x[0-9a-f]{64}$/);
    expect(workflow.getSubmission(record.submissionId)).toBe(record);
    expect(Object.isFrozen(record)).toBe(true);
    expect(Object.isFrozen(record.provider)).toBe(true);
    expect(Object.isFrozen(record.apiPrincipal)).toBe(true);
    expect(Object.isFrozen(record.submission)).toBe(true);
  });

  it("rejects a provider response from an unauthorized principal", () => {
    const workflow = workflowFor();
    const acceptedRequest = workflow.acceptRequest(request, 220n);
    expect(() => workflow.recordProviderResponse(
      acceptedRequest,
      provider,
      responseFor({ forecaster: id("7"), forecasterAddress: address("b7") }),
      260n,
    )).toThrow(/not authorized/i);
  });

  it("rejects a Forecast signed by the wrong address", () => {
    const workflow = workflowFor();
    const acceptedRequest = workflow.acceptRequest(request, 220n);
    expect(() => workflow.recordProviderResponse(
      acceptedRequest,
      provider,
      responseFor({ forecasterAddress: address("dead") }),
      260n,
    )).toThrow(/address|signer|match/i);
  });

  it("rejects wrong market, circuit, and policy linkage", () => {
    const wrongMarketWorkflow = workflowFor();
    const wrongMarketRequest = wrongMarketWorkflow.acceptRequest(request, 220n);
    expect(() => wrongMarketWorkflow.recordProviderResponse(
      wrongMarketRequest,
      provider,
      responseFor({ marketId: id("8") }),
      260n,
    )).toThrow(/marketId.*match/i);

    const wrongCircuitWorkflow = workflowFor();
    const wrongCircuitRequest = wrongCircuitWorkflow.acceptRequest(request, 220n);
    expect(() => wrongCircuitWorkflow.recordProviderResponse(
      wrongCircuitRequest,
      provider,
      responseFor({ circuitId: id("9") }),
      260n,
    )).toThrow(/circuitId.*match/i);

    const wrongPolicyWorkflow = workflowFor();
    const wrongPolicyRequest = wrongPolicyWorkflow.acceptRequest(request, 220n);
    expect(() => wrongPolicyWorkflow.recordProviderResponse(
      wrongPolicyRequest,
      provider,
      responseFor({ policyHash: id("a") }),
      260n,
    )).toThrow(/policy hash.*match/i);
  });

  it("rejects probability outside the fixed bps range", () => {
    const workflow = workflowFor();
    const acceptedRequest = workflow.acceptRequest(request, 220n);
    expect(() => workflow.recordProviderResponse(
      acceptedRequest,
      provider,
      responseFor({ probabilityUpBps: 10_001 }),
      260n,
    )).toThrow(/probabilityUpBps|bps/i);
  });

  it("rejects an empty signature value", () => {
    const workflow = workflowFor();
    const acceptedRequest = workflow.acceptRequest(request, 220n);
    expect(() => workflow.recordProviderResponse(
      acceptedRequest,
      provider,
      responseFor({ signature: "0x" }),
      260n,
    )).toThrow(/signature/i);
  });

  it("rejects expired responses and responses recorded after the deadline", () => {
    const expiredWorkflow = workflowFor();
    const expiredRequest = expiredWorkflow.acceptRequest(request, 220n);
    expect(() => expiredWorkflow.recordProviderResponse(
      expiredRequest,
      provider,
      responseFor({ validUntil: 260n }),
      260n,
    )).toThrow(/expired/i);

    const lateWorkflow = workflowFor();
    const lateRequest = lateWorkflow.acceptRequest(request, 220n);
    expect(() => lateWorkflow.recordProviderResponse(
      lateRequest,
      provider,
      responseFor({ validUntil: 500n }),
      401n,
    )).toThrow(/deadline/i);
  });

  it("rejects a conflicting duplicate for the same forecaster and market", () => {
    const workflow = workflowFor();
    const first = recordGood(workflow);
    const acceptedRequest = workflow.acceptRequest(request, 220n);
    expect(() => workflow.recordProviderResponse(
      acceptedRequest,
      provider,
      responseFor({ probabilityUpBps: 7_201 }),
      270n,
    )).toThrow(/conflicting duplicate/i);
    expect(workflow.getSubmission(first.submissionId)).toBe(first);
  });

  it("rejects a second request identity for the same forecaster and market", () => {
    const workflow = workflowFor();
    recordGood(workflow);
    const alternateRequest = { ...request, forecastId: id("a") };
    const acceptedAlternate = workflow.acceptRequest(alternateRequest, 220n);
    expect(() => workflow.recordProviderResponse(
      acceptedAlternate,
      provider,
      responseForRequest(alternateRequest),
      270n,
    )).toThrow(/conflicting duplicate/i);
  });

  it("returns the exact existing record on replay, including after its response window", () => {
    const workflow = workflowFor();
    const first = recordGood(workflow);
    const acceptedRequest = workflow.acceptRequest(request, 220n);
    const replay = workflow.recordProviderResponse(acceptedRequest, provider, responseFor(), 900n);

    expect(replay).toBe(first);
    expect(workflow.getSubmissionByIdempotencyKey(first.idempotencyKey)).toBe(first);
  });

  it("keeps provider transport authentication separate from Forecast authority", () => {
    const workflow = workflowFor();
    const acceptedRequest = workflow.acceptRequest(request, 220n);
    const wrongTransportProvider: ForecastProvider = {
      ...provider,
      apiPrincipal: { transport: ApiTransport.API, principalId: "provider:other" },
    };
    expect(() => workflow.ask(wrongTransportProvider, acceptedRequest)).toThrow(/transport principal/i);
    expect(binding.executeCapabilities).toEqual([]);
  });

  it("accepts matching optional circuit/policy links and exposes only local evidence", () => {
    const workflow = workflowFor();
    const acceptedRequest = workflow.acceptRequest(request, 220n);
    const record = workflow.recordProviderResponse(
      acceptedRequest,
      provider,
      responseFor({ circuitId: CIRCUIT_ID, policyHash: mandatePolicyHash(policy) }),
      260n,
    );

    expect(record.chainCommitment).toBe("NOT_SUBMITTED");
    expect(record).not.toHaveProperty("transactionHash");
    expect(formatForecastSubmissionRecord(record)).toContain("local domain record only");
    expect(() => {
      (record.submission as unknown as { probabilityUpBps: number }).probabilityUpBps = 1;
    }).toThrow();
  });
});
