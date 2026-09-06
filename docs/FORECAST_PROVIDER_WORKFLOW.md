# M4.2 Forecast Provider / Domain Workflow

Status: `UNIT_VERIFIED` / local domain behavior only.

M4.2 adds the first local workflow for one identified Forecast provider to
answer one scoped `ForecastRequest` and produce one attributable,
immutable `ForecastSubmissionRecord`. It does not make a network write.

## Boundary

```text
AgentBinding.apiPrincipal
        = authenticated transport identity
        │
        ▼
ForecastProvider.apiPrincipal + provider.identity
        │ getForecast(request)
        ▼
ForecastProviderResponse
        │
        ▼
ForecastProviderWorkflow.recordProviderResponse(...)
        │
        ▼
ForecastSubmissionRecord
```

`ForecastProvider` contains a typed `providerId`, display name, source, and
source version, plus an authenticated transport principal. It has no wallet,
private key, signer method, executor address, capital limit, or execution
capability. The provider's identity is not the forecaster's authority.
`ForecastSubmission.forecasterAddress` is the supplied attributable signer
address. This milestone checks its linkage to the `AgentPrincipal` and
`AgentBinding`; it does not create a wallet or perform cryptographic signing.

The public workflow is exported from `@prior/core`:

- `acceptRequest(request, acceptedAt)` validates the existing M4.1 mandate
  scope and returns an immutable `AcceptedForecastRequest`.
- `ask(provider, acceptedRequest)` invokes the typed adapter response boundary.
- `recordProviderResponse(request, provider, response, recordedAt)` validates
  the response and stores the immutable local record.
- `askAndRecord(...)` is the equivalent local convenience path.
- `getSubmission(...)` and `getSubmissionByIdempotencyKey(...)` are read-only
  lookups.

The workflow requires an active M4.1 `AgentBinding` with
`submitForecast`. Provider transport authentication must match that binding's
`apiPrincipal`; authentication alone does not grant Forecast authority,
execution authority, or capital authority. The record preserves the matched
transport principal as read-only evidence, while keeping it separate from the
Forecast signer and authority capabilities.

## Validation

The existing typed validators remain the source of truth for mandate,
binding, request, probability, time, and signer checks. The workflow adds the
provider and recording boundary checks:

- provider identity, source metadata, adapter function, and transport
  principal are present and typed;
- response provider ID and request ID match the adapter and scoped request;
- market ID and optional circuit ID match the request;
- forecaster is in the mandate Forecast roster and the binding has
  `submitForecast`;
- signer address and source type match the authorized principal;
- `probabilityUpBps` remains an integer in `[0, 10000]`;
- generated, validity, request, mandate, binding, and forecast-deadline
  windows hold at recording time;
- an optional submission policy hash, when emitted, matches the canonical
  M4.1 policy hash;
- the signature field is non-empty hexadecimal metadata. M4.2 does not claim
  cryptographic signature verification.

## Identity and idempotency

For a request and forecaster:

```text
requestId = forecastRequestIdentity(request)
submissionId = keccak256(
  encodePacked("PRIOR_FORECAST_SUBMISSION", requestId, forecaster)
)
idempotencyKey = keccak256(
  encodePacked(
    "PRIOR_FORECAST_SUBMISSION_IDEMPOTENCY",
    circuitId,
    marketId,
    forecaster
  )
)
```

`submissionId` is deterministic for the request identity. The conservative
v0.1 `idempotencyKey` also binds circuit, canonical DreamDEX `marketId`, and
forecaster, so a second request ID cannot create a second accepted Forecast
for the same market. Repeating the exact accepted response returns the same
record. A changed probability, signer, provider metadata, request, or other
canonical field is rejected as a conflicting duplicate.

The record deep-freezes its request, provider metadata, and submission. It
contains `chainCommitment: "NOT_SUBMITTED"` and deliberately contains no
transaction hash, receipt, RPC result, order, or capital effect.

## Minimal additive refinement

M4.2 adds optional `circuitId` and `policyHash` linkage fields to
`ForecastSubmission`. Existing M4.1 submissions without those optional fields
remain valid. When present, the M4.1 validator and M4.2 workflow validate
both fields against the request and canonical policy. The validator also now
rejects an empty `0x` signature, matching the documented requirement for an
actual signature value. These refinements are covered by
`packages/core/test/forecastProvider.test.ts` and preserve the existing M4.1
validator boundary.

## Evidence ceiling and next gate

Current evidence is:

```text
UNIT_VERIFIED
```

It proves deterministic local validation, identity, immutability, readback,
and idempotency using a fixture provider. It does not prove an external agent,
live API, cryptographic signature verification, chain commitment, transaction
receipt, onchain Forecast, RFT, or DreamDEX execution.

The next live evidence gate is an `external attributable submission`: an
external provider/agent must supply a real authenticated response and a real
signer-linked Forecast through an integration adapter, with independent
readback of the accepted submission. That gate remains separate from a later
onchain Forecast commitment and receipt gate.

No MCP, marketplace, ranking, consensus, auto-capital escalation, new Circuit,
contract change, wallet signing, RPC call, live write, or autonomous DreamDEX
execution is part of M4.2.

## M4.3 external first-party agent boundary

M4.3 freezes the transport contract in `docs/FORECAST_PROVIDER_PROTOCOL.md` and
adds three separate local packages:

- `packages/forecast-protocol` contains only JSON DTO parsing, deterministic
  request/signature-domain helpers, and fixture metadata;
- `packages/forecast-agent` is an external HTTP-only process with separate
  `ForecastProviderClient`, vendor-neutral `ForecastStrategy`, and
  `ForecastSigner` ports; it has no `@prior/core` dependency;
- `packages/forecast-provider-server` is the Layer-3 adapter and the only
  transport-to-`ForecastProviderWorkflow` bridge.

The separate-process demo runs fixture providers A and B through the same HTTP
and core validation path, reads both accepted records back, proves exact replay
idempotency, rejects a tampered signature domain, and returns
`REJECTED_AUTHORITY` for an execution request. Its artifact is
`evidence/external-forecast-agent.json`.

The external fixture/authentication/attribution path is `END_TO_END_VERIFIED`
with an `X2_EXTERNAL_FIXTURE_ONLY` ceiling. The deterministic strategy is
`INTEGRATION_FIXTURE` and forecasting intelligence is `NOT_CLAIMED`. The
fixture digest is explicitly not production cryptographic verification. Live
DreamDEX market-reference, funded signer, onchain commitment, receipt, and RFT
fields remain `BLOCKED_EXTERNAL` and are stored as `null`, not backfilled.
