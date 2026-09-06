import market1 from "../../../evidence/shannon/market1-lifecycle.json";
import continuity from "../../../evidence/shannon/circuit-continuity-recovery.json";

export const MARKET_ONE = market1;
export const CONTINUITY = continuity;
export const CONTINUITY_ID = continuity.circuitId;

export type ContinuityMarket = (typeof continuity.markets)[keyof typeof continuity.markets];

export function short(value: string, head = 10, tail = 8) {
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

export function percent(bps: number) {
  return `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 2)}%`;
}
