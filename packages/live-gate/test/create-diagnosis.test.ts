import { describe, expect, it } from "vitest";
import { assembleCreateIntent, decodeCreateError, encodeCreateCalldata, timestampInvariants } from "../src/create-diagnosis.js";

const owner = "0x82Daa64CEDfA4d15615ADC6D577Dba0d9FfccF55" as const;
const forecaster = "0x4EbF775fb6397C1a191614CDCd0E117e04B24AB5" as const;

describe("CircuitRegistryV2 create diagnosis", () => {
  it("assembles the exact intent from one pinned observation", () => {
    const intent = assembleCreateIntent({ owner, forecaster, marketClass: 1, targetWindows: 1, observationTimestamp: 1_788_969_600n, tradingStart: 1_788_969_600n, expiry: 1_788_973_200n });
    expect(intent.startsAt).toBe(1_788_969_600n);
    expect(intent.expiresAt).toBe(1_788_973_200n);
    expect(timestampInvariants({ block: 483_971_537n, blockTimestamp: 1_788_970_372n, observationTimestamp: 1_788_970_372n, tradingStart: intent.startsAt, expiry: intent.expiresAt }).tradingWindowOpen).toBe(true);
    expect(encodeCreateCalldata(intent).slice(0, 10)).toBe("0xae050486");
  });

  it("records raw revert bytes and selector without inventing a decode", () => {
    expect(decodeCreateError("0xdeadbeef00")).toEqual({ raw: "0xdeadbeef00", selector: "0xdeadbeef", error: undefined });
  });

  it("proves the prior split snapshot was inconsistent", () => {
    const result = timestampInvariants({ block: 483_971_537n, blockTimestamp: 1_788_970_372n, observationTimestamp: 1_788_970_368n, tradingStart: 1_788_969_600n, expiry: 1_788_973_200n });
    expect(result.tradingWindowOpen).toBe(true);
    expect(result.remainingMatchesObservation).toBe(false);
  });
});
