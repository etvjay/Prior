# Frontend State Machine

The frontend is a projection of external and RFT state, not a separate source of truth.

## State dimensions

Do not create one giant enum. Model orthogonal machines.

# Wallet machine

```text
DISCONNECTED
   ↓ connect
CONNECTING
   ├─ success → CONNECTED
   └─ fail    → DISCONNECTED + error

CONNECTED
   ├─ account changed → CONNECTED(new account)
   └─ disconnect      → DISCONNECTED
```

# DreamDEX market machine

Mirror observed state:

```text
LISTED
TRADING
LOCKED
RESOLVED
VOIDED
UNKNOWN
```

Only `TRADING` enables forecast commitment and trade writes.

# Trial machine

```text
IDLE
  ↓ probability changes
DRAFTING
  ↓ commit
AWAITING_WALLET
  ↓ wallet signs
SUBMITTING_COMMIT
  ├─ revert/fail → DRAFTING + error
  └─ receipt ok  → COMMITTED

COMMITTED
  ├─ optional trade → TRADE_FLOW
  ├─ abstain        → ABSTAINED
  └─ market locks   → AWAITING_RESOLUTION

TRADE_FLOW
  ↓
AWAITING_TRADE_WALLET
  ↓
SUBMITTING_TRADE
  ├─ fail → COMMITTED + trade error
  └─ success → TRADE_LINKED

COMMITTED / TRADE_LINKED / ABSTAINED
  ↓ market Locked
AWAITING_RESOLUTION

AWAITING_RESOLUTION
  ├─ market Resolved → FINALIZABLE
  └─ market Voided   → FINALIZABLE_VOID

FINALIZABLE
  ↓ finalize
SUBMITTING_FINALIZE
  ├─ fail → FINALIZABLE + error
  └─ success → RESOLVED

FINALIZABLE_VOID
  ↓ finalize
SUBMITTING_FINALIZE
  ├─ fail → FINALIZABLE_VOID + error
  └─ success → VOIDED
```

# UI mapping

| State | Probability editable | Commit | Trade | Finalize |
|---|---:|---:|---:|---:|
| IDLE/DRAFTING | yes | yes if valid | no | no |
| AWAITING_WALLET | no | pending | no | no |
| SUBMITTING_COMMIT | no | pending | no | no |
| COMMITTED | no | no | yes | no |
| TRADE_LINKED | no | no new MVP trade | complete | no |
| ABSTAINED | no | no | no | no |
| AWAITING_RESOLUTION | no | no | no | no |
| FINALIZABLE | no | no | no | yes |
| RESOLVED | no | no | no | no |
| VOIDED | no | no | no | no |

# Error principle

Errors attach to the state transition that failed.

Examples:

- wallet rejection under Commit;
- chain revert under Commit;
- market locked before trade;
- order not filled;
- finalize attempted before terminal DreamDEX state.

Do not collapse every failure into a global toast.

# Navigation state

Navigation must not erase chain state.

A user can refresh `/trial/[trialId]` and reconstruct the page from chain/DreamDEX evidence without depending on prior browser session state.
