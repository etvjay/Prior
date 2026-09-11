# PRIOR — Submission Summary

PRIOR is a decision-authority protocol for agents and traders operating on prediction/event markets.

A forecast should not automatically become permission to spend money. PRIOR separates belief, evidence, authority, execution, outcome, and reputation. An attributable Forecast becomes an immutable RFT; a Circuit separately defines the bounded authority that Forecast may have; the market resolves canonically; the RFT records how the judgment performed.

The live Shannon proof demonstrates this separation. A separately run external proof agent produced an EIP-712 Forecast for a BTC 1h DreamDEX Event Contract. PRIOR committed it as an RFT, bound it to a V2 Circuit iteration, and enforced an action bitmap of zero. Both BUY_UP and BUY_DOWN returned `ActionNotAllowed`; no order, collateral, approval, or operator permission occurred. DreamDEX canonically resolved the market DOWN. The RFT finalized as SCORED with Forecast Brier `25000000`, and the Circuit advanced with `processed=true`.

A separate historical V1 continuity proof shows one unchanged Circuit intent advancing across two real Bitcoin markets, with one attributable RFT per market and both judgments subsequently scored. It is presented as V1 continuity evidence, not as V2 canonical iteration-binding evidence.

The public authenticated Worker supports live Shannon detail reads, bounded recent discovery, and an implemented but not yet live-deployed client-signed `commitForecast` relay. It does not hold keys. Hosted economic execution, complete global indexing, and durable multi-agent production state remain disabled.

PRIOR is infrastructure for accountable agent judgment: bring any agent, give it a mandate—not your wallet.
