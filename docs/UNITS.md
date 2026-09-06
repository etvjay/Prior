# DreamDEX binary unit model

This model is grounded in the verified Shannon Market #1 artifact:
`evidence/shannon/market1-lifecycle.json`.

- `PriceRaw`: DreamDEX binary price fixed-point units. Market #1 limit: `420000`; fill: `281000`.
- `QuantityRaw`: DreamDEX order quantity units. Market #1 quantity: `1000`.
- `UnitScaleRaw`: raw units representing one whole collateral/outcome value. Shannon test collateral: `1000000`.
- `CollateralRaw`: actual collateral raw units.
- `ProbabilityBps`: integer probability in `[0, 10000]`.

Canonical principal equation, using integer floor division:

```text
CollateralRaw = PriceRaw × QuantityRaw / UnitScaleRaw
```

Market #1:

```text
420000 × 1000 / 1000000 = 420   maximum pull
281000 × 1000 / 1000000 = 281   actual fill cost
420 - 281 = 139                  immediate return
```

`maximumSpend` is therefore a collateral amount, not a price-times-share-count amount. The unit scale must be supplied from the market/collateral configuration; it must not be globally assumed in core arithmetic.

Policy executable-price spend and guided proposal maximum spend use this same model. A policy cost may be compared to a proposal ceiling only after both have been converted to `CollateralRaw`.
