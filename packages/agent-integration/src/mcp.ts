import { PriorApplicationService, IntegrationError, type AuthContext } from "./service.js";

export interface McpTool { readonly name: string; readonly description: string; readonly inputSchema: Record<string, unknown>; readonly readOnly: boolean; }
export const MCP_TOOLS: readonly McpTool[] = Object.freeze([
  { name: "get_capabilities", description: "Discover scoped Prior capabilities; never executes economic actions.", inputSchema: { type: "object", additionalProperties: false }, readOnly: true },
  { name: "get_circuit", description: "Read canonical Circuit authority and current iteration state.", inputSchema: { type: "object", required: ["circuitId"], additionalProperties: false, properties: { circuitId: { type: "string", minLength: 1 } } }, readOnly: true },
  { name: "get_market", description: "Read canonical market identity, lifecycle, and captured reference evidence.", inputSchema: { type: "object", required: ["marketId"], additionalProperties: false, properties: { marketId: { type: "string", minLength: 1 } } }, readOnly: true },
  { name: "get_forecast", description: "Read a request or accepted signed Forecast record.", inputSchema: { type: "object", required: ["forecastId"], additionalProperties: false, properties: { forecastId: { type: "string", minLength: 1 } } }, readOnly: true },
  { name: "get_forecast_request", description: "Read an already scoped Forecast Provider request.", inputSchema: { type: "object", required: ["providerId", "sessionId"], additionalProperties: false, properties: { providerId: { type: "string", minLength: 1 }, sessionId: { type: "string", minLength: 1 } } }, readOnly: true },
  { name: "submit_signed_forecast", description: "Relay an explicit signed Forecast through the existing Provider boundary; this does not commit onchain or execute trades.", inputSchema: { type: "object", required: ["submission"], additionalProperties: false, properties: { submission: { type: "object" } } }, readOnly: false },
]);

export interface McpResource { readonly uri: string; readonly mimeType: "application/json"; readonly description: string; }
export const MCP_RESOURCES: readonly McpResource[] = Object.freeze([
  { uri: "prior://capabilities", mimeType: "application/json", description: "Scoped capability discovery" },
  { uri: "prior://circuit/{circuitId}", mimeType: "application/json", description: "Circuit authority and iteration" },
  { uri: "prior://market/{marketId}", mimeType: "application/json", description: "Market state and reference" },
  { uri: "prior://forecast/{forecastId}", mimeType: "application/json", description: "Forecast request or accepted record" },
]);
function objectArgs(value: unknown): Record<string, unknown> { if (!value || typeof value !== "object" || Array.isArray(value)) throw new IntegrationError("MALFORMED_INPUT", "MCP arguments must be an object", 400); return value as Record<string, unknown>; }
function required(args: Record<string, unknown>, key: string): string { if (typeof args[key] !== "string" || args[key].length === 0) throw new IntegrationError("MALFORMED_INPUT", `${key} is required`, 400); return args[key] as string; }

export class PriorMcpCore {
  public constructor(private readonly service = new PriorApplicationService()) {}
  public listTools(): readonly McpTool[] { return MCP_TOOLS; }
  public listResources(): readonly McpResource[] { return MCP_RESOURCES; }
  public async callTool(name: string, rawArgs: unknown, auth?: AuthContext): Promise<unknown> { const args = objectArgs(rawArgs); switch (name) { case "get_capabilities": this.service.authorize(auth, "prior:read"); return this.service.capabilities(auth); case "get_circuit": return this.service.getCircuit(required(args, "circuitId"), auth); case "get_market": return this.service.getMarket(required(args, "marketId"), auth); case "get_forecast": return this.service.getForecast(required(args, "forecastId"), auth); case "get_forecast_request": return this.service.getForecastRequest(required(args, "providerId"), required(args, "sessionId"), auth); case "submit_signed_forecast": this.service.authorize(auth, "prior:forecast:submit"); return this.service.submitSignedForecast(args.submission, auth); default: throw new IntegrationError("NOT_FOUND", "MCP tool not found", 404); } }
  public async readResource(uri: string, auth?: AuthContext): Promise<unknown> { if (uri === "prior://capabilities") return this.service.capabilities(auth); const circuit = uri.match(/^prior:\/\/circuit\/(.+)$/); if (circuit) return this.service.getCircuit(decodeURIComponent(circuit[1]), auth); const market = uri.match(/^prior:\/\/market\/(.+)$/); if (market) return this.service.getMarket(decodeURIComponent(market[1]), auth); const forecast = uri.match(/^prior:\/\/forecast\/(.+)$/); if (forecast) return this.service.getForecast(decodeURIComponent(forecast[1]), auth); throw new IntegrationError("NOT_FOUND", "MCP resource not found", 404); }
}
