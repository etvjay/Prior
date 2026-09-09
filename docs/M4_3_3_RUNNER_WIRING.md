# M4.3.3 bounded Runner wiring

## Scope

This slice adds dependency-injected Runner gateways and a zero-action lifecycle harness. It does not add a new protocol, signer, custody path, DreamDEX order path, deployment, funding, or transaction broadcast.

## Composition

```text
external Forecast Provider Protocol (EIP712_FORECAST_V2)
  -> injected forecaster/RFT commit callback
  -> injected owner-control bindTrial callback
  -> existing deterministic policy
  -> ABSTAINED / NOT_AUTHORIZED / ACTION_NOT_ALLOWED execution boundary
  -> injected DreamDEX settlement read
  -> injected permissionless RFT finalize callback
  -> injected owner-control advance callback
```

`CircuitControlGateway` intentionally exposes only `bind` and `advance`. It does not expose Circuit creation, authorization, activation, owner keys, or unrestricted execution. `ZeroActionExecutionGateway` never submits a DreamDEX order.

## Evidence classification

| Area | Classification | Basis |
|---|---|---|
| Runner composition | `UNIT_VERIFIED` | `apps/runner/src/workflow.test.ts`, adapter tests |
| Persistence/recovery | `UNIT_VERIFIED` | atomic checkpoint tests; no live restart evidence |
| External Forecast adapter | `LOCAL_HTTP_PROTOCOL_WIRED` | existing typed provider protocol client boundary; injected EIP712 signer/commit callback |
| Circuit bind/advance | `OWNER_CONTROL_CALLBACK_REQUIRED` | `CircuitRegistryV2.bindTrial` and lifecycle controls are owner-only |
| Zero-action lifecycle | `MOCK_VERIFIED` | local injected lifecycle test; no chain transaction |
| DreamDEX settlement | `READ_ADAPTER_BOUNDARY_ONLY` | outcome must come from injected DreamDEX read; no invented outcome |
| Autonomous economic Runner | `BLOCKED_EXTERNAL` | no unrestricted owner key and no DreamDEX economic write path |

No local test or simulated callback is live onchain evidence.
