# Product Specification — Forecast Arena v0.1

## Product goal

Create the shortest convincing product loop proving that a pre-resolution belief can become independently reconstructable forecast evidence after a live DreamDEX Event Contract resolves.

## Primary user

A human forecaster or autonomous-agent operator who wants to test forecasting quality against live resolved markets.

## Primary job

> “Let me commit what I believe before the answer is known, compare it with what the market priced at that moment, optionally act on it, and later prove how good the forecast was.”

## Core flow

```text
Open Arena
  ↓
Select live Event Contract
  ↓
Set P(Up)
  ↓
Review market reference
  ↓
Commit forecast
  ↓
Trade Up / Trade Down / Abstain / Forecast-only
  ↓
Wait for DreamDEX resolution
  ↓
Finalize trial
  ↓
Inspect resolved evidence
  ↓
View forecaster history
```

## MVP surfaces

### `/`

Editorial landing page. Explains the primitive and routes into a live trial.

### `/arena`

Live trial workspace. One market is primary at a time. It is not a multi-widget trading dashboard.

### `/trial/[trialId]`

Evidence page for a single immutable trial.

### `/forecaster/[address]`

Evidence history and aggregate forecast statistics for one address.

## MVP capabilities

1. Wallet connection.
2. Live DreamDEX Event Contract discovery.
3. Live onchain market-status check.
4. Probability input.
5. Forecast commitment on Somnia.
6. Contemporaneous DreamDEX market-reference capture.
7. Explicit action intent:
   - Buy Up
   - Buy Down
   - Abstain
   - Forecast-only
8. Optional DreamDEX trade.
9. Trial finalization after DreamDEX resolves/voids.
10. Brier score.
11. Market-reference Brier score when reference data is valid.
12. Evidence page.
13. Forecaster history.

## Explicit non-goals for v0.1

- AI model hosting.
- Agent marketplace.
- copy trading.
- portfolio management.
- capital delegation.
- token/rewards.
- governance.
- custom oracle.
- ZK forecasts.
- generalized reputation score.
- multichain support.
- proprietary order book.
- custom settlement.
- full public REST API.
- MCP write surface.

## Success criteria

A reviewer can independently answer:

- Did this forecast exist before resolution?
- Was it immutable?
- Which DreamDEX market did it refer to?
- What market state was captured at commitment?
- What did DreamDEX eventually resolve?
- Was the market voided?
- Can the score be recomputed?
- Was the optional economic action separately evidenced?
- Is forecast skill kept separate from PnL?
