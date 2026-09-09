# System Wholeness Audit — Prior

Date: 2026-09-07
Reviewed HEAD: `6f2885ece0c4e48d88813b1cc82fd9d5aaacab8f`
Scope: repository/runtime coherence audit using the supplied System Wholeness & Integration Skill.

## Evidence ceiling

This audit establishes repository-local composition, test/build status, documented boundaries, and current external integration classifications. It does not establish a new live market, autonomous live execution, production daemon reliability, browser E2E, or DreamDEX completeness.

## Actual implementation graph

```text
Accepted Shannon evidence JSON
  ├─> Next.js evidence surfaces (`apps/web/app/evidence.ts`)
  │     ├─> landing / live / history / forecast / circuit / profile routes
  │     └─> local forecast state machine and wallet-oriented UI controls
  ├─> local core domain
  │     ├─> mandate / policy / scoring / fixed-point units
  │     └─> guided execution proposal builder
  ├─> Forecast protocol
  │     ├─> wire validation and identity binding
  │     └─> fixture and EIP-712 signer paths
  ├─> Forecast provider server
  │     └─> HTTP server; fixture/live-mode boundary; no chain commit
  ├─> DreamDEX adapter
  │     ├─> indexer discovery
  │     ├─> direct onchain market binding
  │     └─> typed order-book quote helpers
  ├─> Runner
  │     ├─> checkpoint persistence/reload
  │     ├─> direct chain reconciliation
  │     └─> read-only HTTP health/ready/runtime/iterations endpoints
  └─> Shannon V2 infrastructure
        ├─> CircuitRegistryV2
        └─> CircuitExecutorV2
```

## Wholeness invariants

| Invariant | Result | Evidence / limitation |
|---|---|---|
| Flow continuity | PARTIAL | Local domain and protocol paths compose; live Circuit-to-Runner-to-chain execution is not composed. |
| Identity continuity | PASS locally / PARTIAL live | `marketId`, `circuitId`, `trialId`, and `executionId` are represented in code and evidence; no single live receipt traverses every stage. |
| State continuity | PARTIAL | Core/UI trial states are explicit; the web accepted-evidence surface and Runner have separate state views. |
| Authority continuity | PASS for bounded paths | Guided proposals are owner-authorized; V2 executor has zero-action tests; no autonomous authority is claimed. |
| Truth continuity | PARTIAL | README and proof index disclose evidence limits; `/live` is a static accepted-evidence surface rather than a live market monitor. |

## Gap matrix

| ID | Layer | Current behavior | Expected behavior | Severity | Status |
|---|---|---|---|---|---|
| WG-P0-001 | Runner ↔ canonical workflow | Runner only reconciles chain state and exposes read-only HTTP endpoints; it never creates/recover iterations, obtains/relays Forecasts, evaluates policy, submits execution, finalizes RFTs, or advances Circuits (`apps/runner/src/index.ts:17-44`). | The Runner spec requires the complete bounded liveness loop (`docs/RUNNER_SPEC.md:36-71`). | P0 | OPEN / not fixed; autonomous external execution remains separately blocked. |
| WG-P0-002 | Runner ↔ persistence/recovery | `RunnerCheckpoint` has persistence primitives, but production Runner never calls `put()` or `persist()`; checkpoint loading occurs only during `/ready` (`apps/runner/src/checkpoint.ts:18-45`, `apps/runner/src/index.ts:17-21`). | Production Runner must persist and reconstruct iteration state across restart, with chain/RFT/DreamDEX reconciliation. | P0 | OPEN / not fixed. |
| WG-P1-001 | Web ↔ runtime | `/live` reads `ACCEPTED_FORECASTS` from checked-in Shannon evidence. It does not consume `pnpm prior:live-gate`, Runner `/ready`, or live RPC state. | A user-facing live surface should expose the same current state as the canonical live-gate/runtime, or be clearly separated as Demo/Evidence. | P1 | OPEN — current labels say `ACCEPTED RESOLVED EVIDENCE`. |
| WG-P1-002 | Persistence | `RunnerCheckpoint.load()` inserts parsed records without schema validation, transition validation, or normalization of serialized bigint strings. | Persisted state must be validated before exposure and invalid/stale records must fail closed. | P1 | OPEN. |
| WG-P1-003 | Adapter domain mapping | `DreamDexAdapter.classify()` defaults unknown asset/cadence combinations to BTC 15m (`packages/dreamdex/src/index.ts:214-222`). | Unknown market identity must be rejected or represented as unknown, never silently mapped to an authorized class. | P1 | OPEN. |
| WG-P1-004 | External execution | DreamDEX adapter/guided execution has no composed writer, receipt observer, settlement reader, or RFT finalization path. | A complete live execution workflow requires an explicitly authorized and externally proven composition. | P1 | BLOCKED_EXTERNAL / intentionally not fixed. |
| WG-P2-001 | Public interfaces | No custom REST or MCP surface exists. | REST/MCP would be needed only for a later third-party/agent integration target. | P2 | NOT A GAP for current MVP; explicitly excluded by `docs/BACKEND_ARCHITECTURE.md:63-124`. |
| WG-P2-002 | External provider | External Forecast live path remains separate from fixture evidence and is guarded by live-mode signer checks. | External execution should be classified separately from local/fixture proof. | P2 | PASS as classification; live external proof remains unavailable. |
| WG-P2-003 | Documentation | README describes completed historical guided lifecycle and clearly states autonomous execution and production reliability are not proven. | Narrative must remain below evidence ceiling. | P2 | PASS with limitation disclosure. |

## End-to-end case coverage

- Success: LOCAL/SYSTEM-PARTIAL — guided lifecycle and protocol tests pass; the production Runner does not execute the full live Circuit workflow.
- Refusal: PASS locally — authority-denied and zero-action V2 tests exist; fixture provider unauthorized execution is rejected.
- Dependency failure: PARTIAL — provider/live-gate blocked states exist; no single full workflow receipt crosses every boundary.
- Ambiguous consequence: PARTIAL — checkpoint/recovery evidence exists for Prior orchestration; production Runner persistence and live external exactly-once semantics remain unproven.

## Cross-surface review

- Web routes: present, buildable, and evidence-backed.
- REST routes: none.
- MCP routes: none.
- SDK/domain boundary: DreamDEX adapter and core packages are present.
- Runner HTTP surface: `/health`, `/ready`, `/runtime`, `/iterations`; read-only.
- Transport equivalence: not applicable to REST/MCP because those surfaces are explicitly not required; direct service and fixture protocol tests pass independently.

## Verification run

- `pnpm test`: PASS — 67 core tests.
- `pnpm test:forecast`: PASS — 6 protocol, 5 agent, 7 provider-server tests.
- `pnpm typecheck:forecast`: PASS.
- `(cd contracts && forge test && forge build)`: PASS — 28 contract tests, build pass; compiler warnings only.
- `pnpm build:web`: PASS — Next.js production build, 7 generated routes.
- Latest authorized live-gate observation: `DISCOVERY_INCOMPLETE` at block `483803674`, with `101` deduplicated discoveries, `59` successful direct reads, `10` currently Trading/structurally compatible markets, `0` proof-eligible markets, and no writes/funding/broadcasts.

## Verdict

`REQUEST_CHANGES` for the whole-system product claim: P0 gaps remain in the production Runner workflow and persistence composition.

The bounded MVP evidence claim remains valid: local core/provider/contract tests pass, live V2 infrastructure is verified, discovery now reports its bounded coverage honestly, and no authority boundary was expanded.

The initial audit did not modify contracts, Forecast protocol, signer implementation, or authority semantics. The separately authorized M4.3.2D follow-up changed only live-gate discovery and eligibility reporting, and its final evidence is recorded above.
