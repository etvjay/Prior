import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { URL } from "node:url";
import {
  AgentSourceType,
  ApiTransport,
  ForecastCapability,
  ForecastProviderWorkflow,
  MandateLifecycle,
  MandateMarketClass,
  MarketAsset,
  MarketVenue,
  ReadCapability,
  asCollateralRaw,
  mandatePolicyHash,
  type AgentBinding,
  type AgentPrincipal,
  type ForecastProvider,
  type ForecastProviderResponse,
  type ForecastRequest,
  type ForecastSubmission,
  type MandatePolicy,
} from "@prior/core";
import {
  FIXTURE_CIRCUIT_ID,
  FIXTURE_MARKET_ID,
  FIXTURE_PROVIDER_A,
  FIXTURE_PROVIDER_B,
  WireProtocolError,
  assertSubmissionMatchesRequest,
  createFixtureForecastRequest,
  fixtureSignature,
  materialForSubmission,
  parseForecastSubmissionWire,
  parseWireJson,
  sameProviderIdentity,
  serializeWire,
  type FixtureProviderProfile,
  type ForecastRequestWire,
  type ForecastSubmissionAcceptedWire,
  type ForecastSubmissionWire,
  type WireProviderIdentity,
} from "@prior/forecast-protocol";

const ACCEPTED_AT = 220n;
const RECORDED_AT = 260n;

export interface ForecastProviderServerOptions {
  readonly host?: string;
  readonly port?: number;
  readonly acceptedAt?: bigint;
  readonly recordedAt?: bigint;
}

export interface FixtureProviderContext {
  readonly profile: FixtureProviderProfile;
  readonly request: ForecastRequestWire;
  readonly coreRequest: ForecastRequest;
  readonly policy: MandatePolicy;
  readonly binding: AgentBinding;
  readonly provider: ForecastProvider;
  readonly workflow: ForecastProviderWorkflow;
}

export interface ForecastProviderServerHandle {
  readonly url: string;
  readonly contexts: readonly FixtureProviderContext[];
  readonly server: Server;
  close(): Promise<void>;
}

function sameId(left: string, right: string): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

function toCoreRequest(request: ForecastRequestWire): ForecastRequest {
  return {
    forecastId: request.requestId,
    circuitId: request.circuitId,
    marketId: request.marketId,
    asset: request.asset as MarketAsset,
    intervalSec: request.intervalSec,
    opensAt: BigInt(request.opensAt),
    expiresAt: BigInt(request.expiresAt),
    ...(request.forecastDeadline === null ? {} : { forecastDeadline: BigInt(request.forecastDeadline) }),
    ...(request.reference === null
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

function fixturePolicy(forecasters: readonly AgentPrincipal[]): MandatePolicy {
  return {
    version: 1,
    mandateId: `0x${"1".repeat(64)}`,
    owner: `0x${"a1".repeat(20)}`,
    forecasters,
    executors: [],
    marketScope: {
      venue: MarketVenue.DREAMDEX,
      assets: [MarketAsset.BTC],
      intervalsSec: [300],
      marketClass: MandateMarketClass.BTC_5M,
      marketIds: [FIXTURE_MARKET_ID],
    },
    forecastAuthority: {
      agentIds: forecasters.map((principal) => principal.agentId),
      capabilities: [ForecastCapability.SUBMIT_FORECAST],
      maxSubmissionsPerMarket: 1,
      requireAttributableSigner: true,
      minLeadTimeSec: 0,
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
}

function profilePrincipal(profile: FixtureProviderProfile): AgentPrincipal {
  return {
    agentId: profile.forecaster,
    displayName: `${profile.provider.displayName} Forecaster`,
    sourceType: profile.sourceType as AgentSourceType,
    forecastAddress: profile.forecasterAddress,
  };
}

function bindingIdFor(profile: FixtureProviderProfile): `0x${string}` {
  return profile.key === "A" ? (`0x${"6".repeat(64)}` as `0x${string}`) : (`0x${"7".repeat(64)}` as `0x${string}`);
}

function createContext(profile: FixtureProviderProfile, acceptedAt: bigint, recordedAt: bigint): FixtureProviderContext {
  const principals = [profilePrincipal(FIXTURE_PROVIDER_A), profilePrincipal(FIXTURE_PROVIDER_B)];
  const policy = fixturePolicy(principals);
  const request = createFixtureForecastRequest(profile);
  const coreRequest = toCoreRequest(request);
  const binding: AgentBinding = {
    bindingId: bindingIdFor(profile),
    agentId: profile.forecaster,
    circuitId: FIXTURE_CIRCUIT_ID,
    apiPrincipal: { transport: ApiTransport.HTTP, principalId: `fixture-provider:${profile.key}` },
    forecastAddress: profile.forecasterAddress,
    readCapabilities: [ReadCapability.GET_FORECAST_REQUEST],
    forecastCapabilities: [ForecastCapability.SUBMIT_FORECAST],
    executeCapabilities: [],
    issued: 110n,
    expires: 900n,
    mandateId: policy.mandateId,
    policyHash: mandatePolicyHash(policy),
  };
  const provider: ForecastProvider = {
    identity: request.provider,
    apiPrincipal: binding.apiPrincipal,
    getForecast: () => {
      throw new Error("HTTP provider submissions are pushed through the external transport boundary");
    },
  };
  const workflow = new ForecastProviderWorkflow({ policy, binding, now: recordedAt });
  workflow.acceptRequest(coreRequest, acceptedAt);
  return Object.freeze({ profile, request, coreRequest, policy, binding, provider, workflow });
}

export function createFixtureProviderContexts(
  acceptedAt = ACCEPTED_AT,
  recordedAt = RECORDED_AT,
): readonly FixtureProviderContext[] {
  return Object.freeze([
    createContext(FIXTURE_PROVIDER_A, acceptedAt, recordedAt),
    createContext(FIXTURE_PROVIDER_B, acceptedAt, recordedAt),
  ]);
}

function providerContext(contexts: readonly FixtureProviderContext[], provider: WireProviderIdentity): FixtureProviderContext | undefined {
  return contexts.find((context) => sameId(context.provider.identity.providerId, provider.providerId));
}

function serializeAccepted(
  context: FixtureProviderContext,
  record: ReturnType<ForecastProviderWorkflow["recordProviderResponse"]>,
): ForecastSubmissionAcceptedWire {
  return {
    protocolVersion: "1",
    status: "ACCEPTED",
    requestId: record.requestId,
    provider: record.provider,
    sessionId: context.request.sessionId,
    submissionId: record.submissionId,
    idempotencyKey: record.idempotencyKey,
    circuitId: record.circuitId,
    marketId: record.marketId,
    forecaster: record.forecaster,
    forecasterAddress: record.forecasterAddress,
    probabilityUpBps: record.submission.probabilityUpBps,
    generatedAt: record.submission.generatedAt.toString(10),
    validUntil: record.submission.validUntil.toString(10),
    submittedAt: record.acceptedAt.toString(10),
    chainCommitment: "NOT_SUBMITTED",
    signatureScheme: "FIXTURE_KECCAK_V1",
    signatureVerification: "FIXTURE_RECOMPUTED_NOT_PRODUCTION_CRYPTOGRAPHIC_VERIFICATION",
    transportPrincipal: {
      transport: record.apiPrincipal.transport,
      principalId: record.apiPrincipal.principalId,
    },
  };
}

function json(response: ServerResponse, statusCode: number, body: unknown): void {
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(serializeWire(body));
}

async function bodyText(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    length += buffer.length;
    if (length > 1_000_000) throw new WireProtocolError("PAYLOAD_TOO_LARGE", "wire payload exceeds 1 MiB", 413);
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function coreError(error: unknown): { code: string; statusCode: number; message: string } {
  const message = error instanceof Error ? error.message : "core Forecast validation failed";
  if (/conflicting duplicate|duplicate Forecast submission/i.test(message)) return { code: "CONFLICTING_DUPLICATE", statusCode: 409, message };
  if (/expired|deadline|recorded before/i.test(message)) return { code: "INVALID_SUBMISSION_WINDOW", statusCode: 422, message };
  return { code: "CORE_VALIDATION_REJECTED", statusCode: 422, message };
}

function executionRequestFields(value: unknown): { requestId: `0x${string}`; marketId: `0x${string}` } {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new WireProtocolError("INVALID_WIRE", "execution request must be an object", 400);
  const object = value as Record<string, unknown>;
  if (object.protocolVersion !== "1") throw new WireProtocolError("UNSUPPORTED_PROTOCOL_VERSION", "execution request must be protocol v1", 400);
  if (typeof object.requestId !== "string" || typeof object.marketId !== "string") throw new WireProtocolError("INVALID_WIRE", "execution request identity is required", 400);
  return { requestId: object.requestId as `0x${string}`, marketId: object.marketId as `0x${string}` };
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  contexts: readonly FixtureProviderContext[],
  recordedAt: bigint,
): Promise<void> {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  try {
    if (request.method === "GET" && url.pathname === "/health") {
      json(response, 200, { ok: true, service: "prior-forecast-provider", protocolVersion: "1", executionAuthority: false });
      return;
    }

    if (request.method === "GET" && url.pathname === "/v1/forecast-requests/next") {
      const providerId = url.searchParams.get("providerId");
      const sessionId = url.searchParams.get("sessionId");
      const context = contexts.find(
        (candidate) => candidate.profile.provider.providerId.toLowerCase() === providerId?.toLowerCase() && candidate.profile.sessionId === sessionId,
      );
      if (context === undefined) {
        json(response, 404, { protocolVersion: "1", code: "UNKNOWN_PROVIDER_SESSION", message: "provider session is not registered" });
        return;
      }
      json(response, 200, context.request);
      return;
    }

    if (request.method === "POST" && url.pathname === "/v1/forecast-submissions") {
      const parsed = parseForecastSubmissionWire(parseWireJson(await bodyText(request)));
      const context = providerContext(contexts, parsed.provider);
      if (context === undefined) {
        throw new WireProtocolError("UNKNOWN_PROVIDER", "provider identity is not registered", 403);
      }
      assertSubmissionMatchesRequest(context.request, parsed);
      if (!sameProviderIdentity(context.request.provider, parsed.provider)) {
        throw new WireProtocolError("PROVIDER_IDENTITY_MISMATCH", "provider attribution does not match the issued request");
      }
      const expectedSignature = fixtureSignature(materialForSubmission(parsed));
      if (!sameId(expectedSignature, parsed.signature)) {
        throw new WireProtocolError("SIGNATURE_DOMAIN_MISMATCH", "fixture signature does not match the frozen sign material");
      }

      const submission: ForecastSubmission = {
        marketId: parsed.marketId,
        circuitId: parsed.circuitId,
        policyHash: mandatePolicyHash(context.policy),
        forecaster: parsed.forecaster,
        forecasterAddress: parsed.forecasterAddress,
        probabilityUpBps: parsed.probabilityUpBps,
        generatedAt: BigInt(parsed.generatedAt),
        validUntil: BigInt(parsed.validUntil),
        sourceType: parsed.sourceType as AgentSourceType,
        sourceVersion: parsed.sourceVersion,
        signature: parsed.signature,
      };
      const providerResponse: ForecastProviderResponse = {
        requestId: context.request.requestId,
        providerId: context.provider.identity.providerId,
        submission,
      };
      const record = context.workflow.recordProviderResponse(context.coreRequest, context.provider, providerResponse, recordedAt);
      json(response, 200, serializeAccepted(context, record));
      return;
    }

    if (request.method === "GET" && url.pathname.startsWith("/v1/forecast-submissions/")) {
      const submissionId = decodeURIComponent(url.pathname.slice("/v1/forecast-submissions/".length));
      for (const context of contexts) {
        const record = context.workflow.getSubmission(submissionId as `0x${string}`);
        if (record !== undefined) {
          json(response, 200, serializeAccepted(context, record));
          return;
        }
      }
      json(response, 404, { protocolVersion: "1", code: "SUBMISSION_NOT_FOUND", message: "submission readback is unavailable" });
      return;
    }

    if (request.method === "POST" && url.pathname === "/v1/execution-requests") {
      const fields = executionRequestFields(parseWireJson(await bodyText(request)));
      json(response, 403, {
        protocolVersion: "1",
        status: "REJECTED_AUTHORITY",
        reasonCode: "REJECTED_AUTHORITY",
        executionAuthority: false,
        requestId: fields.requestId,
        marketId: fields.marketId,
        message: "Forecast Provider transport and Forecast authority do not grant execution authority",
      });
      return;
    }

    json(response, 404, { protocolVersion: "1", code: "NOT_FOUND", message: "route is not part of the v1 provider boundary" });
  } catch (error) {
    if (error instanceof WireProtocolError) {
      json(response, error.statusCode, { protocolVersion: "1", code: error.code, message: error.message });
      return;
    }
    const mapped = coreError(error);
    json(response, mapped.statusCode, { protocolVersion: "1", code: mapped.code, message: mapped.message });
  }
}

export async function createForecastProviderServer(options: ForecastProviderServerOptions = {}): Promise<ForecastProviderServerHandle> {
  const host = options.host ?? "127.0.0.1";
  const port = options.port ?? 8791;
  const acceptedAt = options.acceptedAt ?? ACCEPTED_AT;
  const recordedAt = options.recordedAt ?? RECORDED_AT;
  const contexts = createFixtureProviderContexts(acceptedAt, recordedAt);
  const server = createServer((request, response) => {
    void handleRequest(request, response, contexts, recordedAt);
  });
  await new Promise<void>((resolve, reject) => {
    const onError = (error: Error) => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.off("error", onError);
      resolve();
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, host);
  });
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("provider server did not expose a TCP address");
  return {
    url: `http://${host}:${address.port}`,
    contexts,
    server,
    close: () => new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? "8791");
  const handle = await createForecastProviderServer({ port });
  console.log(`FORECAST_PROVIDER_SERVER_READY=${handle.url}`);
  const close = async () => {
    await handle.close();
    process.exit(0);
  };
  process.once("SIGINT", () => void close());
  process.once("SIGTERM", () => void close());
}
