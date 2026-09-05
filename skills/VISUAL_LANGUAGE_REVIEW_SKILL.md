# Visual Language Review Skill

## Objective

Prevent implementation drift from Prior's frozen visual language.

## Required sources

```text
docs/VISUAL_LANGUAGE.md
docs/SCREEN_GEOMETRY.md
docs/UI_ONESHOT_SPEC.md
docs/MOTION_SYSTEM.md
```

## Reject if

- gradients appear;
- glassmorphism appears;
- market/Forecast use generic spheres/orbs;
- unsupported market classes are shown as live;
- arbitrary icon libraries are mixed;
- permanent exchange-dashboard panels dominate `/live`;
- Circuit intent looks editable while active;
- Circuit analysis becomes a generic analytics dashboard;
- mobile changes the conceptual interaction;
- generated concept images override canonical geometry.
