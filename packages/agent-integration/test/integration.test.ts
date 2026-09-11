import { afterEach, describe, expect, it } from "vitest";
import { FIXTURE_MARKET_ID, FIXTURE_PROVIDER_A, createFixtureForecastRequest, createFixtureForecastSubmission, fixtureSignature, materialForSubmission } from "@prior/forecast-protocol";
import { createPriorHttpServer } from "../src/http.js";
import { PriorClient } from "../src/sdk.js";
import { PriorMcpCore } from "../src/mcp.js";

const handles: Awaited<ReturnType<typeof createPriorHttpServer>>[] = [];
afterEach(async () => { while (handles.length) await handles.pop()!.close(); });
const read = { scopes: ["prior:read"] as const };

async function signedPayload(baseUrl: string) {
  const requestResponse = await fetch(`${baseUrl}/v1/forecast-requests/next?providerId=${FIXTURE_PROVIDER_A.provider.providerId}&sessionId=${FIXTURE_PROVIDER_A.sessionId}`, { headers: { "x-prior-scope": "prior:read" } });
  const request = await requestResponse.json();
  const payload = createFixtureForecastSubmission(request, { probabilityUpBps: FIXTURE_PROVIDER_A.probabilityUpBps, generatedAt: "201", validUntil: "400", signature: fixtureSignature(materialForSubmission({ ...request, probabilityUpBps: FIXTURE_PROVIDER_A.probabilityUpBps, generatedAt: "201", validUntil: "400", signatureScheme: "FIXTURE_KECCAK_V1", signature: "0x" })) });
  return payload;
}

describe("Prior integration equivalence and refusal boundaries", () => {
  it("returns the same market state through REST, SDK and MCP", async () => {
    const h = await createPriorHttpServer(); handles.push(h);
    const rest = await (await fetch(`${h.url}/v1/markets/${FIXTURE_MARKET_ID}`, { headers: { "x-prior-scope": "prior:read" } })).json();
    const sdk = await new PriorClient({ baseUrl: h.url, scopes: read.scopes }).getMarket(FIXTURE_MARKET_ID);
    const mcp = await new PriorMcpCore(h.service).callTool("get_market", { marketId: FIXTURE_MARKET_ID }, read);
    expect(sdk).toEqual(rest); expect(mcp).toEqual(rest);
  });
  it("requires scope, rejects malformed MCP input, and refuses arbitrary execution", async () => {
    const h = await createPriorHttpServer(); handles.push(h);
    const denied = await fetch(`${h.url}/v1/markets/${FIXTURE_MARKET_ID}`); expect(denied.status).toBe(403); expect((await denied.json()).code).toBe("SCOPE_REQUIRED");
    const mcp = new PriorMcpCore(h.service); await expect(mcp.callTool("get_market", {}, read)).rejects.toMatchObject({ code: "MALFORMED_INPUT" });
    const execution = await fetch(`${h.url}/v1/execution-requests`, { method: "POST", headers: { "content-type": "application/json", "x-prior-scope": "prior:forecast:submit" }, body: "{}" }); expect(execution.status).toBe(403);
  });
  it("exposes only signed provider submission and preserves replay identity", async () => {
    const h = await createPriorHttpServer(); handles.push(h); const payload = await signedPayload(h.url);
    const first = await fetch(`${h.url}/v1/forecast-submissions`, { method: "POST", headers: { "content-type": "application/json", "x-prior-scope": "prior:forecast:submit" }, body: JSON.stringify(payload) });
    expect(first.status).toBe(200); const accepted = await first.json();
    const replay = await fetch(`${h.url}/v1/forecast-submissions`, { method: "POST", headers: { "content-type": "application/json", "x-prior-scope": "prior:forecast:submit" }, body: JSON.stringify(payload) });
    expect(replay.status).toBe(200); expect(await replay.json()).toEqual(accepted);
    const conflict = createFixtureForecastSubmission(await (await fetch(`${h.url}/v1/forecast-requests/next?providerId=${FIXTURE_PROVIDER_A.provider.providerId}&sessionId=${FIXTURE_PROVIDER_A.sessionId}`, { headers: { "x-prior-scope": "prior:read" } })).json(), { probabilityUpBps: payload.probabilityUpBps + 1, generatedAt: "201", validUntil: "400" });
    const conflicting = await fetch(`${h.url}/v1/forecast-submissions`, { method: "POST", headers: { "content-type": "application/json", "x-prior-scope": "prior:forecast:submit" }, body: JSON.stringify(conflict) });
    expect(conflicting.status).toBe(409);
  });
  it("composes one continuity view for REST, SDK, and MCP", async () => {
    const h = await createPriorHttpServer(); handles.push(h);
    const circuitId = (await h.service.listCircuits(read)).items[0]!.circuitId;
    const marketId = (await h.service.listMarkets(read)).items[0]!.marketId;
    const rest = await (await fetch(`${h.url}/v1/circuits/${circuitId}/iterations/${marketId}`, { headers: { "x-prior-scope": "prior:read" } })).json();
    const mcp = await new PriorMcpCore(h.service).callTool("get_circuit_iteration", { circuitId, marketId }, read);
    expect(rest.source.mode).toBe("ACCEPTED_SNAPSHOT");
    expect(rest.circuit.circuitId).toBe(circuitId);
    expect(rest.iteration.marketId).toBe(marketId);
    expect(rest.iteration.policy.decision).toBe("PENDING");
    expect(mcp).toEqual(rest);
  });
  it("rejects malformed pagination/path input, protects capability resources, and deduplicates fixture identities", async () => {
    const h = await createPriorHttpServer(); handles.push(h);
    const headers = { "x-prior-scope": "prior:read" };
    const nan = await fetch(`${h.url}/v1/markets?limit=NaN&offset=0`, { headers }); expect(nan.status).toBe(400); expect((await nan.json()).code).toBe("MALFORMED_INPUT");
    const emptyOffset = await fetch(`${h.url}/v1/markets?limit=1&offset=`, { headers }); expect(emptyOffset.status).toBe(400);
    const exponent = await fetch(`${h.url}/v1/markets?limit=1e2`, { headers }); expect(exponent.status).toBe(400);
    const unsafe = await fetch(`${h.url}/v1/markets?limit=9007199254740992`, { headers }); expect(unsafe.status).toBe(400);
    await expect(new PriorMcpCore(h.service).readResource("prior://capabilities")).rejects.toMatchObject({ code: "SCOPE_REQUIRED" });
    await expect(new PriorMcpCore(h.service).readResource("prior://market/%E0%A4%A")).rejects.toMatchObject({ code: "MALFORMED_INPUT" });
    const markets = await h.service.listMarkets(read); expect(markets.items).toHaveLength(1); expect(markets.items[0]?.marketId).toBe(FIXTURE_MARKET_ID);
  });
});
