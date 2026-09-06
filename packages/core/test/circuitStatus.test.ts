import { describe, expect, it } from "vitest";
import { effectiveCircuitStatus } from "../src/circuitStatus.js";
import { CircuitStatus } from "../src/types.js";

describe("effective Circuit status", () => {
  it("derives EXPIRED from stored ACTIVE after immutable expiry", () => {
    expect(effectiveCircuitStatus(CircuitStatus.ACTIVE, 100n, 100n)).toBe(CircuitStatus.EXPIRED);
    expect(effectiveCircuitStatus(CircuitStatus.ACTIVE, 100n, 101n)).toBe(CircuitStatus.EXPIRED);
  });
  it("does not rewrite terminal COMPLETE or REVOKED", () => {
    expect(effectiveCircuitStatus(CircuitStatus.COMPLETE, 100n, 101n)).toBe(CircuitStatus.COMPLETE);
    expect(effectiveCircuitStatus(CircuitStatus.REVOKED, 100n, 101n)).toBe(CircuitStatus.REVOKED);
  });
  it("preserves active state before expiry", () => {
    expect(effectiveCircuitStatus(CircuitStatus.ACTIVE, 100n, 99n)).toBe(CircuitStatus.ACTIVE);
  });
  it("preserves explicit paused and stopped states after expiry", () => {
    expect(effectiveCircuitStatus(CircuitStatus.PAUSED, 100n, 101n)).toBe(CircuitStatus.PAUSED);
    expect(effectiveCircuitStatus(CircuitStatus.STOPPED, 100n, 101n)).toBe(CircuitStatus.STOPPED);
  });
});
