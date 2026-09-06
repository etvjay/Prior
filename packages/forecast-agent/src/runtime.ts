import {
  assertSubmissionMatchesRequest,
  sameProviderIdentity,
  type ForecastRequestWire,
  type ForecastSignMaterial,
  type ForecastSubmissionAcceptedWire,
  type ForecastSubmissionWire,
  type UnauthorizedExecutionResponseWire,
} from "@prior/forecast-protocol";
import type { ForecastProviderClient } from "./client.js";
import type { ForecastSigner, ForecastSignerResult } from "./signer.js";
import type { ForecastStrategy, ForecastStrategyOutput } from "./strategy.js";

export interface ForecastAgentRunResult {
  readonly request: ForecastRequestWire;
  readonly strategy: ForecastStrategyOutput;
  readonly signer: Pick<ForecastSignerResult, "forecasterAddress" | "signatureScheme" | "label" | "productionCryptographicVerification">;
  readonly submission: ForecastSubmissionWire;
  readonly acceptance: ForecastSubmissionAcceptedWire;
  readonly replay: ForecastSubmissionAcceptedWire;
  readonly readback: ForecastSubmissionAcceptedWire;
  readonly unauthorizedExecution: UnauthorizedExecutionResponseWire;
}

export async function runExternalForecastAgent(
  client: ForecastProviderClient,
  strategy: ForecastStrategy,
  signer: ForecastSigner,
): Promise<ForecastAgentRunResult> {
  const request = await client.getForecastRequest();
  if (!sameProviderIdentity(request.provider, client.provider)) {
    throw new Error("Forecast request provider identity does not match the configured client");
  }

  const strategyOutput = await strategy.forecast(request);
  const signMaterial: ForecastSignMaterial = {
    protocolVersion: request.protocolVersion,
    marketId: request.marketId,
    circuitId: request.circuitId,
    forecaster: request.forecaster,
    probabilityUpBps: strategyOutput.probabilityUpBps,
    generatedAt: strategyOutput.generatedAt,
    validUntil: strategyOutput.validUntil,
    nonce: request.nonce,
  };
  const signerOutput = await signer.sign(signMaterial);
  if (signerOutput.forecasterAddress.toLowerCase() !== request.forecasterAddress.toLowerCase()) {
    throw new Error("Forecast signer address does not match the requested forecaster address");
  }

  const submission: ForecastSubmissionWire = Object.freeze({
    protocolVersion: request.protocolVersion,
    requestId: request.requestId,
    provider: request.provider,
    sessionId: request.sessionId,
    circuitId: request.circuitId,
    marketId: request.marketId,
    forecaster: request.forecaster,
    forecasterAddress: signerOutput.forecasterAddress,
    probabilityUpBps: strategyOutput.probabilityUpBps,
    generatedAt: strategyOutput.generatedAt,
    validUntil: strategyOutput.validUntil,
    nonce: request.nonce,
    sourceType: strategyOutput.sourceType,
    sourceVersion: strategyOutput.sourceVersion,
    signatureScheme: signerOutput.signatureScheme,
    signature: signerOutput.signature,
  });
  assertSubmissionMatchesRequest(request, submission);

  const acceptance = await client.submitForecast(submission);
  const replay = await client.submitForecast(submission);
  const readback = await client.getForecastSubmission(acceptance.submissionId);
  const unauthorizedExecution = await client.requestExecution({
    requestId: request.requestId,
    marketId: request.marketId,
    actionId: `0x${"e".repeat(64)}`,
  });

  return Object.freeze({
    request,
    strategy: strategyOutput,
    signer: {
      forecasterAddress: signerOutput.forecasterAddress,
      signatureScheme: signerOutput.signatureScheme,
      label: signerOutput.label,
      productionCryptographicVerification: signerOutput.productionCryptographicVerification,
    },
    submission,
    acceptance,
    replay,
    readback,
    unauthorizedExecution,
  });
}
