import { describe, it, expect } from "vitest";
import { scoreFinalized } from "../src/scoring.js";
import { Outcome, type Bps } from "../src/types.js";

const v: Bps[] = [0, 100, 1000, 5000, 7234, 9000, 10000];

describe("scoreFinalized — RFT Brier math (must match Solidity RFTScoring)", () => {
  for (const p of v) {
    it(`pUp=${p} / UP -> (p-10000)^2 in bps^2`, () => {
      const s = scoreFinalized({
        outcome: Outcome.UP,
        voided: false,
        pUpBps: p,
        reference: { referenceUpBps: 0, referenceValid: false },
      });
      const y = 10000n;
      const expected = (BigInt(p) - y) * (BigInt(p) - y);
      expect(s.forecastBrier).toBe(expected);
      expect(s.marketBrier).toBe(0n);
      expect(s.marketScoreDelta).toBe(expected);
      expect(s.status).toBe(2 /* SCORED */);
      expect(s.outcome).toBe(Outcome.UP);
    });

    it(`pUp=${p} / DOWN -> p^2`, () => {
      const s = scoreFinalized({
        outcome: Outcome.DOWN,
        voided: false,
        pUpBps: p,
        reference: { referenceUpBps: 0, referenceValid: false },
      });
      const y = 0n;
      const expected = BigInt(p) * BigInt(p);
      expect(s.forecastBrier).toBe(expected);
      expect(s.status).toBe(2);
    });
  }

  it("pUp=5000 / either outcome -> 25_000_000", () => {
    const up = scoreFinalized({
      outcome: Outcome.UP,
      voided: false,
      pUpBps: 5000,
      reference: { referenceUpBps: 0, referenceValid: false },
    });
    expect(up.forecastBrier).toBe(25_000_000n);
    const down = scoreFinalized({
      outcome: Outcome.DOWN,
      voided: false,
      pUpBps: 5000,
      reference: { referenceUpBps: 0, referenceValid: false },
    });
    expect(down.forecastBrier).toBe(25_000_000n);
  });

  it("pUp=7234 / UP -> 7_660_036 (matches worked example 72.34% / Up)", () => {
    const s = scoreFinalized({
      outcome: Outcome.UP,
      voided: false,
      pUpBps: 7234,
      reference: { referenceUpBps: 6100, referenceValid: true },
    });
    // (7234 - 10000)^2 = (-2766)^2 = 7650756
    expect(s.forecastBrier).toBe(7_650_756n);
    // market: (6100 - 10000)^2 = (-3900)^2 = 15210000
    expect(s.marketBrier).toBe(15_210_000n);
    // delta = 15210000 - 7650756 = 7559244 (forecast beat market)
    expect(s.marketScoreDelta).toBe(7_559_244n);
  });

  it("voided -> (VOIDED), no scores", () => {
    const s = scoreFinalized({
      outcome: Outcome.NONE,
      voided: true,
      pUpBps: 7234,
      reference: { referenceUpBps: 6100, referenceValid: true },
    });
    expect(s.status).toBe(3 /* VOIDED */);
    expect(s.forecastBrier).toBe(0n);
    expect(s.marketBrier).toBe(0n);
    expect(s.marketScoreDelta).toBe(0n);
  });

  it("missing reference -> (SCORED, marketBrier=0, delta=forecastBrier)", () => {
    const s = scoreFinalized({
      outcome: Outcome.UP,
      voided: false,
      pUpBps: 5000,
      reference: { referenceUpBps: 0, referenceValid: false },
    });
    expect(s.status).toBe(2);
    expect(s.forecastBrier).toBe(25_000_000n);
    expect(s.marketBrier).toBe(0n);
    expect(s.marketScoreDelta).toBe(25_000_000n);
  });

  it("invalid outcome (NONE) for non-voided -> throws", () => {
    expect(() =>
      scoreFinalized({
        outcome: Outcome.NONE,
        voided: false,
        pUpBps: 5000,
        reference: { referenceUpBps: 0, referenceValid: false },
      })
    ).toThrow();
  });
});
