import { describe, it, expect } from "vitest";
import { packTradeTag, unpackTradeTag } from "../src/tradeTag.js";

describe("packTradeTag — DreamDEX Order.userData packing", () => {
  it("round-trips a typical (circuit, market, iteration)", () => {
    const circuitId = "0x" + "aa".repeat(32);
    const marketId = "0x" + "bb".repeat(32);
    const tag = packTradeTag({ circuitId: circuitId as any, marketId: marketId as any, iteration: 42 });
    const u = unpackTradeTag(tag);
    expect(u.iteration).toBe(42);
    expect(u.marketTail32).toBe(BigInt("0x" + "bb".repeat(16).slice(0, 8))); // last 4 bytes of marketId
    expect(u.circuitTail16).toBe(BigInt("0x" + "aa".repeat(2)));
  });

  it("clamps iteration to u16", () => {
    expect(() =>
      packTradeTag({
        circuitId: "0x" + "00".repeat(32) as any,
        marketId: "0x" + "00".repeat(32) as any,
        iteration: 70000,
      })
    ).toThrow();
  });

  it("stays within uint64 (no overflow)", () => {
    const tag = packTradeTag({
      circuitId: "0x" + "ff".repeat(32) as any,
      marketId: "0x" + "ff".repeat(32) as any,
      iteration: 65535,
    });
    expect(tag < 1n << 64n).toBe(true);
    const u = unpackTradeTag(tag);
    expect(u.iteration).toBe(65535);
  });
});
