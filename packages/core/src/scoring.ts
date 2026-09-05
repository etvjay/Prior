/**
 * Prior core — deterministic scoring.
 *
 * Mirrors contracts/libraries/RFTScoring.sol exactly.
 * INV-013: independent implementations given canonical inputs produce identical
 * integer scores. We test parity in tests/integration/scoring-parity.test.ts.
 *
 * Canonical:
 *   forecastBrier = (pUpBps - outcomeBps)^2         in bps^2
 *   marketBrier   = (referenceUpBps - outcomeBps)^2 in bps^2, if reference valid
 *   marketScoreDelta = marketBrier - forecastBrier
 *   Positive delta = forecaster beat market baseline on this trial.
 *
 * A voided market produces (VOIDED) and no score.
 * A missing reference produces (forecastBrier, 0, forecastBrier) — the
 * market-relative comparison is unavailable but the forecaster's own
 * calibration is preserved.
 */

import { type Bps, Outcome, TrialStatus, outcomeToBps, type MarketReference } from "./types.js";

export interface ScoreResult {
  readonly status: TrialStatus;
  readonly outcome: Outcome;
  readonly forecastBrier: bigint;
  readonly marketBrier: bigint;
  readonly marketScoreDelta: bigint;
}

export function scoreFinalized(args: {
  outcome: Outcome;
  voided: boolean;
  pUpBps: Bps;
  reference: MarketReference;
}): ScoreResult {
  if (args.voided) {
    return {
      status: TrialStatus.VOIDED,
      outcome: Outcome.NONE,
      forecastBrier: 0n,
      marketBrier: 0n,
      marketScoreDelta: 0n,
    };
  }
  if (args.outcome !== Outcome.UP && args.outcome !== Outcome.DOWN) {
    throw new Error(`finalize: outcome must be UP or DOWN for non-voided markets, got ${args.outcome}`);
  }
  const y = BigInt(outcomeToBps(args.outcome));
  const p = BigInt(args.pUpBps);
  const forecastBrier = (p - y) * (p - y);

  let marketBrier = 0n;
  let delta = forecastBrier; // market-relative unavailable -> delta = 0 - forecastBrier
  if (args.reference.referenceValid) {
    const q = BigInt(args.reference.referenceUpBps);
    marketBrier = (q - y) * (q - y);
    delta = marketBrier - forecastBrier;
  }
  return {
    status: TrialStatus.SCORED,
    outcome: args.outcome,
    forecastBrier,
    marketBrier,
    marketScoreDelta: delta,
  };
}
