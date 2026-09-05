# DESIGN.md — Canonical Product Design Contract

This is the entry point for all frontend/design work.

Read with:

1. `DESIGN_SYSTEM.md`
2. `FRONTEND_STATE_MACHINE.md`
3. `PRODUCT_SPEC.md`
4. `INVARIANTS.md`

## Product experience

Forecast Arena is an **evidence instrument**.

It should visually explain:

```text
uncertain reality
      ↓
market prices a probability
      ↓
user forms a different/same belief
      ↓
belief is committed and becomes immutable
      ↓
optional economic action
      ↓
DreamDEX resolves
      ↓
forecast becomes evidence
```

Every screen, transition and motion should reinforce that chronology.

## Core visual language

- dark graphite field;
- bone/off-white editorial typography;
- user forecast = electric blue;
- market reference = amber;
- Up = lime;
- Down = vermilion;
- resolution/finality = violet;
- hashes, blocks and raw evidence = monospace;
- large probability typography;
- sparse surfaces rather than dashboard-card grids.

Full tokens are in `DESIGN_SYSTEM.md`.

## Canonical route map

```text
/
│
├─ Enter live trial
│       ↓
│     /arena
│       │
│       ├─ commit forecast
│       ├─ optional trade/abstain
│       │
│       └─ View trial
│              ↓
│        /trial/[trialId]
│              │
│              └─ forecaster identity
│                     ↓
│              /forecaster/[address]
│
└─ See resolved trial
        ↓
  /trial/[example/live-id]
```

## Page responsibilities

### `/`

Explain the mechanism and provide one live/representative market specimen.

Do not show a dashboard.

### `/arena`

One focused market/trial at a time.

Primary action is forecast commitment.

### `/trial/[trialId]`

Immutable evidence object.

This is the strongest proof page for reviewers/judges.

### `/forecaster/[address]`

Evidence set and scoped aggregates.

No generic reputation score.

## Object continuity

Routes use shared objects rather than unrelated page changes.

```text
hero market specimen
   → arena focused market
   → committed trial panel
   → trial evidence header
   → history row
```

A user should feel that one object is changing state, not that the app is opening unrelated screens.

## Motion contract

Motion may represent:

- becoming interactive;
- becoming pending;
- moving to an external execution lane;
- becoming immutable;
- receiving resolution;
- producing a derived score;
- zooming between one trial and a history of trials.

Motion must not exist merely to decorate.

## State contract

Visual state must follow `FRONTEND_STATE_MACHINE.md`.

Especially:

```text
wallet request ≠ submitted transaction
submitted ≠ confirmed
confirmed commit ≠ DreamDEX trade
DreamDEX resolved ≠ RFT finalized
voided ≠ wrong forecast
```

## Landing hero

Recommended:

```text
Commit before
reality does.

Turn live DreamDEX markets into verifiable forecasting trials.
```

Primary CTA:

```text
Enter live trial
```

Secondary:

```text
See a resolved trial
```

Hero object:

```text
BTC · 15 MIN

MARKET
61% UP

YOUR FORECAST
72% UP

[ COMMIT 72% ]

FORECAST ─ COMMIT ─ LOCK ─ RESOLVE ─ EVIDENCE
```

## Primary interaction animation

### Commit

```text
editable 72%
   ↓ wallet request
frozen-pending 72%
   ↓ receipt success
COMMITTED 72% · block #
```

The probability control physically stops behaving like an input and becomes an evidence object.

### Trade

Action chip moves visually toward the DreamDEX execution/evidence lane; it becomes “linked” only after verified transaction evidence.

### Resolve

Outcome enters from the DreamDEX/market side while the frozen forecast remains fixed. They converge visually into deterministic scoring.

This is the product's signature motion.

## Responsive rule

Mobile preserves chronology, not desktop layout:

```text
market
forecast
commit
action
resolution
evidence
```

Side rails become sheets/timelines.

## Design acceptance gate

A design is rejected if:

- it resembles a generic exchange dashboard before the mechanism is clear;
- forecast and market probability are visually ambiguous;
- success states precede successful receipts;
- motion does not map to state;
- route changes lose the current trial's object continuity;
- critical evidence is hidden behind decoration.
