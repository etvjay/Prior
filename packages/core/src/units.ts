/** Canonical fixed-point units used by DreamDEX binary Event Contracts. */

declare const priceRawBrand: unique symbol;
declare const quantityRawBrand: unique symbol;
declare const collateralRawBrand: unique symbol;
declare const probabilityBpsBrand: unique symbol;
declare const unitScaleRawBrand: unique symbol;

export type PriceRaw = bigint & { readonly [priceRawBrand]: "PriceRaw" };
export type QuantityRaw = bigint & { readonly [quantityRawBrand]: "QuantityRaw" };
export type CollateralRaw = bigint & { readonly [collateralRawBrand]: "CollateralRaw" };
export type ProbabilityBps = number & { readonly [probabilityBpsBrand]: "ProbabilityBps" };
export type UnitScaleRaw = bigint & { readonly [unitScaleRawBrand]: "UnitScaleRaw" };

export function asPriceRaw(value: bigint): PriceRaw { return assertNonNegative(value, "priceRaw") as PriceRaw; }
export function asQuantityRaw(value: bigint): QuantityRaw { return assertNonNegative(value, "quantityRaw") as QuantityRaw; }
export function asCollateralRaw(value: bigint): CollateralRaw { return assertNonNegative(value, "collateralRaw") as CollateralRaw; }
export function asUnitScaleRaw(value: bigint): UnitScaleRaw {
  if (value <= 0n) throw new Error("unitScaleRaw must be positive");
  return value as UnitScaleRaw;
}

/** Convert a probability in basis points into DreamDEX raw price units. */
export function priceRawFromProbabilityBps(probabilityBps: number, unitScaleRaw: UnitScaleRaw): PriceRaw {
  if (!Number.isInteger(probabilityBps) || probabilityBps < 0 || probabilityBps > 10_000) throw new Error("probabilityBps must be integer in [0, 10000]");
  return asPriceRaw(BigInt(probabilityBps) * unitScaleRaw / 10_000n);
}

export function maxCollateralSpendRaw(priceRaw: PriceRaw, quantityRaw: QuantityRaw, unitScaleRaw: UnitScaleRaw): CollateralRaw {
  return asCollateralRaw((priceRaw * quantityRaw) / unitScaleRaw);
}

/** Filled principal in collateral raw units, rounded down by integer arithmetic. */
export function actualCollateralCostRaw(fillPriceRaw: PriceRaw, filledQuantityRaw: QuantityRaw, unitScaleRaw: UnitScaleRaw): CollateralRaw {
  return asCollateralRaw((fillPriceRaw * filledQuantityRaw) / unitScaleRaw);
}

function assertNonNegative(value: bigint, name: string): bigint {
  if (value < 0n) throw new Error(`${name} must be non-negative`);
  return value;
}
