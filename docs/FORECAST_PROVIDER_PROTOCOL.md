# Forecast Provider Protocol v1

Status: frozen for M4.3. This is a narrow external Forecast transport protocol. It is not an onchain commitment protocol, a wallet protocol, an execution API, an oracle, or a model-quality claim.

The M4.3 implementation proves the external fixture path at `END_TO_END_VERIFIED` when the separate agent and server processes complete the HTTP exchange and the server reads the accepted record back through the core workflow. The fixture strategy and signer remain `NOT_CLAIMED` for forecasting intelligence and production cryptographic assurance. Live DreamDEX discovery, commitment, receipts, and RFT evidence remain `BLOCKED_EXTERNAL` unless independently observed.

A production-shaped `EIP712_V2` signer and recovery path is available locally for M4.3.2 prerequisite testing. Its local tests prove typed-data signing and expected-address recovery only. They do not change the historical fixture evidence classification, prove a live provider exchange, prove an onchain commitment, or authorize any network write.

## 1. Boundary and responsibilities

```text
external Forecast agent
  ├─ ForecastStrategy       -> probability and timing metadata
  ├─ ForecastSigner         -> signer address and signature metadata
  └─ ForecastProviderClient -> JSON/HTTP only
                                │
                                ▼
Prior provider HTTP boundary
  ├─ parse/validate protocol v1 DTOs
  ├─ verify the declared signature scheme (`FIXTURE_KECCAK_V1` or `EIP712_V2`)
  ├─ map the DTO to typed core objects
  └─ invoke ForecastProviderWorkflow exactly once as the core bridge
```

The external agent does not import `@prior/core`, `packages/core`, a Prior internal function, a Circuit, a contract client, an RPC client, or a DreamDEX adapter. It knows only this JSON wire contract and HTTP endpoints.

The Layer-3 server adapter is the only transport-to-core bridge. Provider-specific identity selection happens at that adapter's registration boundary. Core policy validation is provider-neutral and is not branched by provider name.

Transport authentication, Forecast authority, and execution authority remain separate:

```text
HTTP/session identity != Forecast signer != execution authority
```

A Forecast provider has no execution capability in v1.

## 2. Version and JSON rules

- `protocolVersion` is the literal string `"1"` on every v1 request, submission, and response.
- Wire payloads are JSON objects with the exact fields documented below. Unknown fields are rejected.
- Unix timestamps are non-negative decimal strings, for example `"1788664800"`. They are not JSON numbers and never use floating-point arithmetic.
- Hex values use a `0x` prefix and even hexadecimal length. `bytes32` values are exactly 32 bytes; addresses are exactly 20 bytes.
- `probabilityUpBps` and market-reference bps are JSON integers in `[0, 10000]`. `5000` means 50.00% Up; 100 bps is one percentage point.
- `marketId` is the canonical DreamDEX market identity. A pool address is not a substitute.
- The protocol carries no chain-of-thought, prompt, rationale, secret, credential, order, capital, or outcome field.

## 3. Provider identity and session identity

The provider identity is public attribution metadata:

```json
{
  "providerId": "0x<32-byte id>",
  "displayName": "provider label",
  "source": "adapter/source label",
  "sourceVersion": "adapter-version"
}
```

`providerId` identifies the provider implementation. `sessionId` identifies the bounded provider session that received the request. The HTTP transport principal is recorded by the Layer-3 adapter and is evidence of transport authentication only. Neither provider identity nor session identity grants capital or execution authority.

The Forecast signer is separate:

```text
forecaster       = typed AgentId, bytes32
forecasterAddress = attributable signer address, address
```

The server checks the signer identity against the issued request and the bound M4.1 Forecast principal. A provider cannot select a different forecaster in its POST body.

## 4. Request DTO and request identity

`GET /v1/forecast-requests/next?providerId=...&sessionId=...` returns:

```json
{
  "protocolVersion": "1",
  "requestId": "0x...",
  "provider": { "providerId": "0x...", "displayName": "...", "source": "...", "sourceVersion": "..." },
  "sessionId": "...",
  "circuitId": "0x...",
  "marketId": "0x...",
  "asset": "BTC",
  "intervalSec": 300,
  "opensAt": "200",
  "expiresAt": "500",
  "forecastDeadline": "400",
  "reference": null,
  "forecaster": "0x...",
  "forecasterAddress": "0x...",
  "nonce": "0x..."
}
```

`reference` is either `null` or a typed market-reference object containing `referenceUpBps`, `referenceValid`, and optional best-ask bps fields. A missing reference is explicit; it is never replaced with a guessed probability.

The request identity is deterministic and bound to provider/session attribution:

```text
requestIdentityMaterial = {
  domain: "PRIOR_FORECAST_REQUEST",
  protocolVersion: "1",
  circuitId,
  marketId,
  providerId,
  sessionId,
  nonce
}

requestId = keccak256(UTF8(canonicalJson(requestIdentityMaterial)))
```

`canonicalJson` recursively sorts object keys, preserves strings exactly, and does not encode a bigint or floating-point value. The server rejects a supplied `requestId` that does not equal this value. The Layer-3 bridge maps the accepted wire `requestId` to the optional core `ForecastRequest.forecastId`, so the core request identity and the external request identity are the same record.

The request is scoped to one `circuitId × marketId` iteration. The request does not authorize execution.

## 5. Submission DTO

`POST /v1/forecast-submissions` accepts:

```json
{
  "protocolVersion": "1",
  "requestId": "0x...",
  "provider": { "providerId": "0x...", "displayName": "...", "source": "...", "sourceVersion": "..." },
  "sessionId": "...",
  "circuitId": "0x...",
  "marketId": "0x...",
  "forecaster": "0x...",
  "forecasterAddress": "0x...",
  "probabilityUpBps": 6200,
  "generatedAt": "201",
  "validUntil": "400",
  "nonce": "0x...",
  "sourceType": "AGENT",
  "sourceVersion": "INTEGRATION_FIXTURE/v1",
  "signatureScheme": "FIXTURE_KECCAK_V1",
  "signature": "0x..."
}
```

The server requires the request ID, provider/session identity, circuit, market, forecaster, signer address, and nonce to match the issued request. Core validation additionally checks the mandate, binding, Forecast capability, source type, time window, probability range, and immutable one-per-forecaster-per-market idempotency boundary.

The accepted response contains the deterministic `submissionId`, `idempotencyKey`, the attributed provider and transport principal, `submittedAt`, and:

```text
chainCommitment = "NOT_SUBMITTED"
```

This response is an offchain domain record, not a transaction receipt.

## 6. Forecast signer domain

The exact v1 sign material is:

```json
{
  "protocolVersion": "1",
  "marketId": "0x...",
  "circuitId": "0x...",
  "forecaster": "0x...",
  "probabilityUpBps": 6200,
  "generatedAt": "201",
  "validUntil": "400",
  "nonce": "0x..."
}
```

No provider display text, model prompt, rationale, market pool address, or execution parameter is silently substituted into this domain. The signature preimage is:

```text
"PRIOR_FORECAST_SIGN_V1:" + canonicalJson(signMaterial)
```

The integration fixture uses:

```text
signature = keccak256(UTF8(signature preimage))
signatureScheme = "FIXTURE_KECCAK_V1"
```

This is a deterministic fixture digest. It is labeled `fixture signature` and `FIXTURE_RECOMPUTED_NOT_PRODUCTION_CRYPTOGRAPHIC_VERIFICATION`. It is not a wallet signature, does not prove control of the displayed address, and must not be described as production cryptographic verification. A production signer may implement the same `ForecastSigner` port only when its key custody and verification path are separately accepted.

Changing any of `protocolVersion`, `marketId`, `circuitId`, `forecaster`, `probabilityUpBps`, `generatedAt`, `validUntil`, or `nonce` changes the fixture digest or is rejected as an unsupported domain. The server recomputes the v1 fixture digest before invoking core validation.

### 6.1 Production-shaped EIP-712 v2 signer

`EIP712_V2` is an available cryptographic signer/verification path for the same protocol-v1 submission DTO. It is vendor-neutral at the `ForecastSigner` port and uses the Ethereum typed-data account interface.

The fixed EIP-712 domain is:

```text
name:              PRIOR Forecast
version:           2
chainId:           50312
verifyingContract: 0x5b1B51cB062B7B782c9EC2Bd5674eFAdb5308F41
primaryType:       ForecastSubmission
```

The `ForecastSubmission` type contains exactly these fields, in this order:

```text
protocolVersion   string
requestId         bytes32
marketId          bytes32
circuitId         bytes32
forecaster        bytes32
forecasterAddress address
probabilityUpBps  uint16
generatedAt       uint64
validUntil        uint64
nonce             bytes32
sourceType        string
sourceVersion     string
```

Wire timestamp strings are converted to uint64 typed-data values after validation. No provider display text, session identifier, rationale, execution parameter, or other field is included in this EIP-712 struct. The agent uses viem `account.signTypedData`; the provider server recovers the typed-data address and compares it with the issued request's expected `forecasterAddress` before core validation.

The local runtime selector is fail-closed: `PRIOR_FORECAST_SIGNER_MODE=live` requires either `PRIOR_FORECASTER_PRIVATE_KEY_PATH` or `PRIOR_FORECASTER_PRIVATE_KEY`. The key is read only at runtime and is never printed. With no explicit live mode, the demo continues to use `FIXTURE_KECCAK_V1`. This selector and signer path do not perform an RPC call or authorize a chain write.

The EIP-712 path is cryptographically meaningful, but its current evidence ceiling is local deterministic signing/recovery tests. It must not be substituted into the historical fixture artifact or represented as live M4.3.2 evidence until a separately authorized external run is observed.

## 7. Timestamps and deadline rules

All times are Unix seconds represented as decimal strings on the wire.

- `opensAt < expiresAt`.
- `forecastDeadline` is `null` or lies within the market window.
- `generatedAt >= opensAt` and before `expiresAt`.
- `generatedAt` must not miss `forecastDeadline` when a deadline is present.
- `validUntil > generatedAt` and `validUntil <= expiresAt`.
- The provider server records the accepted domain object only while the bound mandate and binding are active.
- The server's `submittedAt` is the core workflow acceptance time, not a client-supplied claim.

The external agent may not extend a request deadline by changing `validUntil` or by retrying after expiry.

## 8. Replay and idempotency

There are two identities:

```text
requestId = deterministic issued request identity

submissionId = core Forecast submission identity for requestId × forecaster
idempotencyKey = core v0.1 uniqueness key for circuitId × marketId × forecaster
```

A byte-for-byte replay of an accepted submission returns the same accepted record. A conflicting submission for the same `circuitId × marketId × forecaster` is rejected; it cannot create a second Forecast. A changed probability with the old signature is rejected at the signature-domain fence before core recording. A changed valid submission is rejected as a conflicting duplicate by the core workflow.

The server's readback route is:

```text
GET /v1/forecast-submissions/:submissionId
```

A caller must read this route before treating an HTTP acceptance response as independently observed evidence.

## 9. Error contract

Error responses are JSON with `protocolVersion`, `code`, and a redacted human-readable `message`. The v1 codes are:

| Code | Meaning |
|---|---|
| `INVALID_JSON` | Body is not JSON. |
| `INVALID_WIRE` | Required type, range, timestamp, hex, or exact-field rule failed. |
| `UNSUPPORTED_PROTOCOL_VERSION` | The version is not literal `"1"`. |
| `REQUEST_ID_MISMATCH` | `requestId` is not the deterministic identity of the request. |
| `PROVIDER_IDENTITY_MISMATCH` | Provider metadata does not match the issued session. |
| `SESSION_ID_MISMATCH` | Submission is from a different session than the request. |
| `CIRCUIT_ID_MISMATCH` / `MARKET_ID_MISMATCH` | Domain identity does not match the request. |
| `FORECASTER_ID_MISMATCH` / `FORECASTER_ADDRESS_MISMATCH` | Signer attribution does not match the request. |
| `NONCE_MISMATCH` | Replay/signing nonce does not match the request. |
| `SIGNATURE_DOMAIN_MISMATCH` | The declared signature does not validate against its selected domain. |
| `SIGNATURE_RECOVERY_MISMATCH` | Recovered EIP-712 address does not match the expected forecaster address. |
| `INVALID_SUBMISSION_WINDOW` | Core time/deadline validation failed. |
| `CONFLICTING_DUPLICATE` | An immutable forecaster/market record already exists with different content. |
| `REJECTED_AUTHORITY` | The caller attempted an execution operation outside Forecast authority. |
| `BLOCKED_EXTERNAL` | A live market, signer, receipt, or chain readback is unavailable; this is an evidence classification, not a retry instruction. |

## 10. Execution boundary

The only execution route included for the M4.3 negative proof is:

```text
POST /v1/execution-requests
```

It returns HTTP `403` and `status = "REJECTED_AUTHORITY"`, with `executionAuthority = false`. The server does not invoke an executor, Circuit, DreamDEX adapter, contract, wallet, RPC write, or capital path. HTTP authentication and a valid signed Forecast do not change this result.

M4.3 explicitly does not add MCP, contracts, DreamDEX execution, spending, a new Circuit, ranking, marketplace, consensus, or automatic capital escalation.
