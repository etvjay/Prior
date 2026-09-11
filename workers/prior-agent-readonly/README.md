# PRIOR hosted Worker

The Worker is a bounded authenticated surface for PRIOR. It reads canonical Shannon detail state, exposes bounded discovery, and supports narrowly scoped client-signed Forecast commit and RFT-to-Circuit binding relays. It never holds a private key or signs for a user. Economic execution remains disabled.

## Endpoints

- `GET /health` — public liveness.
- `GET /v1/capabilities` — bearer-authenticated capability discovery.
- `GET /v1/discovery/markets?limit=1..20` — recent DreamDEX indexer sample, `discoveryCompleteness=BOUNDED`.
- `GET /v1/discovery/circuits` — explicit verified hero/supporting Circuit references, not a global index.
- `GET /v1/markets/:marketId` — canonical BinaryMarketsModule detail plus market nonce.
- `GET /v1/circuits/:circuitId` — deployed V2 `CircuitRegistryV2` intent/runtime tuple.
- `GET /v1/forecasts/:forecastId` — canonical RFTRegistry trial tuple.
- `POST /v1/forecast-submissions` — requires the separate `prior:forecast:submit` scope and a client-signed EIP-1559 Shannon transaction. Only `RFTRegistry.commitForecast` to the pinned RFT registry is accepted. The Worker validates chain, target, calldata, market, and recovered signer, forwards the raw transaction, and reads its receipt. Circuit binding and Circuit-forecaster validation are not performed by this relay; they remain a separate onchain operation.
- `POST /v1/circuit-bindings` — requires the separate write scope and a client-signed EIP-1559 `CircuitRegistryV2.bindTrial(circuitId, marketId, trialId)` transaction. The Worker preflights the active Circuit and matching committed RFT, verifies the Circuit owner signature, forwards the transaction, and reads back `getIteration`.
- `POST /mcp` — bearer-authenticated MCP JSON-RPC with the same read tools and client-signed Forecast and RFT-to-Circuit binding relay tools.

Authentication uses secret-backed `Authorization: Bearer ...` headers. Read and Forecast-write tokens are separate. Secret values are never stored in the repository or documentation.

## MCP

MCP exposes `initialize`, `tools/list`, `resources/list`, `tools/call` for `get_capabilities`, `get_market`, `get_circuit`, `get_forecast`, `discover_markets`, `discover_circuits`, `submit_signed_forecast`, and `bind_signed_trial`, plus `resources/read` for the listed resources.

## Evidence boundary

Detail reads are `SHANNON_RPC_READ_VERIFIED_FOR_BOUND_DETAILS` and bind to chain ID `50312` and deployed addresses. Forecast relay is `CLIENT_SIGNED_RELAY`: the client supplies the signed transaction, and the Worker has no signer custody. A relay response is classified from the transaction receipt as `INCLUDED`, `REVERTED`, or `UNKNOWN`; it is not an RFT proof until the returned trial ID is independently read from the RFT route.

Discovery uses the DreamDEX indexer only to find recent candidates; agents must verify each candidate through the canonical detail endpoint. Circuit discovery is an explicit bounded evidence list. No complete global index is claimed.

There is no hosted Circuit creation, signer custody, autonomous economic execution, order relay, D1 binding, Durable Object binding, or durable agent state. The client-signed Forecast and binding relays remain independently reviewable testnet write paths; a deployment alone does not promote them to verified live evidence.
