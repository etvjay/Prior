# PRIOR — Canonical Visual Language

**Version:** 1.0  
**Status:** FROZEN FOR IMPLEMENTATION  
**Scope:** Brand, color, typography, geometry, icons, probability objects, chart language, sound/haptics

---

# 1. Product Character

Prior is:

```text
cinematic
tactical
game-like
precise
evidence-driven
dark
```

Prior is not:

```text
casino-like
glossy DeFi
glassmorphic
gradient-heavy
generic SaaS
generic exchange dashboard
```

The visual system should feel like a **strategy-game forecasting instrument**, not a betting interface.

---

# 2. Theme

Hackathon build is:

```text
DARK ONLY
```

Do not implement light mode for v0.1.

No gradients.

Depth comes from:

```text
solid dark surfaces
border contrast
opacity
shadow
blur
z-order
motion
```

Do not use gradient fills for:

```text
backgrounds
buttons
charts
nodes
panels
```

---

# 3. Color Tokens

```text
VOID             #08070A
BACKGROUND       #0D0B11
SURFACE_1        #121017
SURFACE_2        #17131E
SURFACE_3        #1D1727

BORDER_SUBTLE    #211B2A
BORDER           #30263F

PRIOR_PURPLE     #8B5CF6
PURPLE_BRIGHT    #A78BFA
PURPLE_MUTED     #665080

TEXT             #F5F2F8
TEXT_SECONDARY   #AAA3B2
TEXT_MUTED       #706A78

FORECAST         #65C7FF
MARKET           #EAB85E

UP               #A8E063
DOWN             #EF7067
ERROR            #F05D6C
```

## Semantic rule

```text
Purple = Prior/product state
Blue   = user Forecast
Amber  = Market/reference
Green  = Up/success where semantically correct
Red    = Down/error where semantically correct
```

Purple must not replace blue/amber in data semantics.

---

# 4. Button Tokens

Primary:

```text
background  #8B5CF6
text        #FFFFFF
hover       #9B72F7
pressed     #7B4DE0
disabled    #332A43
```

Secondary:

```text
background  transparent
border      #30263F
text        #F5F2F8
hover bg    #17131E
```

Danger:

```text
background  transparent
border      #EF7067
text        #EF7067
```

No gradient buttons.

---

# 5. Typography

Use:

```text
Geist Sans
IBM Plex Mono
```

## Geist Sans

Used for:

```text
hero
probabilities
navigation
controls
section headings
body
```

## IBM Plex Mono

Used for:

```text
hashes
marketId
block
tx
timestamps
technical evidence
```

## Scale

```text
Hero          88 / 84   weight 600
Scene title   64 / 62   weight 600
Probability   72 / 72   weight 500
Page title    36 / 40   weight 550
Section       24 / 30   weight 550
Body          15 / 22   weight 400
UI            13 / 18   weight 450
Label         11 / 14   weight 550
Evidence      11 / 16   mono
Micro         10 / 12   weight 550
```

## Tracking

```text
PRIOR wordmark        +0.32em
Hero uppercase        -0.035em
Large numbers         -0.045em
Section headings      -0.02em
Labels                +0.08em
Evidence              0
```

## Numeric rule

All probabilities/prices/timers:

```text
tabular numerals
```

---

# 6. Spacing

Base unit:

```text
4px
```

Scale:

```text
4
8
12
16
20
24
32
40
48
64
80
96
128
```

Rules:

```text
inline icon gap      8
control gap          12
small panel padding  16
normal panel         20
major panel          24
section gap          40–48
scene gap            80+
```

---

# 7. Radius & Geometry

```text
tiny technical surface  2px
small control            4px
button                   6px
normal panel             8px
large drawer             10px
mobile sheet             12px
status chip              pill
```

Do not use 20–32px card radii.

## Clipped corner motif

Use one clipped lower-right corner only on:

```text
focused market panel
active Circuit intent panel
expanded context drawer
```

Do not apply the motif everywhere.

---

# 8. Borders

```text
quiet       1px #211B2A
default     1px #30263F
focus       1px #8B5CF6
Forecast    1px #65C7FF
Market      1px #EAB85E
danger      1px #EF7067
```

2px only for accessibility/keyboard focus.

---

# 9. Icon System

Base library:

```text
Phosphor Regular
```

Rules:

```text
18px default
20px primary control
24px major action
Regular weight
consistent optical sizing
```

Custom Prior SVG icons:

```text
Market
Forecast
Circuit
Commit
Evidence
Abstain
Runner
```

Avoid metaphor clichés:

```text
brain = Forecast
robot = Agent
shield = Verified
lightning = Execute
```

Use system-object icons instead.

---

# 10. PRIOR Mark

Primary wordmark:

```text
P R I O R
```

Primary symbolic mark:

```text
● │
```

Meaning:

```text
belief
crossing
commitment boundary
```

Before:

```text
●  │
```

After:

```text
   │ ●
```

The mark may be animated during loading/commit.

---

# 11. Probability Object Language

## Market

Canonical object:

```text
◆
```

Properties:

```text
amber
fixed
non-draggable
diamond geometry
```

## Forecast

Canonical object:

```text
●
```

Properties:

```text
blue
draggable before commit
fixed after commit
circular geometry
```

## Size

Normal node:

```text
6px visual core
```

Focused interactive node:

```text
16–18px core
32–40px hit target
one thin outer focus ring
```

No planet/orb rendering.

No filled 3D sphere.

No gradient glow.

A restrained solid-color halo at low opacity is allowed only for focus/live state.

---

# 12. Chart Language

Only five canonical chart primitives:

```text
ForecastVsMarket
Calibration
CircuitTrajectory
HistorySparkline
OrderBookDepth
```

## Lines

```text
1px default
1.5px focused
```

## Nodes

```text
6px normal
8px selected
```

Forecast node:

```text
blue circle
```

Market node:

```text
amber diamond
```

## Grid

```text
#211B2A
1px
sparse
```

No heavy boxed chart backgrounds.

## Axis

```text
10–11px
compact UI or mono
```

## Tooltip

```text
SURFACE_3
solid
no gradient
no heavy blur
```

## No chart-library defaults

Every chart must use Prior's semantic node and line language.

---

# 13. Calibration

Scientific, not gamified.

```text
ACTUAL
100 │                         ●
    │                    ●
 75 │               ●
    │
 50 │          ●
    │
 25 │     ●
    │
  0 └────────────────────────────
     0   25   50   75   100
            FORECAST
```

Include thin diagonal reference:

```text
perfect calibration
```

---

# 14. Circuit Trajectory

Not a generic line chart.

```text
TIME ─────────────────────────────────────→

MARKET     ◆────◆────◆────◆────◆
FORECAST   ●────●────●────●────●
ACTION     ↑    —    ↓    ↑    —
RESULT     ✓         ✓    ✕
```

The intent spine must remain visible above/alongside this view.

---

# 15. Order Book

Solid depth bars.

No heatmap gradient.

Example:

```text
0.65  ███████
0.64  █████
----------------  YOUR LIMIT 0.64
0.63  ████████
```

Forecast-derived maximum price line is explicit and crisp.

---

# 16. Sound

Supported:

```text
YES
```

Default:

```text
OFF
```

User setting:

```text
Sound Off / On
```

Sound character:

```text
dry
mechanical
restrained
low-volume
```

No:

```text
cash register
coin sound
victory jingle
casino chime
```

---

# 17. Haptics

Use where platform supports it.

| Event | Haptic |
|---|---|
| Forecast pickup | very light |
| Cross 50% | light once |
| Forecast release | light |
| Commit confirmed | medium |
| Circuit authorized | medium |
| Order submitted | light |
| Fill | medium |
| No fill | light |
| Resolution | medium |
| Error | double-short |
| Next Circuit market | very light |

Do not haptic on every market tick.

---

# 18. Generated Image Rule

Generated concept images are:

```text
REFERENCE ONLY
```

They are not canonical implementation truth.

If a generated image conflicts with this document or canonical UI/motion docs:

```text
IGNORE THE IMAGE
```

Common rejected exploratory artifacts include:

```text
gradients
planets/orbs
generic dashboard cards
invented unsupported market classes
wrong Circuit terminology
permanent exchange-terminal density
```
