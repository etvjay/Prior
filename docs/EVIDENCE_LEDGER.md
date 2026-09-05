# Evidence Ledger

This file tracks claims and their proof level.

| Claim | Status | Evidence | Date |
|---|---|---|---|
| RFT product/protocol documents exist | DESIGN_ONLY | repository docs | 2026-09-05 |
| RFT can discover live DreamDEX Event Contracts | UNVERIFIED | M0 pending | — |
| RFT can capture onchain top-of-book during commit | UNVERIFIED | M0 pending | — |
| RFT can read DreamDEX resolution | UNVERIFIED | M0 pending | — |
| RFT can bind a DreamDEX order using `userData` | UNVERIFIED | M0 pending | — |
| RFT contract deployed on Shannon | UNVERIFIED | M1 pending | — |
| Live commit → resolve → score works | UNVERIFIED | M2/M3 pending | — |

## Evidence rules

A screenshot alone does not prove contract behavior.

A successful local mock does not prove DreamDEX compatibility.

A deployed contract does not prove end-to-end behavior.

Every public claim in README/demo/submission should map to an evidence row.

| Circuit policy is deterministic | UNVERIFIED | M1 pending | — |
| Circuit authority blocks over-budget execution | UNVERIFIED | M1 pending | — |
| Circuit Runner can recover after restart without duplicate action | UNVERIFIED | M2 pending | — |
| One Circuit persists across two live DreamDEX markets | UNVERIFIED | M3 pending | — |

| Binary Event Contracts use specialized `placeBinaryOrder` / `placeBinaryOrderFor` | PRIMARY_SOURCE_VERIFIED | Somnia Markets SDK release notes | 2026-09-05 |
| Generic `placeOrderFor` is unsuitable on BinaryPool | PRIMARY_SOURCE_VERIFIED | Somnia Markets SDK release notes (`UseBinaryPlacement`) | 2026-09-05 |
| DreamDEX supports selector-scoped/per-pool operator grants | PRIMARY_SOURCE_VERIFIED | DreamDEX operator docs + SDK reference | 2026-09-05 |
| Somnia native session transaction account is separate key/account | PRIMARY_SOURCE_VERIFIED | Somnia Markets Native RPC docs | 2026-09-05 |
| CircuitExecutor can place Binary order for owner on Shannon | UNVERIFIED | M0 pending | — |
| Owner collateral auto-pulls correctly through CircuitExecutor | UNVERIFIED | M0 pending | — |
