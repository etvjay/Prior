import { describe, expect, it } from "vitest";
import { allocateUnusedLocalhostPort, FORK_PROCESS_START_FAILED, FORK_IDENTITY_MISMATCH, verifyForkIdentity, ForkIsolationError } from "../src/anvil-adapter.js";

describe("M4.3.5A-R2 fork process isolation", () => {
  it("allocates a port that is actually unused and releases the reservation", async () => {
    const allocation = await allocateUnusedLocalhostPort();
    expect(allocation.port).toBeGreaterThan(0);
    expect(allocation.release).toBeTypeOf("function");
    await allocation.release();
  });

  it("exposes typed isolation failure codes", () => {
    expect(FORK_PROCESS_START_FAILED).toBe("FORK_PROCESS_START_FAILED");
    expect(FORK_IDENTITY_MISMATCH).toBe("FORK_IDENTITY_MISMATCH");
  });

  it("rejects stale responder A when requested block B is checked", () => {
    const blockA = { number: 483966016n, hash: "0xaaa", timestamp: 1788940000n };
    const blockB = { number: 483991834n, hash: "0xbbb", timestamp: 1788972402n };
    expect(() => verifyForkIdentity(blockB, blockA, 50312n)).toThrowError(ForkIsolationError);
    try { verifyForkIdentity(blockB, blockA, 50312n); } catch (error) { expect((error as ForkIsolationError).code).toBe(FORK_IDENTITY_MISMATCH); }
  });
});
