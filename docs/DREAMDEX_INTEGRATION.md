# DreamDEX Integration

## Canonical developer surface

For Event Contracts, use:

```text
@somnia-chain/markets-sdk
```

DreamDEX's HTTP API covers spot and is **not** the Event Contract API.

Primary docs:

- https://app.dreamdex.io/docs/developers/event-contracts
- https://app.dreamdex.io/docs/developers/event-contracts/market-structure
- https://app.dreamdex.io/docs/developers/event-contracts/recipes
- https://app.dreamdex.io/docs/developers/event-contracts/gotchas
- https://app.dreamdex.io/docs/developers/event-contracts/contracts-and-addresses
- https://app.dreamdex.io/docs/developers/contracts/functions
- https://app.dreamdex.io/docs/developers/contracts/events
- https://app.dreamdex.io/docs/developers/contracts/types

## Facts currently relied on

- Event Contracts are Up/Down markets.
- Current rolling classes include BTC/ETH and 15-minute/1-hour windows.
- `marketId` is the canonical per-window identity.
- Per-window pools may be recycled; do not durably key by pool address.
- Only live onchain `Trading` state accepts new orders.
- DreamDEX exposes order-book contracts and events.
- `placeOrder` carries arbitrary `uint64 userData`.
- `OrderPlaced` exposes the complete order including `owner` and `userData`.
- `OrderFilled` exposes fill quantities and price.
- Event Contract settlement can be Resolved or Voided.
- SDK/event-contract integration must gate writes against live onchain status because indexed status can lag.

## M0 verification requirements

Before writing `DreamDexAdapter.sol`, prove against Shannon:

1. exact SDK version installs;
2. live market discovery works;
3. `marketId → market/pool/status/expiry` read works;
4. top-of-book can be read/normalized;
5. recently finalized outcome/void can be read;
6. exported ABI shape matches code assumptions;
7. `userData` can be passed by the chosen raw/unified trading path;
8. emitted order evidence preserves the tag;
9. tiny IOC execution succeeds when liquidity permits.

## SDK discipline

Do not copy undocumented tuple layouts into Solidity from memory.

Extract/use package ABIs where practical and record the exact package version in `docs/CANONICAL_STATE.md`.

## Write discipline

Before a DreamDEX order:

```text
load live market
  ↓
read onchain status
  ↓
assert Trading
  ↓
normalize price/quantity to tick + lot sizes
  ↓
submit
  ↓
verify transaction receipt
  ↓
index emitted evidence
```

## Execution linkage

Desired mapping:

```text
RFT trial.tradeTag
       ↕
DreamDEX Order.userData
       ↕
OrderPlaced / OrderFilled
```

This is secondary evidence. Forecast validity never depends on whether the participant traded.

## Binary placement is specialized

Current Somnia Markets SDK release notes state:

```text
BinaryPool:
placeBinaryOrder(...)
placeBinaryOrderFor(...)
```

Generic:

```text
placeOrder(...)
placeOrderFor(...)
```

revert on BinaryPool with `UseBinaryPlacement`.

Therefore Prior must extract and use the exact binary ABI from the pinned SDK.

## Operator target

Target autonomous Circuit execution:

```text
CircuitExecutor
  ↓
BinaryPool.placeBinaryOrderFor(owner, ...)
```

with DreamDEX operator permission granted by the owner to the CircuitExecutor for the exact binary placement selector.

Do not assume the generic exported `PLACE_ORDER_FOR_SELECTOR` is correct for BinaryPool.

M0 must derive/verify the specialized selector.

## Pool allowance setup

Operator permission does not replace ERC-20 allowance.

For auto-pull execution, the owner must permit relevant binary pools to pull collateral.

Because binary pools recycle across windows, Prior should enumerate the currently relevant pool set for the selected series and establish setup state explicitly.

Missing approval is a Circuit authority/setup state, not something the Runner may bypass.
