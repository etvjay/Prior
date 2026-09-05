/**
 * Prior core — TradeTag packing (uint64) for BinaryPool.placeBinaryOrderFor.userData.
 *
 * Format (high to low bits):
 *   bits  0..15  : nonce / iteration index (per-circuit)
 *   bits 16..47  : marketId tail (32 bits; not durable identity, just a tag)
 *   bits 48..63  : circuitId tail (16 bits; not durable identity, just a tag)
 *
 * Canonical market and circuit identity are bytes32 and are recorded in the
 * RFT contract event; the tradeTag is purely a label that the read model can
 * use to correlate DreamDEX orders with RFT trials when both are observed.
 *
 * INVARIANT: tradeTag is set by the CircuitExecutor (not the user) at the
 * moment of execution. The same (circuitId, marketId) yields the same
 * tradeTag deterministically.
 */

import type { CircuitId, MarketId, TradeTag } from "./types.js";

const U64 = 0xffffffffffffffffn;

function tail32(x: bigint): bigint {
  return x & 0xffffffffn;
}
function tail16(x: bigint): bigint {
  return x & 0xffffn;
}

export function packTradeTag(args: {
  circuitId: CircuitId;
  marketId: MarketId;
  iteration: number; // 0..=65535
}): TradeTag {
  if (args.iteration < 0 || args.iteration > 0xffff) {
    throw new Error("iteration out of u16 range");
  }
  const circuitPart = tail16(BigInt(args.circuitId)) << 48n;
  const marketPart = tail32(BigInt(args.marketId)) << 16n;
  const iterPart = BigInt(args.iteration) & 0xffffn;
  const tag = (circuitPart | marketPart | iterPart) & U64;
  return tag;
}

export function unpackTradeTag(tag: TradeTag): {
  circuitTail16: bigint;
  marketTail32: bigint;
  iteration: number;
} {
  return {
    circuitTail16: (tag >> 48n) & 0xffffn,
    marketTail32: (tag >> 16n) & 0xffffffffn,
    iteration: Number(tag & 0xffffn),
  };
}
