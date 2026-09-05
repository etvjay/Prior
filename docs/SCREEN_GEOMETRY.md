# PRIOR — Canonical Screen Geometry

**Version:** 1.0  
**Status:** FROZEN FOR IMPLEMENTATION

---

# 1. Desktop Breakpoint Baseline

Reference width:

```text
1440px+
```

Top bar:

```text
64px
```

Main app height:

```text
100dvh - topbar
```

---

# 2. `/live`

## Default layout

```text
┌──────────────────────────────────────────────────────────────┐
│ TOP BAR · 64                                                │
├────────────┬──────────────────────────────────────┬──────────┤
│ MARKET     │                                      │ CONTEXT  │
│ RAIL       │       MARKET | FORECAST              │ TRIGGERS │
│ 240px      │       FLEX                           │ 56px     │
│            │                                      │          │
└────────────┴──────────────────────────────────────┴──────────┘
```

## Market rail

Width:

```text
240px
```

Contains:

```text
live market rows
focused market state
small active-Circuit block at bottom
```

Does not contain:

```text
generic portfolio stats
PnL dashboard
large analytics cards
```

## Main viewport

Dominant visual area.

Top metadata:

```text
asset
interval
time remaining
status
```

Center:

```text
MARKET                 FORECAST
61%                    72%
◆                      ●
```

Interaction morph:

```text
MARKET | YOU
    ↓
shared probability axis
```

## Context trigger rail

Width:

```text
56px
```

Controls:

```text
DEPTH
EXEC
PROOF
```

## Expanded context

Width:

```text
360px
```

May vary 320–380px based on viewport.

Opening context:

```text
main viewport compresses
context enters from right/rear
no modal
```

## No permanent lower dashboard

Default `/live` does not permanently show:

```text
Recent Activity
Price History
Open Interest cards
large market stats strip
full Order Book
```

These appear only through contextual expansion where needed.

---

# 3. Forecast Node Component

Forecast:

```text
blue circle
draggable before commit
```

Market:

```text
amber diamond
fixed
```

Shared probability scale:

```text
0 ─────────◆──────────●──────── 100
```

The same component is reused in:

```text
/live
/circuit/[id]
landing
history
profile
```

---

# 4. `/circuit/[id]`

Desktop:

```text
┌────────────────────────────────────────────────────────────┐
│ CIRCUIT HEADER                                             │
├───────────────┬──────────────────────────┬─────────────────┤
│ INTENT        │ CURRENT ITERATION        │ EXECUTION       │
│ 260px         │ FLEX                     │ 300px           │
├───────────────┴──────────────────────────┴─────────────────┤
│ CONTINUITY / TIMELINE                                     │
└────────────────────────────────────────────────────────────┘
```

## Intent

Width:

```text
260px
```

Visual structure:

```text
CIRCUIT INTENT
LOCKED

BTC · 15M
│
├─ 8 markets
├─ Agent Sigma
├─ ≥ 8pt minimum margin
├─ $15 max / market
├─ $100 total
└─ pause after 2 losses
```

Controls:

```text
PAUSE
STOP
```

Never:

```text
Edit Intent
```

while active.

## Current iteration

Reuses `/live` Market/Forecast core.

Shows:

```text
market
Forecast
minimum margin
maximum acceptable price
available executable price
current decision
```

## Execution lane

Width:

```text
300px
```

Vertical causal chain:

```text
FORECAST
  ↓
POLICY
  ↓
MARKET
  ↓
DECISION
  ↓
ORDER
  ↓
RESULT
```

Each completed stage locks.

Only next active stage receives strong emphasis.

## Continuity

Always visible.

```text
#1  #2  #3  #4  #5  #6  #7  #8
●───●───●───◉───○───○───○───○
```

States remain labeled/accessibly represented.

---

# 5. Circuit Expanded Analysis

Do not navigate to a visually unrelated dashboard.

Transformation:

```text
current iteration shrinks
→ becomes current timeline point
→ timeline expands
→ trajectories unfold
```

Canonical layout:

```text
CIRCUIT INTENT
─────────────────────────────────────────────

TIME ───────────────────────────────────────→

MARKET      ◆────◆────◆────◆────◆
FORECAST    ●────●────●────●────●
ACTION      ↑    —    ↓    ↑    —
RESULT      ✓         ✓    ✕

BUDGET      100 → 85 → 85 → 70 → ...
```

Secondary metrics:

```text
completed
missed
abstained
average Brier
market-relative comparison
capital used
```

No generic KPI-card wall.

---

# 6. Landing Keyframes

Exactly nine major scenes.

## 1 — PRIOR

```text
P R I O R

COMMIT BEFORE
REALITY DOES.
```

## 2 — MARKET

Amber market object enters.

```text
THE MARKET
HAS A VIEW.

61%
◆
```

## 3 — YOU

Blue Forecast enters.

```text
SO DO YOU.

◆                         ●
61                        72
```

## 4 — SHARED SPACE

```text
0 ───────◆──────────●────── 100
         MARKET     YOU
```

Copy:

```text
Same question.
Different belief.
```

## 5 — COMMIT

Node crosses commitment boundary:

```text
● │
  ↓
│ ●
```

## 6 — REALITY

Market continues moving.

Forecast stays fixed.

Outcome arrives.

## 7 — EVIDENCE

```text
Forecast
Market
Outcome
Score
```

## 8 — CIRCUIT

Camera pulls back.

Intent spine appears.

Same Forecast becomes one Circuit node.

## 9 — PRODUCT

Abstract objects align into actual Prior `/live` shell.

CTA:

```text
ENTER PRIOR
```

---

# 7. Mobile `/live`

Mobile is a reflow, not a redesign.

```text
┌────────────────────────────┐
│ PRIOR       BTC15   08:41  │
├────────────────────────────┤
│ MARKET                     │
│ 61%                        │
│  ◆                         │
│                            │
│ ───── probability ───────  │
│                       ●    │
│                      72%   │
│                       YOU  │
│                            │
│ [ COMMIT 72% ]             │
├────────────────────────────┤
│ BTC15 BTC1H ETH15 ETH1H    │
└────────────────────────────┘
```

Market selector:

```text
horizontal snap
```

## Dense mode

Context becomes bottom sheet:

```text
55–70vh
```

Forecast remains visible above where practical.

---

# 8. Mobile Circuit

Primary order:

```text
Circuit header
Current market
Forecast
Rule
Execution
Timeline
```

Intent:

```text
RULES ▾
```

Execution:

```text
EXECUTION ▾
```

Timeline always available:

```text
●──●──●──◉──○──○──○──○
```

Horizontal scroll/snap.

---

# 9. Tablet

At intermediate widths:

```text
market rail may collapse to 180px or drawer
context panel overlays/reflows only if necessary
Circuit intent may become collapsible rail
```

Do not remove semantic objects.

---

# 10. Context Drawer Priority

Only one major context drawer visible at a time:

```text
DEPTH
EXEC
PROOF
```

Switching drawers keeps focused market/Forecast stable.

---

# 11. Exact Visual Priority

Default `/live` attention order:

```text
1. focused market + Forecast
2. time/status
3. commit/action
4. live market rail
5. context triggers
6. active Circuit reference
```

Default Circuit attention order:

```text
1. current iteration
2. execution causality
3. intent
4. continuity/timeline
5. secondary metrics
```
