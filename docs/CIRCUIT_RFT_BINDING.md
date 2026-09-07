# Circuit ↔ RFT Binding — V2

Status: `MOCK_VERIFIED / NOT_DEPLOYED`

M4.3.1 adds a versioned binding boundary without changing the deployed V1
protocol. `CircuitRegistryV2` and `CircuitExecutorV2` are fresh contract
artifacts. `CircuitRegistry.sol`, `CircuitExecutor.sol`, `RFTRegistry.sol`,
existing deployment addresses, and historical Shannon evidence remain V1
artifacts.

## Independence boundary

`RFTRegistry.commitForecast` remains independent and keeps its V1 ABI. It does
not accept a `circuitId`, and no Circuit field is smuggled into a duplicated
commit argument. The canonical RFT identity remains:

```text
keccak256(abi.encode(chainId, RFTRegistry address, forecaster, marketId))
```

RFT uniqueness is still scoped to `forecaster × marketId` within one RFT
registry. A V2 Circuit binding is a separate relationship. The same committed
RFT may be bound by more than one legitimate Circuit when each Circuit's
immutable `Intent.forecaster` equals the RFT's canonical `Trial.forecaster`.
V2 does not write or consume the RFT registry's `trialFor` uniqueness slot.

## Circuit iteration identity and storage

V2 derives one domain-separated iteration identity:

```solidity
keccak256(abi.encode(block.chainid, address(this), circuitId, marketId))
```

The chain ID and V2 registry address are part of the preimage. The helper is
`CircuitRegistryV2.iterationIdentity(circuitId, marketId)`. The contract's
canonical state is the source of truth; Runner checkpoints and other local
read models are caches only.

Canonical V2 storage:

| Storage | Meaning |
|---|---|
| `trialForIteration[circuitId][marketId]` | The canonical committed RFT bound to this Circuit iteration; zero means unbound. |
| `processedMarket[circuitId][marketId]` | Exactly-once marker for the Circuit market iteration. |
| `iterations[iterationId]` (read through `getIteration`) | Stored iteration identity, Circuit/market IDs, trial ID, bound state, processed state, and missed state. |
| `intents[circuitId]` / `runtime[circuitId]` | V1-shaped immutable intent and lifecycle/progress state in the V2 registry. |

`executionUsed[circuitId][marketId]` remains the separate V2 execution
reservation key. It does not replace `processedMarket`.

## Binding function

`CircuitRegistryV2.bindTrial(circuitId, marketId, trialId)` is owner-only and
requires all of the following:

1. the Circuit exists;
2. the Circuit runtime is `ACTIVE`;
3. the current block is within the immutable `[startsAt, expiresAt)` window;
4. `processedMarket[circuitId][marketId]` is false;
5. there is no previous `trialForIteration[circuitId][marketId]`;
6. the canonical RFT trial exists in the configured immutable `rftRegistry`;
7. the RFT trial status is `COMMITTED`;
8. the RFT trial's stored `marketId` equals the supplied `marketId`;
9. the RFT trial's stored `forecaster` equals the Circuit intent's stored `forecaster`.

The caller does not provide duplicated forecaster, probability, or market
fields. V2 reads the canonical `RFTRegistry.Trial` and emits:

```solidity
event CircuitTrialBound(
    bytes32 indexed circuitId,
    bytes32 indexed marketId,
    bytes32 indexed trialId,
    address forecaster
);
```

V2 deliberately requires `COMMITTED`: a terminal `SCORED` or `VOIDED` trial
is historical evidence, not a new Circuit iteration input. The binding itself
is not globally exclusive; two distinct Circuits can reference the same RFT
when their stored forecaster checks pass.

## Iteration lifecycle

```text
unbound → bound → processed
       \→ missed/processed
```

- A normal advance (`missed == false`) requires a nonzero canonical binding.
- A missed advance (`missed == true`) may be unbound. It records a visible
  missed iteration with no trial and cannot be repeated.
- Both paths require owner authority, an `ACTIVE` or `PAUSED` lifecycle state,
  and the immutable time window.
- `processedMarket` is set before subsequent runtime-counter/status updates and
  the event. Solidity transaction atomicity means a reverted transition leaves
  the marker unchanged.
- Any second advance of the same `circuitId × marketId` reverts, regardless of
  whether the first iteration was bound or missed.
- Binding after a missed iteration is rejected because the market is already
  processed.

The V2 registry does not call DreamDEX or RFT from `bindTrial` or `advance`.
The pre-effect marker is nevertheless the canonical boundary for any future
external effect added after the marker.

## Action enforcement

`CircuitExecutorV2` reads `Intent.allowedActionsBitmap` and maps DreamDEX
binary order kinds as follows:

| Bitmap bit | Action | DreamDEX kind |
|---:|---|---:|
| bit 0 (`1`) | `BUY_UP` | kind `0` (`BUY_YES`) |
| bit 1 (`2`) | `BUY_DOWN` | kind `2` (`BUY_NO`) |

A kind is rejected when its bit is absent. The check occurs after the
read-only V2 intent lookup but before the market read, operator approval read,
collateral allowance read, `reserveExecution`, or BinaryPool call. Bitmap `0`
therefore makes both supported actions inert. This is only the requested
bitmap hardening: V2 still does not claim exact DreamDEX admission, complete
price/spend derivation, or production-safe autonomous execution.

## Policy enforcement matrix

The classifications below describe the M4.3.1 V2 implementation, not the
older M4.1 TypeScript policy model and not live deployment evidence.

| Policy dimension | V2 source of truth / behavior | Enforcement | Boundary |
|---|---|---|---|
| Forecaster | `Intent.forecaster` compared with canonical `Trial.forecaster` during `bindTrial` | `ONCHAIN` | V2 registry binding |
| Market identity | `marketId` plus `iterationIdentity(chainId, V2 registry, circuitId, marketId)` | `ONCHAIN` | V2 registry storage |
| Market scope | `marketClass` is stored, but V2 does not validate market metadata/class against a supplied market | `APP` | Core/Mandate request-policy checks are noncanonical; no V2 contract gate was added |
| Cadence | `targetWindows` limits completion count; no interval/cadence field or market cadence validation exists in V2 | `APP` | Core request scope can validate intervals; it cannot make V2 storage authoritative |
| Minimum margin | `minMarginBps` remains stored; V2 executor does not derive or validate an executable price margin | `APP` | Core policy evaluation is noncanonical; V2 action execution does not enforce it |
| Maximum per market | `reserveExecution` rejects `spend > maxPerMarket` | `ONCHAIN` | V2 registry reservation |
| Total budget | `reserveExecution` rejects cumulative reserved spend above `totalBudget` | `ONCHAIN` | V2 registry reservation |
| Allowed side/action | V2 executor maps kind `0`/`2` to bitmap bits `0`/`1` before economic checks | `ONCHAIN` | V2 executor |
| Lifecycle | Owner-only lifecycle functions; binding/advance require valid V2 state/time; reservations require `ACTIVE` and time bounds | `ONCHAIN` | V2 registry |
| Duplicate Circuit-market | `processedMarket` rejects repeated iteration; `executionUsed` separately rejects repeated reservation | `ONCHAIN` | V2 registry |
| Execution caller | No configured caller/Runner allowlist; `msg.sender != address(0)` is not a meaningful authorization boundary | `NONE` | Existing scope limitation |
| Revocation | Owner-only `revoke`; revoked status blocks binding, advance, and execution reservation | `ONCHAIN` | V2 registry lifecycle |

`APP` rows identify existing noncanonical Runner/core checks; they cannot
override V2 storage or authorize a V2 external effect. No additional policy
enforcement is implied by this matrix.

## V1 versus V2

| Surface | V1 | V2 |
|---|---|---|
| Circuit ↔ RFT association | No canonical onchain association; continuity evidence was runner-level | Immutable RFT dependency plus owner-only canonical binding |
| Duplicate Circuit-market iteration | No deployed `processedMarket` marker; Runner prevented duplicates in the historical proof | `processedMarket` and stored `CircuitIteration` reject repeats onchain |
| RFT commit ABI | Independent; unchanged | Independent; V2 reads `getTrial` only |
| Allowed action bitmap | Stored by V1 intent but ignored by V1 executor | Enforced before economic/external checks |
| Deployment state | Existing V1 addresses/evidence retained as legacy | `NOT_DEPLOYED`; no address or receipt exists |

Historical V1 claims remain narrow: one unchanged Circuit intent was advanced
alongside two real BTC 5m markets, with one attributable RFT per market and
Runner-level duplicate prevention. That evidence does not prove that deployed
V1 cryptographically bound RFTs or prevented duplicate iterations.

## Evidence ceiling and next gate

The V2 contract tests are local Foundry tests using controllable mocks, plus
unchanged-RFT regression tests. They prove source behavior at the local test
boundary only. No Shannon funding, deployment, Forecast write, MCP call,
DreamDEX write, or autonomous execution occurred for M4.3.1. A live V2
recommendation requires a separately authorized deployment, constructor
readback, and live binding/action verification.
