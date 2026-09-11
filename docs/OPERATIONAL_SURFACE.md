# PRIOR Operational Surface

PRIOR preserves continuity across recurring DreamDEX Event Contracts.

```text
Forecast captures belief.
RFT preserves evidence.
Circuit preserves intent.
```

## Human surface

The production web app is served from the Next.js web package. `/live` is the operational entry point. It reads the canonical V2 hero Circuit through `/api/continuity`, keeps the read server-side, and falls back to a clearly labeled accepted snapshot when Shannon is unavailable.

The live workspace presents:

```text
Circuit → market → Forecast → RFT → policy → execution/refusal → resolution → progress
```

Forecast signing remains client-owned. The browser signs the `commitForecast` transaction, observes the receipt, and refreshes canonical state. A transaction hash alone is not shown as commitment.

## Shared continuity read model

The stable application view is `prior.continuity.v1`, exported by `packages/agent-integration/src/continuity.ts`.

It composes source metadata, Circuit intent/runtime, market state, Forecast/RFT state, binding, policy, execution, resolution, and next state. It is an application read model, not a new protocol object or contract.

Source modes are explicit:

- `LIVE`: canonical Shannon read, chain ID and fetch metadata included;
- `ACCEPTED_SNAPSHOT`: committed historical evidence, with its evidence classification and historical freshness label.

## HTTP

Hosted Worker:

```text
GET  /health
GET  /v1/capabilities
GET  /v1/markets/:marketId
GET  /v1/circuits/:circuitId
GET  /v1/circuits/:circuitId/iterations/:marketId
GET  /v1/forecasts/:forecastId
GET  /v1/discovery/markets
GET  /v1/discovery/circuits
POST /v1/forecast-submissions
POST /v1/circuit-bindings
POST /mcp
```

`GET /v1/circuits/:circuitId/iterations/:marketId` is the canonical composed continuity read. It verifies Shannon chain identity, reads the existing Circuit, market, RFT, and iteration contracts, and returns `prior.continuity.v1`.

The local `packages/agent-integration` server remains fixture-backed and is labeled as local integration evidence. It does not claim a chain commit.

## MCP

Read tools include:

- `get_capabilities`
- `get_market`
- `get_circuit`
- `get_circuit_iteration`
- `get_forecast`
- `discover_markets`
- `discover_circuits`

Client-signed relay tools remain separate and non-custodial:

- `submit_signed_forecast`
- `bind_signed_trial`

Autonomous economic execution remains disabled. The Worker holds no signer key.

## Evidence boundary

The live V2 hero proves a real attributable Forecast, immutable RFT, V2 Circuit binding, zero-action refusal, canonical DreamDEX settlement, RFT scoring, and Circuit processing.

The V1 continuity artifact proves a separate historical two-market continuity path. It does not inherit V2 binding or action-enforcement claims.

Neither surface claims forecasting competence, production autonomous trading, global indexing, production identity federation, or durable multi-agent state.
