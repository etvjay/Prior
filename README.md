# PRIOR

> Commit what you believe before reality resolves it, then carry fixed decision rules across changing Event Contracts.

PRIOR is a forecasting and persistent-intent prototype built on Somnia Shannon and DreamDEX binary Event Contracts.

## What it does

- **Forecast** — an immutable belief committed before a market resolves.
- **RFT** — a Resolved Forecast Trial that compares the Forecast with the market reference and canonical DreamDEX outcome.
- **Circuit** — a fixed, multi-window intent that evaluates changing Event Contracts without mutating its rules.
- **Guided execution** — the Circuit computes the exact bounded action first; the owner authorizes that exact proposal. This is not discretionary manual trading.

## Why it is different

Prediction markets preserve market outcomes. PRIOR preserves the full decision record:

```text
belief → market reference → policy decision → execution/abstention → outcome → score
```

That makes Forecast quality, policy behavior, and PnL inspectable separately.

## Live proof

- Market #1: one losing guided DreamDEX position completed the full lifecycle: Forecast, policy, owner authorization, order, fill, resolution, redemption, and RFT scoring.
- Circuit continuity: one unchanged Circuit processed two real BTC 5m markets. Both Forecasts were committed before resolution; both deterministic policy decisions were ABSTAIN; both RFTs are scored.
- Runner recovery: the continuity records are keyed by `circuitId × marketId`; restart evidence shows no duplicate Forecast, proposal, or order effects.

## Architecture

```text
DreamDEX Event Contract
        ↓ typed market/book reads
Forecast → RFT commit → CircuitPolicy
                           ↓
                 ABSTAIN or exact proposal
                           ↓
                    owner authorization
                           ↓
                DreamDEX order/fill/resolution
                           ↓
                    redemption → RFT score
```

## DreamDEX integration

Event Contracts use `@somnia-chain/markets-sdk@0.29.0` on Shannon (`50312`). Market identity is `marketId`; pool addresses may recycle. Onchain market status outranks indexed status. Prices and quantities use fixed-point raw units:

```text
CollateralRaw = PriceRaw × QuantityRaw / UnitScaleRaw
```

The autonomous `placeBinaryOrderFor` path remains `BLOCKED_EXTERNAL` by DreamDEX `OnlyApprovedContracts()` and is not used in the demo.

## Run locally

```bash
pnpm install
packages/core/node_modules/.bin/vitest run
packages/core/node_modules/.bin/tsc -p packages/core/tsconfig.json --noEmit
(cd contracts && forge build && forge test)
(cd apps/web && node_modules/.bin/next build)
```

See [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md), [`docs/PROOF_INDEX.md`](docs/PROOF_INDEX.md), and [`docs/JUDGING_MAP.md`](docs/JUDGING_MAP.md).

## Evidence

Machine-readable Shannon evidence is in [`evidence/shannon/`](evidence/shannon/):

- [`market1-lifecycle.json`](evidence/shannon/market1-lifecycle.json)
- [`circuit-continuity-recovery.json`](evidence/shannon/circuit-continuity-recovery.json)

## Limitations

Proven: guided economic lifecycle, fixed-point accounting, two-market Circuit continuity, deterministic abstention, scored RFTs, and restart/recovery evidence.

Not proven: autonomous Circuit execution, production-safe autonomous executor security, DreamDEX-level exactly-once semantics, production daemon reliability, or browser E2E in the constrained environment. Guided duplicate safety is **Prior-orchestrated**, not a DreamDEX protocol guarantee.

Primary sources: [`docs/SOURCES.md`](docs/SOURCES.md).
