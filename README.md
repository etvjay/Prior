# Resolved Forecast Trials — Repository Control Plane

This package is the canonical documentation and agent-governance layer for the Resolved Forecast Trials (RFT) project.

## Product decomposition

- **Forecast Arena** — the first user-facing product.
- **Resolved Forecast Trial (RFT)** — the primitive.
- **DreamDEX Event Contracts** — market, order-book, execution and resolution substrate.
- **Somnia** — execution and persistence substrate.
- **Forecast Evidence Set (future)** — aggregation primitive over many RFTs.

## Canonical precedence

When two documents conflict, follow this order:

1. `docs/GROUND_TRUTH.md`
2. `docs/SYSTEM_DEFINITION.md`
3. `docs/PRODUCT_SPEC.md`
4. `docs/PROTOCOL_SPEC.md`
5. `docs/CIRCUIT_SPEC.md`
6. `docs/AUTHORITY_DECISION.md`
7. `docs/AUTHORITY_MODEL.md`
8. `docs/EXECUTION_POLICY.md`
9. `docs/RUNNER_SPEC.md`
10. `docs/INVARIANTS.md`
11. `docs/DREAMDEX_INTEGRATION.md`
12. `docs/SOMNIA_INTEGRATION.md`
13. `docs/INTERFACE_SURFACES.md`
14. `docs/DESIGN.md`
15. `docs/DESIGN_SYSTEM.md`
16. `docs/FRONTEND_STATE_MACHINE.md`
17. `docs/BACKEND_ARCHITECTURE.md`
18. `docs/TEST_SPEC.md`
19. `docs/DECISIONS.md`
20. `docs/ASSUMPTIONS.md`
21. `docs/CONTRADICTIONS.md`
22. `docs/CANONICAL_STATE.md`
23. `docs/EVIDENCE_LEDGER.md`

The skills in `/skills` govern how agents execute and review work; they do not override product ground truth.

## Operational entry point

Before a one-shot build or live Shannon run, read:

`docs/ONESHOT_BUILD_INPUTS.md`

It lists secrets, endpoints, SDKs, required funds, dynamic state, evidence outputs, build phases, and review gates. For UI implementation, `docs/UI_ONESHOT_SPEC.md` is the page-by-page interaction contract, `docs/VISUAL_LANGUAGE.md` and `docs/SCREEN_GEOMETRY.md` freeze the visual implementation, and `docs/MOTION_SYSTEM.md` is the canonical motion/choreography contract. These are operational guidance and do not override canonical ground truth.

## Core build loop

```text
external truth
    ↓
bounded design
    ↓
implementation
    ↓
tests
    ↓
live evidence
    ↓
review
    ↓
canonical state update
```

No feature is considered implemented because it exists in a mock, static UI, README, screenshot, or local-only code path.

## Current implementation

This repository contains the current Prior implementation slices:

- `packages/core`: shared types, deterministic Brier scoring, executable-price Circuit policy, and trade-tag packing.
- `packages/dreamdex`: pinned `@somnia-chain/markets-sdk@0.29.0` adapter, Shannon discovery, canonical `marketId → pool` binding reads, and SDK executable-book quoting.
- `contracts`: `RFTRegistry`, `CircuitRegistry`, `CircuitExecutor`, `DreamDexAdapter`, and deterministic Foundry tests.
- `apps/runner`: restart-safe-oriented liveness skeleton with `/health`, `/ready`, and `/runtime`; no owner key custody.
- `apps/web`: Prior landing, Live, Forecast, Circuits, Circuit, History, and Profile routes with the frozen dark evidence-instrument visual system.
- `evidence/shannon`: machine-readable M0 read evidence from live Shannon.

### Evidence boundary

M0 read-only integration is verified against Shannon chain `50312`, including the exact pinned SDK, live Event Contract discovery, the specialized `placeBinaryOrderFor` selector (`0x5d97c566`), and selector-scoped per-pool operator-registry bytecode. M0 write evidence, deployment, and live multi-market execution remain blocked until a disposable Shannon-only `PRIOR_OWNER_PRIVATE_KEY` with STT is supplied. No mock or local result is presented as live proof.
