# PRIOR hosted read-only Worker

The Worker is a bounded public observation surface for PRIOR. It reads canonical Shannon detail state and exposes bounded discovery; it does not hold keys, sign, submit Forecasts, create Circuits, execute trades, or persist agent state.

## Endpoints

- `GET /health` — public liveness.
- `GET /v1/capabilities` — bearer-authenticated capability discovery.
- `GET /v1/discovery/markets?limit=1..20` — recent DreamDEX indexer sample, `discoveryCompleteness=BOUNDED`.
- `GET /v1/discovery/circuits` — explicit verified hero/supporting Circuit references, not a global index.
- `GET /v1/markets/:marketId` — canonical BinaryMarketsModule detail plus market nonce.
- `GET /v1/circuits/:circuitId` — deployed V2 `CircuitRegistryV2` intent/runtime tuple.
- `GET /v1/forecasts/:forecastId` — canonical RFTRegistry trial tuple.
- `POST /mcp` — bearer-authenticated read-only MCP JSON-RPC.

The public URL is `https://prior-agent-readonly.microcosm.workers.dev`. Authentication uses the Worker secret-backed `Authorization: Bearer $PRIOR_READ_TOKEN` header. The bearer value is never stored in the repository or documentation.

MCP exposes `initialize`, `tools/list`, `resources/list`, `tools/call` for `get_capabilities`, `get_market`, `get_circuit`, `get_forecast`, `discover_markets`, and `discover_circuits`, plus `resources/read` for the listed read resources. Unknown write tools fail cleanly.

## Evidence boundary

Detail reads are `SHANNON_RPC_READ_ONLY` and bind to the verified chain ID `50312` and deployed addresses. Discovery uses the DreamDEX indexer only to find recent candidates; agents must verify any candidate through the canonical detail endpoint. Circuit discovery is an explicit bounded evidence list. No complete global index is claimed.

There are no signers, writes, submission, execution, persistence, D1 bindings, or Durable Object bindings.
