import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FIXTURE_PROVIDER_A,
  createFixtureForecastRequest,
  type ForecastProviderClient,
  type ForecastSubmissionWire,
  type ForecastSubmissionAcceptedWire,
  type UnauthorizedExecutionResponseWire,
} from "@prior/forecast-protocol";
import { DeterministicFixtureStrategy } from "../src/strategy.js";
import { FixtureForecastSigner } from "../src/signer.js";
import { runExternalForecastAgent } from "../src/runtime.js";

const request = createFixtureForecastRequest(FIXTURE_PROVIDER_A);
const accepted: ForecastSubmissionAcceptedWire = {
  protocolVersion: "1",
  status: "ACCEPTED",
  requestId: request.requestId,
  provider: request.provider,
  sessionId: request.sessionId,
  submissionId: `0x${"c".repeat(64)}`,
  idempotencyKey: `0x${"d".repeat(64)}`,
  circuitId: request.circuitId,
  marketId: request.marketId,
  forecaster: request.forecaster,
  forecasterAddress: request.forecasterAddress,
  probabilityUpBps: 6_200,
  generatedAt: "201",
  validUntil: "400",
  submittedAt: "260",
  chainCommitment: "NOT_SUBMITTED",
  signatureScheme: "FIXTURE_KECCAK_V1",
  signatureVerification: "FIXTURE_RECOMPUTED_NOT_PRODUCTION_CRYPTOGRAPHIC_VERIFICATION",
  transportPrincipal: { transport: "HTTP", principalId: "fixture-provider:A" },
};

class InMemoryBoundaryClient implements ForecastProviderClient {
  public readonly provider = FIXTURE_PROVIDER_A.provider;
  public readonly request = request;
  public readonly submissions: ForecastSubmissionWire[] = [];
  public readonly executionAttempts: string[] = [];

  public async getForecastRequest(): Promise<typeof request> {
    return this.request;
  }

  public async submitForecast(submission: ForecastSubmissionWire): Promise<ForecastSubmissionAcceptedWire> {
    this.submissions.push(submission);
    return accepted;
  }

  public async getForecastSubmission(): Promise<ForecastSubmissionAcceptedWire> {
    return accepted;
  }

  public async requestExecution(): Promise<UnauthorizedExecutionResponseWire> {
    this.executionAttempts.push("attempted");
    return {
      protocolVersion: "1",
      status: "REJECTED_AUTHORITY",
      reasonCode: "REJECTED_AUTHORITY",
      executionAuthority: false,
      requestId: request.requestId,
      marketId: request.marketId,
      message: "Forecast Provider has no execution authority",
    };
  }
}

describe("first-party external Forecast agent composition", () => {
  it("keeps client, vendor-neutral strategy, and signer as separate ports", async () => {
    const client = new InMemoryBoundaryClient();
    const strategy = new DeterministicFixtureStrategy({ probabilityUpBps: 6_200 });
    const signer = new FixtureForecastSigner({ forecasterAddress: request.forecasterAddress });

    const result = await runExternalForecastAgent(client, strategy, signer);

    expect(result.strategy.classification).toBe("INTEGRATION_FIXTURE");
    expect(result.strategy.sourceVersion).toBe("INTEGRATION_FIXTURE/v1");
    expect(result.signer.signatureScheme).toBe("FIXTURE_KECCAK_V1");
    expect(result.signer.productionCryptographicVerification).toBe(false);
    expect(client.submissions).toHaveLength(2);
    expect(result.replay.submissionId).toBe(result.acceptance.submissionId);
    expect(result.readback).toEqual(result.acceptance);
    expect(result.unauthorizedExecution.status).toBe("REJECTED_AUTHORITY");
    expect(result.unauthorizedExecution.executionAuthority).toBe(false);
  });

  it("keeps the external agent process free of internal core imports", () => {
    for (const file of ["client.ts", "runtime.ts", "signer.ts", "strategy.ts", "main.ts"]) {
      const source = readFileSync(resolve(process.cwd(), "src", file), "utf8");
      expect(source).not.toMatch(/(?:from|import)\s*[^;]*@prior\/core/);
    }
  });
});
