import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { URL } from "node:url";
import { IntegrationError, PriorApplicationService, type AuthContext } from "./service.js";

export interface PriorHttpOptions { readonly host?: string; readonly port?: number; readonly service?: PriorApplicationService; }
export interface PriorHttpHandle { readonly url: string; readonly server: Server; readonly service: PriorApplicationService; close(): Promise<void>; }

function auth(request: IncomingMessage): AuthContext { const raw = request.headers["x-prior-scope"]; const scopes = typeof raw === "string" ? raw.split(",").map((s) => s.trim()).filter(Boolean) : []; return { scopes, principalId: typeof request.headers["x-prior-principal"] === "string" ? request.headers["x-prior-principal"] : undefined }; }
function send(response: ServerResponse, status: number, body: unknown): void { response.statusCode = status; response.setHeader("content-type", "application/json; charset=utf-8"); response.end(JSON.stringify(body)); }
async function readBody(request: IncomingMessage): Promise<unknown> { const chunks: Buffer[] = []; let size = 0; for await (const chunk of request) { const b = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk); size += b.length; if (size > 1_000_000) throw new IntegrationError("PAYLOAD_TOO_LARGE", "payload exceeds 1 MiB", 413); chunks.push(b); } try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new IntegrationError("MALFORMED_INPUT", "request body must be JSON", 400); } }
function routeId(pathname: string, prefix: string): string | undefined { if (!pathname.startsWith(prefix)) return undefined; try { return decodeURIComponent(pathname.slice(prefix.length)); } catch { throw new IntegrationError("MALFORMED_INPUT", "path identifier is not valid percent-encoding", 400); } }
function pageParam(url: URL, name: "limit" | "offset", fallback: number): number { const raw = url.searchParams.get(name); if (raw === null) return fallback; if (!/^(0|[1-9][0-9]*)$/.test(raw)) throw new IntegrationError("MALFORMED_INPUT", `${name} must be a finite integer in canonical decimal form`, 400); const value = Number(raw); if (!Number.isSafeInteger(value)) throw new IntegrationError("MALFORMED_INPUT", `${name} is outside the safe integer range`, 400); return value; }

export async function createPriorHttpServer(options: PriorHttpOptions = {}): Promise<PriorHttpHandle> {
  const service = options.service ?? new PriorApplicationService(); const host = options.host ?? "127.0.0.1"; const port = options.port ?? 0;
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", `http://${host}`); const context = auth(request);
      if (request.method === "GET" && url.pathname === "/health") return send(response, 200, { ok: true, service: "prior-agent-integration", version: "v1" });
      if (request.method === "GET" && url.pathname === "/v1/capabilities") return send(response, 200, service.capabilities(context));
      if (request.method === "GET" && url.pathname === "/v1/circuits") return send(response, 200, service.listCircuits(context, pageParam(url, "limit", 50), pageParam(url, "offset", 0)));
      const circuitId = routeId(url.pathname, "/v1/circuits/"); if (request.method === "GET" && circuitId) return send(response, 200, service.getCircuit(circuitId, context));
      if (request.method === "GET" && url.pathname === "/v1/markets") return send(response, 200, service.listMarkets(context, pageParam(url, "limit", 50), pageParam(url, "offset", 0)));
      const marketId = routeId(url.pathname, "/v1/markets/"); if (request.method === "GET" && marketId) return send(response, 200, service.getMarket(marketId, context));
      const forecastId = routeId(url.pathname, "/v1/forecasts/"); if (request.method === "GET" && forecastId) return send(response, 200, service.getForecast(forecastId, context));
      if (request.method === "GET" && url.pathname === "/v1/forecast-requests/next") return send(response, 200, service.getForecastRequest(url.searchParams.get("providerId") ?? "", url.searchParams.get("sessionId") ?? "", context));
      if (request.method === "POST" && url.pathname === "/v1/forecast-submissions") return send(response, 200, service.submitSignedForecast(await readBody(request), context));
      if (request.method === "POST" && url.pathname === "/v1/execution-requests") { service.authorize(context, "prior:forecast:submit"); service.refuseExecution(); }
      return send(response, 404, { code: "NOT_FOUND", message: "route is not part of the v1 Prior integration contract" });
    } catch (error) { const e = error instanceof IntegrationError ? error : new IntegrationError("INTERNAL_ERROR", "request failed", 500); return send(response, e.status, { code: e.code, message: e.message }); }
  });
  await new Promise<void>((resolve) => server.listen(port, host, resolve)); const address = server.address(); const actual = typeof address === "object" && address ? address.port : port;
  return { url: `http://${host}:${actual}`, server, service, close: () => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())) };
}
