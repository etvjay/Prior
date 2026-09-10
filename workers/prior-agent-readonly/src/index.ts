import { PriorApplicationService, IntegrationError, type AuthContext } from "@prior/agent-integration";

interface Env { }
const service = new PriorApplicationService();

function auth(request: Request): AuthContext {
  const raw = request.headers.get("x-prior-scope");
  return { scopes: raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [], principalId: request.headers.get("x-prior-principal") ?? undefined };
}
function json(body: unknown, status = 200): Response { return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } }); }
function id(pathname: string, prefix: string): string | undefined { if (!pathname.startsWith(prefix)) return undefined; try { return decodeURIComponent(pathname.slice(prefix.length)); } catch { throw new IntegrationError("MALFORMED_INPUT", "path identifier is not valid percent-encoding", 400); } }
function page(url: URL, name: "limit" | "offset", fallback: number): number { const raw = url.searchParams.get(name); if (raw === null) return fallback; if (!/^(0|[1-9][0-9]*)$/.test(raw)) throw new IntegrationError("MALFORMED_INPUT", `${name} must be a finite safe integer in canonical decimal form`, 400); const value = Number(raw); if (!Number.isSafeInteger(value)) throw new IntegrationError("MALFORMED_INPUT", `${name} is outside the safe integer range`, 400); return value; }

export default {
  async fetch(request: Request, _env: Env): Promise<Response> {
    try {
      const url = new URL(request.url); const context = auth(request);
      if (request.method !== "GET") return json({ code: "CAPABILITY_DENIED", message: "only read-only GET routes are exposed" }, 403);
      if (url.pathname === "/health") return json({ ok: true, service: "prior-agent-readonly", version: "v1", mode: "PUBLIC_FIXTURE_READONLY" });
      if (url.pathname === "/v1/capabilities") return json({ ...service.capabilities(context), scopes: ["prior:read"], routes: ["GET /health", "GET /v1/capabilities", "GET /v1/circuits", "GET /v1/circuits/:id", "GET /v1/markets", "GET /v1/markets/:marketId", "GET /v1/forecasts/:id"], mcp: { resources: ["prior://capabilities", "prior://circuit/{circuitId}", "prior://market/{marketId}", "prior://forecast/{forecastId}"], tools: ["get_capabilities", "get_circuit", "get_market", "get_forecast"] }, hosted: { mode: "PUBLIC_FIXTURE_READONLY", canonicalState: "NOT_CONNECTED", submission: "DISABLED", execution: "DISABLED", persistence: "NONE" } });
      if (url.pathname === "/v1/markets") return json(service.listMarkets(context, page(url, "limit", 50), page(url, "offset", 0)));
      if (url.pathname === "/v1/circuits") return json(service.listCircuits(context, page(url, "limit", 50), page(url, "offset", 0)));
      const marketId = id(url.pathname, "/v1/markets/"); if (marketId) return json(service.getMarket(marketId, context));
      const circuitId = id(url.pathname, "/v1/circuits/"); if (circuitId) return json(service.getCircuit(circuitId, context));
      const forecastId = id(url.pathname, "/v1/forecasts/"); if (forecastId) return json(service.getForecast(forecastId, context));
      return json({ code: "NOT_FOUND", message: "route is not part of the hosted read-only contract" }, 404);
    } catch (error) { const e = error instanceof IntegrationError ? error : new IntegrationError("INTERNAL_ERROR", "request failed", 500); return json({ code: e.code, message: e.message }, e.status); }
  },
};
