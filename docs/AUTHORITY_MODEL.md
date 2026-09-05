# Circuit Authority Model

## Goal

Enable a Circuit to continue executing without asking the owner to sign every market, while preventing the Runner/executor from becoming an unrestricted wallet controller.

## Required properties

Authority must be:

```text
bounded
scoped
time-limited
budget-limited
action-limited
revocable
auditable
```

## Minimum authority dimensions

```text
owner
circuitId
market class
allowed actions
total budget
max per market
start
expiry
target window count
revocation status
```

## Roles

### Owner

Creates/authorizes Circuit.

### Forecaster

Supplies Forecasts.

### Runner

Provides liveness and relays calls.

### Executor

Can perform only actions valid under current Circuit authority.

## Rejected model

```text
backend stores owner's private key
```

Reason:

- unlimited authority;
- poor revocation;
- severe custody/security risk;
- makes Runner compromise catastrophic.

## Candidate models

### A. Onchain escrow/budget vault

Owner deposits bounded Circuit capital into a dedicated contract.

Advantages:

- very explicit budget;
- executor cannot exceed deposited amount;
- easy auditability.

Disadvantages:

- introduces custody;
- additional DreamDEX integration complexity;
- withdrawal/recovery paths required.

### B. Session/delegated account authority

Owner grants a scoped session/delegation to Circuit execution.

Advantages:

- closer to original wallet ownership;
- potentially no bespoke custody vault;
- explicit expiry/action limits if supported.

Disadvantages:

- depends on wallet/account capabilities;
- DreamDEX approval semantics must be compatible.

### C. Per-order user approval

Runner computes action, owner signs each trade.

Advantages:

- simplest security model.

Disadvantages:

- not autonomous;
- weakens the Circuit thesis.

## Target

Prefer **B: scoped session/delegated authority** if Somnia/wallet/DreamDEX mechanics support it cleanly.

Fallback for demo:

- A bounded escrow/executor, if integration is simpler and auditable; or
- guided Circuit mode with per-order confirmation if authority integration cannot be safely completed.

M0/M1 must establish what is actually feasible before choosing.

## Authority invariant

The Circuit's declared intent must be enforceable independently of Runner behavior.

If the Runner requests:

```text
$50 BUY UP
```

against:

```text
maxPerMarket = $15
```

the execution layer itself must reject it.

UI checks are insufficient.

## Revocation

Owner must be able to revoke future execution.

Revocation must not rewrite historical Forecasts/executions.

After revocation:

```text
new Forecasts/actions under Circuit: forbidden
existing evidence: preserved
```

## Expiry

Authority expires at the earlier of:

- explicit time expiry;
- target windows completed;
- budget exhausted;
- stop condition;
- revocation;
- Circuit terminal state.

## Current target decision

Prefer DreamDEX-native operator execution:

```text
Owner
  ↓ grants binary-order operator permission
CircuitExecutor contract
  ↓ enforces Prior limits
DreamDEX BinaryPool.placeBinaryOrderFor(...)
```

Runner calls CircuitExecutor but is not itself the approved DreamDEX operator.

This target remains live-Shannon gated because binary Event Contracts use specialized placement (`placeBinaryOrderFor`) rather than generic `placeOrderFor`.

See `AUTHORITY_DECISION.md`.
