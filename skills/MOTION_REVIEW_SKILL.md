# Motion Review Skill

## Objective

Verify that Prior's motion system explains product state instead of decorating it.

## Review dimensions

### State fidelity
- editable Forecast moves; committed Forecast does not;
- pending/confirmed are visually distinct;
- order placed/fill/no-fill are distinct;
- market resolution and RFT finalization are distinct.

### Object continuity
- market objects preserve identity across focus/route changes;
- Circuit node expands into same Forecast evidence object;
- History aggregate transforms from/to underlying Forecasts.

### Circuit causality
- persistent intent remains visible/stable;
- each market iteration shows Forecast → policy → action → resolution;
- next slot activates only after prior iteration state allows it.

### Scroll choreography
- landing reveals mechanism in canonical order;
- no scroll traps;
- copy remains readable;
- abstract scenes resolve into real product UI.

### Accessibility/performance
- reduced-motion works;
- no key information depends on animation;
- live data does not cause noisy reflow;
- interaction remains smooth on mobile.

## Reject if

- motion is merely aesthetic;
- UI implies success before canonical confirmation;
- Circuit appears to be only a timeline;
- mobile removes signature Forecast interaction;
- route transitions are unrelated page fades;
- game-like motion becomes casino-like.
