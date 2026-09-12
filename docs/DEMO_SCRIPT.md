# PRIOR Demo Script (3–5 minutes)

## Human entry walkthrough (current UI)

For a human product walkthrough, open `/participate` without a wallet. Inspect the `PUBLIC TEMPLATE` and the explicit `PUBLIC TEMPLATE → YOUR CIRCUIT INSTANCE` mapping. Continue to `/create?mode=participate`, review the forecast-only authority, and show the seven-step flow.

Do not call the template a shared Circuit. Do not claim the create or Forecast write succeeded without a wallet signature, successful receipt, and canonical readback. After activation, the participant-specific ID opens `/circuit/[id]` and `/live`; the Live write gate remains disabled for snapshots, wrong forecasters, wrong chains, expired markets, and missing canonical alignment.

## 0:00–0:30 — Problem

“Agents increasingly make consequential decisions, but belief, authority, execution, and outcome are usually collapsed into one opaque story. A forecast should not automatically become permission to spend money.”

## 0:30–1:15 — PRIOR model

Show the `/proof` page and explain:

```text
Forecast → RFT → Circuit → bounded consequence → canonical outcome → scored evidence
```

- Forecast: attributable belief before resolution.
- RFT: Resolution and Forecast Trail, the durable evidence object beneath one Forecast.
- Circuit: bounded mandate deciding what that judgment may cause.

“RFT measures judgment. Circuit assigns bounded consequence.”

## 1:15–2:45 — Live V2 proof

Open `/proof` and show:

- Forecaster and EIP-712 recovered identity;
- 50% UP Forecast and commit block;
- Circuit owner, target window, budget, and allowed-actions bitmap `0`;
- RFT/trial and `bound=true`;
- `BUY_UP → ActionNotAllowed`;
- `BUY_DOWN → ActionNotAllowed`;
- no order/collateral/approval;
- canonical DreamDEX outcome `DOWN`;
- RFT `SCORED`, Forecast Brier `25000000`;
- final Circuit `COMPLETE`, `processed=true`.

Do not fill the unavailable market-reference metrics.

## 2:45–3:30 — Historical continuity

Open the V1 continuity evidence. Explain carefully:

“One unchanged V1 Circuit intent advanced across two real Bitcoin markets, with one attributable RFT per market and both judgments scored.”

Clarify that V1 continuity is supporting evidence; V2 adds canonical Circuit ↔ market ↔ RFT binding and action enforcement.

## 3:30–4:15 — Agent surface

Use the public Worker capability endpoint and MCP `/mcp` endpoint. Show:

- bearer-authenticated capability discovery;
- bounded market discovery;
- live market/Circuit/RFT detail reads;
- read-only MCP tools;
- disabled writes and execution.

## 4:15–end — Why it matters

“Prior lets users bring any agent and give it a mandate, not a wallet. Trust can be allocated from attributable judgment and bounded consequence, not agent claims.”
