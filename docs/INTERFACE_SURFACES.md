# Interface Surface Plan

## Principle

Do not expose a surface because it is fashionable. Add it only when it serves a concrete actor.

## Current actors

```text
Human user
Web UI
Circuit Runner
Forecaster agent
DreamDEX
RFT/Circuit contracts
Future third-party integrator
```

## HTTPS

**Required.**

Used for deployed Prior UI and runner/service endpoints where applicable.

## Somnia JSON-RPC

**Required.**

Canonical EVM reads/writes, logs, receipts.

## WebSocket RPC / DreamDEX live watches

**Required for a strong Circuit experience, but not canonical truth.**

Used for:

- new market discovery;
- live order-book updates;
- status changes;
- resolution events;
- transaction/event responsiveness.

Fallback polling should exist.

## DreamDEX Markets SDK

**Required.**

Canonical Event Contract integration surface for client/runner where appropriate.

Exact verified version must be pinned.

## Internal Prior Core SDK

**Required from the beginning.**

Packages:

```text
packages/core
packages/dreamdex
packages/circuit
```

Shared by:

```text
apps/web
apps/runner
tests
scripts
```

It contains:

- types;
- scoring;
- policy evaluation;
- normalization;
- evidence reconstruction;
- contract clients.

## Public Prior SDK

**Not submission-critical, but natural post-proof surface.**

Potential:

```text
@prior/sdk
```

Do not publish until interfaces stabilize.

## REST API

**Not required for canonical functionality.**

Add a read API when indexing/history scale requires it.

Potential read-only routes:

```text
GET /v1/forecasts/:id
GET /v1/circuits/:id
GET /v1/history/:address
GET /v1/profile/:address
GET /v1/markets/:marketId/forecasts
```

Writes should remain signed/chain-mediated rather than opaque server mutations.

## Runner control API

A small internal authenticated API may be useful operationally:

```text
GET /health
GET /ready
GET /circuits/:id/runtime
POST /reconcile/:id
```

Do not expose “execute arbitrary trade” endpoints.

## MCP

**Not required for the first build.**

Future read-first MCP:

Resources:

```text
prior://forecast/{id}
prior://circuit/{id}
prior://profile/{address}
prior://market/{marketId}
```

Tools:

```text
list_live_markets
get_market_reference
get_forecast
get_circuit
verify_forecast
get_profile
```

Agent Forecast submission may later be supported as:

```text
submit_signed_forecast
```

MCP should not own trading credentials.

## Agent Forecast API

If agent forecasters run outside Prior, a narrow signed-forecast interface may be justified.

Payload:

```text
circuitId
marketId
pUpBps
validUntil
forecaster
signature
model/version metadata hash (optional)
```

Transport may be HTTP, SDK call, or MCP. The signature is the authority boundary, not transport.

## Database/indexer

With Circuits, a lightweight read model becomes more useful earlier, but remains non-canonical.

Recommended after core contracts work:

```text
Somnia/DreamDEX events
        ↓
indexer worker
        ↓
Postgres
        ↓
web/optional REST
```

Use it for:

- fast histories;
- Circuit timelines;
- aggregates;
- runner checkpoints;
- search/filter.

It must be rebuildable from canonical sources.
