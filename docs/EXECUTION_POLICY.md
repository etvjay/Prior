# Circuit Execution Policy v0.1

## Purpose

Translate a committed Forecast into a bounded economic action without confusing market midpoint disagreement with executable value.

## Core correction

Do **not** use:

```text
abs(Forecast - market midpoint) >= threshold
```

as the actual trade rule.

The midpoint is useful evidence, but it is not necessarily the price the Circuit can execute.

## User-facing rule

Simple language:

> **Only act when I can buy at least N points below what I think the outcome is worth.**

Example:

```text
Your Forecast
72% Up

Minimum margin
8 points

Highest acceptable Up price
64%
```

If DreamDEX has executable Up liquidity at or below 0.64, the Circuit may buy.

If not:

```text
ABSTAIN / NO FILL
```

## Up-side rule

Let:

```text
p = Forecast probability of Up
e = minimum required margin
```

Then:

```text
maxUpPrice = p - e
```

Example:

```text
p = 0.72
e = 0.08

maxUpPrice = 0.64
```

The Circuit must never buy Up above 0.64 for this iteration.

## Down-side rule

The Forecast-implied probability of Down is:

```text
1 - p
```

Therefore:

```text
maxDownPrice = (1 - p) - e
```

Example:

```text
pUp = 0.31
pDown = 0.69
e = 0.08

maxDownPrice = 0.61
```

The Circuit may buy Down only at or below 0.61.

## Choosing direction

For v0.1, evaluate both possible buys against current executable liquidity.

Conceptually:

```text
upAcceptable   = best/quoted Up ask <= maxUpPrice
downAcceptable = best/quoted Down ask <= maxDownPrice
```

Possible outcomes:

```text
only Up acceptable    → BUY_UP
only Down acceptable  → BUY_DOWN
neither acceptable    → ABSTAIN
both acceptable        → choose larger expected margin or ABSTAIN if ambiguous
```

Because binary books may express the two sides through one underlying book/inversion, exact normalization must use the verified DreamDEX SDK/ABI helpers.

## IOC by default

Circuit v0.1 uses an Immediate-Or-Cancel style order.

Reason:

- no unintended resting order across a short event window;
- no stale intent after market conditions change;
- no separate cancellation liveness requirement for residual quantity.

If the order cannot fill within the permitted price:

```text
NO FILL
```

is evidence, not a Runner failure.

## Spend bound

The user specifies:

```text
max per market
```

The executor must enforce the maximum possible quote spend before placement.

Preferred verification path:

```text
price
quantity
DreamDEX raw units
    ↓
worst-case input / auto-pull requirement
    ↓
<= Circuit maxPerMarket
<= Circuit remainingBudget
```

M0 must determine whether the binary pool's inherited `getAutoPullRequirement` can be safely used for the specialized binary order kind. If not, implement equivalent integer math from verified binary pool parameters.

Never trust Runner-calculated spend without onchain validation.

## Budget accounting

For v0.1, safety is more important than perfect capital utilization.

A safe initial model:

```text
At proposal/authorization time, record:

maximumAuthorizedSpend += limitPriceRaw * quantityRaw / oneCollateralRaw
```

After the receipt is decoded, reconcile:

```text
actualEconomicCost = fillPriceRaw * filledQuantityRaw / oneCollateralRaw
returnedCollateral = temporaryPull - actualEconomicCost
actualSpent += actualEconomicCost
```

The maximum authorization is a safety ceiling, not final capital usage. Actual fills/PnL remain separate evidence. A retry must use the canonical `circuitId × marketId` identity and may not reserve twice.

## Reference probability vs execution price

Store both:

```text
referenceUpBps
= market state at Forecast commitment
= evidence baseline

executionLimit
= maximum price the Circuit was allowed to pay

actualFillPrice
= DreamDEX execution evidence
```

Do not merge these.

## Circuit decision evidence

Each iteration should be able to show:

```text
Forecast
72% Up

Market at commitment
61% Up

Circuit rule
8-point minimum margin

Allowed Up price
≤ 64%

Best/quoted executable price
63%

Decision
BUY UP

Limit
64%

Filled
63%
```

This is much more defensible than:

```text
"11% edge → trade"
```

## Production caveats

Real expected-value decisions may need:

- depth-weighted execution price;
- fees;
- slippage;
- liquidity;
- order quantity;
- timing;
- partial fills.

DreamDEX currently advertises zero Event Contract trading/settlement fees, but Prior should not hardcode zero-fee assumptions into generic policy math.

MVP can keep quantity small and use a strict IOC limit.
