# Prior Build Report

## Build identity
- Branch: `main`
- HEAD SHA: `b5dfaa1fa5c589133473d25c399ba2ad1010c0e9`
- Parent SHA: `5a3814481c0f84b98073dd9843559b14aeae37f9`
- Environment: Linux, Node 22.23.2, pnpm 11.24.0, Foundry/solc 0.8.24

## Overall status
- M0: **PARTIAL** — ABI, markets, deployment, allowance and revocation reads/writes verified; autonomous binary authority is **BLOCKED_EXTERNAL**.
- Guided execution: **END_TO_END_VERIFIED for Market #1** — owner signed specialized `placeBinaryOrder`; filled, resolved Down, losing position redeemed for zero payout, and RFT finalized.
- RFT: **SHANNON_WRITE_VERIFIED / FINALIZED** — corrected deployment, commit and score proven.
- Runner: **SHANNON_WRITE_VERIFIED** — discovery/readiness, durable checkpoint, effective-status logic, and actual two-iteration restart reconstruction pass.
- Frontend: **PARTIAL** — guided authority model and wallet submission component are implemented; live proposal hydration remains.
- Circuit continuity: **SHANNON_WRITE_VERIFIED** — new four-window Circuit processed two distinct real BTC 1h markets with the same immutable intent; both policy decisions were explicit ABSTAINs.
- Runner recovery: **SHANNON_WRITE_VERIFIED** — actual process kill/restart reloaded both chain-derived completed iterations from durable checkpoint; no duplicate trial/order effects.
- RFT: **SHANNON_WRITE_VERIFIED / FINALIZED for Market #1**; Market A finalized; Market B committed and remains independently inspectable pending resolution.
- Circuit continuity: **SHANNON_WRITE_VERIFIED** across Market A/B; same four-window immutable intent, distinct markets, two explicit abstentions.
- Runner recovery: **SHANNON_WRITE_VERIFIED** — actual process kill/restart reloaded both chain-derived completed iterations.
- Mobile: **PASS** for implemented responsive layout/build coverage; device E2E not run.
- E2E: **PARTIAL** — Market #1 guided Forecast → order → fill → resolution → zero-payout redemption → RFT finalization is verified; the new Circuit continuity proof covers two real markets with explicit abstentions; those new RFTs are not yet resolved/finalized.

## Tests
- Core Vitest: **PASS — 39 tests** (scoring, policy, trade tags, guided execution, effective Circuit status).
- Foundry build: **PASS** (warnings only: block timestamp / bounded cast lint).
- Foundry tests: **PASS — 5 tests** (RFT scoring parity/void handling; Circuit lifecycle/caps; owner-only advance hardening).
- Core TypeScript typecheck: **PASS**.
- DreamDEX adapter TypeScript typecheck: **PASS**.
- Runner TypeScript typecheck: **PASS**.
- Next.js production build: **PASS** — 7 Prior routes generated.
- Runner live `/health`: **PASS**.
- Runner live `/ready`: **PASS** — observed block `481052255`, 50 markets, 6 Trading.
- Playwright/browser E2E: **NOT RUN**.

## Live evidence
- SDK: `@somnia-chain/markets-sdk@0.29.0`.
- Chain: Shannon `50312`.
- RPC: `https://dream-rpc.somnia.network`.
- Indexer: `https://dev.smk.somnia.host/v1/graphql`.
- `placeBinaryOrderFor`: `0x5d97c566`, payable, exact ABI captured.
- `setOperatorApprovalForPool`: `0x7bbc67e6`, exact ABI/selector captured.
- Live sample marketId: `0x0000000000000000000000000000000000000000000000000000000000014934`.
- Live sample market: `0x16c6e449cde5ffbe1f70c759c2da1c13598f7bb9`.
- Live sample binary pool: `0x3942c8d750380678be3b716d05e92a07f71c934c`.
- Binary pool implementation: `0x48e523c9f22f98548d263f0aD444D732e5202C0E`.
- Operator registry proxy: `0x15C7e8CE38F021c5b45d098AaD788f63090bF20A`.
- Operator registry implementation: `0x9707acee9c39fea71564a1b0c840f97f784c22f7`.
- Live writes: corrected RFT deployment, Circuit creation/authorization/activation, Forecast commits, guided order, resolution, redemption, and RFT finalization all have verified receipts in `deployments/shannon.json` and `evidence/shannon/`.
- Evidence: `evidence/shannon/market1-lifecycle.json` and `evidence/shannon/circuit-continuity-recovery.json`.
- Review synthesis: `docs/REVIEW_REPORT_2026-09-06.md`.

## Reviews
- Product review: **FAIL** — 2 blockers, 3 highs; live proposal/commit interaction remains incomplete.
- Protocol review: **REJECT_PENDING_FIXES** — 5 highs; deployed RFT resolution assumptions and authority hardening require further work.
- Circuit review: **REJECT_FOR_CIRCUIT_MILESTONE** at review snapshot; current two-market abstention continuity is recorded, but Market B remains unresolved.
- Runner review: **CONDITIONAL_FAIL** — 3 highs; live discovery/restart pass, full transaction orchestration remains.
- Security review: **FAIL** — autonomous authority and deployed mutation risks remain; source owner-only advance hardening is not deployed to the continuity Circuit.
- Implementation review: **CHANGES_REQUESTED** — unit/documentation/recovery findings were partly fixed after the review snapshot.
- Evidence review: **CONDITIONAL_FAIL** at review snapshot; subsequent actual process kill/restart evidence is now captured.
- Design review: **FAIL_PENDING_REVIEW** — browser interaction and full Circuit geometry remain incomplete.
- Visual-language review: **FAIL** — frozen visual deviations remain.
- Motion review: **BLOCK** — required motion choreography remains incomplete.
- Blocker/high counts: unresolved findings are recorded in `docs/REVIEW_REPORT_2026-09-06.md`.

## Contradictions discovered
- C-002: M0 write evidence is blocked by missing owner key.
- C-003: live BinaryPool is a BeaconProxy; calls/approvals target the live pool proxy, not implementation.
- C-004: `placeBinaryOrderFor` is payable.
- C-005: indexer omits tick/lot/minQuantity/symbol fields for the sample market; adapter must not use indexer values for normalization.

## Assumptions remaining
- Live BinaryPool order-book data can be hydrated into the SDK's `BinaryOrderBook` shape for executable quote tests.
- The exact live status and pool configuration reads still need to be completed before writes.
- `getSettlement` payout ordering maps index 0 to Up and index 1 to Down; must be confirmed with a resolved live market before scoring live evidence.

## Known limitations
- No live owner key was available, so no contracts were deployed and no operator grant, allowance, order, revocation, or live RFT exists.
- RFT commit currently enforces binding/expiry but needs a verified onchain lifecycle/status read before production use.
- CircuitExecutor's live order parameter normalization and settlement semantics remain M0-write gated.
- Runner currently exposes live readiness and discovery but is not yet a complete persistent transaction orchestrator.
- Browser wallet path uses native EIP-1193 discovery; WalletConnect and chain-switch UX are not wired.
- No hosted frontend URL or deployment addresses.
- No demo video or final SDK/docs feedback submission artifact.

## Files changed
- Control plane and evidence: `docs/`, `skills/`, `evidence/shannon/`.
- Shared core: `packages/core/`.
- DreamDEX adapter: `packages/dreamdex/`.
- Contracts: `contracts/src/`, `contracts/test/`, `contracts/foundry.toml`.
- Runner: `apps/runner/`.
- Web: `apps/web/`.
- Tooling: `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.env.example`, `scripts/`.

## Deployment
- frontend URL: none
- chain: Somnia Shannon `50312`
- contract addresses: none; deployment blocked

## Next action
Supply a disposable Shannon-testnet-only `PRIOR_OWNER_PRIVATE_KEY` with STT, then run the M0 operator grant/allowance/IOC/revocation evidence gate before claiming autonomous Circuit execution.
