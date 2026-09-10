import type { ForecastRequestWire, ForecastSubmissionAcceptedWire, ForecastSubmissionWire } from "@prior/forecast-protocol";
import type { Page } from "./service.js";

export class PriorSdkError extends Error { public readonly code: string; public readonly status: number; public constructor(code: string, message: string, status: number) { super(message); this.name = "PriorSdkError"; this.code = code; this.status = status; } }
export interface PriorClientOptions { readonly baseUrl: string; readonly scopes?: readonly string[]; readonly principalId?: string; readonly fetch?: typeof globalThis.fetch; }
export interface CircuitView { readonly circuitId: string; readonly policyHash: string; readonly authority: { forecast: readonly string[]; execute: readonly string[] }; readonly iteration: { marketId: string; requestId: string; status: string }; readonly provenance: { source: string; providerId: string }; }
export interface MarketView { readonly marketId: string; readonly asset: string; readonly intervalSec: number; readonly opensAt: string; readonly expiresAt: string; readonly lifecycle: string; readonly reference: unknown; readonly provenance: { source: string; requestId: string }; }

export class PriorClient {
  private readonly baseUrl: string; private readonly scopes: readonly string[]; private readonly principalId?: string; private readonly http: typeof globalThis.fetch;
  public constructor(options: PriorClientOptions) { this.baseUrl = options.baseUrl.replace(/\/$/, ""); this.scopes = options.scopes ?? ["prior:read"]; this.principalId = options.principalId; this.http = options.fetch ?? globalThis.fetch; }
  private async request<T>(path: string, init: RequestInit = {}): Promise<T> { const headers = new Headers(init.headers); headers.set("accept", "application/json"); headers.set("x-prior-scope", this.scopes.join(",")); if (this.principalId) headers.set("x-prior-principal", this.principalId); const response = await this.http(`${this.baseUrl}${path}`, { ...init, headers }); const body = await response.json().catch(() => ({})); if (!response.ok) throw new PriorSdkError(body.code ?? "HTTP_ERROR", body.message ?? "Prior request failed", response.status); return body as T; }
  public capabilities(): Promise<Record<string, unknown>> { return this.request("/v1/capabilities"); }
  public getCircuit(circuitId: string): Promise<CircuitView> { return this.request(`/v1/circuits/${encodeURIComponent(circuitId)}`); }
  public getMarket(marketId: string): Promise<MarketView> { return this.request(`/v1/markets/${encodeURIComponent(marketId)}`); }
  public listCircuits(limit = 50, offset = 0): Promise<Page<CircuitView>> { return this.request(`/v1/circuits?limit=${limit}&offset=${offset}`); }
  public listMarkets(limit = 50, offset = 0): Promise<Page<MarketView>> { return this.request(`/v1/markets?limit=${limit}&offset=${offset}`); }
  public getForecast(id: string): Promise<unknown> { return this.request(`/v1/forecasts/${encodeURIComponent(id)}`); }
  public getForecastRequest(providerId: string, sessionId: string): Promise<ForecastRequestWire> { return this.request(`/v1/forecast-requests/next?providerId=${encodeURIComponent(providerId)}&sessionId=${encodeURIComponent(sessionId)}`); }
  public submitSignedForecast(submission: ForecastSubmissionWire): Promise<ForecastSubmissionAcceptedWire> { return this.request("/v1/forecast-submissions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(submission) }); }
}
