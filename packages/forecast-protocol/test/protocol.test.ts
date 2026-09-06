import { describe, expect, it } from "vitest";
import {
  FIXTURE_PROVIDER_A,
  FIXTURE_PROVIDER_B,
  createFixtureForecastRequest,
  createFixtureForecastSubmission,
  canonicalSignMaterial,
  fixtureSignature,
  parseForecastRequestWire,
  parseForecastSubmissionWire,
  type ForecastSignMaterial,
} from "../src/index.js";

const request = createFixtureForecastRequest(FIXTURE_PROVIDER_A);
const material: ForecastSignMaterial = {
  protocolVersion: request.protocolVersion,
  marketId: request.marketId,
  circuitId: request.circuitId,
  forecaster: request.forecaster,
  probabilityUpBps: 6_200,
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

describe("Forecast Provider Protocol v1 wire boundary", () => {
  it("parses a complete request and preserves decimal timestamp strings", () => {
    const parsed = parseForecastRequestWire(JSON.parse(JSON.stringify(request)));

    expect(parsed).toEqual(request);
    expect(typeof parsed.opensAt).toBe("string");
    expect(typeof parsed.expiresAt).toBe("string");
    expect(parsed.marketId).toBe(request.marketId);
  });

  it("rejects a request identity that is not bound to the request tuple", () => {
    expect(() => parseForecastRequestWire({ ...request, marketId: `0x${"9".repeat(64)}` })).toThrow(
      /requestId|identity/i,
    );
  });

  it("parses a signed submission and rejects forbidden JSON shapes", () => {
    expect(parseForecastSubmissionWire(JSON.parse(JSON.stringify(submission)))).toEqual(submission);
    expect(() => parseForecastSubmissionWire({ ...submission, probabilityUpBps: 10_001 })).toThrow(/bps/i);
    expect(() => parseForecastSubmissionWire({ ...submission, generatedAt: 201 })).toThrow(/string|timestamp/i);
    expect(() => parseForecastSubmissionWire({ ...submission, reasoning: "must not cross the wire" })).toThrow(
      /unknown|field/i,
    );
  });

  it("binds protocol, market, circuit, signer, probability, timestamps, and nonce", () => {
    const baseline = fixtureSignature(material);

    for (const [field, value] of [
      ["probabilityUpBps", 6_201],
      ["generatedAt", "202"],
      ["validUntil", "399"],
      ["nonce", `0x${"8".repeat(64)}`],
      ["marketId", `0x${"9".repeat(64)}`],
      ["circuitId", `0x${"a".repeat(64)}`],
      ["forecaster", `0x${"b".repeat(64)}`],
      ["protocolVersion", "2"],
    ] as const) {
      const mutated = { ...material, [field]: value } as ForecastSignMaterial;
      if (field === "protocolVersion") {
        expect(() => fixtureSignature(mutated), field).toThrow(/protocol/i);
      } else {
        expect(fixtureSignature(mutated), field).not.toBe(baseline);
      }
    }

    expect(canonicalSignMaterial(material)).toContain('"probabilityUpBps":6200');
    expect(canonicalSignMaterial(material)).not.toContain("reasoning");
  });

  it("keeps fixture provider identities independent while sharing the wire schema", () => {
    const second = createFixtureForecastRequest(FIXTURE_PROVIDER_B);
    expect(second.provider.providerId).not.toBe(request.provider.providerId);
    expect(second.protocolVersion).toBe(request.protocolVersion);
    expect(parseForecastRequestWire(second).provider.providerId).toBe(second.provider.providerId);
  });
});
