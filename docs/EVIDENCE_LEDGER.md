# Evidence Ledger

This file tracks claims and their proof level.

| Claim | Status | Evidence | Date |
|---|---|---|---|
| RFT product/protocol documents exist | DESIGN_ONLY | repository docs | 2026-09-05 |
| RFT can discover live DreamDEX Event Contracts | SHANNON_READ_VERIFIED | `evidence/shannon/m0-market-discovery.json`, `m0-markets-raw.json` | 2026-09-05 |
| RFT can capture one market's identity/status/expiry/pool | SHANNON_READ_VERIFIED | `evidence/shannon/m0-market-14934.json` | 2026-09-05 |
| `placeBinaryOrderFor` ABI selector is `0x5d97c566` and lives in `binaryPoolImpl` | SHANNON_READ_VERIFIED | `evidence/shannon/m0-binary-abi.json`, `m0-binary-impl-code.hex` | 2026-09-05 |
| `setOperatorApprovalForPool` selector is `0x7bbc67e6` and lives in OperatorRegistry implementation `0x9707acee9c39fea71564a1b0c840f97f784c22f7` | SHANNON_READ_VERIFIED | `evidence/shannon/m0-binary-abi.json`, `m0-opregistry-impl-code.hex` | 2026-09-05 |
| Live BinaryPool is BeaconProxy via `binaryPoolBeacon` → `binaryPoolImpl` | SHANNON_READ_VERIFIED | `evidence/shannon/m0-binary-impl-code.hex` (beacon slot match) | 2026-09-05 |
| RFT can read live onchain top-of-book during commit | UNVERIFIED | M0 read-only book probe to be added | — |
| RFT can read DreamDEX resolution | SHANNON_READ_VERIFIED | `evidence/shannon/market1-lifecycle.json`; market status 4, resolution event and payout vector verified | 2026-09-06 |
| RFT can bind a DreamDEX order using `userData` | SHANNON_READ_VERIFIED | `evidence/shannon/market1-lifecycle.json`; OrderPlaced/OrderFilled decoded with owner and userData `45` | 2026-09-06 |
| Corrected RFT deployed and Market #1 finalized | END_TO_END_VERIFIED | `evidence/shannon/market1-lifecycle.json`; RFT finalization `0x21b5f66db37481c86cdbf4608b98a7ea15a12527d72ef3c2bf332c5509ebbbcc`; redemption `0x9af95958ae30c594cd4631b578d193487b6537c1b082f7a825becf69bcf9ec6a`; Down resolved; zero payout | 2026-09-06 |
| Guided accounting reconciles temporary pull to actual fill cost | SHANNON_READ_VERIFIED | 420 pulled, 139 returned, 281 consumed; formula and before/after balances in `market1-lifecycle.json` | 2026-09-06 |
| Finalized Forecast is immutable | SHANNON_READ_VERIFIED | double finalize `0xe405a433` AlreadyTerminal; conflicting recommit `0x9f7d134c` DuplicateForecast; no setter | 2026-09-06 |
| Existing requested Circuit can prove Market #2 | BLOCKED_BY_IMMUTABLE_INTENT | intent reads `targetWindows=1`, `expiresAt=1788664800`; current timestamp `1788676779`; cannot extend/mutate | 2026-09-06 |
| New four-window Circuit persists across Market A → restart → Market B | SHANNON_WRITE_VERIFIED | `evidence/shannon/circuit-continuity-recovery.json`; same intent, distinct markets `0x14d04`/`0x14d96`, two committed RFTs, runtime `completed=2`, `abstained=2` | 2026-09-06 |
| Live runner restarts and reconstructs both completed iterations | SHANNON_WRITE_VERIFIED | `/ready` after restart plus `/runtime` with both chain-derived `ITERATION_COMPLETE` checkpoint records | 2026-09-06 |
| Binary Event Contracts use specialized `placeBinaryOrder` / `placeBinaryOrderFor` | SHANNON_READ_VERIFIED | live bytecode of `binaryPoolImpl` 0x48e523c9f22f98548d263f0aD444D732e5202C0E | 2026-09-05 |
| Generic `placeOrderFor` is unsuitable on BinaryPool | PRIMARY_SOURCE_VERIFIED + SHANNON_READ_VERIFIED | SDK release notes + ABI inspection | 2026-09-05 |
| DreamDEX supports selector-scoped/per-pool operator grants | SHANNON_READ_VERIFIED | OperatorRegistry impl bytecode | 2026-09-05 |
| Somnia native session transaction account is separate key/account | PRIMARY_SOURCE_VERIFIED | Somnia Markets Native RPC docs | 2026-09-05 |
| CircuitExecutor can place Binary order for owner on Shannon | UNVERIFIED | M0 write pending (BLOCKED) | — |
| Owner collateral auto-pulls correctly through CircuitExecutor | UNVERIFIED | M0 write pending (BLOCKED) | — |
| First-party external Forecast agent protocol/auth/attribution path | END_TO_END_VERIFIED (fixture path) | `evidence/external-forecast-agent.json`, `docs/FORECAST_PROVIDER_PROTOCOL.md`, package tests, separate-process demo | 2026-09-06 |

## Evidence rules
- A screenshot alone does not prove contract behavior.
- A successful local mock does not prove DreamDEX compatibility.
- A deployed contract does not prove end-to-end behavior.
- Every public claim in README/demo/submission should map to an evidence row.

## M0 read artifacts (this session)
- `evidence/shannon/m0-environment.json`
- `evidence/shannon/m0-sdk-exports.json`
- `evidence/shannon/m0-binary-abi.json`
- `evidence/shannon/m0-indexer-schema.json`
- `evidence/shannon/m0-indexer-fields.txt`
- `evidence/shannon/m0-market-schema.json`
- `evidence/shannon/m0-markets-raw.json`
- `evidence/shannon/m0-market-14934.json`
- `evidence/shannon/m0-market-discovery.json`
- `evidence/shannon/m0-binary-impl-code.hex`
- `evidence/shannon/m0-opregistry-impl-code.hex`
- `evidence/shannon/m0-pool-code.hex`

## Live-write blockers
| ID | What is blocked | Why | Resume condition |
|---|---|---|---|
| BLK-001 | M0 operator-grant evidence | no `PRIOR_OWNER_PRIVATE_KEY` | disposable key with STT |
| BLK-002 | M0 tiny-IOC binary order evidence | no `PRIOR_OWNER_PRIVATE_KEY` | disposable key with STT + TestUSDC |
| BLK-003 | RFT deployment | no signer | BLK-001 |
| BLK-004 | Multi-market Circuit live proof | no signer | BLK-001 + BLK-002 + BLK-003 |
| BLK-005 | Web deployment from this environment | no `VERCEL_TOKEN` etc. | optional; manual deploy path possible |
