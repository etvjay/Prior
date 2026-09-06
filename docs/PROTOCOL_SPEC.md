# Protocol Specification — RFT v0.1

## Contracts

```text
RFTRegistry
DreamDexAdapter
RFTScoring
```

### `RFTRegistry`

Canonical trial state and events.

### `DreamDexAdapter`

Stateless normalization layer over DreamDEX market identity, status, order-book reference and resolution reads.

### `RFTScoring`

Pure deterministic score functions.

## Suggested types

```solidity
enum TrialStatus {
    NONE,
    COMMITTED,
    SCORED,
    VOIDED
}

enum ActionIntent {
    NONE,
    BUY_UP,
    BUY_DOWN,
    ABSTAIN
}

enum Outcome {
    NONE,
    UP,
    DOWN
}

struct Trial {
    bytes32 trialId;
    bytes32 marketId;
    address forecaster;

    uint16 pUpBps;

    uint16 referenceUpBps;
    bool referenceValid;

    uint64 committedAt;
    uint64 committedBlock;
    uint32 secondsToExpiry;

    uint64 tradeTag;
    ActionIntent actionIntent;

    TrialStatus status;
    Outcome outcome;

    uint32 forecastBrier;
    uint32 marketBrier;
    int64 marketScoreDelta;
}
```

Exact storage layout remains implementation-controlled until ABI verification confirms all external normalization requirements.

## Authority and execution modes

The target autonomous architecture remains:

```text
Circuit → CircuitExecutor → DreamDEX BinaryPool.placeBinaryOrderFor(owner, ...)
```

Status: **BLOCKED_EXTERNAL**. Live Shannon proved that selector `0x5d97c566` can be granted and read back `true`, but DreamDEX still rejects the call with `0x3fb0ba2e` (`OnlyApprovedContracts()`), requiring additional DreamDEX contract admission.

The live guided architecture is:

```text
Circuit → Forecast → deterministic CircuitPolicy → bounded exact proposal
        → owner authorization → BinaryPool.placeBinaryOrder → DreamDEX
```

Status: **END_TO_END_VERIFIED** for Market #1. Guided execution is not discretionary manual trading: the Circuit computes side, price ceiling, quantity, order type, market, expiry, and identity before authorization. The owner may approve or reject that exact proposal, but cannot choose a different action inside the approval step.

RFT does not custody funds. DreamDEX remains the authority for order execution, matching, resolution, settlement, and redemption. Forecast quality, policy quality, execution quality, and PnL remain separate evidence dimensions.

## Circuit effective status

Stored runtime status and effective status are distinct. A stored `ACTIVE` runtime whose immutable `expiresAt` is at or before the current block timestamp has effective status `EXPIRED`; UI and Runner must use effective status and must not present it as operational.


## Trial ID

For v0.1:

```solidity
keccak256(
    abi.encode(
        block.chainid,
        address(this),
        forecaster,
        marketId
    )
)
```

## Commit

Conceptual function:

```solidity
commitForecast(
    bytes32 marketId,
    uint16 pUpBps,
    ActionIntent intent
) returns (bytes32 trialId)
```

Must establish:

- `pUpBps <= 10000`;
- no prior canonical trial for `forecaster × marketId`;
- DreamDEX market exists;
- live onchain status is Trading;
- commit occurs at least `MIN_COMMIT_LEAD` before expiry;
- reference-market capture is attempted through the adapter;
- trial is persisted and emitted atomically.

Recommended demo lead:

```text
MIN_COMMIT_LEAD = 60 seconds
```

This is a product/demo policy, not a universal truth.

## Market reference

Target v0.1 method:

```text
marketId
  ↓
DreamDEX module/SDK-resolved market/pool
  ↓
best bid / best ask
  ↓
normalized midpoint
```

If bid or ask is missing or normalization fails:

```text
referenceValid = false
```

Never fabricate a value.

## Finalization

Conceptual:

```solidity
finalize(bytes32 trialId)
```

Permissionless.

Behavior:

- if DreamDEX market remains Trading/Locked: revert;
- if DreamDEX is Resolved: read winning outcome, compute scores, mark `SCORED`;
- if DreamDEX is Voided: mark `VOIDED`, do not produce forecast/market Brier scores;
- if already terminal: revert.

## Scoring

Use integer-normalized outcome:

```text
UP   = 10000
DOWN = 0
```

Then:

```text
forecastBrier = (pUpBps - outcomeBps)^2
marketBrier   = (referenceUpBps - outcomeBps)^2
marketScoreDelta = marketBrier - forecastBrier
```

Interpretation:

- positive delta: participant forecast had lower Brier error than market reference;
- zero: same error;
- negative: market reference had lower error.

Do not label one trial's delta as durable “skill.”

## Trading boundary

`RFTRegistry` must not:

- approve collateral;
- hold collateral;
- place DreamDEX orders;
- redeem outcome tokens;
- custody user assets.

The web/client coordinates optional DreamDEX execution separately.

## Trade linkage

Preferred DreamDEX linkage if verified by the SDK/raw trader path:

```text
DreamDEX Order.userData = trial.tradeTag
```

The read model can then associate DreamDEX order/fill evidence with the trial without giving RFT custody.

## Events

Minimum conceptual events:

```solidity
event ForecastCommitted(...);
event TrialScored(...);
event TrialVoided(...);
```

Events should contain enough data for a lightweight read model without duplicating every storage field.

### Target DreamDEX execution path

Subject to M0 verification:

```text
CircuitExecutor
  ↓
BinaryPool.placeBinaryOrderFor(owner, ...)
```

Binary Event Contract pools use specialized binary placement. Generic `placeOrderFor` must not be used.

The executor derives/enforces a maximum acceptable limit from:

```text
Forecast
minimum Circuit margin
```

and enforces worst-case spend against Circuit limits before calling DreamDEX.

See:

- `AUTHORITY_DECISION.md`
- `EXECUTION_POLICY.md`
