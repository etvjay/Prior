# Participation Model

## Decision

PRIOR V2 does **not** permit many independent forecasters to bind Forecasts into one canonical Circuit.

The smallest truthful public-participation mapping is:

```text
Public Circuit Template
→ participant inspects the template
→ participant connects a wallet
→ participant creates a canonical Circuit instance
→ participant address is owner and forecaster
→ participant submits one Forecast per eligible market
→ participant RFT binds to that participant-specific Circuit
```

The public card is an application-level template. It is not itself a shared canonical Circuit, and the UI must not imply that many forecasters write into one onchain Circuit.

## Contract basis

`CircuitRegistryV2.Intent.forecaster` is stored when the Circuit is created and is not mutable.

`CircuitRegistryV2.bindTrial` reads the canonical RFT trial and enforces:

```solidity
if (trial.forecaster != intent.forecaster) revert TrialForecasterMismatch();
```

The binding key is:

```text
Circuit × marketId → one trialId
```

`trialForIteration[circuitId][marketId]` rejects a second trial for the same Circuit iteration, and `processedMarket[circuitId][marketId]` enforces exactly-once advancement.

Therefore one canonical V2 Circuit cannot truthfully represent Forecasts from multiple participant addresses.

## Canonical truth versus application grouping

### Onchain truth

- each Circuit has one fixed owner;
- each Circuit has one fixed forecaster;
- each participant Forecast is a canonical RFT owned by that participant address;
- each Circuit-market iteration binds at most one RFT;
- each iteration advances at most once.

### Application grouping

The application may group participant-specific Circuits under a named public template such as `BTC · 15m · 4-market forecast-only run`.

That grouping provides discovery and consistent configuration. It is not a protocol object and must be labeled `PUBLIC TEMPLATE`, not `SHARED CIRCUIT`.

## Participation mode

Participation V1 is forecast-only:

```text
Forecasting: enabled
Economic execution: disabled
Capital required: none
Allowed actions bitmap: 0
```

Because `CircuitRegistryV2.create` currently rejects `maxPerMarket == 0`, a forecast-only instance still requires non-zero bounded numeric budget fields in the immutable intent. Those fields do not authorize spending when `allowedActionsBitmap == 0`; the UI must label execution disabled and must not request token approval, economic allowance, operator permission, or capital movement.

## Participant identity

```text
Participant A → Circuit instance A → RFT A
Participant B → Circuit instance B → RFT B
```

No aggregation or consensus Forecast is introduced. A participant may submit only one canonical Forecast per market under the existing RFT uniqueness rule.

## Recovery

A returning participant is recovered from the connected address and canonical reads. Local browser state may preserve draft convenience only; it is not authoritative for Circuit, Forecast, RFT, receipt, resolution, or progress state.

## Deferred

A true multi-forecaster shared canonical Circuit would require a new protocol design and is outside this milestone.
