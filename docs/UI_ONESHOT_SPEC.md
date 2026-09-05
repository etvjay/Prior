# PRIOR — UI One-Shot Implementation Contract

**Version:** 0.1  
**Scope:** Landing, Live, Forecast, Circuits, Circuit, History, Profile  
**Design direction:** cinematic + high-concept + dense financial/research instrument  
**Primary rule:** motion must map to real product state.

Canonical motion implementation is defined in `docs/MOTION_SYSTEM.md`.

Frozen visual tokens and exact geometry are defined in `docs/VISUAL_LANGUAGE.md` and `docs/SCREEN_GEOMETRY.md`.

---

# 0. Public Product

The only public-facing name is:

```text
PRIOR
```

Primary navigation:

```text
Live
Circuits
History
Profile
```

Do not expose:

```text
RFT
Resolved Forecast Trials
Forecast Arena
Event Circuit
```

as separate brands.

Technical terms may appear only in evidence/developer details.

---

# 1. Experience Thesis

Prior should feel like:

```text
cinematic event system
+
precision forecasting instrument
+
live market environment
+
immutable evidence record
```

It should **not** feel like:

```text
generic exchange dashboard
DeFi analytics dashboard
AI agent control panel
card grid
token terminal clone
```

The primary visual story is:

```text
market exists
    ↓
belief forms
    ↓
belief commits
    ↓
belief becomes immutable
    ↓
rule evaluates
    ↓
action executes or abstains
    ↓
market resolves
    ↓
evidence remains
    ↓
intent continues across markets
```

---

# 2. Visual Tokens

## Base colors

```text
--ink-950      #0B0D0E
--carbon-900   #121518
--carbon-800   #1A1E22
--line-700     #2A2F34
--bone-050     #F3F0E8
--fog-300      #A6A8A5
```

## Semantic colors

```text
--forecast     #72D6FF
--market       #F2B84B
--up           #B8F15B
--down         #FF6B5E
--resolved     #A78BFA
--danger       #FF5D65
```

Semantic meaning:

```text
Blue   = You / Forecast
Amber  = Market
Lime   = Up
Red    = Down
Violet = Resolution/finality
```

Never use color as the only semantic cue.

---

# 3. Typography

Use three roles:

## Display

For:

```text
hero thesis
large probabilities
major state words
```

Direction:

- editorial grotesk;
- narrow or high-contrast sans;
- large scale;
- strong tracking control.

## Interface

For:

```text
controls
labels
market metadata
navigation
```

Neutral grotesk.

## Evidence

For:

```text
blocks
hashes
addresses
marketId
transaction
timestamps
```

Monospace with tabular numerals.

## Numbers

Probability and price figures must use tabular numerals.

---

# 4. Global Layout

Desktop:

```text
max width: ~1440px
12-column grid
full-height scenes allowed
persistent top nav
market/sidebar rails only where useful
```

Mobile:

```text
single narrative column
bottom/sheet navigation where needed
preserve state hierarchy, not desktop geometry
```

Desktop and mobile are developed together.

No “desktop first, fix mobile later.”

---

# 5. Global Route Map

```text
/
│
├── /live
│     └── /forecast/[id]
│
├── /circuits
│     └── /circuit/[id]
│           └── /forecast/[id]
│
├── /history/[address]
│     └── /forecast/[id]
│
└── /profile/[address]
      ├── /history/[address]
      └── /circuit/[id]
```

---

# 6. Route Transition Rule

Navigation should preserve object continuity.

Do not use generic page fades by default.

Use shared-object transitions:

```text
landing market specimen
    ↓
live market

live Forecast
    ↓
committed Forecast

committed Forecast
    ↓
Forecast evidence page

Circuit timeline point
    ↓
Forecast evidence page

Forecast evidence
    ↓
History row

History aggregate
    ↓
Profile
```

Target route duration:

```text
450–650ms
```

Reduced-motion mode replaces spatial transitions with opacity/state changes.

---

# 7. Landing Page

## Goal

Within the first viewport, the user understands:

```text
this is about what you believe before the answer
the market has its own view
you can commit yours
it becomes evidence after resolution
```

## Header

Left:

```text
PRIOR
```

Center:

```text
Live
Circuits
History
```

Right:

```text
Connect
```

No mega-nav.

---

## Hero

Copy:

```text
COMMIT BEFORE
REALITY DOES.
```

Supporting:

```text
Forecast live markets.
Lock what you believe.
Let the result prove it.
```

Primary CTA:

```text
Enter live market
```

Secondary:

```text
See a resolved Forecast
```

## Hero object

Must be a real product specimen, not decorative art.

```text
BTC · 15 MIN

MARKET
61% UP

YOU
72% UP

[ COMMIT 72% ]
```

Below:

```text
FORECAST → COMMIT → RESOLVE → EVIDENCE
```

---

# 8. Landing Scroll Narrative

The page reveals the full product gradually.

## Scene 1 — Market

A live Event Contract appears.

```text
BTC · 15m
Market 61% Up
```

No user Forecast yet.

---

## Scene 2 — Belief

User Forecast enters.

```text
YOU
72% UP
```

The market and user values occupy a shared probability field.

---

## Scene 3 — Commit

The Forecast crosses the visual commitment boundary.

The editable number becomes an immutable object.

Copy:

```text
Once committed,
it cannot be rewritten.
```

---

## Scene 4 — Resolution

DreamDEX outcome enters from the market side.

```text
UP
```

The committed Forecast does not move.

---

## Scene 5 — Evidence

The two values and outcome produce:

```text
Forecast
72%

Market at commit
61%

Outcome
UP

Score
0.0784
```

---

## Scene 6 — History

The single Forecast shrinks into one point.

More points appear.

```text
● ● ● ● ●
```

Copy:

```text
One Forecast is evidence.
Many become your record.
```

---

## Scene 7 — Circuit

The same Forecast objects connect through time.

But now show the governing rule above them.

```text
BTC · 15m
8 markets
8pt minimum margin
$15 max per market

●──●──◉──○──○──○──○──○
```

Execution actions appear beneath:

```text
BUY   ABSTAIN   LIVE
```

Copy:

```text
Set your rules once.
Let them run across markets.
```

This is the Circuit reveal.

---

## Scene 8 — CTA

```text
Reality is still unknown.

[ Start forecasting ]
```

---

# 9. Live Page

Route:

```text
/live
```

Dense by design.

## Desktop structure

```text
┌──────────────────────────────────────────────────────────────┐
│ PRIOR            LIVE                wallet / runner status │
├──────────────┬───────────────────────────────────────────────┤
│ MARKETS      │                                               │
│              │            FOCUSED MARKET                     │
│ BTC 15m      │                                               │
│ 61% Up       │                MARKET                         │
│ 08:41        │                  61%                          │
│              │                   ◆                           │
│ BTC 1h       │                                               │
│ 54% Up       │            YOUR FORECAST                     │
│ 41:27        │                                               │
│              │                  72%                          │
│ ETH 15m      │                   ●                           │
│ 43% Up       │                                               │
│ 03:08        │     0 ───────◆──────●────────── 100          │
│              │                                               │
│ ETH 1h       │            [ COMMIT 72% ]                    │
└──────────────┴───────────────────────────────────────────────┘
```

## Market sidebar

Each market displays:

```text
asset
interval
market-implied Up %
time remaining
status
```

Live values may update.

The sidebar remains anchored while the focused market performs a full central transition.

---

# 10. Market Switching

Clicking another market must not simply replace text.

Sequence:

```text
current market scene recedes
    ↓
probability field resets
    ↓
new market title/time enters
    ↓
market marker enters
    ↓
Forecast control becomes active
```

Duration:

```text
400–650ms
```

If the user has an uncommitted Forecast, preserve/confirm according to product rule; do not silently commit or carry it into another market.

---

# 11. Forecast Input

Primary interaction is the probability itself.

```text
72%
```

Supported interaction:

```text
mouse drag/scrub
touch drag
keyboard arrows
direct numeric input
```

Keyboard:

```text
↑ / ↓ = ±1%
Shift + ↑ / ↓ = ±5%
```

A secondary probability track is visible:

```text
0 ───────────────◆──────●────────────── 100
                 61     72
               MARKET   YOU
```

Do not use a generic slider as the only interaction.

---

# 12. Forecast Comparison

Show both:

## Large confrontation

```text
YOU                          MARKET

72%                           61%
UP                            UP
```

and:

## Shared field

```text
0 ───────────────◆──────●────────────── 100
                 61     72
```

The large values create drama.

The shared field explains the difference.

Use wording:

```text
11 point difference
```

not:

```text
11% edge
```

before execution/resolution analysis.

---

# 13. Commit Interaction

## Idle

```text
COMMIT 72%
```

## Press

- slight scale compression;
- probability stops responding;
- wallet request state begins.

## Wallet request

```text
CONFIRM IN WALLET
```

## Submitted

```text
SUBMITTING
```

Show transaction rail/progress.

## Confirmed

```text
COMMITTED

72%
block 18,392,117
```

The editable number becomes an evidence object.

The UI must make immutability physically obvious.

## Failure

Return to editable state.

Show exact error inline.

Never render `COMMITTED` before successful chain receipt.

---

# 14. After Commit

Immediately reveal:

```text
BUY UP
BUY DOWN
ABSTAIN
```

Below the committed Forecast.

Also:

```text
More context ⌄
```

Expandable context shows:

```text
Forecast
Market at commit
Circuit rule if present
Current executable price
Maximum allowed price
time remaining
marketId
```

Forecast remains visually dominant.

---

# 15. Execution Sheet

Trading action opens a bounded execution sheet.

Example:

```text
BUY UP

Your Forecast
72%

Market at commit
61%

Your Circuit rule
Need 8 points

Max allowed price
64%

Available
63%

Amount
$15

[ SUBMIT ]
```

If not in Circuit/manual single Forecast mode, execution sheet may omit Circuit rule and use explicit user-set limit/amount.

State sequence:

```text
READY
→ WALLET / RUNNER REQUEST
→ SUBMITTING
→ ORDER PLACED
→ FILLED / NO FILL / REVERTED
```

Do not represent `ORDER PLACED` as `FILLED`.

---

# 16. Forecast Evidence Page

Route:

```text
/forecast/[id]
```

Analytical first.

Certificate second.

## Main analytical area

```text
RESOLVED

BTC · 15 MIN

YOUR FORECAST
72% UP

MARKET AT COMMIT
61% UP

OUTCOME
UP

Forecast Brier
0.0784

Market Brier
0.1521

Beat market baseline on this Forecast
YES
```

## Execution section

```text
ACTION
BUY UP

MAX ALLOWED
64%

FILL
63%

ORDER
0x...

PnL
...
```

if applicable.

## Evidence timeline

```text
Forecast committed
block/time

Order submitted
tx/order

DreamDEX resolved
block/time

Forecast finalized
block/time
```

## Certificate rail

Right side on desktop:

```text
PRIOR
FORECAST #018

BTC · 15m
72% UP
RESOLVED UP

block ...
marketId ...
```

Export/share later.

Do not let certificate replace analysis.

---

# 17. Circuits List

Route:

```text
/circuits
```

Sections:

```text
ACTIVE
PAUSED
COMPLETE
```

Dense row/card hybrid:

```text
BTC · 15m
Circuit 04

3 / 8 markets
$44 / $100 used
8pt rule
Runner online

●──●──◉──○──○──○──○──○

[ Open ]
```

Do not use decorative cards with no operational state.

---

# 18. Create Circuit

The flow must feel like configuring intent, not filling a form.

Use staged full-screen/large-panel transitions.

## Step 1

```text
WHAT MARKET?

BTC · 15m
BTC · 1h
ETH · 15m
ETH · 1h
```

## Step 2

```text
HOW LONG?

4 markets
8 markets
12 markets
```

## Step 3

```text
WHO FORECASTS?

Me
Agent
```

## Step 4

```text
WHEN SHOULD PRIOR ACT?

Only when I can buy
at least

[ 8 points ]

below what I think
the outcome is worth.
```

## Step 5

```text
BUDGET

Total
$100

Maximum per market
$15
```

## Step 6

```text
WHEN SHOULD IT STOP?

Pause after
2 losses in a row
```

## Review

```text
BTC · 15m
8 markets
Agent Sigma
$100 total
$15 max
8 point minimum margin
pause after 2 losses

[ AUTHORIZE & START ]
```

---

# 19. Circuit Activation Motion

After `AUTHORIZE & START`:

```text
single setup panel
    ↓ contracts into
intent rail

future timeline extends
    ↓
○──○──○──○──○──○──○──○

first eligible window wakes
    ↓
◉──○──○──○──○──○──○──○
```

If authority setup requires multiple transactions:

```text
Circuit config
→ operator approval
→ collateral allowance
→ active
```

Show these as explicit setup steps.

Do not hide authorization behind one fake “loading” state.

---

# 20. Circuit Page

Route:

```text
/circuit/[id]
```

This is the second flagship surface after Live.

## Desktop composition

```text
┌─────────────────────────────────────────────────────────────┐
│ PRIOR                       BTC · 15m · CIRCUIT 04         │
├──────────────┬────────────────────────────┬─────────────────┤
│ INTENT       │ CURRENT MARKET             │ EXECUTION       │
│              │                            │                 │
│ 8 markets    │ Market       61% Up        │ FORECAST        │
│ $100 budget  │ Forecast     72% Up        │   ↓             │
│ $15 max      │                            │ POLICY          │
│ 8pt minimum  │ Max price     64%          │   ↓             │
│ pause 2 loss │ Available     63%          │ EXECUTION       │
│              │                            │   ↓             │
│              │ Decision      BUY UP       │ FILLED          │
├──────────────┴────────────────────────────┴─────────────────┤
│ 1       2       3       4       5       6       7       8 │
│ ●───────●───────◉───────○───────○───────○───────○───────○ │
│ BUY     ABSTAIN LIVE                                       │
└─────────────────────────────────────────────────────────────┘
```

---

# 21. Circuit Timeline States

Each slot:

```text
○ FUTURE
◉ LIVE
● FORECASTED
↑ EXECUTING
— ABSTAINED
✓ RESOLVED
◇ VOIDED
× MISSED
```

Use labels/accessible semantics, not glyph alone.

Missed windows remain visible.

---

# 22. Circuit Signature Motion

Each market iteration animates:

```text
future slot wakes
    ↓
market enters
    ↓
Forecast arrives
    ↓
Forecast commits
    ↓
rule evaluates visibly
    ↓
BUY / DOWN / ABSTAIN
    ↓
action moves into DreamDEX lane
    ↓
execution returns
    ↓
resolution enters from market side
    ↓
slot locks
    ↓
next slot wakes
```

This is Prior's primary cinematic sequence.

It must correspond to real state transitions.

---

# 23. Circuit Longitudinal View

Expandable from the Circuit page:

```text
Belief over time
```

Use the same objects:

```text
TIME ─────────────────────────────────────────────→

MARKET     ◆────◆────◆────◆────◆────◆
YOU        ●────●────●────●────●────●
ACTION     ↑    —    ↓    ↑    —    ↑
RESULT     ✓         ✓    ✕         ✓
```

This is a **view of Circuit execution history**, not the Circuit definition.

Hover/tap one point:

```text
point enlarges
other points soften
Forecast evidence drawer appears
```

Click:

```text
/circuit/[id]
  ↓
/forecast/[id]
```

using shared-object transition.

---

# 24. Runner State in UI

Runner status is operational metadata, not a giant agent badge.

Examples:

```text
RUNNER ONLINE
last reconciled block 18,392,118
```

or:

```text
RUNNER OFFLINE

Your rules and completed evidence are safe.
Progress may be delayed.
```

Never imply Runner outage changed historical Forecasts.

---

# 25. History

Route:

```text
/history/[address]
```

Two modes:

```text
OVERVIEW
FORECASTS
```

## Overview

```text
184 Forecasts
Brier 0.187
Directional accuracy 63.4%
Market-relative aggregate ...
Circuits completed 12
```

Calibration visualization below.

## Forecasts

Chronological:

```text
BTC 15m   72% Up   Market 61%   ✓
ETH 15m   41% Up   Market 48%   ✓
BTC 1h    68% Up   Market 54%   ✕
```

Each row opens the Forecast page.

---

# 26. Profile

Route:

```text
/profile/[address]
```

Purpose:

```text
show where this forecaster is strong or weak
```

Scope by market class.

Example:

```text
BTC · 15m
184 Forecasts
Brier 0.187

ETH · 1h
42 Forecasts
Brier 0.241
```

No universal reputation score.

No “trust score 87.”

---

# 27. Mobile

Mobile must preserve chronology:

```text
market
Forecast
commit
action
evidence
```

## Live

Market list becomes a bottom sheet or horizontal snap selector.

The Forecast probability remains visually dominant.

## Circuit

Intent becomes collapsible top section.

Current market/action stays primary.

Timeline becomes horizontally scrollable/snap.

Execution rail becomes an expandable sheet.

## Navigation

Use:

```text
Live
Circuits
History
Profile
```

as compact bottom navigation if appropriate.

---

# 28. Component Inventory

Minimum reusable components:

```text
PriorHeader
PrimaryNav
WalletControl

MarketRail
MarketRow
MarketScene
MarketCountdown
MarketProbabilityMarker

ForecastField
ForecastNumber
ProbabilityTrack
CommitButton
CommitStateRail

ActionBar
ExecutionSheet
ExecutionStateRail

EvidenceTimeline
ForecastScoreBlock
ForecastCertificate

CircuitIntentPanel
CircuitSetupStepper
CircuitTimeline
CircuitSlot
CircuitCurrentMarket
CircuitPolicyEvaluation
RunnerStatus

HistoryOverview
HistoryList
HistoryRow
CalibrationChart

ProfileScopeSection

StateError
ChainStatus
TxLink
EvidenceMeta
```

Do not build page-specific duplicates when the same semantic object exists elsewhere.

---

# 29. Animation Tokens

```text
micro      100–180ms
control    180–260ms
panel      280–420ms
route      450–650ms
resolution 650–1000ms
```

Spring:

```text
direct manipulation
drag/scrub
small physical controls
```

Eased:

```text
commit
resolution
route
evidence finality
```

No bouncy finality.

---

# 30. Reduced Motion

Honor:

```text
prefers-reduced-motion
```

Replace:

```text
large spatial moves
morphing
zooming
```

with:

```text
opacity
instant layout swap
small state emphasis
```

No information may depend on animation.

---

# 31. Loading and Skeleton Rules

Do not show fake live values.

For unknown state:

```text
MARKET
— —

loading live state
```

For stale indexed data waiting on chain confirmation:

```text
INDEXED
61%

ONCHAIN
checking...
```

Before writes use onchain truth.

---

# 32. Error Design

Errors attach to the action that failed.

Examples:

```text
Commit rejected in wallet
Market locked before submission
Operator approval missing
Collateral allowance insufficient
Order not filled
Order reverted
Runner offline
Forecast signature invalid
Market voided
```

Avoid generic:

```text
Something went wrong
```

unless no more precise classification exists.

---

# 33. Empty States

## No live markets

```text
No eligible markets are live right now.

Prior is watching DreamDEX.
```

## No Forecast history

```text
No resolved Forecasts yet.
```

## No Circuits

```text
No Circuits yet.

Set your rules once and let them run across markets.
```

---

# 34. Evidence Visibility

Every Forecast/Circuit result should expose:

```text
marketId
block
transaction
time
DreamDEX resolution
execution evidence
```

but not overwhelm the primary interaction.

Use progressive disclosure:

```text
simple result
  ↓
technical evidence
```

---

# 35. Mock Data Policy

Allowed:

```text
Storybook/dev fixtures
unit tests
design prototypes
```

Not allowed in the production live route unless explicitly labeled.

No demo fixture may silently render as a live DreamDEX market.

---

# 36. UI Testing

## Component/state tests

Required for:

```text
Forecast input
Commit states
Execution states
Circuit setup
Circuit timeline
Runner online/offline
Resolved/Void
```

## Playwright

Test:

```text
landing → live
switch market
set Forecast
wallet reject
commit success
post-commit action reveal
trade/no-fill state
open Forecast evidence
create Circuit
authorization setup
Circuit active
Runner offline
Circuit timeline progress
History view
Profile scope
mobile navigation
reduced-motion mode
```

---

# 37. Visual Review Gates

Reject the implementation if:

```text
Forecast and Market are visually ambiguous
Circuit looks like a generic bot dashboard
landing explains too much before showing the mechanism
commit success appears before receipt
order placed is shown as filled
Circuit timeline hides misses
mobile removes key evidence
route transitions lose object continuity
colors are used without labels
motion is decorative rather than stateful
```

---

# 38. UI Build Order

The coding agent should build the design system once, then surfaces in this order:

```text
1. tokens / typography / layout primitives
2. Market + Forecast primitives
3. landing hero + first scroll scenes
4. Live page
5. commit state choreography
6. Forecast evidence page
7. Circuit creation
8. Circuit live page
9. Circuit longitudinal view
10. History
11. Profile
12. responsive/mobile pass
13. reduced-motion pass
14. live-state wiring
15. design review
```

Do not fully polish mock pages before stateful primitives exist.

---

# 39. UI One-Shot Agent Directive

> Build Prior as one cinematic, high-concept forecasting and execution product, not a generic exchange dashboard. Use the sole public name `PRIOR`. Follow `DESIGN.md`, `DESIGN_SYSTEM.md`, `FRONTEND_STATE_MACHINE.md`, and this UI contract as binding. Keep Market, Forecast, Circuit, History and Profile visually continuous. The same semantic objects must survive route transitions: amber Market, blue Forecast, real execution state, violet finality. The landing page must reveal the mechanism progressively through scroll, ending with the execution-centric Circuit concept. The Live page is dense, with several active markets in an anchored sidebar and one full central market scene. Probability itself is the primary Forecast control. Committing must visibly transform an editable belief into an immutable evidence object only after confirmed chain success. After commit, show Buy Up / Buy Down / Abstain underneath with expandable execution context. Circuit creation configures intent in staged full-screen steps. The Circuit page must show rules, current Forecast, policy decision, execution lane and persistent timeline simultaneously, with motion mapping directly to real runner/chain/DreamDEX state. Resolved Forecast pages are analytical first with a certificate rail second. History supports overview and chronological views; Profile is scoped, never a universal reputation score. Desktop and mobile must be implemented together. Honor reduced motion. Do not use unlabeled mock data on live routes, generic card-grid layouts, fake transaction success, or decorative animation unrelated to product state.


# 40. Motion dependency

Before implementing any route or major interaction motion, read `docs/MOTION_SYSTEM.md` and run `skills/MOTION_REVIEW_SKILL.md` during UI review.

# 41. Frozen implementation references

The agent must treat these as implementation source of truth:

```text
docs/VISUAL_LANGUAGE.md
docs/SCREEN_GEOMETRY.md
docs/MOTION_SYSTEM.md
```

Generated concept images are reference-only and cannot override these documents.
