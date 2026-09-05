# Circuit Review Skill

## Objective

Falsify whether a Circuit actually preserves bounded intent across multiple markets.

## Review dimensions

### Intent

- Is scope fixed before execution?
- Are target markets/windows unambiguous?
- Can intent change after activation?
- Are stop/pause/revocation rules explicit?

### Forecast source

- Is the declared forecaster attributable?
- Are automatic Forecasts signed/verified?
- Can the Runner substitute a Forecast?

### Policy

- Is policy deterministic?
- Does it use canonical inputs?
- Does it distinguish reference midpoint from executable price?
- Are abstentions explicit?

### Authority

- Can execution exceed total budget?
- Can it exceed per-market cap?
- Can it execute disallowed actions/markets?
- Can revoked/expired Circuits still trade?

### Iteration integrity

- max one RFT per Circuit/market;
- max one economic execution per Circuit/market;
- missed windows preserved;
- no arbitrary reordering.

### Continuity

- same intent persists across markets;
- runner restart does not recreate/modify intent;
- completed iteration evidence remains immutable.

## Mandatory adversarial tests

```text
retry same market twice
restart Runner mid-trade
revoke before next market
budget nearly exhausted
stop condition reached
Forecast missing
reference missing
market locks between decision and submit
DreamDEX trade reverts
market voids
```

## Verdict

Reject the Circuit milestone if it only renders a timeline but does not prove persistent execution intent.

### DreamDEX binary execution

- specialized `placeBinaryOrderFor` path used;
- exact operator selector verified;
- Runner is not directly operator-approved;
- pool binding rechecked by marketId before execution;
- collateral allowance state is explicit;
- limit price is derived from Forecast + configured margin;
- midpoint disagreement cannot override the limit.
