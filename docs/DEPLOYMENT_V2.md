# V2 Deployment Metadata

Protocol version: `V2`

Status: `SHANNON_WRITE_VERIFIED`

Network: Somnia Shannon (`chainId 50312`)

This document originally recorded the pre-deployment local design state. That historical record is superseded by the verified deployment and lifecycle evidence below; existing V1 metadata remains separate and is not rewritten.

## Verified addresses

| Artifact | Address |
|---|---|
| `RFTRegistry` dependency | `0x5b1B51cB062B7B782c9EC2Bd5674eFAdb5308F41` |
| `CircuitRegistryV2` | `0x1eD3B2310F369977ef82569498d5F678f8B73104` |
| `CircuitExecutorV2` | `0x6e6Bf80Dc412f4DFCb59C15494C83785d54fb66d` |
| `BinaryMarketsModule` | `0x3ecC694Cef705358864a646142ac17A90E29e388` |
| `OperatorPermissionsRegistry` | `0x15C7e8CE38F021c5b45d098AaD788f63090bF20A` |

## Deployment evidence

- `deployments/shannon-v2.json` records the authorized two-deployment packet, constructor readbacks, and immutable-aware runtime matches.
- `CircuitRegistryV2` deployment transaction: `0xcaf3049627145d08b3b8908aa4fb6d2844f6b86d45c8dcb6e5596e13a81ae213`.
- `CircuitExecutorV2` deployment transaction: `0xc514a3fbc159f433cbb3af8dd8481bc08d429c8cfa96d1eb90a8f5899be91ff2`.
- The M4.3 hero lifecycle independently proves V2 Circuit creation, authorization, activation, RFT binding, zero-action refusal, settlement, finalization, and advancement.

## V2 hero lifecycle

- Circuit: `0x6cdfdf64cc70b5bb2e6519ab1dc0372e3ed7fdfb6d16a0ca0043f7aea4f23437`.
- Market: `0x0000000000000000000000000000000000000000000000000000000000018e83`.
- Trial/RFT: `0x9d0ce9d1542b3dc1261e4cf73a1f18b24b9fa61e3dec72b7407823156b954f66`.
- Final iteration: `bound=true`, `processed=true`, Circuit `COMPLETE`.
- `BUY_UP` and `BUY_DOWN`: `ActionNotAllowed`.
- Economic execution: zero.

## Boundaries

The hosted Worker now has a separately scoped, client-signed Forecast relay implementation: it can forward only an EIP-1559 `RFTRegistry.commitForecast` transaction after target, chain, signature, replay, receipt, and `trialFor` checks. It does not hold a key. This implementation is now deployed and its authenticated boundary is externally verified. No live Forecast broadcast has been performed in this milestone; hosted economic execution remains disabled.

Source artifacts:

- `contracts/src/CircuitRegistryV2.sol`
- `contracts/src/CircuitExecutorV2.sol`
- `contracts/test/CircuitRegistryV2.t.sol`
- `contracts/test/CircuitExecutorV2.t.sol`
- `contracts/test/RFTRegistry.t.sol`
- `evidence/m4-3-live-zero-action-lifecycle.json`
