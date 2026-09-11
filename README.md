# PRIOR

> **Prior turns agent judgment into scoped, durable, inspectable evidence.**

PRIOR is a decision-authority protocol for agents and traders operating on prediction and event markets.

A forecast should not automatically become permission to spend money.

PRIOR separates:

```text
belief → evidence → authority → execution
```

and keeps these distinct:

```text
belief ≠ authority
authority ≠ execution
execution ≠ outcome
outcome ≠ reputation
```

## The primitives

### Forecast

An attributable statement of judgment made before the relevant outcome is known.

### RFT — Resolved Forecast Trial

An immutable Forecast trial that records who made a judgment, what probability they assigned, which market it concerned, and how that judgment performed after canonical resolution.

### Circuit

A persistent, bounded mandate defining whose Forecasts are trusted, which markets are in scope, when the intent is active, what actions are allowed, what budget exists, and how each iteration progresses.

> **RFT measures judgment. Circuit assigns bounded consequence to that judgment.**

## How it works

```text
Agent Forecast
      ↓
RFT records attributable judgment
      ↓
Circuit binds the relevant authority
      ↓
Allowed consequence or deliberate refusal
      ↓
DreamDEX canonically resolves the market
      ↓
RFT records score and evidence
```

The DreamDEX build is the first proving environment. It demonstrates that an external agent can contribute attributable judgment without receiving custody or unrestricted economic authority.

## Live V2 hero proof

Open the web proof route at `/proof` or read the canonical artifact:

`evidence/m4-3-live-zero-action-lifecycle.json`

- Network: Somnia Shannon, chain ID `50312`.
- Circuit: `0x6cdfdf64cc70b5bb2e6519ab1dc0372e3ed7fdfb6d16a0ca0043f7aea4f23437`.
- Market: `0x0000000000000000000000000000000000000000000000000000000000018e83` — BTC 1h.
- Trial/RFT: `0x9d0ce9d1542b3dc1261e4cf73a1f18b24b9fa61e3dec72b7407823156b954f66`.
- Forecaster: `0x233FE0d8D75e15b668b94eFD0e6DE50A8e50D364`.
- Belief: `pUpBps=5000` — 50.00% UP.
- Binding: `bound=true`.
- Authority: `allowedActionsBitmap=0`; budget and execution authority were zero.
- Consequence: `BUY_UP` and `BUY_DOWN` both returned `ActionNotAllowed`.
- Outcome: canonical DreamDEX settlement `DOWN`.
- RFT: `SCORED`; Forecast Brier `25000000`.
- Final state: Circuit `COMPLETE`; iteration `processed=true`; `completed=1`; `abstained=1`.
- Market-reference Brier and delta: unavailable because `referenceValid=false`.

This proves attributable judgment and bounded consequence. It does not claim forecasting competence or autonomous trading.

## Historical V1 continuity

Supporting evidence is recorded separately in `evidence/shannon/circuit-continuity-recovery.json`:

> One unchanged V1 Circuit intent was advanced across two real Bitcoin markets, with one attributable RFT per market and both judgments subsequently scored.

Circuit `0x15e18e2aecb7d00ca3243181fb2fa38af81b021266e2d0a290eb0c55d2b5f4c1` advanced across markets `0x…14d04` and `0x…14d96`. Both decisions were `ABSTAIN`; no orders were placed.

V1 continuity must not be read as V2 canonical iteration binding, V2 `allowedActionsBitmap` enforcement, or V2 duplicate-prevention semantics.

## Agent interface

Public hosted read surface:

- HTTP: `https://prior-agent-readonly.microcosm.workers.dev`
- MCP JSON-RPC: `https://prior-agent-readonly.microcosm.workers.dev/mcp`
- Quickstart: `docs/AGENT_QUICKSTART.md`

The surface uses bounded bearer authentication and exposes live Shannon detail reads plus bounded discovery. No bearer token belongs in source, documentation, screenshots, or videos.

## Current capability boundary

### PROVEN

- live V2 Circuit/RFT lifecycle evidence;
- historical V1 two-market continuity evidence;
- canonical Shannon detail reads;
- public authenticated HTTP reads;
- remote read-only MCP transport;
- bounded recent market discovery;
- bounded verified Circuit discovery;
- RFT/Circuit proof visualization.

### DISABLED OR DEFERRED

- hosted Forecast submission and relay;
- Circuit creation and authority writes through the public surface;
- economic execution and order placement;
- complete global market/Circuit indexing;
- durable multi-agent sessions and replay state;
- production identity federation;
- production signer custody.

## Verify independently

- Evidence matrix: `docs/SUBMISSION_EVIDENCE_MATRIX.md`.
- Judge proof matrix: `docs/JUDGE_PROOF_MATRIX.md`.
- Claim freeze: `docs/SUBMISSION_CLAIMS.md`.
- Demo script: `docs/DEMO_SCRIPT.md`.
- Architecture: `docs/PRIOR_ARCHITECTURE.md`.
- Deployment references: `docs/SUBMISSION_REFERENCES.md`.
- Public agent quickstart: `docs/AGENT_QUICKSTART.md`.

## Contract addresses

- RFTRegistry: `0x5b1B51cB062B7B782c9EC2Bd5674eFAdb5308F41`.
- CircuitRegistryV2: `0x1eD3B2310F369977ef82569498d5F678f8B73104`.
- CircuitExecutorV2: `0x6e6Bf80Dc412f4DFCb59C15494C83785d54fb66d`.
- BinaryMarketsModule: `0x3ecC694Cef705358864a646142ac17A90E29e388`.
- BinarySettlement: `0xbF4a49e0Dfd092e5FBE8E5761064C49533e6Ed23`.
- OperatorPermissionsRegistry: `0x15C7e8CE38F021c5b45d098AaD788f63090bF20A`.

## Verification commands

```bash
pnpm --filter @prior/agent-integration test
pnpm --filter @prior/web typecheck
pnpm --filter @prior/web test
pnpm --filter @prior/web check:ui
pnpm --filter @prior/web build
pnpm build:contracts
forge test --root contracts
```

## Why it matters

Prior lets a user bring any agent and give it a mandate, not a wallet. Trust can be allocated from attributable judgment and bounded consequence—not from an agent’s unsupported claim about what it predicted or what it was allowed to do.
