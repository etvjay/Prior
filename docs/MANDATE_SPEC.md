# M4.1 Mandate Specification

Status: domain, documentation, and deterministic test milestone. This document does not add a contract, a Circuit, a Runner endpoint, or an MCP server.

## 1. Definition

A Mandate is an owner-approved, machine-enforceable statement of bounded authority. It names the principals that may read, submit Forecasts, or execute an already authorized action, and fixes the market, time, capital, and lifecycle boundaries for those actions.

A Mandate is a control-plane object. It is not a market, an RFT, a Circuit, an order, a wallet, a custody vault, or a model explanation.

The M4.1 core representation is `MandatePolicy` in `packages/core/src/types.ts`. Its deterministic validators and derived views are in `packages/core/src/mandate.ts`. The current implementation is local application/domain evidence only. Existing RFT and Circuit contracts are intentionally unchanged.

The authority rule is monotonic:

```text
approved authority
  -> active bounded authority
  -> a same-or-smaller scope/capability/time/budget
  -> paused, expired, revoked, or completed
```

No agent, API principal, Runner, Forecast signer, or executor can self-expand a Mandate. An expansion requires the owner, a new owner-confirmed draft or version, and a new canonical policy hash. A reduction receives a new derived snapshot and never rewrites the approved or historical snapshot.

## 2. Policy object

`MandatePolicy` contains:

| Field | Meaning |
|---|---|
| `version` | Positive policy schema/version number. |
| `mandateId` | Stable 32-byte Mandate identity. |
| `owner` | Address that approves, attenuates, and revokes the Mandate. |
| `forecasters` | Typed `AgentPrincipal` roster allowed to be named by Forecast authority. |
| `executors` | Typed `AgentPrincipal` roster allowed to be named by execution authority. |
| `marketScope` | Venue, typed assets, intervals in seconds, market class, and optional explicit `marketIds`. |
| `forecastAuthority` | Typed Forecast agent IDs and `submitForecast` capability. v0.1 permits one immutable Forecast per market. |
| `executionAuthority` | Typed executor IDs, execute capabilities, allowed actions, and minimum Forecast-implied margin in bps. |
| `capitalAuthority` | `maxPerMarketRaw`, `totalBudgetRaw`, and `stopLossRaw`, all collateral raw units. |
| `temporalAuthority` | `issuedAt`, `startsAt`, and exclusive `expiresAt`, all Unix seconds. |
| `lifecycle` | One of `DRAFT`, `APPROVED`, `ACTIVE`, `PAUSED`, `EXPIRED`, `REVOKED`, `COMPLETED`. |
| `revocation` | Owner-only revocation switch. It is always enabled in an accepted policy. |

All durable identifiers use the existing `Hex` convention. Addresses use the existing `Address` convention. Prices, quantities, collateral, and unit scales use the branded fixed-point helpers from `packages/core/src/units.ts`.

### 2.1 Actors and capabilities

`AgentPrincipal` is a typed identity record:

```text
agentId: bytes32
 displayName: human-readable label
 sourceType: HUMAN | AGENT | MODEL | SERVICE
 forecastAddress?: Address
 executorAddress?: Address
```

`AgentBinding` binds one agent to:

```text
agent identity
  <-> authenticated API/MCP/SDK principal
  <-> Circuit
  <-> Forecast signer address
  <-> execution/session signer address
```

The binding has separate arrays for `readCapabilities`, `forecastCapabilities`, and `executeCapabilities`. It does not contain `permissions: string[]`. A binding can be Forecast-only, execute-only, both, or read-only. A Forecast capability requires a Forecast signer address. An execute capability requires an executor address and the `executeAuthorizedAction` capability before an action can be accepted.

The `apiPrincipal` authenticates a transport identity. It never grants collateral, budget, or action permission. A valid action also needs an approved executor principal, an active binding, an executor address, the exact policy hash, and all capital/time/scope checks.

### 2.2 Market scope

`marketScope` is explicit and typed:

```text
venue       = DreamDEX
assets      = BTC | ETH, one or more
intervalsSec = positive integer seconds, one or more
marketClass = an existing Circuit market class or the domain label BTC_5M
marketIds   = zero or more canonical DreamDEX bytes32 IDs
```

An empty `marketIds` means that the typed venue, asset, interval, and class scope is the restriction. A non-empty list is an additional allowlist. `marketId`, never a pool address, is the durable DreamDEX identity.

The `BTC_5M` domain label is representable in this control-plane model so the example can be described without modifying existing Circuit contracts. It is not evidence that the current Circuit contract or DreamDEX autonomous path enforces a new 5-minute class.

### 2.3 Capital and fixed-point rules

The three capital values are branded `CollateralRaw` values:

```text
maxPerMarketRaw
 totalBudgetRaw
 stopLossRaw
```

`AuthorizedAction.maximumSpendRaw` must equal the result of the existing helper:

```text
maxCollateralSpendRaw(maxPriceRaw, quantityRaw, unitScaleRaw)
```

The M4.1 code does not reimplement price-times-quantity arithmetic. It checks the exact helper result, then checks the per-market cap and remaining total budget. `stopLossRaw` is the cumulative loss ceiling; applying realized-loss evidence is an input to a future executor/read model, not a new spending formula in this milestone.

## 3. Lifecycle

The only Mandate lifecycle values are:

```text
DRAFT
APPROVED
ACTIVE
PAUSED
EXPIRED
REVOKED
COMPLETED
```

The normal compilation path is:

```text
DRAFT -> APPROVED -> ACTIVE
```

Operational transitions are:

```text
ACTIVE -> PAUSED | EXPIRED | REVOKED | COMPLETED
PAUSED -> ACTIVE | EXPIRED | REVOKED | COMPLETED
```

`DRAFT` or `APPROVED` can be terminated by owner revocation. `EXPIRED`, `REVOKED`, and `COMPLETED` are terminal. A timestamp at or after `temporalAuthority.expiresAt` derives `EXPIRED` for non-terminal `DRAFT`, `APPROVED`, `ACTIVE`, and `PAUSED` snapshots. Derivation does not mutate the stored snapshot.

Future action validation requires effective `ACTIVE` lifecycle, a valid policy time window, a matching binding, and an unexpired action envelope. `PAUSED`, `EXPIRED`, `REVOKED`, and `COMPLETED` reject future actions. Owner revocation returns a new revoked snapshot and leaves the prior policy, Forecast, RFT, and execution evidence untouched.

## 4. Approval, immutability, and attenuation

### Immutable after approval

The approved snapshot fixes:

- `version`, `mandateId`, and `owner`;
- principal identities and source types;
- market venue, assets, intervals, market class, and explicit market IDs;
- Forecast and execution principal sets and capability definitions;
- allowed actions and minimum margin;
- capital ceilings;
- approval/start/expiry bounds;
- revocation being owner-only and enabled.

The snapshot is content-addressed by `policyHash`. A submitted Forecast and an issued `AuthorizedAction` retain the hash of the policy snapshot under which they were created.

### Safely reducible

A derived policy may only:

- remove a forecaster or executor;
- remove read, Forecast, execute, or action capabilities;
- remove an asset, cadence, or explicit market ID;
- shorten `expiresAt` or delay `startsAt`;
- reduce `maxPerMarketRaw`, `totalBudgetRaw`, or `stopLossRaw`;
- increase `minMarginBps`;
- shorten an action lifetime;
- pause, expire, revoke, or complete the Mandate.

`assertSafeAttenuation` proves these comparisons without mutating the parent. A reduction is still a new policy snapshot and should be re-linked with a new hash where a binding is reissued.

### Expansion

Adding a principal, capability, asset, cadence, action, budget, expiry interval, or weaker minimum margin is an expansion. Non-owner expansion is rejected. `assertPolicyChangeAuthorized` permits only the owner to propose an expansion while requiring the same `mandateId` and `owner`; the caller must still create a new draft, obtain human confirmation, approve it, compute its hash, and activate it. There is no in-place silent expansion.

Revocation cannot be disabled. `revocation.ownerOnly` is a literal `true` type and validation rejects `enabled: false`.

## 5. Forecast and action envelopes

### ForecastRequest

A `ForecastRequest` defines one typed request for one `circuitId × marketId` iteration:

```text
forecastId?          optional Forecast/RFT identity
circuitId            bytes32
marketId             bytes32
asset               BTC | ETH
intervalSec          positive integer
opensAt              Unix seconds
expiresAt            Unix seconds
forecastDeadline?    optional Unix seconds
reference?           optional MarketReference evidence
```

The request is valid only when its market and interval are within the Mandate scope and its time window is within the Mandate temporal authority.

### ForecastSubmission

A `ForecastSubmission` is only an attributable signed probability:

```text
marketId
forecaster            AgentId
forecasterAddress     Address
probabilityUpBps      integer [0, 10000]
generatedAt
validUntil
sourceType
sourceVersion
signature
```

It has no chain-of-thought, reasoning, rationale, prompt, or explanation field. The source version is metadata for attribution, not a claim that the model's internal reasoning is true. The signer, source type, market, probability, and validity interval are validated against the request, policy, principal roster, and optional binding.

### AuthorizedAction

An `AuthorizedAction` is a fixed execution envelope:

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

The future execution surface is intentionally by reference:

```text
executeAuthorizedAction(actionId)
```

It is not an arbitrary order-parameter endpoint. `maxPriceRaw`, `quantityRaw`, `maximumSpendRaw`, market, direction, executor, policy hash, and expiry are immutable once issued. A future adapter must load and verify this envelope before submitting anything to an external venue. M4.1 does not add that adapter or a new autonomous DreamDEX path.

## 6. Canonical IDs, iteration, and retries

All IDs are typed 32-byte `Hex` values unless an external system supplies an explicitly documented evidence identifier.

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

The implementation helper is `iterationIdentity(circuitId, marketId)`. This is the canonical equivalent of `circuitId × marketId`, and it prevents a pool address or a mutable display label from becoming iteration identity.

Retry rules:

1. Reads such as `getMandate` and `getRemainingAuthority` are replay-safe.
2. One v0.1 Forecast is accepted for one authorized forecaster and market. A committed Forecast is immutable.
3. An action is first identified by `actionId`. A retry must look up the existing action/effect before attempting an external write.
4. A duplicate `actionId` is rejected by the M4.1 `AuthorizedActionLedger`; it cannot create a second effect.
5. `executionId` and external transaction/order evidence are retained as historical evidence. They are not used to rewrite the action envelope.
6. Revocation rejects new future actions but does not delete or rewrite prior Forecast, RFT, action, or execution evidence.

## 7. Deterministic policy identity

`mandatePolicyHash(policy)` hashes a canonical JSON representation with `keccak256(stringToHex(canonicalJson))`.

Canonicalization rules:

- object keys are sorted lexicographically;
- `bigint` values are encoded as base-10 decimal strings;
- IDs and addresses retain their validated hexadecimal spelling;
- principal arrays are sorted by `agentId`;
- asset, interval, market ID, agent ID, capability, and action arrays are sorted as sets;
- omitted optional authority values receive deterministic defaults (`maxSubmissionsPerMarket=1`, `requireAttributableSigner=true`, `minLeadTimeSec=0`);
- the lifecycle, revocation policy, and all authority/capital/temporal fields are included;
- invalid policies cannot be hashed.

Reordering unordered arrays therefore does not change the hash. Changing an authority, scope, capital, temporal, lifecycle, principal, or revocation value changes the hash.

`validateAgentBinding` checks all of the following:

```text
binding.mandateId == policy.mandateId
binding.policyHash == mandatePolicyHash(policy)
binding.agentId is in the relevant policy roster
binding circuit and signer addresses match the principal/binding
binding capabilities are subsets of policy capabilities
binding issued/expires fit the policy time window
```

## 8. Human-readable formatter

`formatMandatePolicy` validates and formats the same `MandatePolicy` object used for hashing and action checks. It does not accept a second display-only configuration. Currency rendering uses `viem`'s fixed-point `formatUnits`; spend arithmetic remains in the existing units helpers.

Example policy output:

```text
Mandate 0x1111111111111111111111111111111111111111111111111111111111111111
owner: 0x00000000000000000000000000000000000000a1 (owner may revoke)
lifecycle: ACTIVE
agent: Alice [HUMAN] capabilities: Forecast, execute
agent: Forecast Bot [AGENT] capabilities: Forecast
agent: Execution Service [SERVICE] capabilities: execute
scope: DreamDEX BTC 5m marketClass=BTC_15M
rule: minimum Forecast margin 8 points
capital: $1/market, $20 total, stop-loss $2
temporal: issuedAt=100 startsAt=100 expiresAt=1000
```

The example deliberately shows a BTC 5m interval from the same policy object, the 8-point minimum margin, `$1/market`, `$20 total`, expiry, and owner revocation. It is a readable domain example, not a claim of current onchain 5m or autonomous execution enforcement.

## 9. Deterministic mandate compilation design

Natural language is never executable authority. The only accepted compilation path is:

```text
natural language
  -> DRAFT
  -> typed validation
  -> canonical policy
  -> human confirmation
  -> owner approval
  -> policyHash
  -> Circuit activation
```

Each stage has a separate meaning:

| Stage | Required result |
|---|---|
| Natural language | Human intent input only. It cannot trigger Forecasts, actions, or capital movement. |
| Draft | A candidate object with no execution authority. |
| Typed validation | Addresses, IDs, enums, sets, fixed-point values, time bounds, and authority separation pass deterministic checks. |
| Canonical policy | Stable field ordering, set ordering, defaults, and hash input. |
| Human confirmation | A human sees the formatter output and confirms the intended scope, capabilities, rule, caps, and expiry. |
| Owner approval | The owner authorizes the exact canonical policy. |
| `policyHash` | The approved snapshot receives a content identity. |
| Circuit activation | A separately existing Circuit may be linked to the approved policy. M4.1 does not create a Circuit. |

A parser or future API may produce a draft, but it may never treat prose, an API credential, or a model response as executable capital authority.

## 10. Machine-testable invariants A-M

The focused suite is `packages/core/test/mandate.test.ts`. The invariant matrix is:

| ID | Invariant | Machine check |
|---|---|---|
| A | Forecast authority is not execution authority. | Forecast and execute capability sets are typed separately; a Forecast-only binding has no execute capability. |
| B | Execution authority is not Forecast authority. | An execute-only binding cannot submit a Forecast; execution capabilities do not include `submitForecast`. |
| C | API/MCP authentication is not capital permission. | An API/MCP-authenticated binding without `executeAuthorizedAction` is rejected for an action. |
| D | Attenuation cannot increase per-market or total budget. | `assertSafeAttenuation` rejects larger `maxPerMarketRaw` and `totalBudgetRaw`. |
| E | Attenuation cannot add assets or cadences. | `assertSafeAttenuation` rejects added assets or `intervalsSec`. |
| F | Attenuation cannot extend expiry. | `assertSafeAttenuation` rejects a later `temporalAuthority.expiresAt`. |
| G | Attenuation cannot disable owner revocation. | Validation and attenuation reject `revocation.enabled=false` or non-owner revocation. |
| H | Attenuation cannot weaken `minMarginBps`. | A lower execution minimum margin is rejected. |
| I | `AuthorizedAction` is immutable after issuance. | Every envelope field is compared, and the frozen envelope is runtime immutable. |
| J | Expired, revoked, paused, and completed mandates reject future actions. | Effective lifecycle and envelope validation reject all non-active cases. |
| K | A duplicate `actionId` cannot produce two effects. | `AuthorizedActionLedger.recordEffect` rejects the second reservation/effect. |
| L | Historical Forecast, RFT, action, and execution evidence survives revocation. | Revocation returns a new snapshot and the retained historical objects remain unchanged. |
| M | Canonical identity and binding linkage are deterministic. | Reordered policy sets hash identically; a binding must match `mandateId` and `policyHash`. |

These are local `UNIT_VERIFIED` invariants. They do not promote any Mandate field to onchain enforcement.

## 11. Traceability to the existing Circuit

The following table is intentionally conservative. "Current contract enforcement" describes the existing `CircuitRegistry.sol` and `CircuitExecutor.sol`, not the M4.1 TypeScript model. "Future enforcement" names the boundary that would be required for a production Mandate registry/executor. No new contract is introduced here.

| MandatePolicy field | Existing Circuit intent field | Current contract enforcement | Application-only enforcement in M4.1 | Future enforcement | Classification |
|---|---|---|---|---|---|
| `version` | None | None | Canonical validation and hash | Versioned Mandate registry | DESIGN_ONLY |
| `mandateId` | None | None | Typed ID and binding linkage | Mandate-to-Circuit registry link | DESIGN_ONLY |
| `owner` | `owner` | `create`, `onlyOwner`, `revoke`, and owner lifecycle calls enforce the existing Circuit owner | Mandate policy/binding linkage | Mandate owner approval/revocation authority | APP_ENFORCED |
| `forecasters` | `forecaster` (single address) | Stores one Circuit forecaster; existing contracts do not manage a principal roster | Typed principal roster and subset checks | Onchain principal/binding registry | APP_ENFORCED |
| `executors` | `executor` (registry executor address) | Registry restricts `reserveExecution` to its configured executor; CircuitExecutor is the bounded contract target | Typed executor roster and binding checks | Onchain executor principal/binding checks | APP_ENFORCED |
| `marketScope.venue` | None | DreamDEX is selected by the existing adapter/executor integration, not stored as a Mandate field | Typed venue validation | Venue adapter/registry enforcement | DESIGN_ONLY |
| `marketScope.assets` | None | None. Current contracts do not store an asset allowlist | Asset subset validation | Market metadata plus onchain allowlist | DESIGN_ONLY |
| `marketScope.intervalsSec` | None | None. Current contracts do not store cadence allowlists | Interval subset validation | Market metadata plus onchain allowlist | DESIGN_ONLY |
| `marketScope.marketClass` | `marketClass` | Stored in `CircuitRegistry.Intent`; creation stores it, but the current executor does not independently prove all Mandate semantics | Typed class validation and attenuation | Circuit/Mandate class gate | ONCHAIN_ENFORCED |
| `marketScope.marketIds` | None; `marketId` is an execution input | `CircuitExecutor` rechecks `marketId -> pool`; `CircuitRegistry` keys duplicate execution by `circuitId, marketId`, but no persistent Mandate allowlist exists | Explicit ID allowlist validation | Onchain market allowlist and pool binding | ONCHAIN_ENFORCED |
| `forecastAuthority` | `forecaster` (partial analogue) | No signature/capability/agent binding enforcement | Typed Forecast capability, signer, and source validation | Forecast signer/nonce verifier | APP_ENFORCED |
| `executionAuthority` | `allowedActionsBitmap`, `executor` (partial analogues) | `kind` is limited to BUY_YES/BUY_NO; existing bitmap is stored but not checked by `CircuitExecutor`; DreamDEX operator path is externally blocked by `OnlyApprovedContracts()` as recorded in C-006 | Typed executor/action capability and envelope validation | Approved executor plus fixed-envelope executor | BLOCKED_EXTERNAL |
| `capitalAuthority.maxPerMarketRaw` | `maxPerMarket` | `CircuitRegistry.reserveExecution` rejects spend above `maxPerMarket` | Exact fixed-point envelope spend check | Mandate-aware executor/registry cap | ONCHAIN_ENFORCED |
| `capitalAuthority.totalBudgetRaw` | `totalBudget` | `reserveExecution` rejects cumulative reserved spend above `totalBudget` | Remaining-budget validation | Mandate-aware cumulative budget | ONCHAIN_ENFORCED |
| `capitalAuthority.stopLossRaw` | None | None. Existing runtime tracks consecutive losses, not raw realized loss | Typed value and optional realized-loss gate | Canonical loss accounting and stop gate | DESIGN_ONLY |
| `temporalAuthority.issuedAt` | None | None | Approval/binding temporal validation | Onchain approval timestamp | DESIGN_ONLY |
| `temporalAuthority.startsAt` | `startsAt` | `reserveExecution` rejects before `startsAt` | Action/request start validation | Mandate-aware start gate | ONCHAIN_ENFORCED |
| `temporalAuthority.expiresAt` | `expiresAt` | `reserveExecution` rejects at/after expiry; executor checks market expiry | Effective lifecycle and envelope expiry validation | Mandate-aware expiry gate | ONCHAIN_ENFORCED |
| `lifecycle` | Circuit runtime status | Existing Circuit runtime has a different enum including `AUTHORIZED`, `STOPPED`, and `COMPLETE`; owner/runtime checks enforce Circuit transitions | Exact seven-state Mandate lifecycle and derived expiry | Mandate registry lifecycle transitions | APP_ENFORCED |
| `revocation.enabled` | Circuit runtime `REVOKED` state | Existing owner `revoke` transitions a Circuit and future reservation requires `ACTIVE`; it does not store a Mandate revocation switch | Revocation validation and immutable historical snapshots | Onchain Mandate revocation bit/event | APP_ENFORCED |
| `revocation.ownerOnly` | `onlyOwner` | Existing owner modifier enforces owner-only Circuit lifecycle changes | Binding and owner checks | Onchain owner-only Mandate revocation | ONCHAIN_ENFORCED |

The `ONCHAIN_ENFORCED` labels refer only to the mapped existing Circuit behavior named in the current-contract column. They do not claim that the complete MandatePolicy exists or is enforced onchain. The `APP_ENFORCED` labels are deterministic local checks. `DESIGN_ONLY` and `BLOCKED_EXTERNAL` are explicit evidence boundaries.

## 12. Explicit non-goals

M4.1 does not:

- build an MCP server or expose MCP tools;
- add a marketplace, agent rankings, reputation, consensus, or model competition;
- add automatic capital escalation or dynamic budget widening;
- add new autonomous DreamDEX execution;
- create a new Circuit or modify an existing Circuit;
- modify RFT or Circuit contracts;
- introduce custody, escrow, a custom oracle, or a new protocol layer;
- make an API key, MCP principal, Runner, or model response a capital permission;
- accept arbitrary order parameters in place of an `AuthorizedAction` envelope;
- store chain-of-thought in Forecast evidence;
- change the frontend, deployment state, or credentials;
- claim that application fields are currently enforced onchain;
- claim live 5m or autonomous execution proof from this local milestone.

## 13. Evidence and next action

M4.1 evidence is local and deterministic:

```text
UNIT_VERIFIED: packages/core/test/mandate.test.ts
TYPECHECKED: packages/core/tsconfig.json
DESIGN_ONLY / APP_ENFORCED: this document and packages/core/src/mandate.ts
```

The highest-priority next action is:

> Build the first Forecast Provider/domain workflow and prove that one external agent can submit an attributable Forecast into PRIOR, unless a blocking architecture defect is found.

That workflow must preserve the signed, typed `ForecastSubmission` boundary, use `marketId` as canonical identity, keep API authentication separate from authority, and record the exact evidence class. It must not be expanded into an MCP server or an autonomous trading path as part of that proof.
