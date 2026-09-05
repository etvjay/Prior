# Ground Truth

## Purpose

RFT is a **forecast-evidence protocol**. Its job is to preserve a participant's pre-resolution probabilistic belief, bind that belief to a specific DreamDEX Event Contract and contemporaneous market state, and deterministically evaluate it after DreamDEX resolves the event.

## Canonical product statement

> Forecast Arena lets a human or agent commit a probability against a live DreamDEX Event Contract before resolution, optionally express that belief economically, and receive independently reconstructable forecast evidence when the market resolves.

## Primitive

```text
Forecast Commitment
        +
Reference Market State
        +
Optional Economic Action
        +
External Resolved Outcome
        =
Resolved Forecast Trial
```

## Responsibilities

### RFT owns

- trial identity;
- forecast commitment;
- commitment time/block;
- immutable association to DreamDEX `marketId`;
- contemporaneous market-reference evidence where available;
- action intent metadata;
- deterministic scoring;
- final trial status;
- RFT events.

### DreamDEX owns

- Event Contract creation;
- market lifecycle;
- order book;
- trade execution;
- collateral;
- outcome tokens;
- market resolution;
- void semantics;
- settlement evidence.

### Somnia owns

- transaction ordering;
- smart-contract execution;
- persistence;
- RPC/event access.

### Frontend owns

- interaction;
- visualization;
- wallet orchestration;
- readable evidence presentation.

The frontend is not an authority for protocol truth.

## Canonical boundaries

- RFT does **not** determine market outcomes.
- RFT does **not** custody trading capital.
- RFT does **not** require a trade for a valid trial.
- RFT does **not** prove the truth of a model's reasoning.
- RFT does **not** prove private information possession.
- RFT does **not** solve Sybil identity.
- RFT does **not** infer general intelligence.
- RFT does **not** equate profit with forecast skill.

## Identity

For v0.1:

```text
one forecaster × one DreamDEX marketId = one canonical forecast
```

A future version may support forecast trajectories/versioned updates, but v0.1 does not.

## Probability

Canonical forecast representation:

```text
pUpBps ∈ [0, 10000]
```

Examples:

- `0` = 0.00% Up
- `5000` = 50.00% Up
- `7234` = 72.34% Up
- `10000` = 100.00% Up

No floating-point protocol arithmetic.

## Market reference

The market-reference value is a contemporaneous **market-implied reference**, not ground truth.

If defensible top-of-book evidence cannot be captured, the trial may still be valid but market-relative metrics are unavailable.

## Resolution

Only the underlying DreamDEX market's finalized state determines whether the RFT resolves Up, Down, or Void.

A void is not a forecasting loss.

## Scoring

Primary per-trial probabilistic score:

```text
Brier = (p - y)^2
```

where probability/outcome are normalized consistently.

Market disagreement:

```text
p - q
```

is not “edge.”

Post-resolution comparison may evaluate the participant Brier score against the contemporaneous market-reference Brier score.

## Product vs primitive

```text
Forecast Arena          = first application
Resolved Forecast Trial = primitive
DreamDEX                 = first market adapter
```

Never collapse these concepts.
