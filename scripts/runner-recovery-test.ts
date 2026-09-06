import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { RunnerCheckpoint } from "../apps/runner/src/checkpoint.js";

async function main() {
  const dir = await mkdtemp(join(tmpdir(), "prior-runner-"));
  const file = join(dir, "checkpoint.json");
  const circuitId = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const marketId = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
  const base = { circuitId, marketId, updatedAt: 1n } as const;
  try {
    const first = new RunnerCheckpoint(file);
    first.put({ ...base, status: "WAITING_FOR_MARKET" });
    first.put({ ...base, status: "MARKET_FOUND", updatedAt: 2n });
    first.put({ ...base, status: "WAITING_FOR_FORECAST", updatedAt: 3n });
    await first.persist();
    const restarted = new RunnerCheckpoint(file);
    await restarted.load();
    assert.equal(restarted.all().length, 1);
    assert.equal(restarted.get(circuitId, marketId)?.status, "WAITING_FOR_FORECAST");
    assert.equal(restarted.get(circuitId.toUpperCase(), marketId.toUpperCase())?.status, "WAITING_FOR_FORECAST");
    assert.throws(() => restarted.put({ ...base, status: "EXECUTING", updatedAt: 4n }), /illegal iteration transition/);
    restarted.put({ ...base, status: "FORECAST_COMMITTING", updatedAt: 4n });
    assert.equal(restarted.all().length, 1);
    console.log(JSON.stringify({ restart: "PASS", recovered: 1, canonicalKey: `${circuitId}:${marketId}`, duplicates: "NONE", illegalTransition: "REJECTED" }));
  } finally { await rm(dir, { recursive: true, force: true }); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
