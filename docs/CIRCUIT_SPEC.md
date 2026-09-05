# Circuit Specification v0.1

## Purpose

A Circuit persists one declared intent across a bounded sequence of eligible DreamDEX Event Contracts.

It is the execution-centric layer above individual Forecasts/RFTs.

## Circuit responsibilities

A Circuit owns:

- scope;
- window count / termination condition;
- forecast-source identity;
- policy parameters;
- budget and per-market limits;
- allowed actions;
- stop/pause conditions;
- authority configuration;
- progress;
- references to per-market RFTs;
- execution status.

A Circuit does **not** own:

- DreamDEX market creation;
- DreamDEX outcome resolution;
- Forecast mutation;
- a custom order book;
- unrestricted wallet authority.

## Initial scope

Supported market classes:

```text
BTC 15m
BTC 1h
ETH 15m
ETH 1h
```

Initial run lengths:

```text
4 markets
8 markets
12 markets
```

No arbitrary strategy DSL in v0.1.

## Intent schema

Conceptual:

```solidity
struct CircuitIntent {
    bytes32 circuitId;
    address owner;
    address forecaster;

    MarketClass marketClass;
    uint16 targetWindows;

    uint128 totalBudget;
    uint128 maxPerMarket;

    uint16 minDifferenceBps;

    uint8 maxConsecutiveLosses;

    uint64 startsAt;
    uint64 expiresAt;

    uint256 allowedActionsBitmap;
}
```

Exact collateral units and execution fields depend on DreamDEX M0/M1 verification.

## Public interpretation

```text
Market
BTC · 15m

Run
8 markets

Budget
$100

Max per market
$15

Act when
your Forecast differs from Market by at least 8 points

Pause after
2 consecutive losses
```

## Forecast source

Every Circuit has a Forecast Source.

### Manual

The user supplies the Forecast for each newly eligible market.

The Circuit persists the decision/execution rules.

### Agent

An agent/model supplies a signed Forecast automatically.

The Circuit may then progress without the owner being present.

## Iteration

Each eligible market generates at most one Circuit iteration.

```text
WAITING_FOR_MARKET
        ↓
MARKET_ELIGIBLE
        ↓
FORECAST_REQUESTED
        ↓
FORECAST_COMMITTED
        ↓
POLICY_EVALUATED
      ↙        ↘
 EXECUTE      ABSTAIN
      \        /
       ↓      ↓
WAITING_FOR_RESOLUTION
        ↓
RFT_FINALIZED
        ↓
CIRCUIT_UPDATED
        ↓
NEXT / PAUSE / COMPLETE
```

## Circuit status

Canonical conceptual states:

```text
DRAFT
AUTHORIZED
ACTIVE
PAUSED
STOPPED
COMPLETE
EXPIRED
REVOKED
```

Operational iteration states belong to the runner/read model and need not all be persisted as protocol status.

## Policy v0.1

Policy is deliberately small and deterministic.

The Circuit does **not** trade merely because the Forecast differs from the market midpoint.

User rule:

```text
Only act when executable price is at least N points
below the Forecast-implied value.
```

For Up:

```text
maxUpPrice = pUp - minMargin
```

For Down:

```text
maxDownPrice = (1 - pUp) - minMargin
```

The executor submits an IOC order with a limit no worse than the derived maximum acceptable price.

If sufficient liquidity does not exist:

```text
ABSTAIN / NO FILL
```

The market reference captured by RFT remains an evidence baseline, separate from execution price.

See `EXECUTION_POLICY.md`.
## Misses

Expected windows are preserved.

If an eligible market passes without a valid Forecast:

```text
MISSED
```

The Circuit must not silently compress the sequence.

## Circuit membership

Each included RFT must satisfy:

- same Circuit ID;
- expected market class;
- correct temporal position;
- one Circuit RFT per market;
- committed before market resolution.

## Completion

A Circuit completes when:

- declared window count is exhausted; or
- explicit terminal condition is reached.

`PAUSED`, `REVOKED`, `EXPIRED`, and `STOPPED` are distinct from `COMPLETE`.

## Derived Circuit evidence

At minimum:

```text
expected windows
completed Forecasts
missed windows
abstentions
executed actions
average Forecast Brier
market-relative comparisons
wins/losses where economic action occurred
capital used
remaining authority/budget
```

All aggregate values must be reconstructable from canonical RFTs, Circuit config, and execution evidence.
