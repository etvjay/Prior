import {
  FIXTURE_PROVIDER_A,
  createFixtureForecastRequest,
  fixtureSignature,
  materialForSubmission,
  parseForecastSubmissionWire,
  type ForecastRequestWire,
  type ForecastSubmissionAcceptedWire,
  type ForecastSubmissionWire,
  type FixtureProviderProfile,
  type WireProviderIdentity,
} from "@prior/forecast-protocol";
import { createFixtureProviderContexts, type FixtureProviderContext } from "@prior/forecast-provider-server";

export type IntegrationScope = "prior:read" | "prior:forecast:submit";
export interface AuthContext { readonly scopes?: readonly string[]; readonly principalId?: string; }
export interface Page<T> { readonly items: readonly T[]; readonly limit: number; readonly offset: number; readonly nextOffset: number | null; }
export interface IntegrationErrorShape { readonly code: string; readonly message: string; readonly status: number; }

export class IntegrationError extends Error {
  public readonly code: string; public readonly status: number;
  public constructor(code: string, message: string, status = 400) { super(message); this.name = "IntegrationError"; this.code = code; this.status = status; }
}

function same(a: string, b: string): boolean { return a.toLowerCase() === b.toLowerCase(); }
function pageValue(value: number, field: string, minimum: number): number {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < minimum) throw new IntegrationError("MALFORMED_INPUT", `${field} must be a finite integer >= ${minimum}`, 400);
  return value;
}
function accepted(context: FixtureProviderContext, record: ReturnType<FixtureProviderContext["workflow"]["recordProviderResponse"]>): ForecastSubmissionAcceptedWire {
  return { protocolVersion: "1", status: "ACCEPTED", requestId: record.requestId, provider: record.provider, sessionId: context.request.sessionId, submissionId: record.submissionId, idempotencyKey: record.idempotencyKey, circuitId: record.circuitId, marketId: record.marketId, forecaster: record.forecaster, forecasterAddress: record.forecasterAddress, probabilityUpBps: record.submission.probabilityUpBps, generatedAt: record.submission.generatedAt.toString(), validUntil: record.submission.validUntil.toString(), submittedAt: record.acceptedAt.toString(), chainCommitment: "NOT_SUBMITTED", signatureScheme: "FIXTURE_KECCAK_V1", signatureVerification: "FIXTURE_RECOMPUTED_NOT_PRODUCTION_CRYPTOGRAPHIC_VERIFICATION", transportPrincipal: { transport: record.apiPrincipal.transport, principalId: record.apiPrincipal.principalId } };
}

export class PriorApplicationService {
  public readonly contexts: readonly FixtureProviderContext[];
  public constructor(contexts = createFixtureProviderContexts()) { this.contexts = contexts; }
  public authorize(auth: AuthContext | undefined, scope: IntegrationScope): void {
    if (!auth?.scopes?.includes(scope)) throw new IntegrationError("SCOPE_REQUIRED", `required scope: ${scope}`, 403);
  }
  public capabilities(auth?: AuthContext): Record<string, unknown> { this.authorize(auth, "prior:read"); return { version: "v1", service: "prior-agent-integration", scopes: ["prior:read", "prior:forecast:submit"], execution: { enabled: false, reason: "No execution capability is exposed by the Forecast Provider boundary" }, routes: ["GET /v1/capabilities", "GET /v1/circuits/:id", "GET /v1/markets/:marketId", "GET /v1/forecasts/:id", "GET /v1/forecast-requests/next", "POST /v1/forecast-submissions"], mcp: { resources: ["prior://capabilities", "prior://circuit/{id}", "prior://market/{marketId}", "prior://forecast/{id}"], tools: ["get_capabilities", "get_circuit", "get_market", "get_forecast", "get_forecast_request", "submit_signed_forecast"] }, caller: auth?.principalId ?? null }; }
  private contextById(id: string): FixtureProviderContext | undefined { return this.contexts.find((c) => same(c.request.circuitId, id)); }
  private contextByMarket(id: string): FixtureProviderContext | undefined { return this.contexts.find((c) => same(c.request.marketId, id)); }
  public getCircuit(id: string, auth?: AuthContext) { this.authorize(auth, "prior:read"); const c = this.contextById(id); if (!c) throw new IntegrationError("NOT_FOUND", "circuit not found", 404); return { circuitId: c.request.circuitId, policyHash: c.binding.policyHash, authority: { forecast: c.binding.forecastCapabilities, execute: c.binding.executeCapabilities }, iteration: { marketId: c.request.marketId, requestId: c.request.requestId, status: "WAITING_FOR_FORECAST" }, provenance: { source: "ForecastProviderWorkflow", providerId: c.provider.identity.providerId } }; }
  public getMarket(id: string, auth?: AuthContext) { this.authorize(auth, "prior:read"); const c = this.contextByMarket(id); if (!c) throw new IntegrationError("NOT_FOUND", "market not found", 404); return { marketId: c.request.marketId, asset: c.request.asset, intervalSec: c.request.intervalSec, opensAt: c.request.opensAt, expiresAt: c.request.expiresAt, lifecycle: "TRADING", reference: c.request.reference, provenance: { source: "ForecastRequest", requestId: c.request.requestId } }; }
  public listMarkets(auth?: AuthContext, limit = 50, offset = 0): Page<ReturnType<PriorApplicationService["getMarket"]>> { this.authorize(auth, "prior:read"); const safeLimit = pageValue(limit, "limit", 1); const start = pageValue(offset, "offset", 0); const all = [...new Map(this.contexts.map((c) => [c.request.marketId.toLowerCase(), this.getMarket(c.request.marketId, auth)] )).values()]; const items = all.slice(start, start + Math.min(safeLimit, 100)); const next = start + items.length < all.length ? start + items.length : null; return { items, limit: Math.min(safeLimit, 100), offset: start, nextOffset: next }; }
  public listCircuits(auth?: AuthContext, limit = 50, offset = 0): Page<ReturnType<PriorApplicationService["getCircuit"]>> { this.authorize(auth, "prior:read"); const safeLimit = pageValue(limit, "limit", 1); const start = pageValue(offset, "offset", 0); const all = [...new Map(this.contexts.map((c) => [c.request.circuitId.toLowerCase(), this.getCircuit(c.request.circuitId, auth)] )).values()]; const items = all.slice(start, start + Math.min(safeLimit, 100)); const next = start + items.length < all.length ? start + items.length : null; return { items, limit: Math.min(safeLimit, 100), offset: start, nextOffset: next }; }
  public getForecast(id: string, auth?: AuthContext) { this.authorize(auth, "prior:read"); for (const c of this.contexts) { const record = c.workflow.getSubmission(id as `0x${string}`); if (record) return accepted(c, record); if (same(c.request.requestId, id)) return { request: c.request, submission: null }; } throw new IntegrationError("NOT_FOUND", "forecast not found", 404); }
  public getForecastRequest(providerId: string, sessionId: string, auth?: AuthContext): ForecastRequestWire { this.authorize(auth, "prior:read"); const c = this.contexts.find((x) => same(x.request.provider.providerId, providerId) && x.request.sessionId === sessionId); if (!c) throw new IntegrationError("NOT_FOUND", "provider session not found", 404); return c.request; }
  public submitSignedForecast(payload: unknown, auth?: AuthContext): ForecastSubmissionAcceptedWire { this.authorize(auth, "prior:forecast:submit"); let parsed: ForecastSubmissionWire; try { parsed = parseForecastSubmissionWire(payload); } catch { throw new IntegrationError("MALFORMED_INPUT", "invalid Forecast submission", 400); } const c = this.contexts.find((x) => same(x.request.provider.providerId, parsed.provider.providerId)); if (!c) throw new IntegrationError("NOT_FOUND", "provider not found", 404); if (c.request.requestId.toLowerCase() !== parsed.requestId.toLowerCase() || c.request.sessionId !== parsed.sessionId || !same(c.request.marketId, parsed.marketId) || !same(c.request.circuitId, parsed.circuitId)) throw new IntegrationError("IDENTITY_MISMATCH", "submission is not bound to the issued request", 409); if (parsed.signatureScheme !== "FIXTURE_KECCAK_V1") throw new IntegrationError("UNSUPPORTED_SIGNATURE_SCHEME", "only the existing fixture protocol path is enabled in this local surface", 422); if (!same(fixtureSignature(materialForSubmission(parsed)), parsed.signature)) throw new IntegrationError("SIGNATURE_DOMAIN_MISMATCH", "signature does not match the frozen sign material", 422); const submission = { marketId: parsed.marketId, circuitId: parsed.circuitId, policyHash: c.binding.policyHash, forecaster: parsed.forecaster, forecasterAddress: parsed.forecasterAddress, probabilityUpBps: parsed.probabilityUpBps, generatedAt: BigInt(parsed.generatedAt), validUntil: BigInt(parsed.validUntil), sourceType: parsed.sourceType, sourceVersion: parsed.sourceVersion, signature: parsed.signature } as const; try { const record = c.workflow.recordProviderResponse(c.coreRequest, c.provider, { requestId: c.request.requestId, providerId: c.provider.identity.providerId, submission }, 260n); return accepted(c, record); } catch (error) { throw new IntegrationError("CONFLICTING_IDENTITY", error instanceof Error ? error.message : "conflicting submission", 409); } }
  public refuseExecution(): never { throw new IntegrationError("CAPABILITY_DENIED", "arbitrary execution is not exposed", 403); }
}
