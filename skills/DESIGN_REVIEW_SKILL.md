# Design Review Skill

## Objective

Keep Forecast Arena legible as a temporal evidence product.

## Review axes

### Hierarchy

Can the viewer identify within 3 seconds:

```text
market
market-implied probability
user forecast
current trial state
primary next action
```

### Concept separation

Does UI distinguish:

- market belief;
- user belief;
- action;
- outcome;
- score?

### State truth

Does every displayed state map to an actual frontend/protocol state?

No visual “Committed” before a successful transaction receipt.

### Motion semantics

Every major animation must answer one:

- what changed?
- where did this object go?
- what became immutable?
- what external system is processing the action?
- what became final?

Remove animation that answers none.

### Navigation continuity

Shared-element transitions should preserve the user's mental object:

```text
live market specimen
→ active arena market
→ committed trial
→ resolved evidence
→ evidence history
```

### Density

Fail if the interface becomes a conventional trading dashboard before the trial interaction is understood.

### Accessibility

- reduced motion;
- keyboard;
- focus;
- semantic labels;
- color not sole signal;
- tabular numbers.

## Output

```text
Hierarchy:
State mapping:
Motion:
Routing:
Accessibility:
Drift:
Required changes:
```

### Frozen visual language

Verify:

- dark-only implementation;
- no gradients;
- no glassmorphism;
- Geist Sans + IBM Plex Mono roles respected;
- Phosphor Regular base icons;
- custom icons only for Prior primitives;
- Forecast represented as blue circle;
- Market represented as amber diamond;
- clipped-corner motif used only on approved major panels;
- `/live` and Circuit geometry follow `SCREEN_GEOMETRY.md`;
- generated-image artifacts are not copied when they conflict with canonical docs.
