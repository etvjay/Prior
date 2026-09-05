# Authority Decision — DreamDEX-Native Operator Execution

## Status

**TARGET ARCHITECTURE — PRIMARY-SOURCE VERIFIED, LIVE SHANNON VERIFICATION PENDING**

This decision is based on current DreamDEX/Somnia Markets primary documentation. It is not yet promoted to live implementation truth.

## Decision

Prior should target this authority chain:

```text
Circuit Owner
    │
    │ grants DreamDEX operator permission
    ▼
Prior CircuitExecutor contract
    │
    │ bounded by immutable Circuit policy
    ▼
DreamDEX BinaryPool
    │
    │ order belongs to owner
    │ funds/payout remain owner-scoped
    ▼
Owner
```

The **Runner is not the DreamDEX operator**.

The Runner only calls `CircuitExecutor`.

## Why

DreamDEX already supports operator/session-key style execution in its order-book layer:

```text
operator acts for owner
order remains owned by owner
funds settle to owner
operator cannot withdraw owner funds
```

This is preferable to:

- storing the user's private key;
- giving the Runner direct trading authority;
- inventing a custom trading vault before necessary.

## Critical binary-market detail

Event Contracts use **BinaryPool**, not the generic SpotPool placement function.

Current Somnia Markets SDK release notes state that binary pools use:

```text
placeBinaryOrder(...)
placeBinaryOrderFor(...)
```

and that generic:

```text
placeOrder(...)
placeOrderFor(...)
```

revert on binary pools with `UseBinaryPlacement`.

Therefore M0 must extract from the pinned SDK ABI:

```text
exact placeBinaryOrderFor signature
exact selector
exact operator authorization behavior
```

Never reuse the generic `PLACE_ORDER_FOR_SELECTOR` unless live/ABI verification proves that the binary authorization path deliberately aliases it.

## Intended call chain

```text
Runner
  ↓
CircuitExecutor.execute(circuitId, marketId, ...)
  ↓
validate Circuit
  ↓
validate RFT
  ↓
derive maximum acceptable price
  ↓
validate spend/authority
  ↓
BinaryPool.placeBinaryOrderFor(
    owner,
    kind,
    limitPrice,
    quantity,
    expiry,
    IOC,
    ...,
    tradeTag
  )
```

Exact ABI is M0-gated.

## DreamDEX operator approval

The operator registry supports permission grants by function selector and per-pool grants. Current SDK documentation exposes:

```text
setOperatorApprovalForPool(...)
isOperatorAuthorized(...)
```

Per-pool approval does not require the pool to be in the global SpotPool registry.

This makes the conservative Event Contract setup:

```text
owner
  ↓
approve CircuitExecutor
for binary placement selector
on eligible BinaryPool addresses
```

The feasibility of global approval for binary Event Contract pools is **not assumed**.

## Pool recycling consequence

DreamDEX Event Contract pools are recycled across market windows.

This is useful and dangerous.

Useful:

```text
one pool approval can remain useful
when that pool serves a later eligible market
```

Dangerous:

```text
pool approval is not itself a market/circuit restriction
```

Therefore the CircuitExecutor must independently enforce:

```text
marketId belongs to active Circuit scope
pool currently belongs to marketId
market status == Trading
market class matches Circuit
Circuit not paused/revoked/expired
```

Never use pool approval as the Circuit policy boundary.

## Collateral allowance

DreamDEX auto-pull execution requires the order owner's input token allowance to the pool.

Operator approval and token allowance are separate:

```text
operator approval
= who may place for owner

ERC-20 allowance
= what the pool may pull from owner
```

For a multi-window Circuit, Prior must establish allowances to the BinaryPool addresses that may execute the selected series.

Because pools recycle, the setup flow can pre-authorize the currently known pool set for the selected Event Contract series.

If a future eligible market binds to a pool for which the owner has no allowance/operator grant:

```text
Circuit does NOT bypass authority
Circuit enters AUTHORITY_REQUIRED / MISSED
```

The Runner may notify/reconcile, but cannot manufacture approval.

## No custom escrow by default

A custom Prior trading vault is no longer the preferred first architecture.

Use DreamDEX owner-scoped operator execution if M0 proves the binary path works.

Fallback hierarchy:

```text
1. DreamDEX-native BinaryPool operator execution
2. guided Circuit requiring owner signature per order
3. bounded custom escrow only if unavoidable
```

Do not jump to option 3 for convenience.

## Runner identity

The Runner may use:

- a normal relayer key; or
- a Somnia native session transaction account.

Somnia native session transactions do **not** provide delegated owner authority. A session seed is effectively a private key for a separate account.

Therefore a session account may pay gas and call `CircuitExecutor`, but it must not be treated as the owner's trading key.

## Revocation

Future Circuit execution can be stopped through both:

```text
Prior Circuit revocation
and/or
DreamDEX operator revocation/denial
```

Historical RFTs and execution evidence remain unchanged.

## M0 proof gates

Before implementing autonomous trading, prove on Shannon:

1. binary pool ABI includes `placeBinaryOrderFor`;
2. exact selector;
3. `isOperatorAuthorized(owner, executor, selector)` works for a live Event Contract pool;
4. owner can grant/revoke the selector per pool;
5. binary order placed through operator is owned by owner;
6. collateral is pulled from owner, not Runner/executor;
7. payout/position accrues to owner;
8. `userData`/tradeTag round-trips;
9. generic `placeOrderFor` is not accidentally used on binary pool;
10. recycled-pool binding is validated by `marketId` immediately before execution.

Only then mark the authority design `SHANNON_WRITE_VERIFIED`.
