# Canonical State

## Current phase

`PRE-M0 / V0.2 RE-BASELINED`

## Verified implementation

None yet.

## Implemented

Documentation/control-plane only. Prior v0.2 is re-baselined around single Forecasts/RFTs plus execution-centric Circuits with a Runner and bounded authority model.

## Not yet verified

- exact pinned `@somnia-chain/markets-sdk` version;
- Shannon SDK construction;
- live Event Contract discovery;
- ABI return shapes;
- marketId → current pool read;
- same-transaction top-of-book reference;
- settlement/outcome read;
- `userData` trade-tag propagation;
- tiny Shannon IOC order;
- RFT deployment.

## Next gate

**M0 — Integration truth**

Required outputs:

```text
scripts/discover-markets.ts
scripts/inspect-market.ts
scripts/snapshot-book.ts
scripts/inspect-abi.ts
scripts/inspect-resolution.ts
scripts/smoke-trade.ts (last)
evidence/shannon/m0-*.json
```

No production UI implementation should be accepted before M0 establishes external integration truth.

## Newly canonical in v0.2

```text
Prior = sole public product name
Forecast = public atomic belief action
RFT = internal atomic evidence primitive
Circuit = persistent execution intent across markets
Runner = liveness runtime
Circuit authority = bounded/revocable
belief trajectory = derived Circuit view, not Circuit definition
```

## New architectural gates after M0

### M1-A — RFT contracts

Prove atomic Forecast/RFT.

### M1-B — Authority feasibility

Choose and verify:

```text
scoped session/delegation
or
bounded executor/escrow
or
guided fallback
```

### M1-C — Circuit policy

Pure deterministic policy + invariants.

### M2 — Runner

Prove restart/reconciliation/idempotency.

### M3 — Live multi-market Circuit

At least two consecutive real DreamDEX markets under one unchanged Circuit intent.

## Primary-source verified authority findings

Current DreamDEX/Somnia Markets documentation establishes:

```text
Binary Event Contracts use BinaryPool specialized placement.
Generic placeOrder/placeOrderFor revert on binary pools.
Binary ABI includes placeBinaryOrderFor.
DreamDEX operator registry supports selector-scoped and per-pool approval.
Operator orders remain owner-scoped in the shared order-book model.
Somnia native session transactions are separate session accounts, not delegated owner authority.
```

Still unverified live:

```text
exact binary placement selector
binary pool operator auth behavior on Shannon
binary collateral auto-pull through CircuitExecutor
pool-set preauthorization strategy
```

Target architecture:

```text
Runner → CircuitExecutor → BinaryPool.placeBinaryOrderFor(owner,...)
```

## One-shot preflight

`docs/ONESHOT_BUILD_INPUTS.md` now defines the complete operational handoff required for a coding agent to bootstrap, verify M0, execute live Shannon writes, build RFT/Circuit/Runner/UI, run reviews, and produce evidence.

No real secrets are stored in repository documentation.

## UI one-shot contract

`docs/UI_ONESHOT_SPEC.md` now freezes the page hierarchy, visual tokens, landing scroll narrative, Forecast interaction, commit choreography, Circuit creation/live execution views, History/Profile behavior, mobile rules, component inventory, motion tokens, error/loading rules, and UI test/review gates.

## Motion system

`docs/MOTION_SYSTEM.md` now freezes text motion, landing scroll choreography, object continuity, route motion, Forecast commitment motion, dense-mode drift, order-book behavior, Circuit execution choreography, History/Profile transitions, mobile motion, reduced-motion behavior, and performance/accessibility constraints.

## Visual language frozen

Prior's implementation visual language is now frozen in:

```text
docs/VISUAL_LANGUAGE.md
docs/SCREEN_GEOMETRY.md
```

This includes exact colors, typography, spacing, radii, borders, icon system, probability-node geometry, chart language, sound/haptic rules, `/live` geometry, Circuit geometry, expanded Circuit analysis, landing keyframes, and mobile reflow.
