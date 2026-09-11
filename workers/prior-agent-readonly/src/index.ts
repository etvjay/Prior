import { PriorApplicationService, IntegrationError, type AuthContext } from "@prior/agent-integration";
import { LiveReadAdapter } from "./live-read";

interface Env { SHANNON_RPC_HTTP?: string; PRIOR_READ_TOKEN?: string; MARKET_INDEXER_URL?: string }
const service = new PriorApplicationService();
const tools = [
  { name: "get_capabilities", description: "Read hosted Prior capabilities; never executes economic actions.", inputSchema: { type: "object", additionalProperties: false } },
  { name: "get_market", description: "Read canonical Shannon market detail by marketId.", inputSchema: { type: "object", required: ["marketId"], additionalProperties: false, properties: { marketId: { type: "string", minLength: 1 } } } },
  { name: "get_circuit", description: "Read canonical Shannon Circuit intent and runtime by circuitId.", inputSchema: { type: "object", required: ["circuitId"], additionalProperties: false, properties: { circuitId: { type: "string", minLength: 1 } } } },
  { name: "get_forecast", description: "Read canonical Shannon RFT Forecast trial by forecastId.", inputSchema: { type: "object", required: ["forecastId"], additionalProperties: false, properties: { forecastId: { type: "string", minLength: 1 } } } },
  { name: "discover_markets", description: "List a bounded recent DreamDEX market sample; not a complete global index.", inputSchema: { type: "object", additionalProperties: false, properties: { limit: { type: "integer", minimum: 1, maximum: 20 } } } },
  { name: "discover_circuits", description: "List verified bounded Circuit references; not a complete global index.", inputSchema: { type: "object", additionalProperties: false } },
];
const resources = [
  { uri: "prior://capabilities", name: "Prior capabilities", mimeType: "application/json" },
  { uri: "prior://circuit/{circuitId}", name: "Prior Circuit", mimeType: "application/json" },
  { uri: "prior://market/{marketId}", name: "Prior market", mimeType: "application/json" },
  { uri: "prior://forecast/{forecastId}", name: "Prior Forecast", mimeType: "application/json" },
];
const INDEXER_URL = "https://dev.smk.somnia.host/v1/graphql";
const KNOWN_CIRCUITS = [
  { circuitId: "0x6cdfdf64cc70b5bb2e6519ab1dc0372e3ed7fdfb6d16a0ca0043f7aea4f23437", version: "V2", source: "m4-3-live-zero-action-lifecycle.json" },
  { circuitId: "0x15e18e2aecb7d00ca3243181fb2fa38af81b021266e2d0a290eb0c55d2b5f4c1", version: "V1", source: "circuit-continuity-recovery.json" },
];
function auth(request: Request, env: Env): AuthContext { const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1]; return !env.PRIOR_READ_TOKEN || !token || token !== env.PRIOR_READ_TOKEN ? { scopes: [] } : { scopes: ["prior:read"], principalId: "cloudflare-bearer" }; }
function json(body: unknown, status = 200): Response { return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } }); }
function id(pathname: string, prefix: string): string | undefined { if (!pathname.startsWith(prefix)) return undefined; try { return decodeURIComponent(pathname.slice(prefix.length)); } catch { throw new IntegrationError("MALFORMED_INPUT", "path identifier is not valid percent-encoding", 400); } }
function page(url: URL, name: "limit" | "offset", fallback: number): number { const raw = url.searchParams.get(name); if (raw === null) return fallback; if (!/^(0|[1-9][0-9]*)$/.test(raw)) throw new IntegrationError("MALFORMED_INPUT", `${name} must be a finite safe integer in canonical decimal form`, 400); const value = Number(raw); if (!Number.isSafeInteger(value)) throw new IntegrationError("MALFORMED_INPUT", `${name} is outside the safe integer range`, 400); return value; }
function liveError(error: unknown): IntegrationError | undefined { const code = (error as { code?: string })?.code; if (code === "CHAIN_MISMATCH") return new IntegrationError(code, "RPC is not bound to Somnia Shannon chainId 50312", 502); if (code === "UPSTREAM_MALFORMED") return new IntegrationError(code, "canonical RPC response did not match the verified ABI", 502); if (code === "UPSTREAM_UNAVAILABLE") return new IntegrationError(code, "canonical RPC is unavailable", 503); return undefined; }
function notConnected(route: string) { return json({ code: "NOT_CONNECTED", message: `${route} list/indexing is not proven by the canonical RPC adapter`, evidenceMode: "SHANNON_RPC_READ_ONLY" }, 501); }
async function discoverMarkets(env: Env, limit: number) {
  const query = `query M($n: Int!) { Market(limit: $n, order_by: {createdAtBlock: desc}) { marketId asset intervalSec clobStatus expiry marketAddress binaryPoolAddress quoteToken quoteDecimals baseSymbol baseDecimals oracleQuestionId yesTokenId noTokenId createdAtBlock } }`;
  const response = await fetch(env.MARKET_INDEXER_URL ?? INDEXER_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query, variables: { n: Math.min(limit, 20) } }) });
  if (!response.ok) throw new IntegrationError("DISCOVERY_UNAVAILABLE", `market discovery upstream returned ${response.status}`, 503);
  const body = await response.json() as { data?: { Market?: unknown[] }; errors?: unknown[] };
  if (body.errors || !Array.isArray(body.data?.Market)) throw new IntegrationError("DISCOVERY_MALFORMED", "market discovery upstream response was malformed", 502);
  return { chainId: 50312, discoveryCompleteness: "BOUNDED", source: "DreamDEX indexer for discovery; verify canonical detail by marketId", limit: Math.min(limit, 20), items: body.data.Market };
}
function discoverCircuits() { return { chainId: 50312, discoveryCompleteness: "BOUNDED", source: "explicit verified evidence references; not a global Circuit index", items: KNOWN_CIRCUITS }; }
function rpc(id: unknown, result: unknown): Response { return json({ jsonrpc: "2.0", id: id ?? null, result }); }
function rpcError(id: unknown, code: number, message: string): Response { return json({ jsonrpc: "2.0", id: id ?? null, error: { code, message } }, 200); }
function argument(args: unknown, key: string): string { if (!args || typeof args !== "object" || Array.isArray(args) || typeof (args as Record<string, unknown>)[key] !== "string" || !(args as Record<string, unknown>)[key]) throw new IntegrationError("MALFORMED_INPUT", `${key} is required`, 400); return (args as Record<string, unknown>)[key] as string; }
function decodeResource(raw: string): string { try { return decodeURIComponent(raw); } catch { throw new IntegrationError("MALFORMED_INPUT", "resource identifier is not valid percent-encoding", 400); } }
function discoveryLimit(value: unknown): number { if (value === undefined) return 10; if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1 || value > 20) throw new IntegrationError("MALFORMED_INPUT", "discovery limit must be an integer from 1 to 20", 400); return value; }
async function mcp(request: Request, env: Env, context: AuthContext): Promise<Response> {
  service.authorize(context, "prior:read");
  let body: { id?: unknown; method?: unknown; params?: Record<string, unknown> }; try { body = await request.json() as typeof body; } catch { return rpcError(null, -32700, "invalid JSON"); }
  const method = body.method; const rid = body.id;
  if (method === "initialize") return rpc(rid, { protocolVersion: "2025-06-18", capabilities: { tools: { listChanged: false }, resources: { subscribe: false, listChanged: false } }, serverInfo: { name: "prior-agent-readonly", version: "v1" } });
  if (method === "tools/list") return rpc(rid, { tools });
  if (method === "resources/list") return rpc(rid, { resources });
  if (method === "tools/call") {
    const name = body.params?.name; const args = body.params?.arguments;
    const live = new LiveReadAdapter({ rpcUrl: env.SHANNON_RPC_HTTP }); let result: unknown;
    if (name === "get_capabilities") result = { ...service.capabilities(context), scopes: ["prior:read"], routes: ["GET /health", "GET /v1/capabilities", "GET /v1/circuits/:id", "GET /v1/markets/:marketId", "GET /v1/forecasts/:id", "GET /v1/discovery/markets", "GET /v1/discovery/circuits"], mcp: { resources, tools }, hosted: { mode: "SHANNON_RPC_READ_ONLY", canonicalState: "SHANNON_RPC_READ_VERIFIED_FOR_BOUND_DETAILS", submission: "DISABLED", execution: "DISABLED", persistence: "NONE", listIndexing: "NOT_CONNECTED", evidenceMode: "SHANNON_RPC_READ_ONLY" } };
    else if (name === "get_market") result = await live.readMarket(argument(args, "marketId") as `0x${string}`);
    else if (name === "get_circuit") result = await live.readCircuit(argument(args, "circuitId") as `0x${string}`);
    else if (name === "get_forecast") result = await live.readForecast(argument(args, "forecastId") as `0x${string}`);
    else if (name === "discover_markets") result = await discoverMarkets(env, discoveryLimit(args && typeof args === "object" ? (args as Record<string, unknown>).limit : undefined));
    else if (name === "discover_circuits") result = discoverCircuits();
    return rpc(rid, { content: [{ type: "text", text: JSON.stringify(result) }], structuredContent: result });
  }
  if (method === "resources/read") {
    const uri = typeof body.params?.uri === "string" ? body.params.uri : ""; const live = new LiveReadAdapter({ rpcUrl: env.SHANNON_RPC_HTTP }); let result: unknown;
    if (uri === "prior://capabilities") result = { ...service.capabilities(context), scopes: ["prior:read"], routes: ["GET /health", "GET /v1/capabilities", "GET /v1/circuits/:id", "GET /v1/markets/:marketId", "GET /v1/forecasts/:id", "GET /v1/discovery/markets", "GET /v1/discovery/circuits"], mcp: { resources, tools }, hosted: { mode: "SHANNON_RPC_READ_ONLY", canonicalState: "SHANNON_RPC_READ_VERIFIED_FOR_BOUND_DETAILS", submission: "DISABLED", execution: "DISABLED", persistence: "NONE", listIndexing: "NOT_CONNECTED", evidenceMode: "SHANNON_RPC_READ_ONLY" } };
    else { const c = uri.match(/^prior:\/\/circuit\/(.+)$/), m = uri.match(/^prior:\/\/market\/(.+)$/), f = uri.match(/^prior:\/\/forecast\/(.+)$/); if (c) result = await live.readCircuit(decodeResource(c[1]) as `0x${string}`); else if (m) result = await live.readMarket(decodeResource(m[1]) as `0x${string}`); else if (f) result = await live.readForecast(decodeResource(f[1]) as `0x${string}`); else return rpcError(rid, -32004, "MCP resource not found"); }
    return rpc(rid, { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(result) }] });
  }
  return rpcError(rid, -32601, "MCP method not found");
}

export default { async fetch(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url); const context = auth(request, env);
    if (url.pathname === "/health" && request.method === "GET") return json({ ok: true, service: "prior-agent-readonly", version: "v1", mode: "SHANNON_RPC_READ_ONLY", chainId: 50312 });
    if (url.pathname === "/mcp" && request.method === "POST") return await mcp(request, env, context);
    if (request.method !== "GET") return json({ code: "CAPABILITY_DENIED", message: "only read-only GET routes and the read-only MCP POST endpoint are exposed" }, 403);
    if (url.pathname === "/v1/capabilities") { service.authorize(context, "prior:read"); return json({ ...service.capabilities(context), scopes: ["prior:read"], routes: ["GET /health", "GET /v1/capabilities", "GET /v1/circuits/:id", "GET /v1/markets/:marketId", "GET /v1/forecasts/:id", "GET /v1/discovery/markets", "GET /v1/discovery/circuits", "POST /mcp"], mcp: { resources, tools }, hosted: { mode: "SHANNON_RPC_READ_ONLY", canonicalState: "SHANNON_RPC_READ_VERIFIED_FOR_BOUND_DETAILS", submission: "DISABLED", execution: "DISABLED", persistence: "NONE", listIndexing: "NOT_CONNECTED", evidenceMode: "SHANNON_RPC_READ_ONLY" } }); }
    if (url.pathname === "/v1/discovery/markets") { service.authorize(context, "prior:read"); const limit = Math.min(page(url, "limit", 10), 20); return json(await discoverMarkets(env, limit)); }
    if (url.pathname === "/v1/discovery/circuits") { service.authorize(context, "prior:read"); return json(discoverCircuits()); }
    if (url.pathname === "/v1/markets" || url.pathname === "/v1/circuits") { service.authorize(context, "prior:read"); page(url, "limit", 50); page(url, "offset", 0); return notConnected(url.pathname); }
    const live = new LiveReadAdapter({ rpcUrl: env.SHANNON_RPC_HTTP }); service.authorize(context, "prior:read");
    const marketId = id(url.pathname, "/v1/markets/"); if (marketId) return json(await live.readMarket(marketId as `0x${string}`));
    const circuitId = id(url.pathname, "/v1/circuits/"); if (circuitId) return json(await live.readCircuit(circuitId as `0x${string}`));
    const forecastId = id(url.pathname, "/v1/forecasts/"); if (forecastId) return json(await live.readForecast(forecastId as `0x${string}`));
    return json({ code: "NOT_FOUND", message: "route is not part of the hosted read-only contract" }, 404);
  } catch (error) { const e = error instanceof IntegrationError ? error : liveError(error) ?? new IntegrationError("INTERNAL_ERROR", "request failed", 500); return json({ code: e.code, message: e.message }, e.status); }
} };
