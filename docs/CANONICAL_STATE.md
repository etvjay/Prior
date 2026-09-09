# Canonical State

## Current phase
`M3 CONTINUITY WRITE VERIFIED — same four-window Circuit processed two real BTC 5m markets with immutable intent; Market A and Market B finalized/scored; guided abstentions; autonomous path BLOCKED_EXTERNAL; UI/reviews pending`

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
- Guided execution fallback, effective Circuit status derivation, durable checkpoint recovery, and live continuity evidence for two BTC 5m markets.
- Corrected RFT deployment plus Market #1 full lifecycle evidence.

## Not yet verified
- `setOperatorApprovalForPool(owner, CircuitExecutor, [0x5d97c566], true)` against the live pool — **WRITE VERIFIED then revoked**; per-pool approval read `true`, but the subsequent `placeBinaryOrderFor` call reached DreamDEX and reverted `0x3fb0ba2e` (`OnlyApprovedContracts()`).
- Corrected RFT contract deployed at `0x5b1B51cB062B7B782c9EC2Bd5674eFAdb5308F41` — **WRITE VERIFIED**; Market #1 committed, resolved, redeemed (zero payout), and finalized.
- Market #1 guided order — **END_TO_END_VERIFIED** for a losing position: owner approval, fill, resolution, zero-payout redemption, and RFT score all read back.
- Existing Circuit `0x89da292ff1dafee8ae54b4b73a2bf6dfeee1cce7143b57875e73cd997d527f07` — **BLOCKED_BY_IMMUTABLE_INTENT** for further markets; it expired correctly after one window.
- New continuity Circuit `0x15e18e2aecb7d00ca3243181fb2fa38af81b021266e2d0a290eb0c55d2b5f4c1` — **SHANNON_WRITE_VERIFIED** across Market A `0x14d04` and Market B `0x14d96`; same intent, two committed RFTs, both policy ABSTAIN.

## Next gate
**Next gate:** Market B resolution/finalization and then extend the same four-window Circuit to additional eligible windows if the expiry budget permits. Browser E2E and review gates remain open.

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
  - placeBinaryOrder (0x718c2d4d)  payable
  - placeBinaryOrderFor (0x5d97c566)  payable
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

## M4.1 domain foundation

M4.1 Mandate and Agent Authority Foundation is implemented locally in `packages/core` with typed `MandatePolicy`, `AgentPrincipal`, `AgentBinding`, `ForecastRequest`, `ForecastSubmission`, and fixed-envelope `AuthorizedAction` objects. Deterministic policy hashing, binding linkage, attenuation, lifecycle, spend, immutability, idempotency, and formatting tests are `UNIT_VERIFIED` only. No new Circuit, contract, UI, deployment, MCP server, or autonomous DreamDEX execution was added.

The M4.1 authority boundary is documented in:

- `docs/MANDATE_SPEC.md`
- `docs/AGENT_AUTHORITY_MODEL.md`

## M4.2 Forecast Provider/domain workflow

M4.2 is implemented locally in `packages/core` with a typed Forecast Provider identity and transport principal, scoped request acceptance, provider response validation, immutable attributable submission records, deterministic identities, and replay-safe idempotency. The implementation is `UNIT_VERIFIED` / local domain behavior only. It makes no external network write and does not claim cryptographic, onchain, or external-agent evidence.

The workflow and evidence ceiling are documented in `docs/FORECAST_PROVIDER_WORKFLOW.md`. The minimal additive refinement is optional `circuitId` and `policyHash` linkage on `ForecastSubmission`, with stronger validation for non-empty signature metadata.

## Next bounded evidence gate

The next gate is an external attributable Forecast submission through a real provider/agent integration, with independent readback. This remains distinct from a later onchain Forecast commitment and receipt gate.

## M4.3 first-party external Forecast agent

M4.3 is implemented in three transport-separated packages: the JSON-only
`packages/forecast-protocol`, the external HTTP-only `packages/forecast-agent`,
and the Layer-3 `packages/forecast-provider-server` adapter. The agent has no
`@prior/core` import. The server is the only bridge that parses the wire DTO,
checks the frozen v1 fixture signature domain, invokes the existing
`ForecastProviderWorkflow`, and exposes readback.

The separate-process fixture demo proves provider/session/signer attribution,
request identity, exact replay idempotency, provider A/B independence on the
same validation path, and an explicit `REJECTED_AUTHORITY` execution attempt.
The machine-readable artifact is `evidence/external-forecast-agent.json`.

```text
external protocol/auth/attribution: END_TO_END_VERIFIED
forecasting intelligence quality: NOT_CLAIMED
fixture signature cryptographic assurance: NOT_CLAIMED
live DreamDEX/market reference: BLOCKED_EXTERNAL
onchain commitment/receipt/RFT: BLOCKED_EXTERNAL
execution authority: false
```

The implementation ceiling is `X2_EXTERNAL_FIXTURE_ONLY`; it is not onchain
evidence and does not promote M4.3 to a live commitment milestone.

## M4.3.5A — Stateful fork gas estimation

M4.3.5A adds a local-only, stateful Anvil/Shannon-fork lifecycle estimator for the live zero-action path. It pins the observed Shannon head, verifies deployed RFT/RegistryV2/ExecutorV2 bytecode, impersonates only the exact owner and forecaster on the fork, and records per-write gas, 1.25 ceiling, gas price, caller, target, function, arguments, estimation method, and cost. Canonical trial/iteration readbacks and ordered create → authorize → activate → commit → bind → advance checks are enforced. BUY_UP/BUY_DOWN `ActionNotAllowed` simulations are excluded from funding. Phase B is unresolved until post-resolution fresh estimation. Output classification is `FORK_SIMULATION_ONLY`; no Shannon write, funding, signing, or broadcast is performed.

The milestone implementation is `UNIT_VERIFIED` in `packages/live-gate`; live-gate selection invokes the stateful fork path for a mapped selected candidate and fails closed with structured reason codes. A live read run on 2026-09-09 found only an unmapped `BOTNAV/5400` candidate and therefore returned `COMPATIBLE_MARKET_REQUIRES_AUTHORIZATION` without attempting gas or writes.

```text
docs/VISUAL_LANGUAGE.md
docs/SCREEN_GEOMETRY.md
```
This includes exact colors, typography, spacing, radii, borders, icon system, probability-
node geometry, chart language, sound/haptic rules, /live geometry, Circuit geometry,
expanded Circuit analysis, landing keyframes, and mobile reflow.

## M4.3.1 — Circuit binding and authority hardening

`CircuitRegistryV2` and `CircuitExecutorV2` are implemented locally and covered by Foundry tests. V2 adds an immutable `RFTRegistry` dependency, canonical `trialForIteration` / `processedMarket` storage, deterministic chain-and-registry-domain iteration identity, owner-only committed-trial binding, exactly-once Circuit-market advancement, and pre-effect `allowedActionsBitmap` enforcement. The unchanged V1 contracts remain legacy artifacts.

Local evidence is `MOCK_VERIFIED` / mock-backed only. V2 is `NOT_DEPLOYED`; no M4.3.1 Shannon funding, deployment, Forecast write, MCP operation, DreamDEX write, or autonomous execution occurred. Existing V1 deployment addresses and live evidence remain unchanged and are not promoted to V2 guarantees.

See `docs/CIRCUIT_RFT_BINDING.md` and `docs/DEPLOYMENT_V2.md` for the storage, lifecycle, enforcement matrix, V1/V2 boundary, and deployment metadata.
