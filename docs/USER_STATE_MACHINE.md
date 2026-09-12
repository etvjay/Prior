# User State Machine

PRIOR keeps human and agent entry paths on one continuity model. The human UI uses the following states and does not infer protocol truth from local state.

## Public entry

```text
EXPLORE
→ PUBLIC_TEMPLATE_INSPECTED
→ WALLET_REQUIRED
→ PARTICIPANT_INSTANCE_DRAFT
```

A public template is application grouping only. The participant instance becomes canonical only after V2 create receipt and intent readback.

## Circuit creation

```text
DRAFT
→ REVIEW
→ SIGNING_CREATE
→ AWAITING_CREATE_RECEIPT
→ CREATED_READBACK
→ SIGNING_AUTHORIZE
→ SIGNING_ACTIVATE
→ ACTIVE
```

Failure states are terminal for that attempt and include `RECEIPT_REVERTED`, `RECEIPT_TIMEOUT`, `READBACK_MISMATCH`, and `ACTIVATE_READBACK_MISMATCH`. No retry blindly rebroadcasts the same write.

## Forecast and RFT

```text
UNCOMMITTED
→ SIGNING
→ SIGNED
→ AWAITING_RECEIPT
→ CANONICAL_READBACK
→ COMMITTED
```

The failure states are `SIGNATURE_REJECTED`, `WRONG_CHAIN`, `BROADCAST_FAILED`, `RECEIPT_REVERTED`, `TIMEOUT`, and `READBACK_MISMATCH`. A transaction hash is transport evidence only.

## Circuit iteration

```text
MARKET_DISCOVERY
→ CANONICAL_MARKET_VERIFICATION
→ FORECAST_DRAFT
→ RFT_COMMITTED
→ BINDING_RFT
→ BOUND
→ POLICY_EVALUATED
→ EXECUTION_OBSERVED
→ WAITING_FOR_RESOLUTION
→ RFT_FINALIZED
→ ADVANCED
→ NEXT_ELIGIBLE_MARKET
```

Possible truthful execution observations include `DISABLED`, `ABSTAINED`, `NOT_AUTHORIZED`, `ACTION_SELECTED`, `CONFIRMED`, `FAILED`, and `BLOCKED_EXTERNAL`. `ACTION_SELECTED` is not an order receipt.

## Source modes

Every read model carries either:

```text
LIVE · SHANNON · block · freshness
```

or:

```text
ACCEPTED SNAPSHOT · captured time · block · evidence artifact
```

A live read failure may show an accepted snapshot only with an explicit warning. Snapshot data never unlocks a live write.

## Recovery

On return, canonical reads reconstruct the Circuit and iteration. Local draft convenience cannot overwrite canonical status, ownership, Forecast, RFT, receipt, resolution, or progress.
