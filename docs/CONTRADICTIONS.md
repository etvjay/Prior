# Contradictions

Record unresolved conflicts between docs, live protocol behavior, implementation or design.

Template:

```text
## C-XXX — Title

Observed:
Expected:
Sources:
Affected invariant/spec:
Risk:
Decision required:
Status:
```

No current contradiction is canonical until verified.

If current DreamDEX/Somnia behavior conflicts with a document, implementation must not silently choose one interpretation.

## C-001 — Circuit definition drift

Observed:
Earlier design text temporarily redefined Circuit as a longitudinal container/trajectory of RFTs.

Expected:
Circuit is the original execution-centric primitive: one persistent bounded intent operating across multiple Event Contracts.

Affected:
Ground truth, product spec, design, state machine.

Resolution:
Execution-centric definition restored in v0.2. Belief trajectory retained only as a Circuit visualization.

Status:
RESOLVED / superseded by D-011.

## C-002 — M0 write evidence blocked by missing owner key

Observed:
Live Shannon writes were initially blocked by missing owner key. The key was subsequently available and deployment, grants, allowance, and cleanup were verified.

Expected:
M0 write evidence would remain blocked until a disposable key was available.

Status:
SUPERSEDED by verified Shannon writes; autonomous order remains blocked externally by C-006.

## C-003 — Live binary pool is a BeaconProxy

Observed:
A live BTC 5m market's `binaryPoolAddress` (`0x3942c8d750380678be3b716d05e92a07f71c934c`) is an EIP-1967 beacon-proxy; the `binaryPoolBeacon` (`0x85C01B5ef4F4ed59caC69749565e309f01b14Dbc`) address is embedded in the proxy's fallback bytecode, and the proxy delegates to `binaryPoolImpl` (`0x48e523c9f22f98548d263f0aD444D732e5202C0E`).

Expected:
`SOMNIA_TESTNET_ADDRESSES.binaryPoolImpl` is the upgradeable implementation; runtime pools are proxies.

Sources:
- `evidence/shannon/m0-binary-impl-code.hex` (40,566 bytes runtime, contains both place-binary selectors)
- `evidence/shannon/m0-pool-code.hex` (584 bytes; matches EIP-1967 beacon-proxy fallback)

Affected:
- `CircuitExecutor` must call `placeBinaryOrderFor` on the **proxy address** that is in `binaryPoolAddress`, not on `binaryPoolImpl`.
- Operator approval via `setOperatorApprovalForPool(pool, ...)` must be called with the **proxy address**; if granted against the impl address it has no effect on the live pool.

Risk:
Low. Architecture already targets the proxy. The control plane's CINV-017 specialized-binary path remains satisfied.

Decision required:
None. Recorded for implementer review.

Status:
RESOLVED — recorded in `CANONICAL_STATE.md` and `EVIDENCE_LEDGER.md`.

## C-004 — `placeBinaryOrderFor` is `payable`

Observed:
The pinned SDK ABI and the live `binaryPoolImpl` bytecode show `placeBinaryOrderFor` with `stateMutability: payable` (selector `0x5d97c566`). `placeBinaryOrder` is also payable (selector `0x718c2d4d`).

Additional correction: an earlier evidence-generation pass mislabeled the two overloaded ABI entries in `m0-binary-abi.json`; the artifact and executor constant have now been regenerated/corrected from the named SDK entries.

Expected:
The Solidity wrapper in `CircuitExecutor` must declare its outer `execute(...)` (or a private helper) `payable` and forward `msg.value` unchanged. Even if the order cost is zero, the function must be payable to compile and to match the on-chain selector dispatch.

Sources:
- `evidence/shannon/m0-binary-abi.json` (ABI from pinned SDK)
- `evidence/shannon/m0-binary-impl-code.hex` (selector present in live impl)

Affected:
- `contracts/src/CircuitExecutor.sol` ABI and call site.
- `executeTrade` library function in `packages/circuit`.

Risk:
None if implemented; compile error if forgotten.

Decision required:
None. Apply `payable` modifier on the executor call site.

Status:
RESOLVED — recorded for implementer.

## C-005 — Indexer does not expose `tickSize`, `lotSize`, `minQuantity`, `quoteSymbol`, `baseSymbol` for live markets

Observed:
For live market 0x14934, the indexer returns `null` for `tickSize`, `lotSize`, `minQuantity`, `quoteSymbol`, `baseSymbol` even though it returns `quoteDecimals`, `baseDecimals`, `lastPriceRaw=850000`, `oracleQuestionId`, `yesTokenId`, `noTokenId`, `expiry`.

Expected:
Per `INVARIANTS.md` IINV-001 and IINV-003, all price/quantity normalization must come from onchain reads, not from the indexer.

Sources:
- `evidence/shannon/m0-market-14934.json`

Affected:
- `packages/dreamdex` adapter must call onchain view functions on the BinaryPool (or a discovered pool-config helper) to obtain `tickSize`, `lotSize`, `minQuantity`, and decimals.
- If those view functions are not exported in `binaryPoolImpl` ABI, we use the SDK's `getPoolConfig(marketId)` helper if present; otherwise we compute from the live order book (smallest price step observed).

Risk:
Medium. Without tick/lot the executor cannot construct a valid `price`/`quantity` for `placeBinaryOrderFor`. This is on the M0 path: must be resolved before M0 write evidence.

Decision required:
Implement a read-only script that calls the onchain view functions from `binaryModuleReadAbi` (and falls back to binaryPoolImpl direct views) to record tick/lot for at least one live Trading pool. Save as `evidence/shannon/m0-pool-config.json`.

## C-006 — Live `placeBinaryOrderFor` rejected by `OnlyApprovedContracts()`

Observed:
After deploying corrected Prior contracts, granting `placeBinaryOrderFor` (`0x5d97c566`) per-pool operator approval, and setting a 1 USDC collateral allowance, a fresh `eth_estimateGas`/raw pool simulation from `CircuitExecutor` reverted with `0x3fb0ba2e`, decoded from DreamDEX's official error documentation as `OnlyApprovedContracts()`.

Expected:
The control-plane target architecture expected selector-scoped per-pool operator approval to authorize `CircuitExecutor`.

Sources:
- Live Shannon preflight against pool `0xa34e33f71c566134ceecdd6869bcc693b3d69c17`.
- `https://app.dreamdex.io/docs/developers/contracts/errors`.
- `https://app.dreamdex.io/docs/trading/spot/operators`.
- `deployments/shannon.json`.

Affected:
CINV-016, M0 authority spike, autonomous Circuit execution.

Risk:
High. Selector-scoped approval is writable/readable but is insufficient for the live BinaryPool `...For` path. No economic order was broadcast.

Decision required:
Verify DreamDEX's approved-contract/system allowlist path for Event Contract BinaryPools. If Prior cannot be added safely, use the documented guided per-order owner-signature fallback and preserve the non-custodial invariant.

Status:
OPEN / LIVE BLOCKER. All temporary grants used in the experiment were revoked and read back false. The guided fallback is now live-proven through a filled owner-signed specialized order; settlement/finalization is a separate pending gate.

## C-007 — Existing Circuit cannot extend to Market #2

Observed:
The requested unchanged Circuit `0x89da292ff1dafee8ae54b4b73a2bf6dfeee1cce7143b57875e73cd997d527f07` has immutable `targetWindows=1` and `expiresAt=1788664800`. Current Shannon time is `1788676779`; its runtime is still ACTIVE but its authorization window is expired.

Expected:
A two-market proof requires an unchanged intent whose target window and expiry cover both markets.

Sources:
- Direct `CircuitRegistry.intents` and `runtime` reads at current Shannon head.
- `evidence/shannon/market1-lifecycle.json`.

Affected:
P1 two-market Circuit proof and Runner restart-between-markets proof.

Risk:
High for the requested demo claim. The intent cannot be edited or extended, and creating a replacement Circuit would not prove the same Circuit.

Decision:
Preserve Market #1 as verified. Do not process Market #2 under this expired one-window Circuit. Create a new multi-window Circuit only as a separate future proof.

Status:
BLOCKED_BY_IMMUTABLE_INTENT.

## C-008 — V1 Circuit-to-RFT binding and duplicate iteration guarantees are absent

Observed:
`CircuitRegistry.sol` V1 stores Circuit intent/runtime and an execution key, but
has no canonical `Circuit × market → RFT` binding and no processed
Circuit-market iteration marker. The historical continuity run therefore proved
one unchanged intent advanced alongside two real BTC 5m markets, one
attributable RFT per market, and Runner-level duplicate prevention only.

Expected:
A protocol-level Circuit iteration must store its canonical RFT association and
reject a second advance for the same `circuitId × marketId`.

Sources:
- `contracts/src/CircuitRegistry.sol` (unchanged V1)
- `contracts/src/CircuitRegistryV2.sol`
- `contracts/test/CircuitRegistryV2.t.sol`
- `docs/CIRCUIT_RFT_BINDING.md`

Affected:
V1 historical interpretation, Circuit iteration integrity, and the V2 deployment
boundary.

Risk:
V1 must not be described as cryptographically binding RFTs or preventing
contract-level duplicate iterations. V2 local tests cover the corrected source
behavior, but no live V2 deployment or DreamDEX admission proof exists.

Resolution:
Preserve V1 source, addresses, receipts, and evidence as legacy. V2 adds an
immutable RFT dependency, owner-only COMMITTED-trial binding, chain-and-registry
iteration identity, `trialForIteration`, `processedMarket`, and pre-effect
allowed-action enforcement. RFT commit remains independent and unchanged.

Status:
RESOLVED FOR V2 SOURCE / V1 LEGACY LIMITATION / LIVE DEPLOYMENT OPEN.
