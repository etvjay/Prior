import test from "node:test";
import assert from "node:assert/strict";
import { RunnerCheckpoint } from "./checkpoint.js";
import { buildRunnerWorkflow } from "./index.js";

const circuitId = `0x${"a".repeat(64)}` as `0x${string}`;
const marketId = `0x${"b".repeat(64)}` as `0x${string}`;

test("runner composition uses concrete read adapters and typed external boundary", async () => {
  const provider = {
    getForecastRequest: async () => ({ marketId, circuitId }),
    submitForecast: async () => { throw new Error("must not submit without injected signer"); },
  } as any;
  const workflow = buildRunnerWorkflow({
    checkpoint: new RunnerCheckpoint("/tmp/prior-composition-test.json"),
    provider,
    circuit: { loadActive: async () => ({ circuitId, status: "ACTIVE" }) },
    markets: { discover: async () => ({ marketId, lifecycle: "Trading" }) },
  });

  const result = await workflow.runOnce();
  assert.deepEqual(result, { kind: "BLOCKED", reason: "BLOCKED_EXTERNAL" });
});
