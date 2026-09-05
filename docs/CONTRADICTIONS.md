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
Live Shannon writes for the M0 authority spike (operator grant, collateral allowance, tiny IOC binary order) cannot be performed in this environment because `PRIOR_OWNER_PRIVATE_KEY` is not present.

Expected:
`ONESHOT_BUILD_INPUTS.md` §35 allows local/bootstrap work immediately but gates live writes behind the owner-key check.

Sources:
- `docs/ONESHOT_BUILD_INPUTS.md` §35 (Ready-to-Run Gate)
- `skills/M0_AUTHORITY_SPIKE.md`
- `docs/CANONICAL_STATE.md` (this session)

Affected:
M0 write evidence, M1 deployment, M2 Runner live run, M3 multi-market Circuit live proof.

Risk:
Hackathon submission cannot prove the full target architecture end-to-end (one unchanged Circuit intent across ≥2 live Event Contracts) without the key.

Decision required:
User supplies a disposable Shannon-testnet-only `PRIOR_OWNER_PRIVATE_KEY` with STT gas and TestUSDC. The implementation agent will not generate, paste, or accept any non-disposable key.

Status:
OPEN. Documented. Implementation agent is proceeding with every non-key-dependent slice in parallel (RFT, Circuit, Runner, UI, tests, deployment) so the moment the key is provided the live run can complete.

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
The pinned SDK ABI and the live `binaryPoolImpl` bytecode both show `placeBinaryOrderFor` with `stateMutability: payable` (selector `0x718c2d4d`). `placeBinaryOrder` is also payable (selector `0x5d97c566`).

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

Status:
OPEN. To be closed in this same session before any M0 write attempt.
