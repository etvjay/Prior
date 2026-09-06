import { encodePacked, keccak256, type Address, type Hex } from "viem";
import {
  ApiTransport,
  ForecastCapability,
  MandateLifecycle,
  assertBps,
  type AcceptedForecastRequest,
  type AgentBinding,
  type AgentId,
  type AuthenticatedApiPrincipal,
  type ForecastProvider,
  type ForecastProviderIdentity,
  type ForecastProviderResponse,
  type ForecastRequest,
  type ForecastSubmission,
  type ForecastSubmissionId,
  type ForecastSubmissionRecord,
  type ForecastIdempotencyKey,
  type MandatePolicy,
  type PolicyHash,
} from "./types.js";
import {
  effectiveMandateLifecycle,
  forecastRequestIdentity,
  iterationIdentity,
  mandatePolicyHash,
  validateAgentBinding,
  validateForecastRequest,
  validateForecastSubmission,
  validateMandatePolicy,
} from "./mandate.js";

const BYTE_LENGTHS = { id: 32, address: 20 } as const;
const SUBMISSION_DOMAIN = "PRIOR_FORECAST_SUBMISSION";
const IDEMPOTENCY_DOMAIN = "PRIOR_FORECAST_SUBMISSION_IDEMPOTENCY";
const NOT_SUBMITTED = "NOT_SUBMITTED" as const;

function fail(message: string): never {
  throw new Error(message);
}

function assertHex(value: unknown, field: string, bytes?: number): asserts value is Hex {
  if (typeof value !== "string" || !/^0x[0-9a-fA-F]*$/.test(value) || (value.length - 2) % 2 !== 0) {
    fail(`${field} must be a hexadecimal value`);
  }
  if (bytes !== undefined && value.length !== 2 + bytes * 2) {
    fail(`${field} must be ${bytes} bytes`);
  }
}

function assertAddress(value: unknown, field: string): asserts value is Address {
  assertHex(value, field, BYTE_LENGTHS.address);
}

function assertBigInt(value: unknown, field: string, nonNegative = true): asserts value is bigint {
  if (typeof value !== "bigint") fail(`${field} must be bigint`);
  if (nonNegative && value < 0n) fail(`${field} must be non-negative`);
}

function assertNonEmpty(value: unknown, field: string): asserts value is string {
  if (typeof value !== "string" || value.trim() === "") fail(`${field} must be non-empty`);
}

function sameId(left: string, right: string): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

function sameTransport(left: ForecastProvider["apiPrincipal"], right: AgentBinding["apiPrincipal"]): boolean {
  return left.transport === right.transport && left.principalId === right.principalId;
}

function canonicalize(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "bigint") return JSON.stringify(value.toString(10));
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`)
      .join(",")}}`;
  }
  fail("unsupported value in Forecast canonicalization");
}

function canonicalRequest(request: ForecastRequest): Record<string, unknown> {
  return {
    ...(request.forecastId === undefined ? {} : { forecastId: request.forecastId }),
    circuitId: request.circuitId,
    marketId: request.marketId,
    asset: request.asset,
    intervalSec: request.intervalSec,
    opensAt: request.opensAt,
    expiresAt: request.expiresAt,
    ...(request.forecastDeadline === undefined ? {} : { forecastDeadline: request.forecastDeadline }),
    ...(request.reference === undefined
      ? {}
      : {
          reference: {
            referenceUpBps: request.reference.referenceUpBps,
            referenceValid: request.reference.referenceValid,
            ...(request.reference.bestAskUpBps === undefined ? {} : { bestAskUpBps: request.reference.bestAskUpBps }),
            ...(request.reference.bestAskDownBps === undefined ? {} : { bestAskDownBps: request.reference.bestAskDownBps }),
          },
        }),
  };
}

function canonicalProvider(identity: ForecastProviderIdentity): Record<string, unknown> {
  return {
    providerId: identity.providerId,
    displayName: identity.displayName,
    source: identity.source,
    sourceVersion: identity.sourceVersion,
  };
}

function canonicalSubmission(submission: ForecastSubmission): Record<string, unknown> {
  return {
    marketId: submission.marketId,
    ...(submission.circuitId === undefined ? {} : { circuitId: submission.circuitId }),
    ...(submission.policyHash === undefined ? {} : { policyHash: submission.policyHash }),
    forecaster: submission.forecaster,
    forecasterAddress: submission.forecasterAddress,
    probabilityUpBps: submission.probabilityUpBps,
    generatedAt: submission.generatedAt,
    validUntil: submission.validUntil,
    sourceType: submission.sourceType,
    sourceVersion: submission.sourceVersion,
    signature: submission.signature,
  };
}

function cloneRequest(request: ForecastRequest): ForecastRequest {
  const reference = request.reference === undefined ? undefined : Object.freeze({ ...request.reference });
  return Object.freeze({
    ...request,
    ...(reference === undefined ? {} : { reference }),
  });
}

function cloneSubmission(submission: ForecastSubmission): ForecastSubmission {
  return Object.freeze({ ...submission });
}

function cloneProvider(identity: ForecastProviderIdentity): ForecastProviderIdentity {
  return Object.freeze({ ...identity });
}

function cloneApiPrincipal(principal: AuthenticatedApiPrincipal): AuthenticatedApiPrincipal {
  return Object.freeze({ ...principal });
}

function validateProviderApiPrincipal(principal: ForecastProvider["apiPrincipal"], field: string): void {
  if (!principal || typeof principal !== "object") fail(`${field} must be an authenticated principal`);
  if (!Object.values(ApiTransport).includes(principal.transport)) fail(`${field}.transport is not supported`);
  assertNonEmpty(principal.principalId, `${field}.principalId`);
}

/** Validate the typed identity and non-secret source metadata of a provider. */
export function validateForecastProviderIdentity(identity: ForecastProviderIdentity): void {
  if (!identity || typeof identity !== "object") fail("ForecastProvider identity must be an object");
  assertHex(identity.providerId, "provider.providerId", BYTE_LENGTHS.id);
  assertNonEmpty(identity.displayName, "provider.displayName");
  assertNonEmpty(identity.source, "provider.source");
  assertNonEmpty(identity.sourceVersion, "provider.sourceVersion");
}

/** Validate the adapter boundary without treating it as a wallet or executor. */
export function validateForecastProvider(provider: ForecastProvider): void {
  if (!provider || typeof provider !== "object") fail("ForecastProvider must be an object");
  validateForecastProviderIdentity(provider.identity);
  validateProviderApiPrincipal(provider.apiPrincipal, "provider.apiPrincipal");
  if (typeof provider.getForecast !== "function") fail("provider.getForecast must be a function");
}

function validateSubmissionShape(submission: ForecastSubmission): void {
  if (!submission || typeof submission !== "object") fail("ForecastSubmission must be an object");
  assertHex(submission.marketId, "submission.marketId", BYTE_LENGTHS.id);
  if (submission.circuitId !== undefined) assertHex(submission.circuitId, "submission.circuitId", BYTE_LENGTHS.id);
  if (submission.policyHash !== undefined) assertHex(submission.policyHash, "submission.policyHash", BYTE_LENGTHS.id);
  assertHex(submission.forecaster, "submission.forecaster", BYTE_LENGTHS.id);
  assertAddress(submission.forecasterAddress, "submission.forecasterAddress");
  assertBps(submission.probabilityUpBps, "submission.probabilityUpBps");
  assertBigInt(submission.generatedAt, "submission.generatedAt");
  assertBigInt(submission.validUntil, "submission.validUntil");
  assertNonEmpty(submission.sourceVersion, "submission.sourceVersion");
  assertHex(submission.signature, "submission.signature");
  if (submission.signature === "0x") fail("submission.signature must contain signature bytes");
}

/** Validate provider/request linkage before policy and time checks. */
export function validateForecastProviderResponse(
  response: ForecastProviderResponse,
  request: ForecastRequest,
  provider: ForecastProvider,
): void {
  validateForecastProvider(provider);
  if (!response || typeof response !== "object") fail("ForecastProviderResponse must be an object");
  assertHex(response.requestId, "response.requestId", BYTE_LENGTHS.id);
  assertHex(response.providerId, "response.providerId", BYTE_LENGTHS.id);
  if (!sameId(response.providerId, provider.identity.providerId)) {
    fail("ForecastProviderResponse providerId does not match provider identity");
  }
  if (!sameId(response.requestId, forecastRequestIdentity(request))) {
    fail("ForecastProviderResponse requestId does not match request");
  }
  validateSubmissionShape(response.submission);
  if (!sameId(response.submission.marketId, request.marketId)) {
    fail("ForecastSubmission marketId does not match request");
  }
  if (response.submission.circuitId !== undefined && !sameId(response.submission.circuitId, request.circuitId)) {
    fail("ForecastSubmission circuitId does not match request");
  }
}

/** Stable identity for a request-scoped forecaster submission. */
export function forecastSubmissionIdentity(
  request: ForecastRequest,
  forecaster: AgentId | Pick<ForecastSubmission, "forecaster">,
): ForecastSubmissionId {
  const agentId = typeof forecaster === "string" ? forecaster : forecaster.forecaster;
  assertHex(agentId, "forecaster", BYTE_LENGTHS.id);
  return keccak256(
    encodePacked(
      ["string", "bytes32", "bytes32"],
      [SUBMISSION_DOMAIN, forecastRequestIdentity(request), agentId],
    ),
  );
}

/** Stable v0.1 uniqueness key, conservative across alternate request IDs. */
export function forecastSubmissionIdempotencyKey(
  request: ForecastRequest,
  submission: Pick<ForecastSubmission, "forecaster">,
): ForecastIdempotencyKey {
  assertHex(request.circuitId, "request.circuitId", BYTE_LENGTHS.id);
  assertHex(request.marketId, "request.marketId", BYTE_LENGTHS.id);
  assertHex(submission.forecaster, "submission.forecaster", BYTE_LENGTHS.id);
  return keccak256(
    encodePacked(
      ["string", "bytes32", "bytes32", "bytes32"],
      [IDEMPOTENCY_DOMAIN, request.circuitId, request.marketId, submission.forecaster],
    ),
  );
}

function recordFingerprint(
  accepted: AcceptedForecastRequest,
  provider: ForecastProviderIdentity,
  submission: ForecastSubmission,
  binding: AgentBinding,
): string {
  return canonicalize({
    requestId: accepted.requestId,
    iterationId: accepted.iterationId,
    mandateId: accepted.mandateId,
    policyHash: accepted.policyHash,
    bindingId: binding.bindingId,
    provider: canonicalProvider(provider),
    apiPrincipal: binding.apiPrincipal,
    request: canonicalRequest(accepted.request),
    submission: canonicalSubmission(submission),
  });
}

function requestFingerprint(request: ForecastRequest): string {
  return canonicalize(canonicalRequest(request));
}

function freezeAcceptedRequest(record: AcceptedForecastRequest): AcceptedForecastRequest {
  return Object.freeze({
    ...record,
    request: cloneRequest(record.request),
  });
}

function freezeSubmissionRecord(record: ForecastSubmissionRecord): ForecastSubmissionRecord {
  return Object.freeze({
    ...record,
    provider: cloneProvider(record.provider),
    apiPrincipal: cloneApiPrincipal(record.apiPrincipal),
    request: cloneRequest(record.request),
    submission: cloneSubmission(record.submission),
  });
}

export interface ForecastProviderWorkflowOptions {
  readonly policy: MandatePolicy;
  readonly binding: AgentBinding;
  /** Optional deterministic operation clock. Live clocks belong to the caller, not this domain object. */
  readonly now?: bigint;
}

export type ForecastRequestInput = ForecastRequest | AcceptedForecastRequest;

/**
 * Local M4.2 workflow for one bound Forecast provider.
 *
 * It validates and stores domain records only. It has no transport client,
 * wallet, signer, RPC client, chain writer, or execution capability.
 */
export class ForecastProviderWorkflow {
  private readonly policy: MandatePolicy;
  private readonly binding: AgentBinding;
  private readonly policyHash: PolicyHash;
  private readonly defaultNow?: bigint;
  private readonly requests = new Map<string, AcceptedForecastRequest>();
  private readonly submissions = new Map<string, ForecastSubmissionRecord>();
  private readonly submissionsById = new Map<string, ForecastSubmissionRecord>();
  private readonly submissionFingerprints = new Map<string, string>();

  public constructor(options: ForecastProviderWorkflowOptions) {
    validateMandatePolicy(options.policy);
    validateAgentBinding(options.binding, options.policy, options.now);
    if (!options.binding.forecastCapabilities.includes(ForecastCapability.SUBMIT_FORECAST)) {
      fail("ForecastProviderWorkflow binding lacks submitForecast capability");
    }
    if (options.now !== undefined) assertBigInt(options.now, "now");
    this.policy = options.policy;
    this.binding = options.binding;
    this.policyHash = mandatePolicyHash(options.policy);
    this.defaultNow = options.now;
  }

  private assertPolicySnapshot(): void {
    validateMandatePolicy(this.policy);
    if (!sameId(mandatePolicyHash(this.policy), this.policyHash)) {
      fail("ForecastProviderWorkflow policy snapshot was mutated");
    }
  }

  private operationTime(explicit: bigint | undefined, fallback: bigint): bigint {
    const value = explicit ?? this.defaultNow ?? fallback;
    assertBigInt(value, "operation time");
    return value;
  }

  private asAcceptedRequest(input: ForecastRequestInput): AcceptedForecastRequest {
    if ("request" in input && "requestId" in input) {
      const requestId = forecastRequestIdentity(input.request);
      if (!sameId(requestId, input.requestId)) fail("accepted request identity does not match request");
      const stored = this.requests.get(requestId.toLowerCase());
      if (stored === undefined) fail("accepted request was not created by this workflow");
      if (requestFingerprint(stored.request) !== requestFingerprint(input.request)) {
        fail("accepted request does not match stored request");
      }
      return stored;
    }
    return this.acceptRequest(input);
  }

  private assertProviderTransport(provider: ForecastProvider): void {
    if (!sameTransport(provider.apiPrincipal, this.binding.apiPrincipal)) {
      fail("provider transport principal does not match AgentBinding");
    }
  }

  /** Accept a request only after M4.1 scope and policy validation. */
  public acceptRequest(request: ForecastRequest, acceptedAt?: bigint): AcceptedForecastRequest {
    this.assertPolicySnapshot();
    const requestId = forecastRequestIdentity(request);
    const existing = this.requests.get(requestId.toLowerCase());
    if (existing !== undefined) {
      if (requestFingerprint(existing.request) !== requestFingerprint(request)) {
        fail("conflicting ForecastRequest for request identity");
      }
      return existing;
    }

    validateForecastRequest(request, this.policy, acceptedAt ?? this.defaultNow);
    const at = this.operationTime(acceptedAt, request.opensAt);
    if (effectiveMandateLifecycle(this.policy, at) !== MandateLifecycle.ACTIVE) {
      fail("ForecastRequest requires active mandate lifecycle at acceptance");
    }
    if (at >= request.expiresAt) fail("ForecastRequest is expired at acceptance");
    if (request.forecastDeadline !== undefined && at > request.forecastDeadline) {
      fail("ForecastRequest misses the forecast deadline at acceptance");
    }

    const record = freezeAcceptedRequest({
      requestId,
      iterationId: iterationIdentity(request.circuitId, request.marketId),
      request,
      mandateId: this.policy.mandateId,
      policyHash: this.policyHash,
      acceptedAt: at,
    });
    this.requests.set(requestId.toLowerCase(), record);
    return record;
  }

  /** Ask an identified provider for a response to an already scoped request. */
  public ask(provider: ForecastProvider, input: ForecastRequestInput): ForecastProviderResponse {
    this.assertPolicySnapshot();
    validateForecastProvider(provider);
    this.assertProviderTransport(provider);
    const accepted = this.asAcceptedRequest(input);
    const response = provider.getForecast(accepted.request);
    validateForecastProviderResponse(response, accepted.request, provider);
    return response;
  }

  /** Record and idempotently return a locally accepted provider response. */
  public recordProviderResponse(
    input: ForecastRequestInput,
    provider: ForecastProvider,
    response: ForecastProviderResponse,
    acceptedAt?: bigint,
  ): ForecastSubmissionRecord {
    this.assertPolicySnapshot();
    validateForecastProvider(provider);
    this.assertProviderTransport(provider);
    const accepted = this.asAcceptedRequest(input);
    validateForecastProviderResponse(response, accepted.request, provider);

    const submission = response.submission;
    const submissionId = forecastSubmissionIdentity(accepted.request, submission);
    const idempotencyKey = forecastSubmissionIdempotencyKey(accepted.request, submission);
    const fingerprint = recordFingerprint(accepted, provider.identity, submission, this.binding);
    const existing = this.submissions.get(idempotencyKey.toLowerCase());
    if (existing !== undefined) {
      if (this.submissionFingerprints.get(idempotencyKey.toLowerCase()) !== fingerprint) {
        fail("conflicting duplicate Forecast submission for forecaster and market");
      }
      return existing;
    }
    const existingById = this.submissionsById.get(submissionId.toLowerCase());
    if (existingById !== undefined) {
      fail("conflicting duplicate Forecast submission identity");
    }

    const at = this.operationTime(acceptedAt, submission.generatedAt);
    if (at < accepted.acceptedAt) fail("ForecastSubmission was recorded before request acceptance");
    if (at < submission.generatedAt) fail("ForecastSubmission was recorded before it was generated");
    if (at >= submission.validUntil) fail("ForecastSubmission is expired at recording time");
    if (at >= accepted.request.expiresAt) fail("ForecastSubmission is after market expiry");
    if (accepted.request.forecastDeadline !== undefined && at > accepted.request.forecastDeadline) {
      fail("ForecastSubmission misses the forecast deadline");
    }

    validateAgentBinding(this.binding, this.policy, at);
    validateForecastSubmission(submission, accepted.request, this.policy, this.binding, at);
    if (submission.policyHash !== undefined && !sameId(submission.policyHash, this.policyHash)) {
      fail("ForecastSubmission policy hash does not match policy");
    }

    const record = freezeSubmissionRecord({
      submissionId,
      idempotencyKey,
      requestId: accepted.requestId,
      iterationId: accepted.iterationId,
      circuitId: accepted.request.circuitId,
      marketId: accepted.request.marketId,
      forecaster: submission.forecaster,
      forecasterAddress: submission.forecasterAddress,
      mandateId: accepted.mandateId,
      bindingId: this.binding.bindingId,
      policyHash: accepted.policyHash,
      provider: provider.identity,
      apiPrincipal: provider.apiPrincipal,
      request: accepted.request,
      submission,
      acceptedAt: at,
      chainCommitment: NOT_SUBMITTED,
    });
    this.submissions.set(idempotencyKey.toLowerCase(), record);
    this.submissionsById.set(submissionId.toLowerCase(), record);
    this.submissionFingerprints.set(idempotencyKey.toLowerCase(), fingerprint);
    return record;
  }

  /** Named submission surface; it is still local and never a chain write. */
  public submitForecast(
    input: ForecastRequestInput,
    provider: ForecastProvider,
    response: ForecastProviderResponse,
    acceptedAt?: bigint,
  ): ForecastSubmissionRecord {
    return this.recordProviderResponse(input, provider, response, acceptedAt);
  }

  /** Ask and record in one local domain operation. */
  public askAndRecord(
    provider: ForecastProvider,
    request: ForecastRequest,
    acceptedAt?: bigint,
    recordedAt?: bigint,
  ): ForecastSubmissionRecord {
    const accepted = this.acceptRequest(request, acceptedAt);
    const response = this.ask(provider, accepted);
    return this.recordProviderResponse(accepted, provider, response, recordedAt);
  }

  public getSubmission(submissionId: ForecastSubmissionId): ForecastSubmissionRecord | undefined {
    assertHex(submissionId, "submissionId", BYTE_LENGTHS.id);
    return this.submissionsById.get(submissionId.toLowerCase());
  }

  public getSubmissionByIdempotencyKey(key: ForecastIdempotencyKey): ForecastSubmissionRecord | undefined {
    assertHex(key, "idempotencyKey", BYTE_LENGTHS.id);
    return this.submissions.get(key.toLowerCase());
  }
}

/** Canonical inspection representation for a local record. */
export function canonicalizeForecastSubmissionRecord(record: ForecastSubmissionRecord): string {
  return canonicalize({
    submissionId: record.submissionId,
    idempotencyKey: record.idempotencyKey,
    requestId: record.requestId,
    iterationId: record.iterationId,
    circuitId: record.circuitId,
    marketId: record.marketId,
    forecaster: record.forecaster,
    forecasterAddress: record.forecasterAddress,
    mandateId: record.mandateId,
    bindingId: record.bindingId,
    policyHash: record.policyHash,
    provider: canonicalProvider(record.provider),
    apiPrincipal: record.apiPrincipal,
    request: canonicalRequest(record.request),
    submission: canonicalSubmission(record.submission),
    acceptedAt: record.acceptedAt,
    chainCommitment: record.chainCommitment,
  });
}

/** Deterministic, non-authoritative read model for inspection/logging. */
export function formatForecastSubmissionRecord(record: ForecastSubmissionRecord): string {
  return [
    `Forecast ${record.submissionId}`,
    `request: ${record.requestId} circuit=${record.circuitId} market=${record.marketId}`,
    `forecaster: ${record.forecaster} signer=${record.forecasterAddress}`,
    `probabilityUpBps: ${record.submission.probabilityUpBps}`,
    `provider: ${record.provider.displayName} source=${record.provider.source}@${record.provider.sourceVersion}`,
    `transport: ${record.apiPrincipal.transport}/${record.apiPrincipal.principalId}`,
    `policyHash: ${record.policyHash}`,
    `acceptedAt: ${record.acceptedAt.toString()}`,
    `chainCommitment: ${record.chainCommitment} (local domain record only)`,
  ].join("\n");
}

export const forecastRecordIdentity = forecastSubmissionIdentity;
export const forecastRecordIdempotencyKey = forecastSubmissionIdempotencyKey;
export const createForecastProviderWorkflow = (options: ForecastProviderWorkflowOptions): ForecastProviderWorkflow =>
  new ForecastProviderWorkflow(options);
