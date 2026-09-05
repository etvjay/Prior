# Circuit Runner & Recovery Specification

## Purpose

A Circuit needs an offchain runtime because smart contracts do not independently wake up when new DreamDEX markets appear.

The Runner provides liveness.

It must not become the authority.

## Responsibilities

The Runner may:

- discover new eligible DreamDEX markets;
- match them to active Circuits;
- request/read Forecasts;
- relay signed Forecasts;
- call policy/execution functions;
- observe transaction receipts;
- observe DreamDEX settlement;
- call permissionless RFT finalization;
- update a non-canonical read model;
- resume work after restart.

The Runner must not:

- alter Circuit rules;
- increase spend limits;
- forge forecaster signatures;
- set DreamDEX outcomes;
- modify committed Forecasts;
- bypass contract stop/revocation conditions;
- hold an unrestricted owner private key.

## Runner loop

Conceptual:

```text
while running:
    load active circuits

    for circuit:
        reconcile onchain circuit state

        discover eligible market

        if no iteration exists:
            create/recover iteration

        if Forecast missing:
            obtain Forecast
            verify/signature/expiry
            relay commit

        if policy not evaluated:
            compute expected decision locally
            submit/verify protocol decision

        if action allowed and not yet executed:
            submit execution

        if DreamDEX terminal and RFT not terminal:
            finalize RFT

        if iteration terminal:
            advance Circuit

        persist checkpoint
```

## Recovery invariant

The Runner must be restartable.

After runtime death it reconstructs state from:

```text
Circuit onchain state
RFT onchain state
DreamDEX market/order/fill state
transaction receipts/events
non-canonical checkpoint cache
```

The cache may accelerate recovery but cannot be required for correctness.

## Idempotency

Every external write must have an idempotency strategy.

### Forecast commit

One canonical Circuit Forecast per market.

Duplicate relay must revert/no-op safely.

### Execution

One action nonce / execution key per:

```text
circuitId × marketId
```

The executor must prevent double execution even if the Runner retries after timeout.

### Finalization

RFT terminal state prevents double finalization.

## Failure classification

Runner records:

```text
FORECAST_UNAVAILABLE
FORECAST_SIGNATURE_INVALID
MARKET_NOT_TRADING
POLICY_ABSTAIN
AUTHORITY_INSUFFICIENT
BUDGET_EXHAUSTED
TRADE_REVERTED
TRADE_UNFILLED
MARKET_VOIDED
RPC_UNAVAILABLE
RUNNER_RESTARTED
```

Do not collapse these into generic “failed.”

## Restart test

Required integration test:

1. start Circuit;
2. process first market;
3. terminate Runner before next action;
4. restart Runner with empty in-memory state;
5. reconstruct current Circuit/market/iteration;
6. continue;
7. prove no duplicate Forecast or trade occurred.

## Runner implementation

Recommended initial app:

```text
apps/runner
```

Node/TypeScript using the same shared packages as the web client.

Do not fork business logic between UI and Runner.

## Secrets

Runner may hold:

- RPC credentials if needed;
- service auth;
- limited relayer credential if architecture requires it.

Runner must not hold:

- owner unrestricted wallet key;
- unbounded trading key.

Any execution signer must be scoped and revocable.

## Runner transaction identity

Runner may use a dedicated gas-paying relayer account.

Somnia native session transactions are a possible implementation because the node can derive/sign/retry transactions for a session seed.

However:

```text
session seed = secret key material
session account = separate account
```

It does not inherit the Circuit owner's authority.

Preferred separation:

```text
Runner session/relayer account
    ↓ calls
CircuitExecutor
    ↓ is DreamDEX-approved operator
```

This means compromise of Runner transaction identity is still constrained by CircuitExecutor policy.

Do not operator-approve the Runner session account directly unless the security model is deliberately changed and re-reviewed.
