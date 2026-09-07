# Assumptions

Assumptions are not facts. Each must be verified, revised, or retired.

| ID | Assumption | Consequence if false | Verification |
|---|---|---|---|
| A-001 | Current DreamDEX SDK exposes all required binary market reads on Shannon | Adapter/client plan changes | M0 SDK spike |
| A-002 | Top-of-book can be read in a Solidity-compatible path during commit | Market reference may need alternate evidence commitment | M0 onchain pool read |
| A-003 | `userData` is settable through a usable DreamDEX trading path | Trade linkage needs tx/order correlation instead | M0 tiny-order test |
| A-004 | Shannon provides sufficiently live Event Contracts/liquidity for demo | Trade portion may become optional demo evidence | live discovery |
| A-005 | Event/log scanning is enough for hackathon history scale | lightweight read indexer may be needed | benchmark after M2 |
| A-006 | One forecast per wallet/market is acceptable for demo | versioned forecast model required | product review |

| A-007 | DreamDEX/Somnia integration can support bounded persistent execution without an unrestricted owner key | Circuit may need guided execution fallback | M1 authority spike |
| A-008 | A Runner can reconstruct sufficient state from chain/DreamDEX after restart | Runtime persistence model must change | runner recovery test |
| A-009 | Agent Forecasts can be safely attributed with signed structured data | automatic forecast relay needs alternative identity scheme | signature spike |

| A-010 | BinaryPool `placeBinaryOrderFor` uses the shared operator registry in a way Prior can grant to CircuitExecutor | **FALSE on current Shannon path**: selector grant reads true but pool rejects with `OnlyApprovedContracts()`; guided execution or approved-contract integration required | M0 authority experiment, C-006 |
| A-011 | Relevant binary pool set can be enumerated/pre-authorized for a bounded Circuit | Circuit may pause when a new unapproved pool appears | M0 pool discovery + recycle tests |
| A-012 | Binary auto-pull/worst-case requirement can be enforced onchain for Circuit spend caps | Executor needs verified custom cost math | M0 pool read/ABI inspection |
| A-013 | V2 can read the unchanged RFTRegistry canonical `getTrial` record without changing `commitForecast` | V2 binding boundary would need an explicitly versioned compatible RFT adapter | local Solidity interface/compiler and mock regression tests; no live deployment |
| A-014 | V2 action bits remain the explicit mapping bit 0 → kind 0 BUY_UP and bit 1 → kind 2 BUY_DOWN | Executor action gate would need a separately reviewed mapping correction | local V2 executor tests with zero/UP/DOWN bitmaps; no live deployment |
| A-015 | Local V2 source/tests are sufficient only for source/test readiness, not live protocol readiness | Deployment, constructor readback, DreamDEX admission, and live binding/action gates remain open | `deployments/shannon-v2.json` is `NOT_DEPLOYED` |
