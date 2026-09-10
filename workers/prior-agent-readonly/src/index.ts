import { PriorApplicationService, IntegrationError, type AuthContext } from "@prior/agent-integration";
import { LiveReadAdapter, EVIDENCE_MODE } from "./live-read";

interface Env { SHANNON_RPC_HTTP?: string }
const service = new PriorApplicationService();

function auth(request: Request): AuthContext {
  const raw = request.headers.get("x-prior-scope");
  return { scopes: raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [], principalId: request.headers.get("x-prior-principal") ?? undefined };
}
function json(body: unknown, status = 200): Response { return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } }); }
function id(pathname: string, prefix: string): string | undefined { if (!pathname.startsWith(prefix)) return undefined; try { return decodeURIComponent(pathname.slice(prefix.length)); } catch { throw new IntegrationError("MALFORMED_INPUT", "path identifier is not valid percent-encoding", 400); } }
function page(url: URL, name: "limit" | "offset", fallback: number): number { const raw = url.searchParams.get(name); if (raw === null) return fallback; if (!/^(0|[1-9][0-9]*)$/.test(raw)) throw new IntegrationError("MALFORMED_INPUT", `${name} must be a finite safe integer in canonical decimal form`, 400); const value = Number(raw); if (!Number.isSafeInteger(value)) throw new IntegrationError("MALFORMED_INPUT", `${name} is outside the safe integer range`, 400); return value; }
function liveError(error: unknown): IntegrationError | undefined { const code = (error as { code?: string })?.code; if (code === "CHAIN_MISMATCH") return new IntegrationError(code, "RPC is not bound to Somnia Shannon chainId 50312", 502); if (code === "UPSTREAM_MALFORMED") return new IntegrationError(code, "canonical RPC response did not match the verified ABI", 502); if (code === "UPSTREAM_UNAVAILABLE") return new IntegrationError(code, "canonical RPC is unavailable", 503); return undefined; }
function notConnected(route: string) { return json({ code: "NOT_CONNECTED", message: `${route} list/indexing is not proven by the canonical RPC adapter`, evidenceMode: "SHANNON_RPC_READ_ONLY" }, 501); }

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url); const context = auth(request);
      if (request.method !== "GET") return json({ code: "CAPABILITY_DENIED", message: "only read-only GET routes are exposed" }, 403);
      if (url.pathname === "/health") return json({ ok: true, service: "prior-agent-readonly", version: "v1", mode: "SHANNON_RPC_READ_ONLY", chainId: 50312 });
      if (url.pathname === "/v1/capabilities") return json({ ...service.capabilities(context), scopes: ["prior:read"], routes: ["GET /health", "GET /v1/capabilities", "GET /v1/circuits/:id", "GET /v1/markets/:marketId", "GET /v1/forecasts/:id"], mcp: { resources: ["prior://capabilities", "prior://circuit/{circuitId}", "prior://market/{marketId}", "prior://forecast/{forecastId}"], tools: ["get_capabilities", "get_circuit", "get_market", "get_forecast"] }, hosted: { mode: "SHANNON_RPC_READ_ONLY", canonicalState: "SHANNON_RPC_READ_VERIFIED_FOR_BOUND_DETAILS", submission: "DISABLED", execution: "DISABLED", persistence: "NONE", listIndexing: "NOT_CONNECTED", evidenceMode: "SHANNON_RPC_READ_ONLY" } });
      if (url.pathname === "/v1/markets" || url.pathname === "/v1/circuits") { page(url, "limit", 50); page(url, "offset", 0); return notConnected(url.pathname); }
      const live = new LiveReadAdapter({ rpcUrl: env.SHANNON_RPC_HTTP });
      const marketId = id(url.pathname, "/v1/markets/"); if (marketId) { service.authorize(context, "prior:read"); return json(await live.readMarket(marketId as `0x${string}`)); }
      const circuitId = id(url.pathname, "/v1/circuits/"); if (circuitId) { service.authorize(context, "prior:read"); return json(await live.readCircuit(circuitId as `0x${string}`)); }
      const forecastId = id(url.pathname, "/v1/forecasts/"); if (forecastId) { service.authorize(context, "prior:read"); return json(await live.readForecast(forecastId as `0x${string}`)); }
      return json({ code: "NOT_FOUND", message: "route is not part of the hosted read-only contract" }, 404);
    } catch (error) { const e = error instanceof IntegrationError ? error : liveError(error) ?? new IntegrationError("INTERNAL_ERROR", "request failed", 500); return json({ code: e.code, message: e.message }, e.status); }
  },
};
