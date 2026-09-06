# PRIOR Demo Script — 2–3 minutes

## 0:00–0:15 — Thesis

“Prediction markets tell you what the market believed. PRIOR preserves what you believed before reality.”

Open `/live` and frame the amber Market node and blue Forecast node as separate objects.

## 0:15–0:45 — Commit a belief

Show the real DreamDEX market, typed cadence, reference probability, and countdown. Move the blue Forecast node. Explain that the amber market reference is observed data, not the user’s belief.

Commit through the visible state sequence:

```text
EDITABLE → SIGNING → SUBMITTED → CONFIRMING → COMMITTED
```

Only confirmation crosses the commitment boundary.

## 0:45–1:15 — Score the belief

Open the RFT proof surface. Show Forecast, market reference, canonical outcome, Forecast Brier, market Brier, and delta. Keep Forecast quality separate from execution.

## 1:15–1:50 — Persistent Circuit intent

Open Circuit `0x15e18e2aecb7d00ca3243181fb2fa38af81b021266e2d0a290eb0c55d2b5f4c1`.

Show the stable intent panel: BTC 5m, four target windows, fixed owner/forecaster, margin, budget, cap, and allowed actions.

Walk the timeline:

```text
Market A → Forecast → Policy → ABSTAIN → Outcome → RFT lock
                 ↓
          Runner restart/recovery
                 ↓
Market B → Forecast → Policy → ABSTAIN → Outcome → RFT lock
```

Say: “The point is not that the Circuit trades every market. The point is that the same intent survives each market and evaluates it again.”

## 1:50–2:20 — Economic execution evidence

Open Market #1 proof. Show the intentional losing trade: Forecast, reference, BUY_UP policy, `420` maximum temporary pull, `281` actual fill cost, `139` return, zero payout, and `-281` PnL. Explain that PRIOR preserves losses instead of cherry-picking wins.

## 2:20–2:40 — Recovery and close

Show Runner recovery: two reconstructed iterations, zero duplicate Forecasts/proposals/orders.

Close: “One committed belief is evidence. One persistent intent across markets is a Circuit. That’s PRIOR.”

Do not demonstrate autonomous execution; it is externally blocked and outside the submitted guided path.
