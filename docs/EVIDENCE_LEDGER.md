# Evidence Ledger

This file tracks claims and their proof level.

| Claim | Status | Evidence | Date |
|---|---|---|---|
| RFT product/protocol documents exist | DESIGN_ONLY | repository docs | 2026-09-05 |
| RFT can discover live DreamDEX Event Contracts | SHANNON_READ_VERIFIED | `evidence/shannon/m0-market-discovery.json`, `m0-markets-raw.json` | 2026-09-05 |
| RFT can capture one market's identity/status/expiry/pool | SHANNON_READ_VERIFIED | `evidence/shannon/m0-market-14934.json` | 2026-09-05 |
| `placeBinaryOrderFor` ABI selector is `0x718c2d4d` and lives in `binaryPoolImpl` | SHANNON_READ_VERIFIED | `evidence/shannon/m0-binary-abi.json`, `m0-binary-impl-code.hex` | 2026-09-05 |
| `setOperatorApprovalForPool` selector is `0x7bbc67e6` and lives in OperatorRegistry implementation `0x9707acee9c39fea71564a1b0c840f97f784c22f7` | SHANNON_READ_VERIFIED | `evidence/shannon/m0-binary-abi.json`, `m0-opregistry-impl-code.hex` | 2026-09-05 |
| Live BinaryPool is BeaconProxy via `binaryPoolBeacon` → `binaryPoolImpl` | SHANNON_READ_VERIFIED | `evidence/shannon/m0-binary-impl-code.hex` (beacon slot match) | 2026-09-05 |
| RFT can read live onchain top-of-book during commit | UNVERIFIED | M0 read-only book probe to be added | — |
| RFT can read DreamDEX resolution | UNVERIFIED | M0 read-only resolution probe to be added | — |
| RFT can bind a DreamDEX order using `userData` | UNVERIFIED | M0 write evidence pending (BLOCKED) | — |
| RFT contract deployed on Shannon | UNVERIFIED | M1 pending (BLOCKED) | — |
| Live commit → resolve → score works | UNVERIFIED | M2/M3 pending (BLOCKED) | — |
| Circuit policy is deterministic | UNVERIFIED | M1 pending | — |
| Circuit authority blocks over-budget execution | UNVERIFIED | M1 pending | — |
| Circuit Runner can recover after restart without duplicate action | UNVERIFIED | M2 pending | — |
| One Circuit persists across two live DreamDEX markets | UNVERIFIED | M3 pending (BLOCKED) | — |
| Binary Event Contracts use specialized `placeBinaryOrder` / `placeBinaryOrderFor` | SHANNON_READ_VERIFIED | live bytecode of `binaryPoolImpl` 0x48e523c9f22f98548d263f0aD444D732e5202C0E | 2026-09-05 |
| Generic `placeOrderFor` is unsuitable on BinaryPool | PRIMARY_SOURCE_VERIFIED + SHANNON_READ_VERIFIED | SDK release notes + ABI inspection | 2026-09-05 |
| DreamDEX supports selector-scoped/per-pool operator grants | SHANNON_READ_VERIFIED | OperatorRegistry impl bytecode | 2026-09-05 |
| Somnia native session transaction account is separate key/account | PRIMARY_SOURCE_VERIFIED | Somnia Markets Native RPC docs | 2026-09-05 |
| CircuitExecutor can place Binary order for owner on Shannon | UNVERIFIED | M0 write pending (BLOCKED) | — |
| Owner collateral auto-pulls correctly through CircuitExecutor | UNVERIFIED | M0 write pending (BLOCKED) | — |

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
