import test from "node:test";
import assert from "node:assert/strict";
import { CircuitControlGateway, ExternalForecastGateway, ReceiptReconciler, ZeroActionExecutionGateway, DreamDexSettlementReader } from "./adapters.js";
import { FIXTURE_PROVIDER_A } from "@prior/forecast-protocol";

const ids = {
  circuitId: `0x${"a".repeat(64)}` as `0x${string}`,
  marketId: `0x${"b".repeat(64)}` as `0x${string}`,
  trialId: `0x${"c".repeat(64)}` as `0x${string}`,
};

test("external forecast gateway uses provider protocol then scoped RFT commit", async () => {
  const calls: string[] = [];
  const gateway = new ExternalForecastGateway({
    provider: {
      getForecastRequest: async () => ({
        protocolVersion: "1", requestId: ids.marketId, provider: FIXTURE_PROVIDER_A.provider,
        sessionId: FIXTURE_PROVIDER_A.sessionId, circuitId: ids.circuitId, marketId: ids.marketId,
        asset: "BTC", intervalSec: 300, opensAt: "1", expiresAt: "9999999999", forecastDeadline: null,
        reference: null, forecaster: FIXTURE_PROVIDER_A.forecaster, forecasterAddress: FIXTURE_PROVIDER_A.forecasterAddress,
        nonce: FIXTURE_PROVIDER_A.nonce,
      }),
      submitForecast: async () => { calls.push("provider-submit"); return { protocolVersion: "1", status: "ACCEPTED", requestId: ids.marketId, provider: FIXTURE_PROVIDER_A.provider, sessionId: FIXTURE_PROVIDER_A.sessionId, submissionId: ids.trialId, idempotencyKey: ids.trialId, circuitId: ids.circuitId, marketId: ids.marketId, forecaster: FIXTURE_PROVIDER_A.forecaster, forecasterAddress: FIXTURE_PROVIDER_A.forecasterAddress, probabilityUpBps: 6200, generatedAt: "1", validUntil: "9999999999", submittedAt: "2", chainCommitment: "NOT_SUBMITTED", signatureScheme: "EIP712_V2", signatureVerification: "EIP712_RECOVERED_PRODUCTION_CRYPTOGRAPHIC_VERIFICATION", transportPrincipal: { transport: "HTTP", principalId: "test" } }; },
    },
    buildSubmission: (request) => ({ protocolVersion: "1", requestId: request.requestId, provider: request.provider, sessionId: request.sessionId, circuitId: request.circuitId, marketId: request.marketId, forecaster: request.forecaster, forecasterAddress: request.forecasterAddress, probabilityUpBps: 6200, generatedAt: "1", validUntil: "9999999999", nonce: request.nonce, sourceType: "AGENT", sourceVersion: "test", signatureScheme: "EIP712_V2", signature: ids.trialId }),
    commit: async () => { calls.push("rft-commit"); return { trialId: ids.trialId }; },
  });
  const result = await gateway.commit({ marketId: ids.marketId, circuitId: ids.circuitId });
  assert.deepEqual(result, { trialId: ids.trialId, pUpBps: 6200 });
  assert.deepEqual(calls, ["provider-submit", "rft-commit"]);
});

test("circuit control exposes bind and advance only, never owner lifecycle controls", async () => {
  const calls: string[] = [];
  const gateway = new CircuitControlGateway({
    bindTrial: async () => { calls.push("bind"); },
    advance: async () => { calls.push("advance"); },
  });
  await gateway.bind(ids.circuitId, ids.marketId, ids.trialId);
  await gateway.advance(ids.circuitId, ids.marketId);
  assert.deepEqual(calls, ["bind", "advance"]);
  assert.equal("create" in gateway, false);
  assert.equal("authorize" in gateway, false);
  assert.equal("activate" in gateway, false);
});

test("zero-action execution is bounded and never submits an order", async () => {
  const gateway = new ZeroActionExecutionGateway();
  assert.deepEqual(await gateway.execute({ kind: "ABSTAIN", reason: "policy" }), { status: "ABSTAINED", reason: "policy" });
  assert.deepEqual(await gateway.execute({ kind: "BUY_UP" }), { status: "NOT_AUTHORIZED" });
});

test("receipt reconciliation fails closed on unknown or malformed state", () => {
  const reconciler = new ReceiptReconciler();
  assert.equal(reconciler.reconcile({ status: "CONFIRMED", txHash: ids.trialId }).status, "CONFIRMED");
  assert.equal(reconciler.reconcile({ status: "UNKNOWN" }).status, "AMBIGUOUS");
  assert.throws(() => reconciler.reconcile({ status: "CONFIRMED" }), /receipt hash/);
});

test("settlement reader requires a DreamDEX read and preserves outcome", async () => {
  const reader = new DreamDexSettlementReader(async () => ({ finalized: true, voided: false, outcome: "UP" as const, source: "dreamdex" as const }));
  assert.deepEqual(await reader.observe(ids.marketId), { terminal: true, outcome: "UP", voided: false, source: "dreamdex" });
  const pending = new DreamDexSettlementReader(async () => ({ finalized: false, voided: false, outcome: null, source: "dreamdex" as const }));
  assert.deepEqual(await pending.observe(ids.marketId), { terminal: false, outcome: null, voided: false, source: "dreamdex" });
});
