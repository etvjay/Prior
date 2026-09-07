# V2 Deployment Metadata

Protocol version: `V2`

Status: `NOT_DEPLOYED`

Network target: Somnia Shannon (`chainId 50312`)

This milestone is local implementation/tests/docs only. No Shannon funding,
transaction broadcast, contract deployment, Forecast write, MCP operation, or
autonomous execution occurred. The fields below are intentionally placeholders
and are not deployment evidence.

| Artifact | Address/status |
|---|---|
| `RFTRegistry` dependency | `NOT_CONFIGURED` |
| `CircuitRegistryV2` | `NOT_DEPLOYED` |
| `CircuitExecutorV2` | `NOT_DEPLOYED` |

V2 requires a separately selected `RFTRegistry` constructor dependency. The
existing V1 deployment metadata in `deployments/shannon.json` is retained and
is not rewritten as V2. V2 has no proxy or in-place upgrade path: any future
release uses fresh addresses and separately observed constructor/configuration,
receipt, bytecode, and state evidence.

Source artifacts:

- `contracts/src/CircuitRegistryV2.sol`
- `contracts/src/CircuitExecutorV2.sol`
- `contracts/test/CircuitRegistryV2.t.sol`
- `contracts/test/CircuitExecutorV2.t.sol`
- `contracts/test/RFTRegistry.t.sol`
- `docs/CIRCUIT_RFT_BINDING.md`

Evidence ceiling: `MOCK_VERIFIED` only. Do not infer a deployed address,
class hash, receipt, or live readiness from these files.
