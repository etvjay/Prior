# PRIOR — Motion System & Choreography

**Version:** 0.1  
**Purpose:** Make motion part of the product model so implementation agents do not improvise decorative animation.

---

# 0. Motion Thesis

Prior uses motion to explain:

```text
state
causality
continuity
irreversibility
focus
time
```

Motion is not decoration.

Every major animation must answer one of these questions:

```text
What changed?
Why did it change?
What object persisted?
What became irreversible?
What is live now?
What moves forward next?
```

If an animation cannot answer one of those, remove it.

---

# 1. Motion Grammar

Prior has six motion classes:

```text
1. Focus motion
2. State motion
3. Commitment motion
4. Execution motion
5. Continuity motion
6. Resolution motion
```

## 1. Focus motion

Used when:

```text
a market becomes active
a Forecast is selected
a Circuit iteration is inspected
a detail panel opens
```

Effect:

```text
selected object moves toward center / foreground
secondary objects recede or soften
```

## 2. State motion

Used when an object changes state:

```text
editable → committed
pending → confirmed
future → live
live → resolved
```

Motion must preserve the same object identity.

## 3. Commitment motion

Used only when a user crosses a meaningful boundary:

```text
Forecast commit
Circuit authorization
Circuit revocation
```

These transitions feel weightier and slower.

## 4. Execution motion

Used for:

```text
policy evaluation
order submission
fill/no-fill
```

Execution motion is directional and causal.

## 5. Continuity motion

Used when:

```text
Forecast becomes one Circuit point
Circuit advances to next market
History collapses into Profile aggregate
```

This shows that new views are the same underlying evidence at a different scale.

## 6. Resolution motion

Used when uncertainty becomes final.

Resolution should feel like:

```text
arrival
lock
settle
```

not celebration.

---

# 2. Timing Tokens

```text
--motion-instant     80ms
--motion-micro       120–180ms
--motion-control     180–260ms
--motion-panel       280–420ms
--motion-focus       360–520ms
--motion-route       450–650ms
--motion-commit      520–760ms
--motion-resolution  650–1000ms
```

No arbitrary per-component timing unless justified.

---

# 3. Easing

## Direct manipulation

Use spring/physical response for:

```text
Forecast dragging
market-object focusing
small draggable controls
```

Properties:

```text
fast response
low overshoot
little bounce
```

## State transitions

Use controlled ease-out / ease-in-out for:

```text
commit
route transitions
resolution
panel expansion
```

Avoid playful bounce on irreversible states.

## Recommended implementation

One motion library only.

Preferred:

```text
Motion / Framer Motion
```

Optional native browser View Transitions for route continuity when reliable.

Do not mix:

```text
GSAP
Framer Motion
anime.js
CSS transition systems
```

without a specific need.

---

# 4. Spatial Model

Prior uses 2.5D depth.

Three planes:

```text
BACKGROUND
other live markets / environmental data

MIDGROUND
active market / market reference

FOREGROUND
user Forecast / active execution / evidence
```

Depth is expressed through:

```text
scale
blur
opacity
z-order
parallax
shadow
position
```

Do not build a literal 3D scene unless necessary.

---

# 5. Text Motion System

Text motion must communicate hierarchy and state.

## A. Thesis reveal

Used on landing.

Example:

```text
COMMIT
BEFORE
REALITY
DOES.
```

Behavior:

```text
line 1 enters
line 2 follows with slight delay
line 3 enters as market object appears
line 4 settles only when Forecast object appears
```

Use:

```text
clip-mask reveal
vertical translation 12–24px
opacity
tracking tighten
```

Avoid random character scrambling.

---

## B. Numeric motion

Probabilities, prices and timers are live values.

Use:

```text
tabular numerals
digit interpolation
small vertical number roll
```

Examples:

```text
61 → 62 → 63
08:41 → 08:40
```

Rules:

- do not animate every tick with large movement;
- no slot-machine effect;
- live updates should be subtle;
- committed Forecast stops animating entirely.

---

## C. State-word motion

State labels:

```text
LIVE
COMMITTING
COMMITTED
EXECUTING
FILLED
RESOLVED
VOIDED
MISSED
```

Use short replacement transitions.

Example:

```text
COMMITTING
   ↓
COMMITTED
```

The old word shifts out 6–10px; new word settles into same baseline.

Do not move the surrounding layout.

---

## D. Evidence reveal

Technical metadata appears after the primary state.

Example:

```text
COMMITTED
72%

block 18,392,117
tx 0x...
```

The probability settles first.

Then evidence metadata fades/raises in 100–180ms later.

This creates hierarchy:

```text
meaning
then proof
```

---

## E. Scroll-linked typography

Landing text can react to scroll, but must remain readable.

Allowed:

```text
scale 0.92 → 1.0
tracking changes
mask reveals
small x/y drift
opacity
```

Avoid:

```text
full paragraphs moving independently
letters flying across screen
horizontal marquees for key explanations
```

---

# 6. Landing Scroll Motion

The landing page is one continuous explanatory choreography.

## Scene 0 — Arrival

Viewport:

```text
dark field
small ambient market objects
PRIOR
```

Hero thesis enters.

Background markets move very slowly.

No primary Forecast yet.

---

## Scene 1 — Market forms

A single amber market object moves from background to midground.

Text:

```text
THE MARKET HAS A VIEW.
```

Then:

```text
61% UP
```

The object gains the `MARKET` label.

---

## Scene 2 — Your belief enters

A blue Forecast object enters from opposite spatial side.

Text:

```text
SO DO YOU.
```

Then:

```text
72% UP
```

The two objects occupy a split composition.

---

## Scene 3 — Probability space appears

As user scrolls:

```text
MARKET | YOU
```

morphs into a shared probability line:

```text
0 ─────────◆──────●──────── 100
```

This shows the two values belong to one probability space.

---

## Scene 4 — Commitment

Scroll pins the viewport.

The blue Forecast object becomes interactive/focused.

Copy:

```text
COMMIT BEFORE REALITY DOES.
```

On progression:

```text
editable
  ↓
commit boundary appears
  ↓
Forecast crosses boundary
  ↓
Forecast locks
```

The locked object cannot drift afterward.

---

## Scene 5 — Time passes

The market object remains alive.

Countdown compresses.

Ambient market objects continue changing.

The Forecast remains fixed.

This contrast is important:

```text
market moves
belief stays committed
```

---

## Scene 6 — Resolution arrives

Outcome enters from the market side.

Example:

```text
UP
```

It travels toward the committed Forecast.

They converge visually into an evidence block.

No explosion/confetti.

---

## Scene 7 — Evidence object

The resolved Forecast becomes a compact evidence card/object:

```text
72% Forecast
61% Market
UP Outcome
0.0784 Brier
```

It floats forward slightly while background dims.

---

## Scene 8 — Zoom out to History

Camera/scene pulls back.

The one evidence object shrinks into:

```text
●
```

More resolved Forecast points appear around it.

Text:

```text
ONE FORECAST IS EVIDENCE.
MANY BECOME YOUR RECORD.
```

---

## Scene 9 — Circuit reveal

The same Forecast point becomes one node in a Circuit.

Critical choreography:

```text
1. existing Forecast node stays fixed
2. intent spine appears above
3. past/future market slots extend horizontally
4. policy line connects intent to each market
5. actions appear below completed nodes
6. current live node wakes
```

Copy:

```text
SET YOUR RULES ONCE.
LET THEM RUN ACROSS MARKETS.
```

The visual must show:

```text
same intent
↓
different markets
↓
repeated Forecast → policy → action
```

not merely a timeline.

---

## Scene 10 — Product resolves from abstraction

The abstract Circuit/Forecast objects slide into the actual Prior UI shell.

Navigation becomes visible.

CTA:

```text
ENTER PRIOR
```

The landing page should end by revealing the real product interface.

---

# 7. Live Page Motion

## Market floor

Inactive markets exist as secondary objects/rows.

Selecting a market:

```text
selected market lifts
other markets soften
selected object travels to center
central split opens
market data resolves into place
Forecast side activates
```

No full-screen flash.

## Market switching

Old market:

```text
recedes / slides slightly backward
```

New market:

```text
enters from market rail/floor origin
```

Forecast draft resets visibly.

Do not carry a Forecast across market identities.

---

# 8. Forecast Interaction Motion

## Drag

The user grabs the blue Forecast object.

As it moves:

```text
probability number updates
shared axis reacts
distance from market becomes visible
background geometry subtly shifts
```

The market object never follows the Forecast.

## Release

Forecast object settles with small spring.

## Exact typing

If user enters a number manually:

```text
object travels to new probability position
```

so direct input and spatial state remain synchronized.

---

# 9. Commit Motion

Commit is the signature irreversible transition.

Sequence:

```text
1. user presses COMMIT
2. Forecast object compresses slightly
3. input affordances disappear
4. commitment boundary appears
5. Forecast crosses boundary / depth plane
6. wallet/submission state begins
7. pending object remains visibly pending
8. chain success arrives
9. Forecast locks into evidence plane
10. block/tx metadata appears
```

Important:

If transaction fails:

```text
object returns to editable plane
```

Do not complete the boundary crossing visually before chain confirmation.

---

# 10. Detail Toggle / Dense Mode Motion

Default Live view:

```text
MARKET | FORECAST
```

Toggle:

```text
MARKET DEPTH
```

Behavior:

```text
central split compresses 10–18%
active scene drifts left
order-book plane enters from right/rear
secondary execution context rises from lower plane
```

This is a layout expansion, not a modal.

Closing:

```text
detail plane recedes
central split expands back
```

Same object positions persist.

---

# 11. Order Book Motion

The order book is data-dense; motion must be restrained.

Allowed:

```text
row quantity bar width changes
price row fades between states
best ask/bid receives subtle positional emphasis
```

Not allowed:

```text
rows flying
large pulsing colors
continuous glowing animation
```

The Forecast-derived max price line may slide into the order book:

```text
YOUR LIMIT 64%
────────────────
```

This visually connects policy to executable liquidity.

---

# 12. Circuit Motion System

Circuit motion must explain persistent intent.

## Persistent intent spine

Circuit header/left rail contains the rules.

It remains spatially stable across iterations.

Example:

```text
BTC 15m
8 markets
8pt minimum
$15 max
pause after 2 losses
```

This should not reanimate every market.

It is the constant.

## Current iteration

The changing center shows:

```text
market
Forecast
policy
decision
execution
resolution
```

## Timeline

Bottom shows:

```text
past ← current → future
```

---

# 13. Circuit Iteration Choreography

For every new market:

```text
FUTURE SLOT
○
  ↓
slot activates
◉ LIVE
  ↓
market object enters
  ↓
Forecast source indicator activates
  ↓
Forecast arrives
●
  ↓
commit boundary
  ↓
policy line lights
  ↓
rule calculation appears
  ↓
decision token forms
BUY UP / BUY DOWN / ABSTAIN
  ↓
execution token travels to DreamDEX lane
  ↓
ORDER PLACED
  ↓
FILLED / NO FILL
  ↓
wait
  ↓
resolution returns from market side
  ↓
RFT evidence locks
  ↓
Circuit state updates
  ↓
node moves into past
  ↓
next slot wakes
```

This sequence is mandatory.

---

# 14. Circuit Intent Visualization

The intent must visibly govern each market.

Recommended conceptual structure:

```text
             CIRCUIT INTENT
                  │
        ──────────┼──────────
                  │
      ┌───────────┼───────────┐
      ▼           ▼           ▼
   MARKET 1    MARKET 2    MARKET 3
      │           │           │
   Forecast    Forecast      LIVE
      │           │
   Policy      Policy
      │           │
    BUY        ABSTAIN
```

In the live UI this may be collapsed, but the causal relationship must be recoverable/visible.

---

# 15. Circuit Timeline Interaction

Hover/tap one past node:

```text
selected node grows 1.05–1.1x
adjacent nodes dim slightly
evidence preview rises
```

Click:

```text
timeline node
  ↓ shared-object morph
Forecast evidence page
```

Back:

```text
Forecast evidence object
  ↓ collapses
same Circuit node
```

---

# 16. Circuit Expand to Analysis

Default:

```text
control room
```

Toggle:

```text
VIEW FULL CIRCUIT
```

Transition:

```text
current market shrinks to current node
timeline expands vertically/horizontally
market/Forecast trajectories unfold
actions/results appear
```

Analysis view:

```text
TIME ─────────────────────────→

MARKET     ◆────◆────◆────◆
YOU        ●────●────●────●
ACTION     ↑    —    ↓    ↑
RESULT     ✓         ✓    ✕
```

---

# 17. History Motion

Two modes:

```text
ANALYSIS
ARCHIVE
```

## Analysis → Archive

Chart points become individual Forecast rows.

Sequence:

```text
aggregate line fades
points remain
points move into list positions
metadata expands
```

## Archive → Analysis

Rows compress into points.

This visually explains:

```text
aggregate = many Forecasts
```

---

# 18. Profile Motion

Profile aggregates multiple scopes.

Selecting a market scope:

```text
BTC 15m
ETH 1h
```

should transform relevant charts/stat blocks, not reload the entire page.

Active Circuits remain spatially distinct from resolved historical evidence.

---

# 19. Route Motion

## `/` → `/live`

Landing active market specimen becomes the Live focused market.

## `/live` → `/forecast/[id]`

Committed Forecast becomes Forecast page header/evidence object.

## `/circuit/[id]` → `/forecast/[id]`

Selected Circuit node expands into Forecast evidence.

## `/history/[address]` → `/forecast/[id]`

History row expands into Forecast evidence.

## `/forecast/[id]` → `/profile/[address]`

Forecaster identity chip anchors transition to aggregate profile.

---

# 20. Scroll Physics

Landing uses controlled scroll-linked scenes.

Rules:

- avoid scroll hijacking;
- browser scrolling remains natural;
- pinned scenes only where narrative requires;
- no horizontal-scroll trap;
- each pinned scene should exit cleanly;
- touch/mobile scroll must remain predictable.

Recommended implementation:

```text
IntersectionObserver
Motion useScroll/useTransform
CSS sticky
```

Avoid a heavy custom scroll engine unless clearly necessary.

---

# 21. Mobile Motion

Keep the same concepts but reduce travel distance.

## Forecast

Desktop split becomes vertical:

```text
MARKET
61%

probability field

YOU
72%
```

Drag remains available.

## Dense mode

Order book/execution enters as a bottom sheet rather than side plane.

## Circuit

Timeline becomes horizontal snap.

Intent panel collapses.

Current iteration stays fixed in primary viewport.

## Route transitions

Use smaller scale/translation.

No large parallax that risks dropped frames.

---

# 22. Performance Budget

Target:

```text
60fps on modern desktop
smooth interaction on mid-range mobile
```

Rules:

- animate transform/opacity where possible;
- avoid animating layout-heavy properties continuously;
- throttle live-data visual updates;
- do not rerender entire market floor for every order-book tick;
- virtualize long History/Archive lists;
- no giant WebGL dependency unless justified.

---

# 23. Accessibility

Motion never carries unique information.

Every state transition also changes:

```text
text label
ARIA state
DOM state
```

Honor:

```text
prefers-reduced-motion
```

Reduced mode removes:

```text
parallax
zoom
large travel
scroll-linked object movement
```

but preserves:

```text
state replacement
opacity
clear focus
timeline progression
```

---

# 24. Game-Like Motion Boundary

Wanted:

```text
tactical
responsive
stateful
competitive tension
round progression
clear consequence
```

Rejected:

```text
casino
slot-machine
loot-box
XP popups
confetti
screen shake
flashing urgency
fake reward loops
```

Think:

```text
strategy-game HUD
```

not:

```text
gambling app
```

---

# 25. Motion Review Checklist

Reject if:

- animation is decorative with no state meaning;
- committed Forecast still moves as if editable;
- market switch loses object continuity;
- Circuit timeline does not show intent causality;
- Runner activity is represented as execution success;
- order placement looks identical to fill;
- resolution feels celebratory instead of final;
- route changes are generic fades everywhere;
- scrolling traps the user;
- mobile drops the signature Forecast interaction;
- reduced-motion mode breaks comprehension;
- live data causes constant visual noise.

---

# 26. Implementation Contract

The coding agent must create one shared motion layer, for example:

```text
packages/ui-motion/
or
apps/web/lib/motion/
```

Containing:

```text
durations
easings
springs
shared layout IDs
route transition helpers
reduced-motion helpers
scroll scene helpers
numeric transition helpers
```

No page may define unrelated timing constants unless documented.

---

# 27. Required Motion Fixtures

Implement deterministic fixtures for:

```text
market switch
Forecast drag
Forecast commit success
Forecast commit failure
order submitted
order filled
order no-fill
market resolution
Circuit next-window activation
Circuit abstain
Circuit missed window
Runner offline/recovery
History analysis/archive switch
```

Use these for Storybook/dev pages and Playwright visual checks.

---

# 28. One-Shot Motion Directive

> Motion in Prior is part of the state model. Implement one shared motion system and map every meaningful animation to actual product state: focus, commitment, execution, continuity, or resolution. Preserve object identity across routes and scales. The Forecast is the signature movable object before commitment and must become physically/static visually immutable after confirmed commitment. The Market remains live while the Forecast stays fixed. Circuit motion must make persistent intent visibly govern each new market: future slot wakes, Forecast arrives, policy evaluates, action executes or abstains, resolution returns, evidence locks, Circuit state updates, and the next slot wakes. Use scroll-linked motion on the landing page to progressively reveal Market → Forecast → Commit → Resolution → Evidence → History → Circuit → actual product UI. Keep motion tactical/game-like, never casino-like. Honor reduced motion and performance budgets. Do not add animations that do not explain state, causality, continuity, irreversibility, focus, or time.
