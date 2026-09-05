# Backend Architecture and Interface Surface

## Recommendation

For the hackathon MVP, **do not build a conventional custom backend**.

The shortest trustworthy architecture is:

```text
Browser / Next.js
   │
   ├── wallet signer
   ├── Somnia RPC
   ├── @somnia-chain/markets-sdk
   │
   ├──────────────→ DreamDEX contracts/indexer/live streams
   │
   └──────────────→ RFTRegistry on Somnia
```

Optional read-model code may run server-side if needed for aggregate history, but it must not become an authority for canonical trial truth.

# Surface decisions

## HTTPS — REQUIRED

Why:

- production web deployment;
- wallet/browser security expectations;
- public demo;
- normal frontend hosting.

HTTPS is transport for the application, not a protocol primitive.

## Somnia JSON-RPC — REQUIRED

Use for:

- RFT contract reads;
- transaction writes via signer;
- receipts;
- logs;
- block references;
- deployment.

## WebSocket RPC / SDK live watches — DEMO-USEFUL

Use for:

- live DreamDEX order-book updates;
- live market lifecycle updates;
- reducing polling.

Do not build a custom WebSocket service for MVP.

## DreamDEX Markets SDK — REQUIRED

Use `@somnia-chain/markets-sdk` for Event Contract integration.

Do not use DreamDEX spot HTTP endpoints as if they expose Event Contracts.

## Custom REST API — NOT REQUIRED FOR MVP

A public REST layer adds little proof while creating:

- hosting;
- schema;
- cache consistency;
- indexing;
- versioning;
- rate limiting;
- auth questions.

The UI can read canonical state directly.

### Introduce REST only when we need:

- fast aggregate queries across many trials;
- third-party non-EVM clients;
- historical search;
- cached statistics;
- evidence exports.

Future shape:

```text
GET /v1/trials/:trialId
GET /v1/forecasters/:address/trials
GET /v1/forecasters/:address/stats
GET /v1/markets/:marketId/trials
```

Writes should generally remain wallet-signed onchain transactions rather than opaque server mutations.

## RFT SDK — POST-MVP BUT HIGH-VALUE

An SDK becomes useful once there is a third-party integration target.

Future package:

```text
@rft-protocol/sdk
```

Responsibilities:

```text
discover eligible DreamDEX markets
read trial
prepare commit transaction
prepare finalize transaction
normalize score display
verify trial evidence
query optional read model
```

It should not custody keys.

## MCP — NOT REQUIRED FOR HACKATHON

MCP is useful only if agents need a standardized tool/resource surface.

Do not add MCP merely because the product concerns agents.

### Sensible future MCP v1: read-first

Resources:

```text
rft://trial/{trialId}
rft://forecaster/{address}
rft://market/{marketId}
```

Tools:

```text
list_live_markets
get_market_reference
get_trial
get_forecaster_stats
verify_trial
```

### Write MCP

`commit_forecast` or `trade` creates authority/credential problems.

If later supported, execution must use:

- an external signer;
- explicitly scoped authority;
- budgets/limits;
- no server-held unrestricted private key;
- visible receipts and failure propagation.

For the current build, agent execution should use the SDK/contract interfaces directly under an explicit signer.

## Indexer / database — NOT REQUIRED INITIALLY

For tens/hundreds of hackathon trials, contract event scanning is sufficient.

Add a read model when:

- aggregate queries become slow;
- calibration buckets need efficient history;
- users/markets grow materially.

If introduced:

```text
chain + DreamDEX logs
        ↓
indexer worker
        ↓
Postgres/read DB
        ↓
REST/GraphQL
```

The DB is a projection and can be rebuilt.

## GraphQL — NOT OUR PUBLIC SURFACE

DreamDEX may use indexed GraphQL internally through its SDK. RFT does not need to expose its own GraphQL API unless later query complexity justifies it.

## Authentication

### MVP

No application accounts.

Identity = connected wallet address.

### Future

If offchain profile metadata is added, use wallet-signature/session authentication.

Never require backend auth for publicly readable chain evidence.

# Backend components by phase

## Necessary for idea

- RFT smart contracts.
- DreamDEX adapter.
- Somnia RPC.
- DreamDEX Markets SDK.
- browser signer.
- deterministic scoring.

## Necessary for convincing demo

- HTTPS web app.
- live market updates.
- evidence reconstruction.
- optional execution verifier.
- simple forecaster aggregates.

## Production requirements

- indexed read model;
- resilient RPC providers;
- reorg handling;
- monitoring/alerts;
- API versioning if public API exists;
- rate limiting;
- data reconciliation;
- security review;
- richer execution verification;
- dependency upgrade process.

## Can wait

- public REST.
- public SDK.
- MCP.
- GraphQL.
- dedicated backend account system.
- agent credential service.
- multi-chain API gateway.
