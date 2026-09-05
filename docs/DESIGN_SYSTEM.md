# Design System — Forecast Arena

## Design thesis

The product should feel like an **evidence instrument**, not a crypto dashboard.

Visual references:

```text
editorial research interface
+
precision measurement instrument
+
live market tension
+
immutable evidence ledger
```

Avoid:

- exchange-dashboard density;
- generic DeFi cards;
- neon gradients everywhere;
- gratuitous glassmorphism;
- giant token-price widgets;
- “AI” particle backgrounds;
- green/red as the only semantic signal;
- motion that has no state meaning.

## Core narrative

The interface should make one temporal idea physically understandable:

```text
belief
  → committed
  → locked
  → reality resolves
  → evidence remains
```

Motion must communicate that transition.

## Palette

### Foundations

| Token | Value | Use |
|---|---|---|
| `--ink-950` | `#0B0D0E` | Primary dark background |
| `--carbon-900` | `#121518` | Raised dark surface |
| `--carbon-800` | `#1A1E22` | Secondary surface |
| `--line-700` | `#2A2F34` | Borders/dividers |
| `--bone-050` | `#F3F0E8` | Primary light text |
| `--fog-300` | `#A6A8A5` | Secondary text |

### Semantic

| Token | Value | Meaning |
|---|---|---|
| `--forecast` | `#72D6FF` | User belief / forecast |
| `--market` | `#F2B84B` | DreamDEX market reference |
| `--up` | `#B8F15B` | Up outcome |
| `--down` | `#FF6B5E` | Down outcome |
| `--resolved` | `#A78BFA` | Resolution/evidence finality |
| `--danger` | `#FF5D65` | Error/destructive state |

Never encode Up/Down only by color. Pair with labels, arrows, patterns or glyphs.

## Typography

Preferred direction:

- display: narrow/high-contrast grotesk or editorial sans;
- UI/body: neutral grotesk;
- numbers: tabular figures;
- hashes/addresses/blocks: monospace.

The dominant typographic hierarchy is:

```text
large thesis
large probability
small evidence labels
dense-but-readable metadata
```

Do not make every section a card.

## Spatial model

Use large empty fields around the current trial.

The screen should feel like one instrument under examination, not twenty widgets competing.

Desktop target:

```text
12-column grid
max content width ≈ 1440
wide center trial field
persistent but quiet evidence rail
```

Mobile collapses to one vertical narrative.

# Landing Page

## Objective

A first-time visitor should understand within one screen:

1. this is about **what you believed before the answer**;
2. it uses live DreamDEX markets;
3. forecasts become immutable/resolved evidence;
4. there is a live arena to enter.

## Header

Left:

```text
RFT
```

Center/optional:

```text
Arena
Evidence
Protocol
```

Right:

```text
Connect
```

No mega-navigation.

## Hero

### Primary copy

Recommended:

```text
Commit before
reality does.
```

Supporting line:

```text
Turn live DreamDEX markets into verifiable forecasting trials.
Commit a probability, optionally trade it, and measure the belief when the market resolves.
```

Primary CTA:

```text
Enter live trial
```

Secondary:

```text
See a resolved trial
```

### Hero object

The right side is not a decorative illustration.

It is a **live trial specimen**:

```text
BTC · 15 MIN

MARKET
61% UP

YOUR FORECAST
72% UP

[ COMMIT 72% ]
```

A quiet timeline underneath:

```text
FORECAST ─ COMMIT ─ LOCK ─ RESOLVE ─ EVIDENCE
```

## Landing scroll sequence

### Section 1 — The missing evidence

Contrast:

```text
Trade history says:
you bought Up.

RFT says:
you believed 72% Up
when the market priced 61%,
you committed at block X,
and DreamDEX later resolved Up.
```

### Section 2 — How a trial moves

Full-width animated lifecycle.

### Section 3 — Resolved specimen

Show one complete evidence object, not a marketing card.

### Section 4 — Primitive / architecture

Minimal topology:

```text
Human / Agent
    ↓
RFT
 ↙      ↘
DreamDEX Somnia
    ↓
Resolved Evidence
```

### Section 5 — CTA

```text
Reality is still unknown.
Commit a forecast.
```

CTA routes to `/arena`.

# Route transitions

## `/` → `/arena`

Use a shared-element transition.

The hero live-market specimen becomes the arena's focused market.

Motion:

1. background copy recedes;
2. specimen expands to center stage;
3. surrounding controls fade/slide in;
4. probability control becomes interactive;
5. URL changes without breaking continuity.

Target duration: ~450–650ms.

No full-screen loader unless network data is actually unavailable.

## `/arena` → `/trial/[trialId]`

After commitment, **do not immediately navigate away**.

The arena enters `COMMITTED`.

When the user opens “View trial”, the frozen commitment panel morphs into the evidence header on the trial page.

## `/trial/[id]` → `/forecaster/[address]`

The forecaster address/identity chip acts as the transition anchor.

History should feel like zooming out from one evidence object into the evidence set.

# Arena Layout

Desktop:

```text
┌───────────────────────────────────────────────────────────┐
│ RFT                       BTC · 15m            wallet     │
├────────────┬──────────────────────────────┬───────────────┤
│ market rail│                              │ evidence rail │
│            │       TRIAL CANVAS           │               │
│ BTC 15m    │                              │ chain status  │
│ BTC 1h     │      Market   61%            │ marketId      │
│ ETH 15m    │      You      72%            │ block         │
│ ETH 1h     │                              │ expiry        │
│            │    probability control       │               │
│            │                              │               │
│            │   [ Commit forecast ]        │               │
└────────────┴──────────────────────────────┴───────────────┘
```

The market rail is narrow. The trial canvas owns visual priority.

# Probability control

Avoid a generic range slider alone.

Use:

```text
72%
```

as the dominant element with:

- drag scrub;
- arrow-key adjustment;
- direct numeric input;
- optional 1% / 5% step controls.

The Market 61% marker sits on the same visual scale but uses the market color and cannot be dragged.

This visually teaches:

```text
your belief ≠ market belief
```

# Button motion rules

Motion is stateful, not decorative.

## Connect

```text
CONNECT
  ↓ wallet opens
CONNECTING…
  ↓ success
0x8F…21C
```

The button morphs in place. No toast is required for ordinary success.

## Commit Forecast

Idle:

```text
COMMIT 72%
```

Press:

- scale to ~0.98;
- probability control stops responding;
- perimeter/progress trace indicates wallet request.

Wallet accepted:

```text
SIGNING / SUBMITTING
```

Chain pending:

- button becomes a horizontal transaction rail;
- a small block indicator advances.

Success:

```text
COMMITTED · BLOCK 12,345
```

The control locks. Forecast blue becomes a stable outlined/filled evidence token.

Failure:

- control returns to editable state;
- exact failure is shown inline;
- never show “Committed” optimistically.

## Trade Up / Trade Down

After commitment, action controls enter from beneath the commitment boundary.

Tap:

```text
BUY UP
```

opens a bounded execution sheet containing:

- current executable price;
- amount;
- expected max cost;
- live market-status check;
- explicit submit.

On submit, the action chip visually moves toward a DreamDEX lane on the evidence rail.

On verified transaction:

```text
ORDER LINKED
```

appears with tx/order evidence.

## Abstain

`ABSTAIN` should feel intentional, not disabled.

On selection:

- trade buttons recede;
- `ABSTAINED` becomes a neutral evidence chip;
- rationale entry may be optional/offchain but is not required.

## Finalize

Only appears when DreamDEX is terminal but the trial has not been finalized.

On finalization success:

1. DreamDEX outcome enters from market side;
2. committed forecast enters from user side;
3. both converge into the score calculation;
4. `RESOLVED` or `VOIDED` stamp appears;
5. editable/action controls disappear permanently.

# Motion tokens

```text
micro:      100–180ms
control:    180–260ms
panel:      280–420ms
route:      450–650ms
resolution: 650–1000ms
```

Use spring motion only for direct manipulation. Use eased motion for evidence/finality.

Honor `prefers-reduced-motion`: replace spatial transformations with opacity/state changes.

# Responsive behavior

Mobile priority:

```text
market
forecast
commit
action
evidence
```

Do not reproduce desktop sidebars. Convert market selection to a top/bottom sheet and evidence rail to a collapsible timeline.

# Accessibility

- Full keyboard probability control.
- Visible focus states.
- Tabular digits.
- Text labels for every semantic color.
- Minimum contrast appropriate to WCAG AA.
- Reduced-motion mode.
- Pending transaction state announced to assistive technology.

# Canonical implementation source

For visual implementation, the frozen sources are:

```text
docs/VISUAL_LANGUAGE.md
docs/SCREEN_GEOMETRY.md
docs/UI_ONESHOT_SPEC.md
docs/MOTION_SYSTEM.md
```

If exploratory design prose or generated images conflict with these, the frozen sources above win.

## Hard constraints

```text
dark-only
no gradients
no glassmorphism
no planet/orb market objects
Forecast = blue circle
Market = amber diamond
Phosphor Regular base icon system
Geist Sans + IBM Plex Mono
solid dark surfaces
limited radii
one clipped-corner motif
```
