# Runner Review Skill

## Objective

Ensure the Circuit Runner provides liveness without becoming authority or creating duplicate actions.

## Review

### Reconstruction

Can Runner restart with empty memory and discover:

```text
active Circuits
current eligible market
whether Forecast exists
whether policy was evaluated
whether execution already occurred
whether market resolved
whether RFT finalized
```

### Idempotency

Every write has an externally enforced duplicate-prevention mechanism.

### Authority

Runner credentials cannot exceed Circuit authority.

### Failure handling

Distinct handling for:

```text
RPC failure
Forecast timeout
invalid signature
market no longer Trading
execution revert
unfilled order
resolution delay
void
```

### Reconciliation

Runner compares local checkpoint with canonical chain/DreamDEX state before action.

### Observability

At minimum:

```text
circuitId
marketId
iteration state
last action
tx hash
error class
last reconciled block
```

## Fail conditions

- duplicate trade possible after retry/restart;
- Runner cache required for correctness;
- unrestricted owner key stored;
- Runner can mutate Circuit policy;
- local state can override chain truth.
