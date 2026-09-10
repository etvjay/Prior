# Prior agent integration

Offchain, read-first integration surfaces share `PriorApplicationService`: versioned HTTP routes, a typed Node SDK, and a transport-agnostic MCP core. The service uses the existing `ForecastProviderWorkflow`; it does not custody keys, determine market outcomes, or execute trades.

## Quickstart (7 lines)

```ts
import { createPriorHttpServer, PriorClient } from "@prior/agent-integration";
const server = await createPriorHttpServer();
const client = new PriorClient({ baseUrl: server.url, scopes: ["prior:read"] });
console.log(await client.capabilities());
console.log(await client.getMarket("0x" + "3".repeat(64)));
await server.close();
```

Auth is a scope hook for this local surface: send `x-prior-scope: prior:read` or `prior:forecast:submit`; deployments must replace it with their authenticated principal mapping. All reads are bounded; market/circuit listing clamps `limit` to 100 and supports `offset`. Forecast submission remains explicitly signed and provider-scoped and returns `chainCommitment: NOT_SUBMITTED` for this offchain adapter. MCP is intentionally transport-agnostic because no MCP SDK dependency is present; embed `PriorMcpCore` in an MCP transport adapter.

There is no arbitrary execution endpoint or MCP execution tool. The fixture provider signature path is supported by this package; production EIP-712 relay remains available in the existing `forecast-provider-server` boundary and is not widened here.
