# M0 Authority Spike Checklist

## Goal

Determine whether Prior can execute bounded autonomous Event Contract orders using DreamDEX-native operator permissions.

## Do not build the full Circuit yet.

Produce evidence for each item.

### SDK/ABI

- pin current working `@somnia-chain/markets-sdk`;
- print `binaryPoolWriteAbi`;
- locate `placeBinaryOrderFor`;
- compute exact selector;
- locate operator-registry ABI methods;
- locate binary pool operator read method if inherited/exported.

### Live market

- discover live Shannon binary market;
- record `marketId`;
- record pool;
- record pool nonce/current binding;
- record status/expiry.

### Operator

- deploy minimal test executor;
- check authorization false;
- owner grants executor exact binary selector on pool;
- check authorization true.

### Collateral

- identify input collateral for BUY_UP/BUY_DOWN;
- inspect owner's allowance to pool;
- obtain exact auto-pull/worst-case requirement;
- approve bounded test amount.

### Execution

- create tiny IOC;
- set nonzero `userData`;
- executor calls specialized binary order-for function;
- save receipt/events;
- prove owner/order owner/fill/position.

### Revocation

- revoke per-pool operator grant;
- prove next call fails.

### Recycling

- after or from historical/live evidence, prove pool-current-market binding is checked immediately before execution;
- document what happens when next Circuit window uses an unapproved different pool.

## Required output

```text
evidence/shannon/m0-authority.json
evidence/shannon/m0-operator-grant.json
evidence/shannon/m0-binary-order.json
evidence/shannon/m0-revocation.json
```

## Gate

Only after this spike passes may `CircuitExecutor` autonomous trading be treated as implemented.
