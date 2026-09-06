# Prior Build Report

## Build identity
- Branch: `main`
- HEAD SHA: verified by `git rev-parse HEAD` and remote `refs/heads/main` at handoff
- Parent SHA: `6b807b59f396132c6816bc9484e2608388e82722`
- Environment: Linux, Node 22.23.2, pnpm 11.24.0, Foundry/solc 0.8.24

## Overall status
- M0: **PARTIAL** — ABI, markets, deployment, allowance and revocation reads/writes verified; binary authority path blocked by DreamDEX `OnlyApprovedContracts()`.
- RFT: **PARTIAL** — implementation compiles and local scoring passes; deployed RFT instance predates the corrected exact `binaryModule.markets` tuple interface and requires redeployment before live commit.
- Circuit: **PARTIAL** — corrected registry/executor deployed; local lifecycle/cap tests pass; live order path blocked by DreamDEX allowlist behavior.
- Authority: **BLOCKED** — selector grant reads true, but BinaryPool rejects `placeBinaryOrderFor` from Prior with `0x3fb0ba2e` (`OnlyApprovedContracts()`).
- Runner: **PARTIAL** — live discovery, `/health`, `/ready` and typecheck pass; full transaction orchestration not complete.
- Frontend: **PARTIAL** — all required routes and core interaction shell build; live contract wiring remains.
- Mobile: **PASS** for implemented responsive layout/build coverage; device E2E not run.
- Live Shannon: **PARTIAL** — chain, RPC, indexer, SDK, ABI, live markets, deployment, operator grants, allowances and revocations verified.
- E2E: **BLOCKED** — requires resolving DreamDEX approved-contract behavior, redeploying corrected RFT, and running live Forecast/Circuit recovery proof.

## Tests
- Core Vitest: **PASS — 33 tests** (scoring, policy, trade tags).
- Foundry build: **PASS** (warnings only: block timestamp / bounded cast lint).
- Foundry tests: **PASS — 4 tests** (RFT scoring parity/void handling; Circuit lifecycle/caps).
- Core TypeScript typecheck: **PASS**.
- DreamDEX adapter TypeScript typecheck: **PASS**.
- Runner TypeScript typecheck: **PASS**.
- Next.js production build: **PASS** — 7 Prior routes generated.
- Runner live `/health`: **PASS**.
- Runner live `/ready`: **PASS** — observed block `480798877`, 50 markets, 10 Trading.
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
- Transaction hashes: none — all live writes are blocked.
- Evidence artifacts: `evidence/shannon/`.

## Reviews
- Product review: **NOT RUN** — no independent review pass yet.
- Protocol review: **NOT RUN** — no independent review pass yet.
- Circuit review: **NOT RUN** — no independent review pass yet.
- Runner review: **NOT RUN** — no independent review pass yet.
- Security review: **NOT RUN** — no independent review pass yet.
- Implementation review: **NOT RUN** — no independent review pass yet.
- Evidence review: **NOT RUN** — no independent review pass yet.
- Design review: **NOT RUN** — no independent review pass yet.
- Visual-language review: **NOT RUN** — no independent review pass yet.
- Motion review: **NOT RUN** — no independent review pass yet.
- Blocker/high counts: not independently assessed; this is an unresolved acceptance gap.

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
