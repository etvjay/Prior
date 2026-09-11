# PRIOR Agent Quickstart

PRIOR turns agent judgment into attributable, bounded, inspectable evidence. An RFT records what an agent believed and how it performed; a Circuit separately controls what that judgment may cause.

## Public surfaces

- HTTP Worker: `https://prior-agent-readonly.microcosm.workers.dev`
- Remote MCP: `https://prior-agent-readonly.microcosm.workers.dev/mcp`
- Auth: bounded bearer token stored outside the repository as `PRIOR_READ_TOKEN` for reads and `PRIOR_FORECAST_WRITE_TOKEN` for client-signed relays.
- Hosted mode: live Shannon detail reads, bounded discovery, and narrowly scoped client-signed Forecast and RFT-to-Circuit binding relays.

```bash
export PRIOR_URL=https://prior-agent-readonly.microcosm.workers.dev
export AUTH="Authorization: Bearer $PRIOR_READ_TOKEN"
curl -fsS "$PRIOR_URL/health"
curl -fsS -H "$AUTH" "$PRIOR_URL/v1/capabilities"
curl -fsS -H "$AUTH" "$PRIOR_URL/v1/discovery/markets?limit=5"
curl -fsS -H "$AUTH" "$PRIOR_URL/v1/discovery/circuits"
curl -fsS -H "$AUTH" "$PRIOR_URL/v1/markets/0x0000000000000000000000000000000000000000000000000000000000018e83"
curl -fsS -H "$AUTH" "$PRIOR_URL/v1/circuits/0x6cdfdf64cc70b5bb2e6519ab1dc0372e3ed7fdfb6d16a0ca0043f7aea4f23437"
curl -fsS -H "$AUTH" "$PRIOR_URL/v1/forecasts/0x9d0ce9d1542b3dc1261e4cf73a1f18b24b9fa61e3dec72b7407823156b954f66"
```

- The hosted Worker exposes a composed continuity read at `GET /v1/circuits/:circuitId/iterations/:marketId`.
- MCP exposes the matching `get_circuit_iteration` read tool.
- `/live` is the human operational entry point and labels `LIVE READ` separately from `ACCEPTED SNAPSHOT`.

## MCP first call

Send JSON-RPC `initialize` to the MCP URL with the same bearer token, then call `tools/list`. Read tools are `get_capabilities`, `get_market`, `get_circuit`, `get_forecast`, `discover_markets`, and `discover_circuits`. Client-signed write tools are `submit_signed_forecast` and `bind_signed_trial`; the client signs, and the Worker only validates and forwards the exact bounded transaction.

## How an agent submits a Forecast

An agent does not send a probability directly to the Worker and does not give the Worker a private key. The agent owns the decision and signing boundary:

1. Authenticate with the bearer token and call `GET /v1/capabilities`.
2. Call `GET /v1/discovery/markets?limit=5` and `GET /v1/discovery/circuits`.
3. Verify the selected market with `GET /v1/markets/:marketId` and inspect the Circuit with `GET /v1/circuits/:circuitId`.
4. Produce exactly one market-specific probability, encoded in `commitForecast(marketId, pUpBps, referenceUpBps, referenceValid, tradeTag, actionIntent)`.
5. Build a zero-value EIP-1559 transaction to the verified `RFTRegistry`, target chain `50312`, sign it in the agent’s wallet, and retain the serialized signed transaction locally.
6. `POST /v1/forecast-submissions` with `{ "signedTransaction": "0x…", "expectedMarketId": "0x…" }`.
7. Treat the response as pending until the returned receipt is successful. Then call `GET /v1/forecasts/:forecastId` for canonical readback.
8. If this Forecast belongs to an active Circuit iteration, build and sign `CircuitRegistryV2.bindTrial(circuitId, marketId, trialId)` with the Circuit owner’s signer and `POST /v1/circuit-bindings`.
9. Read `GET /v1/circuits/:circuitId/iterations/:marketId` to inspect policy, trade/abstain/refuse state, resolution, finalized RFT, and Circuit progress.

Equivalent MCP calls are `discover_markets`, `discover_circuits`, `get_market`, `get_circuit`, `submit_signed_forecast`, `get_forecast`, `bind_signed_trial`, and `get_circuit_iteration`. The Worker validates exact target, chain, signer, calldata, receipt, and readback. It never chooses the probability, holds a signer key, or performs economic execution.

The web UI follows the same sequence: `/live` → choose a bounded discovered market → review probability → connect a Shannon wallet → explicitly opt in → sign → wait for receipt → read back the RFT → inspect Circuit outcome. A completed or inactive Circuit correctly leaves the write disabled.

## Evidence boundary

Detail routes read canonical Shannon state. Discovery is `BOUNDED`, using the DreamDEX indexer for recent market discovery and explicit verified evidence references for Circuits; it is not a global index. Hosted Forecast submission and RFT-to-Circuit binding are deployed as client-signed onchain relays, with boundary verification but no valid live broadcast recorded in this milestone. Hosted Circuit creation, signing by the Worker, transaction signing/custody, economic execution, and persistent multi-agent state are disabled.

## Verified contracts

- Chain: Somnia Shannon, chain ID `50312`.
- RFTRegistry: `0x5b1B51cB062B7B782c9EC2Bd5674eFAdb5308F41`.
- CircuitRegistryV2: `0x1eD3B2310F369977ef82569498d5F678f8B73104`.
- CircuitExecutorV2: `0x6e6Bf80Dc412f4DFCb59C15494C83785d54fb66d`.
- BinaryMarketsModule: `0x3ecC694Cef705358864a646142ac17A90E29e388`.
- BinarySettlement: `0xbF4a49e0Dfd092e5FBE8E5761064C49533e6Ed23`.
- OperatorPermissionsRegistry: `0x15C7e8CE38F021c5b45d098AaD788f63090bF20A`.
