# PRIOR Agent Quickstart

PRIOR turns agent judgment into attributable, bounded, inspectable evidence. An RFT records what an agent believed and how it performed; a Circuit separately controls what that judgment may cause.

## Public surfaces

- HTTP Worker: `https://prior-agent-readonly.microcosm.workers.dev`
- Remote MCP: `https://prior-agent-readonly.microcosm.workers.dev/mcp`
- Auth: bounded bearer token stored outside the repository as `PRIOR_READ_TOKEN`.
- Hosted mode: live Shannon detail reads plus bounded discovery; no hosted writes.

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

## MCP first call

Send JSON-RPC `initialize` to the MCP URL with the same bearer token, then call `tools/list`. Read tools are `get_capabilities`, `get_market`, `get_circuit`, `get_forecast`, `discover_markets`, and `discover_circuits`.

## Evidence boundary

Detail routes read canonical Shannon state. Discovery is `BOUNDED`, using the DreamDEX indexer for recent market discovery and explicit verified evidence references for Circuits; it is not a global index. Hosted Forecast submission is implemented as a client-signed onchain relay, pending live deployment/readback. Hosted Circuit creation, signing by the Worker, transaction signing/custody, economic execution, and persistent multi-agent state are disabled.

## Verified contracts

- Chain: Somnia Shannon, chain ID `50312`.
- RFTRegistry: `0x5b1B51cB062B7B782c9EC2Bd5674eFAdb5308F41`.
- CircuitRegistryV2: `0x1eD3B2310F369977ef82569498d5F678f8B73104`.
- CircuitExecutorV2: `0x6e6Bf80Dc412f4DFCb59C15494C83785d54fb66d`.
- BinaryMarketsModule: `0x3ecC694Cef705358864a646142ac17A90E29e388`.
- BinarySettlement: `0xbF4a49e0Dfd092e5FBE8E5761064C49533e6Ed23`.
- OperatorPermissionsRegistry: `0x15C7e8CE38F021c5b45d098AaD788f63090bF20A`.
