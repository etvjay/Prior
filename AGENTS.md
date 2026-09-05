# AGENTS.md — RFT Agent Governance

Every coding/review agent must read this file and the canonical documents before changing the repository.

## Required reading order

1. `docs/GROUND_TRUTH.md`
2. `docs/CANONICAL_STATE.md`
3. `docs/ONESHOT_BUILD_INPUTS.md`
4. the spec governing the slice being changed
5. `docs/INVARIANTS.md`
6. `skills/EXECUTION_SKILL.md`
7. the relevant review skills

## Non-negotiable rules

- Do not invent DreamDEX ABI shapes, addresses, SDK methods, market states, or settlement semantics.
- Prefer current primary Somnia/DreamDEX documentation and live Shannon evidence.
- `marketId` is the canonical DreamDEX market identity. Never use pool address as durable market identity.
- A forecast must be immutable once committed.
- The frontend must never be authoritative for forecast timing, DreamDEX resolution, or market-reference values when those can be read onchain.
- Trading is optional and must remain separate from forecast scoring.
- Do not introduce custody into the RFT registry.
- Do not create a custom oracle.
- Do not call a probability differential “edge” before resolution.
- Do not score voided markets.
- Do not hide failed transactions behind optimistic UI.
- Do not build new protocol layers simply because they could exist.
- Do not implement an API, SDK, MCP server, database, indexer, token, or agent marketplace unless its requirement is explicit in canonical state or a decision record.

## Change discipline

Every material implementation change must state:

1. requirement being satisfied;
2. invariant(s) touched;
3. external dependency assumptions;
4. tests added/changed;
5. evidence produced;
6. documents updated.

## Drift rule

If implementation contradicts a canonical document, stop and log the conflict in `docs/CONTRADICTIONS.md`. Do not silently reinterpret the spec.
## Circuit rules

- A Circuit is execution-centric persistent intent, not merely a timeline.
- Never introduce autonomous execution without a documented authority boundary.
- Runner code may provide liveness but may not become canonical truth.
- Every Runner write must be retry-safe/idempotent.
- No unrestricted owner private key may be stored in the Runner.
- Circuit budget, per-market limits, allowed actions, stop conditions and revocation must be enforceable outside the UI.
- Every Circuit market iteration must map to at most one canonical RFT and at most one economic execution.
- Missed markets remain visible.

## UI implementation

Before changing user-facing UI, read:

- `docs/UI_ONESHOT_SPEC.md`
- `docs/DESIGN.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/FRONTEND_STATE_MACHINE.md`
- `skills/DESIGN_REVIEW_SKILL.md`

## Motion implementation

Before implementing scroll, route, text, state, or object motion, read:

- `docs/MOTION_SYSTEM.md`
- `skills/MOTION_REVIEW_SKILL.md`

## Frozen visual implementation

Before implementing any user-facing surface, read:

- `docs/VISUAL_LANGUAGE.md`
- `docs/SCREEN_GEOMETRY.md`
- `docs/UI_ONESHOT_SPEC.md`
- `docs/MOTION_SYSTEM.md`

Generated images are reference-only and may not override these files.
