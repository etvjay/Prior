import { afterEach, describe, expect, it } from "vitest";
import {
  FIXTURE_PROVIDER_A,
  FIXTURE_PROVIDER_B,
  createFixtureForecastSubmission,
  createFixtureForecastRequest,
  fixtureSignature,
  parseForecastSubmissionAcceptedWire,
  parseForecastRequestWire,
  type ForecastSignMaterial,
} from "@prior/forecast-protocol";
import { createForecastProviderServer } from "../src/server.js";

const servers: Awaited<ReturnType<typeof createForecastProviderServer>>[] = [];

afterEach(async () => {
  while (servers.length > 0) await servers.pop()!.close();
});

async function postFixture(baseUrl: string, profile: typeof FIXTURE_PROVIDER_A) {
  const requestResponse = await fetch(`${baseUrl}/v1/forecast-requests/next?providerId=${profile.provider.providerId}&sessionId=${profile.sessionId}`);
  expect(requestResponse.status).toBe(200);
  const request = parseForecastRequestWire(await requestResponse.json());
  const material: ForecastSignMaterial = {
    protocolVersion: request.protocolVersion,
    marketId: request.marketId,
    circuitId: request.circuitId,
    forecaster: request.forecaster,
    probabilityUpBps: profile.probabilityUpBps,
    generatedAt: "201",
    validUntil: "400",
    nonce: request.nonce,
  };
  const submission = createFixtureForecastSubmission(request, {
    probabilityUpBps: material.probabilityUpBps,
    generatedAt: material.generatedAt,
    validUntil: material.validUntil,
    signature: fixtureSignature(material),
  });
  const submissionResponse = await fetch(`${baseUrl}/v1/forecast-submissions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(submission),
  });
  expect(submissionResponse.status).toBe(200);
  const accepted = parseForecastSubmissionAcceptedWire(await submissionResponse.json());
  return { request, submission, accepted };
}

describe("Layer-3 Forecast provider HTTP adapter", () => {
  it("attributes provider A and provider B through the same core validation path", async () => {
    const server = await createForecastProviderServer({ port: 0 });
    servers.push(server);
    const a = await postFixture(server.url, FIXTURE_PROVIDER_A);
    const b = await postFixture(server.url, FIXTURE_PROVIDER_B);

    expect(a.accepted.provider.providerId).toBe(FIXTURE_PROVIDER_A.provider.providerId);
    expect(b.accepted.provider.providerId).toBe(FIXTURE_PROVIDER_B.provider.providerId);
    expect(a.accepted.forecasterAddress).toBe(FIXTURE_PROVIDER_A.forecasterAddress);
    expect(b.accepted.forecasterAddress).toBe(FIXTURE_PROVIDER_B.forecasterAddress);
    expect(a.accepted.transportPrincipal.principalId).not.toBe(b.accepted.transportPrincipal.principalId);
    expect(a.accepted.chainCommitment).toBe("NOT_SUBMITTED");
  });

  it("returns the exact accepted record on HTTP replay and readback", async () => {
    const server = await createForecastProviderServer({ port: 0 });
    servers.push(server);
    const first = await postFixture(server.url, FIXTURE_PROVIDER_A);
    const replay = await fetch(`${server.url}/v1/forecast-submissions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(first.submission),
    });
    expect(replay.status).toBe(200);
    const replayBody = parseForecastSubmissionAcceptedWire(await replay.json());
    expect(replayBody).toEqual(first.accepted);

    const readback = await fetch(`${server.url}/v1/forecast-submissions/${first.accepted.submissionId}`);
    expect(readback.status).toBe(200);
    expect(parseForecastSubmissionAcceptedWire(await readback.json())).toEqual(first.accepted);
  });

  it("rejects a tampered signature-domain payload", async () => {
    const server = await createForecastProviderServer({ port: 0 });
    servers.push(server);
    const first = await postFixture(server.url, FIXTURE_PROVIDER_A);
    const tampered = { ...first.submission, probabilityUpBps: first.submission.probabilityUpBps + 1 };
    const response = await fetch(`${server.url}/v1/forecast-submissions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(tampered),
    });
    expect(response.status).toBe(422);
    expect((await response.json()).code).toBe("SIGNATURE_DOMAIN_MISMATCH");
  });

  it("rejects the fixture scheme when live mode is enabled", async () => {
    const server = await createForecastProviderServer({ port: 0, liveMode: true });
    servers.push(server);
    const requestResponse = await fetch(`${server.url}/v1/forecast-requests/next?providerId=${FIXTURE_PROVIDER_A.provider.providerId}&sessionId=${FIXTURE_PROVIDER_A.sessionId}`);
    const request = parseForecastRequestWire(await requestResponse.json());
    const material: ForecastSignMaterial = {
      protocolVersion: request.protocolVersion,
      marketId: request.marketId,
      circuitId: request.circuitId,
      forecaster: request.forecaster,
      probabilityUpBps: FIXTURE_PROVIDER_A.probabilityUpBps,
      generatedAt: "201",
      validUntil: "400",
      nonce: request.nonce,
    };
    const submission = createFixtureForecastSubmission(request, {
      probabilityUpBps: material.probabilityUpBps,
      generatedAt: material.generatedAt,
      validUntil: material.validUntil,
      signature: fixtureSignature(material),
    });
    const response = await fetch(`${server.url}/v1/forecast-submissions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(submission),
    });
    expect(response.status).toBe(422);
    expect((await response.json()).code).toBe("LIVE_REQUIRES_EIP712");
  });

  it("rejects an explicit execution request with no execution authority", async () => {
    const server = await createForecastProviderServer({ port: 0 });
    servers.push(server);
    const request = createFixtureForecastRequest(FIXTURE_PROVIDER_A);
    const response = await fetch(`${server.url}/v1/execution-requests`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ protocolVersion: "1", requestId: request.requestId, marketId: request.marketId, actionId: `0x${"e".repeat(64)}` }),
    });
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.status).toBe("REJECTED_AUTHORITY");
    expect(body.reasonCode).toBe("REJECTED_AUTHORITY");
    expect(body.executionAuthority).toBe(false);
  });
});
