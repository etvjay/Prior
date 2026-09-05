# Canonical State

## Current phase
`M0 READ PASS / M0 WRITE BLOCKED / RFT + CIRCUIT + UI IN PROGRESS`

## Verified implementation
- M0 ABI / market / operator-registry read evidence captured against live Shannon at 2026-09-05.
- Live market discovery works (BTC/ETH 1m and 5m windows, status=Trading).
- All required `placeBinaryOrderFor` / `setOperatorApprovalForPool` / `isApprovedForPool` selectors
  verified inside the deployed bytecode of `binaryPoolImpl` and the OperatorRegistry implementation.
- See `evidence/shannon/m0-environment.json`, `m0-sdk-exports.json`, `m0-binary-abi.json`,
  `m0-market-discovery.json`, `m0-market-14934.json`, `m0-market-schema.json`,
  `m0-indexer-schema.json`, `m0-opregistry-impl-code.hex`, `m0-binary-impl-code.hex`.

## Implemented in this session
- Repository bootstrap (monorepo per `ONESHOT_BUILD_INPUTS.md` §18).
- Pinned `@somnia-chain/markets-sdk@0.29.0` + matching `viem` installed via pnpm.
- `scripts/m0-sdk-exports.ts` and the ad-hoc live M0 probes that produced the evidence above.
- `docs/CANONICAL_STATE.md`, `docs/EVIDENCE_LEDGER.md`, `docs/ASSUMPTIONS.md`,
  `docs/CONTRADICTIONS.md` updated to reflect this session's verified reads and remaining blockers.

## Not yet verified
- `setOperatorApprovalForPool(owner, CircuitExecutor, [0x718c2d4d], true)` against the live pool — **BLOCKED**: no `PRIOR_OWNER_PRIVATE_KEY`.
- Tiny IOC binary order placed through `CircuitExecutor` with `userData = canonical tradeTag` — **BLOCKED**.
- Allowance of the pool to pull `testUsdc` from owner — **BLOCKED**.
- RFT contract deployment, commit, finalize — **BLOCKED**.
- Multi-market Circuit live proof — **BLOCKED**.
- Frontend live read of a real committed RFT — **BLOCKED**.

## Next gate
**M0 write evidence.** Resumes the moment a disposable Shannon-testnet-only
`PRIOR_OWNER_PRIVATE_KEY` is provided with STT gas.

The implementation agent is not authorized to invent this key. All non-key-dependent
slices (RFT, Circuit, Runner, frontend, design, tests, deployment scripts) are being
built in parallel so the moment a key is provided, M0 writes and Phase 5–7 can complete
end-to-end against the live testnet.

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
Choose and verify (after M0 write):
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

This session's M0 read additionally proves, against live bytecode on Shannon:
```text
binaryPoolImpl (0x48e523c9f22f98548d263f0aD444D732e5202C0E) contains:
  - placeBinaryOrderFor (0x718c2d4d)  payable
  - placeBinaryOrder   (0x5d97c566)  payable
OperatorPermissionsRegistry proxy 0x15C7e8CE38F021c5b45d098AaD788f63090bF20A
  - EIP-1967 implementation 0x9707acee9c39fea71564a1b0c840f97f784c22f7
  - contains setOperatorApprovalForPool (0x7bbc67e6)
  - contains setOperatorApprovalGlobal (0x7f1e31ce)
Live BTC 5m market 0x14934 binaryPool is a BeaconProxy that delegates
  via binaryPoolBeacon 0x85C01B5ef4F4ed59caC69749565e309f01b14Dbc
  to the canonical binaryPoolImpl.
```

## One-shot preflight
`docs/ONESHOT_BUILD_INPUTS.md` defines the complete operational handoff required for a
coding agent to bootstrap, verify M0, execute live Shannon writes, build RFT/Circuit/Runner/UI,
run reviews, and produce evidence.

The canonical M0 read gate has been satisfied. The M0 write gate is blocked on
`PRIOR_OWNER_PRIVATE_KEY`.

## UI one-shot contract
`docs/UI_ONESHOT_SPEC.md` freezes the page hierarchy, visual tokens, landing scroll
narrative, Forecast interaction, commit choreography, Circuit creation/live execution
views, History/Profile behavior, mobile rules, component inventory, motion tokens,
error/loading rules, and UI test/review gates.

## Motion system
`docs/MOTION_SYSTEM.md` freezes text motion, landing scroll choreography, object continuity,
route motion, Forecast commitment motion, dense-mode drift, order-book behavior, Circuit
execution choreography, History/Profile transitions, mobile motion, reduced-motion
behavior, and performance/accessibility constraints.

## Visual language frozen
Prior's implementation visual language is now frozen in:
```text
docs/VISUAL_LANGUAGE.md
docs/SCREEN_GEOMETRY.md
```
This includes exact colors, typography, spacing, radii, borders, icon system, probability-
node geometry, chart language, sound/haptic rules, /live geometry, Circuit geometry,
expanded Circuit analysis, landing keyframes, and mobile reflow.
