import { describe, expect, it } from "vitest";
import { actualCollateralCostRaw, asPriceRaw, asQuantityRaw, asUnitScaleRaw, maxCollateralSpendRaw } from "../src/units.js";

describe("DreamDEX binary fixed-point collateral units", () => {
  const ONE = asUnitScaleRaw(1_000_000n);

  it("reproduces the verified Market #1 maximum pull", () => { // evidence/shannon/market1-lifecycle.json accounting.maximumAuthorizedRaw
    expect(maxCollateralSpendRaw(asPriceRaw(420_000n), asQuantityRaw(1_000n), ONE)).toBe(420n);
  });

  it("reproduces the verified Market #1 actual fill cost", () => {
    expect(actualCollateralCostRaw(asPriceRaw(281_000n), asQuantityRaw(1_000n), ONE)).toBe(281n);
    expect(420n - 281n).toBe(139n);
  });

  it("rounds down and handles tiny quantities without floating point", () => {
    expect(actualCollateralCostRaw(asPriceRaw(1n), asQuantityRaw(1n), ONE)).toBe(0n);
    expect(actualCollateralCostRaw(asPriceRaw(1_000_001n), asQuantityRaw(1n), ONE)).toBe(1n);
    expect(actualCollateralCostRaw(asPriceRaw(999_999n), asQuantityRaw(1n), ONE)).toBe(0n);
  });

  it("handles zero price/quantity and large values", () => {
    expect(maxCollateralSpendRaw(asPriceRaw(0n), asQuantityRaw(1_000n), ONE)).toBe(0n);
    expect(maxCollateralSpendRaw(asPriceRaw(1_000_000n), asQuantityRaw(1_000_000n), ONE)).toBe(1_000_000n);
    expect(maxCollateralSpendRaw(asPriceRaw(10_000_000n), asQuantityRaw(10_000_000n), ONE)).toBe(100_000_000n);
  });

  it("rejects a zero scale and negative raw values", () => {
    expect(() => asUnitScaleRaw(0n)).toThrow();
    expect(() => asPriceRaw(-1n)).toThrow();
    expect(() => asQuantityRaw(-1n)).toThrow();
  });
});
