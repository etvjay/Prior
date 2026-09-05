# PRIOR — Canonical System Definition v0.2

## Public product

**Prior**

## Public concepts

```text
Live
Forecast
Circuits
History
Profile
```

## Internal primitives

```text
Resolved Forecast Trial (RFT)
Circuit Intent
Circuit Policy
Circuit Authority
Circuit Execution
Circuit Runner
Execution Evidence
```

## System thesis

Prior proves two things:

1. **Belief continuity** — a forecast can be committed before reality and evaluated after resolution.
2. **Intent/execution continuity** — one bounded intent can persist across multiple Event Contracts without being recreated for every market.

Combined:

```text
belief continuity
+
intent continuity
+
execution continuity
+
evidence continuity
```

## Product architecture

```text
                         PRIOR
                           │
             ┌─────────────┴─────────────┐
             │                           │
             ▼                           ▼
         FORECAST                     CIRCUIT
       one market               persistent intent
             │                           │
             ▼                           │
            RFT ◄────────────────────────┤
             │                           │
             ▼                           │
         DreamDEX ◄──── execution ───────┘
             │
             ▼
         Resolution
             │
             ▼
          Evidence
             │
       ┌─────┴─────┐
       ▼           ▼
    History      Profile
```

## Forecast

A Forecast is one probability committed against one DreamDEX market before resolution.

Public example:

```text
BTC · 15 MIN

Market
61% UP

You
72% UP

COMMIT 72%
```

RFT is the internal evidence object beneath that Forecast.

## Circuit

A Circuit is:

> A persistent, bounded intent that operates across a declared sequence of eligible DreamDEX Event Contracts.

A Circuit is **not** merely an array or visualization of Forecasts.

It contains:

```text
scope
forecast source
policy
budget/limits
authority
stop conditions
progress
execution state
RFT references
```

Each eligible market triggers one iteration:

```text
new market
  ↓
obtain Forecast
  ↓
commit RFT
  ↓
read market state
  ↓
evaluate Circuit policy
  ↓
trade / abstain
  ↓
wait for DreamDEX resolution
  ↓
finalize RFT
  ↓
update Circuit
  ↓
next market
```

## Public naming rule

Normal UI uses:

```text
Forecast
Circuit
History
Profile
```

Technical terms such as `RFT`, `Circuit Policy`, `Runner`, and `Execution Evidence` appear only in protocol/evidence/developer views.

## Authority separation

A Circuit can involve four distinct roles:

```text
OWNER
configures intent and grants authority

FORECASTER
produces the probability

EXECUTOR
performs an allowed economic action

RUNNER
keeps the Circuit progressing across markets
```

These roles may share an identity in a simple deployment, but architecture must not assume they are the same.

## Liveness vs truth

The Runner provides **liveness**.

Contracts/DreamDEX provide **truth and limits**.

If the Runner stops:

```text
Circuit may stop progressing
```

but the Runner must not be able to:

```text
change intent
increase budget
change a committed Forecast
invent outcome
bypass stop conditions
withdraw arbitrary funds
```

## Design principle

One visual grammar across the entire product:

```text
Blue   = You / Forecast
Amber  = Market
Lime   = Up
Red    = Down
Violet = Resolved / final
```

A Circuit reuses the same Forecast objects across time; it does not invent a new charting language.

## Build principle

Design and schema all surfaces together, but implement in dependency order:

```text
DreamDEX/Somnia truth
    ↓
shared types
    ↓
RFT
    ↓
Circuit policy
    ↓
authority/executor
    ↓
runner/recovery
    ↓
Forecast UI
    ↓
Circuit UI
    ↓
History/Profile
```
