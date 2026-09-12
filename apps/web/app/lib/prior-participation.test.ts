import assert from "node:assert/strict";
import test from "node:test";
import {
  instantiatePublicTemplate,
  transitionForecastCommit,
  transitionCircuitCreation,
  type ForecastCommitState,
  type CircuitCreationState,
} from "./prior-participation";

test("public participation instantiates a participant-specific forecast-only Circuit", () => {
  const intent = instantiatePublicTemplate({ marketClass: 1, targetWindows: 4 }, "0x123400000000000000000000000000000000abcd");
  assert.equal(intent.owner, "0x123400000000000000000000000000000000abcd");
  assert.equal(intent.forecaster, intent.owner);
  assert.equal(intent.allowedActionsBitmap, 0n);
  assert.equal(intent.executionMode, "FORECAST_ONLY");
  assert.equal(intent.capitalRequired, false);
  assert.ok(intent.maxPerMarket > 0n);
  assert.ok(intent.totalBudget >= intent.maxPerMarket);
});

test("public participation rejects invalid participant identity and configuration", () => {
  assert.throws(() => instantiatePublicTemplate({ marketClass: 5, targetWindows: 4 }, "not-an-address"), /INVALID_PARTICIPANT_ADDRESS/);
  assert.throws(() => instantiatePublicTemplate({ marketClass: 5, targetWindows: 0 }, "0x123400000000000000000000000000000000abcd"), /INVALID_TARGET_WINDOWS/);
  assert.throws(() => instantiatePublicTemplate({ marketClass: 300, targetWindows: 4 }, "0x123400000000000000000000000000000000abcd"), /INVALID_MARKET_CLASS/);
});

test("invalid receipt events do not skip Forecast commitment phases", () => {
  const state: ForecastCommitState = { phase: "UNCOMMITTED", error: null, hash: null, rftId: null };
  assert.equal(transitionForecastCommit(state, { type: "RECEIPT_SUCCESS" }).phase, "UNCOMMITTED");
  assert.equal(transitionForecastCommit(state, { type: "READBACK_MATCH", rftId: "0xrft" }).phase, "UNCOMMITTED");
});

test("Forecast commitment requires receipt success and canonical RFT readback", () => {
  let state: ForecastCommitState = { phase: "UNCOMMITTED", error: null, hash: null, rftId: null };
  state = transitionForecastCommit(state, { type: "SIGN" });
  state = transitionForecastCommit(state, { type: "SIGNED" });
  state = transitionForecastCommit(state, { type: "SUBMITTED", hash: "0xabc" });
  state = transitionForecastCommit(state, { type: "RECEIPT_SUCCESS" });
  assert.equal(state.phase, "CANONICAL_READBACK");
  state = transitionForecastCommit(state, { type: "READBACK_MATCH", rftId: "0xrft" });
  assert.equal(state.phase, "COMMITTED");
  assert.equal(state.rftId, "0xrft");
});

test("readback mismatch fails closed instead of reporting committed", () => {
  const state: ForecastCommitState = { phase: "CANONICAL_READBACK", error: null, hash: "0xabc", rftId: null };
  const next = transitionForecastCommit(state, { type: "READBACK_MISMATCH" });
  assert.equal(next.phase, "FAILED");
  assert.equal(next.error, "READBACK_MISMATCH");
});

test("Circuit creation is not created before receipt and canonical readback", () => {
  let state: CircuitCreationState = { phase: "DRAFT", error: null, hash: null, circuitId: null };
  for (const event of [{ type: "REVIEW" }, { type: "APPROVE" }, { type: "SUBMITTED", hash: "0xcreate" }, { type: "RECEIPT_SUCCESS" }] as const) state = transitionCircuitCreation(state, event);
  assert.equal(state.phase, "CANONICAL_READBACK");
  state = transitionCircuitCreation(state, { type: "READBACK_MATCH", circuitId: "0xcircuit" });
  assert.equal(state.phase, "CREATED");
});
