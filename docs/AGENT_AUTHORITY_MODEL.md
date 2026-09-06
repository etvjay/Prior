# Prior Agent Authority Model, M4.1

Status: domain and design foundation only. This model adds no MCP server, no new Circuit, no new contract, and no new autonomous DreamDEX execution path.

## 1. Authority is five separate questions

Prior separates authority by what an actor may do:

| Authority | Meaning | What it does not mean |
|---|---|---|
| Transport/API authority | An API, HTTP, MCP, or SDK principal is authenticated for a transport. | It is not capital permission, Forecast permission, or execution permission. |
| Forecast authority | A named principal may produce one attributable, signed probability for an eligible market request. | It is not permission to trade, reserve budget, or change a policy. |
| Execution authority | A named executor may evaluate or submit an already issued, fixed `AuthorizedAction`. | It is not Forecast authority, policy expansion authority, or arbitrary order-parameter authority. |
| Capital authority | A policy envelope limits maximum per-market spend, total budget, and configured stop loss. | It is not granted by an API key, a model identity, a Forecast signature, or a Runner. |
| Owner authority | The owner approves a policy, confirms expansions, attenuates or terminates it, and revokes future authority. | It does not rewrite committed Forecasts, RFTs, actions, or execution evidence. |

The following statements are hard boundaries:

```text
API auth is not capital permission.
Execution address is not Forecast authority.
Forecast authority is not capital authority.
Forecast authority is not execution authority.
Execution authority is not Forecast authority.
```

Only the owner may expand budget or scope, extend expiry, weaken a limit such as `minMarginBps`, add capabilities, or replace principals where the replacement is an expansion. An agent may only attenuate an already approved authority. It may not self-expand.

An owner expansion is not an in-place mutation of an approved snapshot. It requires a new draft or policy version, typed validation, human confirmation, owner approval, a new `policyHash`, and explicit activation. A reduction or termination receives a new derived snapshot and leaves the parent snapshot immutable.

## 2. Identity chain

An `AgentBinding` makes the identity chain explicit:

```text
AgentPrincipal identity
  <-> authenticated API/MCP/SDK principal
  <-> Circuit
  <-> Forecast signer
  <-> execution/session signer
```

The fields are intentionally separate:

- `agentId` identifies the typed principal in the Mandate roster.
- `apiPrincipal` identifies the authenticated transport principal. Its `transport` and `principalId` are not a spend credential.
- `circuitId` binds the binding to one existing Circuit context.
- `forecastAddress` identifies the address used to sign a Forecast, when Forecast capability is present.
- `executorAddress` identifies the address/session signer associated with execution capability, when present.
- `readCapabilities`, `forecastCapabilities`, and `executeCapabilities` are separate typed arrays. There is no generic `permissions: string[]` field.
- `issued`, `expires`, `mandateId`, and `policyHash` limit the binding to one policy snapshot and time window.

A binding with only `submitForecast` cannot execute. A binding with only `executeAuthorizedAction` cannot submit a Forecast. A binding with an API or MCP principal but no execute capability cannot obtain capital permission by presenting that principal.

M4.1 validates this chain in `validateAgentBinding`. It does not mint a credential, run an API, or manage MCP sessions.

## 3. Forecast authority

A `ForecastRequest` is a typed request for one Circuit iteration:

```text
circuitId
marketId
asset
intervalSec
opensAt
expiresAt
forecastDeadline?
reference?
```

The request is valid only when the market ID, asset, cadence, and time window fit the Mandate scope and temporal authority. The optional reference is contemporaneous market evidence. It is not outcome authority.

A `ForecastSubmission` contains only an attributable signed probability:

```text
marketId
circuitId?            optional domain linkage to the request
policyHash?           optional policy-snapshot linkage
forecaster: AgentId
forecasterAddress: Address
probabilityUpBps: [0, 10000]
generatedAt
validUntil
sourceType: HUMAN | AGENT | MODEL | SERVICE
sourceVersion
signature
```

There is deliberately no chain-of-thought, reasoning, rationale, prompt, or private model trace. A model version can identify the source artifact, but it does not prove the truth of model reasoning. M4.2 validates the optional circuit and policy links when a provider emits them.

Submission validation checks:

- the request and policy scope;
- the market ID;
- the Forecast principal roster and `submitForecast` authority;
- source type and signer address;
- generation, deadline, and validity windows;
- an active, non-expired policy;
- an optional binding linked to the request's Circuit and the canonical policy hash;
- an actual hexadecimal signature value.

One v0.1 canonical Forecast is accepted per authorized forecaster and market. Once committed, the probability, market, signer, and commitment evidence cannot be mutated.

## 4. Execution authority

Execution is envelope-based, not parameter-based. The future workflow is:

```text
getAuthorizedAction(actionId)
  -> verify policyHash, binding, lifecycle, scope, time, and caps
  -> executeAuthorizedAction(actionId)
```

The future execute call receives an `actionId`, not arbitrary `marketId`, side, price, quantity, or spend parameters. The issued `AuthorizedAction` fixes:

```text
actionId
circuitId
marketId
executionId
executorAgentId
action = BUY_UP | BUY_DOWN
maxPriceRaw
quantityRaw
maximumSpendRaw
validAfter
expiresAt
policyHash
```

The M4.1 domain validator requires:

- the action hash to equal the canonical hash of the referenced policy;
- the executor to be in execution authority;
- the binding, if supplied, to match the Circuit, executor, policy hash, and execution capability;
- the action to be in the allowed action set;
- the market ID to be in the explicit market allowlist when one is present;
- the action window to fit the policy window and any action-lifetime limit;
- effective lifecycle to be `ACTIVE` at validation time;
- `maximumSpendRaw` to equal the existing fixed-point `maxCollateralSpendRaw(maxPriceRaw, quantityRaw, unitScaleRaw)` result;
- per-market and remaining total caps to hold.

An execution address proves only the identity of a possible executor. It does not prove Forecast authority. An action does not widen the policy. The current DreamDEX `placeBinaryOrderFor` autonomous path remains externally blocked by `OnlyApprovedContracts()` as recorded in `docs/CONTRADICTIONS.md` C-006. This milestone does not retry, bypass, or relabel that path.

## 5. Capital authority

Capital authority is a policy ceiling, not a transport property:

```text
maxPerMarketRaw
 totalBudgetRaw
 stopLossRaw
```

The first two limits are checked against the existing fixed-point unit helpers. No new spend arithmetic is introduced. `stopLossRaw` describes a cumulative loss limit for a future reconciliation path; it is not inferred from an API credential, Forecast probability, or display value.

A Runner, agent, model, API principal, or executor cannot:

- increase `maxPerMarketRaw`;
- increase `totalBudgetRaw`;
- increase `stopLossRaw`;
- reserve twice for one iteration;
- turn an action limit into a different order;
- continue after expiry, revocation, pause, or completion.

The existing Circuit contract has its own `totalBudget` and `maxPerMarket` enforcement. M4.1's Mandate fields are not represented as new onchain storage and must not be described as onchain-enforced.

## 6. Owner authority and attenuation

Owner authority has two distinct forms:

1. Approval of an exact canonical policy. This creates the policy snapshot and hash used by bindings, Forecasts, and action envelopes.
2. Reduction or termination of future authority. This may remove principals/capabilities/scope, reduce capital, increase the minimum margin, shorten time, pause, complete, expire, or revoke.

Owner-only expansion is explicit. `assertPolicyChangeAuthorized` permits an owner proposal to retain the same `owner` and `mandateId`; the caller must still create the new draft/approval record. `assertSafeAttenuation` rejects expansions from any actor, including an agent.

The accepted lifecycle is:

```text
DRAFT -> APPROVED -> ACTIVE
ACTIVE -> PAUSED | EXPIRED | REVOKED | COMPLETED
PAUSED -> ACTIVE | EXPIRED | REVOKED | COMPLETED
```

`EXPIRED`, `REVOKED`, and `COMPLETED` are terminal. A clock at or after `expiresAt` derives `EXPIRED` for non-terminal operational states. Revocation is owner-only and cannot be disabled. It stops future Forecast/action authority; it does not delete or rewrite historical evidence.

## 7. Canonical IDs and iteration identity

Prior uses typed IDs:

```text
mandateId
circuitId
forecastId | trialId
iterationId
actionId
executionId
```

The deterministic iteration identity is:

```text
iterationId = keccak256(abi.encodePacked(circuitId, marketId))
```

The core helper is `iterationIdentity(circuitId, marketId)`. Pool addresses, labels, and API request IDs are not substitutes for `marketId`.

`actionId` is the idempotency key for an issued action. `executionId` links the fixed envelope to execution evidence. Neither may be used to mutate the envelope after issuance.

## 8. Retry and idempotency rules

| Operation | Retry behavior |
|---|---|
| Read workflow | Safe to repeat. Read back the same canonical snapshot/evidence. |
| Forecast request | Safe to repeat until its deadline; it does not create a Forecast. |
| Forecast submission | One canonical submission per authorized forecaster and market. A committed submission is immutable. |
| Action evaluation | Deterministic for the same policy, Forecast, market evidence, and remaining authority. It may produce a fixed envelope or abstain. |
| Action issuance | Reserve one `actionId`. A duplicate is rejected, not reinterpreted. |
| Action execution | Look up the stored envelope by `actionId` before any external write. A prior effect must be returned/read, never submitted again. |
| Execution status | Read-only and repeatable. It does not change the action envelope. |
| Revocation | Idempotent read of the terminal state is safe; historical records remain available. |

`AuthorizedActionLedger` is the M4.1 deterministic in-memory proof of the duplicate-action boundary. A production adapter would persist the same reservation/effect key in a canonical store or contract.

## 9. Future workflow names only

These names describe future narrow workflows. M4.1 does not implement an API, MCP server, or tool surface for them:

```text
getMandate
listEligibleMarkets
getForecastRequest
submitForecast
evaluateAction
getAuthorizedAction
executeAuthorizedAction
getExecutionStatus
getRemainingAuthority
getRftHistory
```

The workflow separation is intentional:

- `getMandate`, `listEligibleMarkets`, `getForecastRequest`, `getExecutionStatus`, `getRemainingAuthority`, and `getRftHistory` are reads.
- `submitForecast` requires Forecast authority and a signed `ForecastSubmission`.
- `evaluateAction` may derive an action decision, but does not grant capital or execute.
- `getAuthorizedAction` returns an already issued fixed envelope.
- `executeAuthorizedAction` may only reference that envelope by `actionId`.

No workflow accepts natural language as authority, and none exposes arbitrary order parameters.

## 10. Deterministic mandate compilation

The safe compilation design is:

```text
natural language
  -> draft
  -> typed validation
  -> canonical policy
  -> human confirmation
  -> owner approval
  -> policyHash
  -> Circuit activation
```

Natural language is never executable authority. A parser or model can propose a `DRAFT`, but it cannot submit a Forecast, issue an action, move capital, or activate a Circuit. Human confirmation must show the formatter output, including actors, Forecast/execute capabilities, market scope, margin rule, caps, expiry, and owner revocation. Only the owner approval step changes the authority state.

## 11. Evidence boundary

M4.1 and M4.2 prove local domain behavior through `packages/core` tests, the core TypeScript typecheck, deterministic hashing, validators, the formatter, provider identity linkage, immutable records, and idempotent replay. M4.2 does not prove a new onchain registry, an external-agent submission, a live API, cryptographic signature verification, an onchain Forecast, an MCP implementation, or autonomous DreamDEX execution.

The next bounded action is an external attributable Forecast submission through a real provider/agent integration, with independent readback. That gate remains separate from a later onchain Forecast commitment and receipt gate.
