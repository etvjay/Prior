# DreamDEX settlement truth (M4.3.4)

Settlement truth is read directly from the pinned Shannon ABI, never inferred from indexer lifecycle labels:

1. `BinaryMarketsModule.markets(marketId)` supplies `yesId`, `noId`, and `expiry`.
2. `BinarySettlement.isFinalized(yesId)` is the finality gate.
3. For finalized markets, `BinarySettlement.getSettlement(yesId >> 8)` supplies `voided` and `payoutNumerators`.
4. `payoutNumerators[0] > payoutNumerators[1]` is `UP`; the inverse is `DOWN`, matching `RFTRegistry.finalize`.

The reader emits `TRADING`, `RESOLVED_UP`, `RESOLVED_DOWN`, `VOIDED`, `INCOMPLETE`, or `CONFLICT`. Missing settlement data, short payout arrays, and non-finalized reads that include payouts fail closed. A void is terminal but is not scored.

The runner has no DreamDEX economic write capability. Settlement reads are read-only and use marketId as durable identity. Shannon addresses remain external configuration (with the documented static references as defaults); no deployment metadata was changed.
