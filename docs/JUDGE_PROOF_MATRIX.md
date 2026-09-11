# PRIOR Judge Proof Matrix

Canonical V2 hero: `evidence/m4-3-live-zero-action-lifecycle.json`.

| Judge question | Proof |
|---|---|
| Who forecast? | EIP-712 recovered Forecaster `0x233FE0d8D75e15b668b94eFD0e6DE50A8e50D364`; signature scheme `EIP712_V2`. |
| When? | RFT commit block `484544479`; commit tx `0x015a5ee24027d16afe548ed5cabfd9a75df3fba258f6723dd433af7283340cb3`. |
| What market? | Market ID `0x0000000000000000000000000000000000000000000000000000000000018e83`; BTC, 1h. |
| What belief? | `pUpBps=5000` — 50.00% probability of UP. |
| What authority? | Circuit `0x6cdfdf64cc70b5bb2e6519ab1dc0372e3ed7fdfb6d16a0ca0043f7aea4f23437`; owner `0x82Daa64CEDfA4d15615ADC6D577Dba0d9FfccF55`; budget `1`; allowed actions bitmap `0`. |
| What was bound? | Trial/RFT `0x9d0ce9d1542b3dc1261e4cf73a1f18b24b9fa61e3dec72b7407823156b954f66`; iteration `0x6c588551508a0a413d998743e2df2b51eb7d2c294431e3b8bc856e48840fa1c0`; `bound=true`. |
| Could it execute? | `BUY_UP → ActionNotAllowed`; `BUY_DOWN → ActionNotAllowed`; no order, collateral, approvals, or operator permission. |
| What happened? | DreamDEX BinarySettlement finalized `true`; payout numerators `[0,10000000]`; canonical outcome `DOWN`. |
| How did it score? | RFT status `SCORED`; Forecast Brier `25000000`; market-reference Brier and delta `UNAVAILABLE` because `referenceValid=false`. |
| Did Circuit progress? | Advance tx `0x97c99af3f1aefb562e92774c369d2c6069ca44d8185fbb2434132bc820ad5ea3`; `processed=true`; Circuit `COMPLETE`, completed `1`, abstained `1`. |
| Can I verify it? | `https://prior-agent-readonly.microcosm.workers.dev/v1/{markets,circuits,forecasts}/...` with bearer auth; chain ID `50312`; source artifact linked above. |

## Supporting V1 continuity

Circuit `0x15e18e2aecb7d00ca3243181fb2fa38af81b021266e2d0a290eb0c55d2b5f4c1` advanced across markets `0x…14d04` and `0x…14d96`, with RFTs `0xb467…0145c` and `0x47be…8053e`; both were scored and both decisions were `ABSTAIN`. This is continuity evidence only. It does not claim V2 canonical iteration binding, `allowedActionsBitmap` enforcement, or V2 duplicate-prevention semantics.
