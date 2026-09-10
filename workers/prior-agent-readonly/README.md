# Prior agent read-only Worker boundary

`src/index.ts` keeps `PriorApplicationService` as the shared authorization/capability boundary, but does not use its fixture-backed domain reads. Detail routes delegate to the explicit `src/live-read.ts` adapter, which performs keyless JSON-RPC `eth_call` reads against the verified Shannon deployment addresses and pinned SDK market ABI.

The adapter is deliberately bounded:

- `GET /v1/markets/:marketId` reads the canonical `marketId` binding from `BinaryMarketsModule` plus `marketNonce`.
- `GET /v1/circuits/:circuitId` reads the deployed V1 `CircuitRegistry` intent/runtime tuple.
- `GET /v1/forecasts/:id` reads the deployed `RFTRegistry` trial tuple.
- List/indexing routes return `NOT_CONNECTED`; no complete live index has been proven.
- There are no signers, writes, submission, execution, persistence, or D1 bindings.
- Responses declare `SHANNON_RPC_READ_ONLY`; upstream, malformed-ABI, and chain-mismatch failures fail closed.

The canonical addresses are intentionally not caller-configurable. Only the RPC URL may be supplied through the `SHANNON_RPC_HTTP` Worker binding.
