import { afterEach, describe, expect, it } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import {
  EIP712_SIGNATURE_SCHEME,
  FIXTURE_PROVIDER_A,
  createFixtureForecastRequest,
  eip712TypedDataForSubmission,
  parseForecastRequestWire,
  parseForecastSubmissionAcceptedWire,
  type FixtureProviderProfile,
  type ForecastRequestWire,
  type ForecastSubmissionSignMaterial,
  type ForecastSubmissionWire,
} from "@prior/forecast-protocol";
import { createForecastProviderServer } from "../src/server.js";

// Disposable test-only identity. It is never used by runtime/demo code.
const TEST_FORECASTER_PRIVATE_KEY = `0x${"00".repeat(31)}01` as `0x${string}`;
const TEST_FORECASTER_ADDRESS = "0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf" as `0x${string}`;
const TEST_PROFILE: FixtureProviderProfile = Object.freeze({
  ...FIXTURE_PROVIDER_A,
  forecasterAddress: TEST_FORECASTER_ADDRESS,
});

const servers: Awaited<ReturnType<typeof createForecastProviderServer>>[] = [];

afterEach(async () => {
  while (servers.length > 0) await servers.pop()!.close();
});

async function signedSubmission(request: ForecastRequestWire): Promise<ForecastSubmissionWire> {
  const material: ForecastSubmissionSignMaterial = {
    protocolVersion: request.protocolVersion,
    requestId: request.requestId,
    marketId: request.marketId,
    circuitId: request.circuitId,
    forecaster: request.forecaster,
    forecasterAddress: request.forecasterAddress,
    probabilityUpBps: 6_200,
    generatedAt: "201",
    validUntil: "400",
    nonce: request.nonce,
    sourceType: "AGENT",
    sourceVersion: "INTEGRATION_FIXTURE/v1",
  };
  const signature = await privateKeyToAccount(TEST_FORECASTER_PRIVATE_KEY).signTypedData(eip712TypedDataForSubmission(material));
  return {
    protocolVersion: request.protocolVersion,
    requestId: request.requestId,
    provider: request.provider,
    sessionId: request.sessionId,
    circuitId: request.circuitId,
    marketId: request.marketId,
    forecaster: request.forecaster,
    forecasterAddress: request.forecasterAddress,
    probabilityUpBps: material.probabilityUpBps,
    generatedAt: material.generatedAt,
    validUntil: material.validUntil,
    nonce: request.nonce,
    sourceType: material.sourceType,
    sourceVersion: material.sourceVersion,
    signatureScheme: EIP712_SIGNATURE_SCHEME,
    signature,
  };
}

async function post(baseUrl: string, submission: ForecastSubmissionWire): Promise<Response> {
  return fetch(`${baseUrl}/v1/forecast-submissions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(submission),
  });
}

describe("Layer-3 EIP-712 Forecast provider verification", () => {
  it("recovers and accepts the expected disposable forecaster address", async () => {
    const server = await createForecastProviderServer({ port: 0, profiles: [TEST_PROFILE] });
    servers.push(server);
    const requestResponse = await fetch(
      `${server.url}/v1/forecast-requests/next?providerId=${TEST_PROFILE.provider.providerId}&sessionId=${TEST_PROFILE.sessionId}`,
    );
    const request = parseForecastRequestWire(await requestResponse.json());
    const submission = await signedSubmission(request);

    const response = await post(server.url, submission);
    expect(response.status).toBe(200);
    const accepted = parseForecastSubmissionAcceptedWire(await response.json());
    expect(accepted.signatureScheme).toBe("EIP712_V2");
    expect(accepted.signatureVerification).toBe("EIP712_RECOVERED_PRODUCTION_CRYPTOGRAPHIC_VERIFICATION");
    expect(accepted.forecasterAddress.toLowerCase()).toBe(TEST_FORECASTER_ADDRESS.toLowerCase());

    const replay = await post(server.url, submission);
    expect(parseForecastSubmissionAcceptedWire(await replay.json())).toEqual(accepted);
    const readback = await fetch(`${server.url}/v1/forecast-submissions/${accepted.submissionId}`);
    expect(parseForecastSubmissionAcceptedWire(await readback.json())).toEqual(accepted);
  });

  it("rejects tampering with every EIP-712-bound submission field", async () => {
    const server = await createForecastProviderServer({ port: 0, profiles: [TEST_PROFILE] });
    servers.push(server);
    const request = createFixtureForecastRequest(TEST_PROFILE);
    const submission = await signedSubmission(request);
    const mutations: readonly [string, unknown][] = [
      ["protocolVersion", "2"],
      ["requestId", `0x${"61".repeat(32)}`],
      ["marketId", `0x${"62".repeat(32)}`],
      ["circuitId", `0x${"63".repeat(32)}`],
      ["forecaster", `0x${"64".repeat(32)}`],
      ["forecasterAddress", "0x1111111111111111111111111111111111111111"],
      ["probabilityUpBps", 6_201],
      ["generatedAt", "202"],
      ["validUntil", "399"],
      ["nonce", `0x${"65".repeat(32)}`],
      ["sourceType", "MODEL"],
      ["sourceVersion", "TAMPERED/v1"],
    ];

    for (const [field, value] of mutations) {
      const response = await post(server.url, { ...submission, [field]: value } as ForecastSubmissionWire);
      expect(response.status, field).not.toBe(200);
    }
  });
});
