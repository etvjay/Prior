import { describe, expect, it } from "vitest";
import {
  EXCLUDED_HISTORICAL_MARKET_ID,
  evaluateLiveGate,
  deriveBookReference,
  predictCreateAddresses,
  type CandidateProbe,
  type GateEvaluationInput,
} from "../src/index.js";

const OWNER = "0x82d0000000000000000000000000000000000001" as const;
const FORECASTER = "0x4EbF775fb6397C1a191614CDCd0E117e04B24AB5" as const;
const RFT = "0x5b1B51cB062B7B782c9EC2Bd5674eFAdb5308F41" as const;
const REGISTRY = "0x1111111111111111111111111111111111111111" as const;
const POOL = "0x2222222222222222222222222222222222222222" as const;
const MARKET = "0x3333333333333333333333333333333333333333" as const;
const HEAD_TIMESTAMP = 1_800_000_000;
const HEAD_BLOCK = 900_000_000;

function marketId(n: number): string {
  return `0x${n.toString(16).padStart(64, "0")}`;
}

function makeProbe(
  id: string,
  asset: string,
  intervalSec: number,
  remainingSec: number,
  overrides: Partial<CandidateProbe> = {},
): CandidateProbe {
  const expirySec = HEAD_TIMESTAMP + remainingSec;
  return {
    discovered: {
      marketId: id,
      source: "fixture",
      marketType: "BINARY",
      asset,
      intervalSec,
      expirySec,
      tradingStartSec: HEAD_TIMESTAMP - 30,
      statusFromIndexer: "Trading",
      marketAddress: MARKET,
      poolAddress: POOL,
      createdAtBlock: HEAD_BLOCK - 100,
    },
    direct: {
      ok: true,
      marketAddress: MARKET,
      pool: POOL,
      collateral: "0x4444444444444444444444444444444444444444",
      yesId: "100",
      noId: "101",
      nonce: "1",
      expirySec,
      status: 1,
      statusLabel: "Trading",
      readAtBlock: HEAD_BLOCK,
    },
    book: {
      ok: true,
      quoteDecimals: 6,
      oneCollateralRaw: "1000000",
      tickSizeRaw: "1000",
      lotSizeRaw: "1000",
      minQuantityRaw: "1000",
      bestBidRaw: "490000",
      bestAskRaw: "500000",
    },
    ...overrides,
  };
}

function estimatedGas(complete = true) {
  return {
    status: complete ? "ESTIMATED" as const : "FAILED" as const,
    complete,
    method: "fixture eth_estimateGas",
    gasPriceWei: "1000000000",
    conservativeMultiplierBps: 12500,
    operations: complete
      ? [{ name: "deploy:RegistryV2", status: "ESTIMATED" as const, gas: "100000", feeWei: "125000000000000" }]
      : [{ name: "deploy:RegistryV2", status: "FAILED" as const, gas: null, feeWei: null, reason: "rpc failure" }],
    limitation: complete ? null : "fixture rpc failure",
  };
}

function input(probes: CandidateProbe[], gas = estimatedGas()): GateEvaluationInput {
  return {
    generatedAt: "2026-09-07T00:00:00.000Z",
    network: {
      chainId: 50312,
      headBlock: HEAD_BLOCK,
      headTimestampSec: HEAD_TIMESTAMP,
      rpcUrl: "https://dream-rpc.somnia.network",
      indexerUrl: "https://dev.smk.somnia.host/v1/graphql",
    },
    owner: {
      address: OWNER,
      nonce: "0",
      source: "fixture",
      nonceReadFresh: true,
    },
    forecaster: FORECASTER,
    rftRegistry: RFT,
    probes,
    gas,
    profileAProvenSufficient: false,
  };
}

describe("M4.3.2B live gate decision", () => {
  it("blocks with candidatesObserved when BTC and ETH are absent", () => {
    const evidence = evaluateLiveGate(input([]));

    expect(evidence.status).toBe("NO_LIVE_COMPATIBLE_MARKET");
    expect(evidence.discovery.candidatesObserved).toEqual([]);
    expect(evidence.selection.selectedMarketId).toBeNull();
    expect(evidence.packet).toBeNull();
  });

  it("discovers but rejects unsafe short cadences by the selected profile", () => {
    const probes = [
      makeProbe(marketId(1), "BTC", 60, 30),
      makeProbe(marketId(2), "BTC", 300, 100),
      makeProbe(marketId(3), "BTC", 900, 200),
    ];
    const evidence = evaluateLiveGate(input(probes));

    expect(evidence.status).toBe("LIVE_MARKETS_FOUND_NONE_PROOF_ELIGIBLE");
    expect(evidence.discovery.candidatesObserved).toHaveLength(3);
    expect(evidence.discovery.candidatesObserved.every((c) => c.decision === "REJECTED")).toBe(true);
    expect(evidence.discovery.candidatesObserved.map((c) => c.rejectionCodes)).toEqual([
      ["HEADROOM_INSUFFICIENT"],
      ["HEADROOM_INSUFFICIENT"],
      ["HEADROOM_INSUFFICIENT"],
    ]);
  });

  it("selects a safe BTC 1h market and defaults to Profile B", () => {
    const evidence = evaluateLiveGate(input([makeProbe(marketId(10), "BTC", 3600, 7200)]));

    expect(evidence.status).toBe("READY_FOR_BOUNDED_LIVE_WRITE");
    expect(evidence.selection.selectedMarketId).toBe(marketId(10));
    expect(evidence.profile.selected).toBe("B");
    expect(evidence.profile.reason).toContain("zero-action rejection");
    expect(evidence.packet?.circuitIntent.owner).toBe(OWNER);
    expect(evidence.packet?.circuitIntent.forecaster).toBe(FORECASTER);
    expect(evidence.packet?.circuitIntent.targetWindows).toBe(1);
    expect(evidence.packet?.circuitIntent.totalBudget).toBe("1");
    expect(evidence.packet?.circuitIntent.maxPerMarket).toBe("1");
    expect(evidence.packet?.circuitIntent.allowedActionsBitmap).toBe("0");
    expect(evidence.packet?.circuitIntent.scope.cadenceAuthority).toBe("APP_ENFORCED");
  });

  it("selects ETH 1h or 4h when BTC is absent, with 1h priority", () => {
    const evidence = evaluateLiveGate(input([
      makeProbe(marketId(11), "ETH", 14400, 40000),
      makeProbe(marketId(12), "ETH", 3600, 8000),
    ]));

    expect(evidence.status).toBe("READY_FOR_BOUNDED_LIVE_WRITE");
    expect(evidence.selection.selectedMarketId).toBe(marketId(12));
    expect(evidence.selection.priorityLabel).toBe("ETH_1H");
  });

  it("prefers explicit asset/cadence priority over longer headroom", () => {
    const evidence = evaluateLiveGate(input([
      makeProbe(marketId(13), "BTC", 14400, 50000),
      makeProbe(marketId(14), "BTC", 3600, 8000),
    ]));

    expect(evidence.selection.selectedMarketId).toBe(marketId(14));
    expect(evidence.selection.priorityLabel).toBe("BTC_1H");
  });

  it("rejects stale expiry and every non-Trading direct status", () => {
    const stale = makeProbe(marketId(15), "BTC", 3600, 0);
    const listed = makeProbe(marketId(16), "BTC", 3600, 8000, {
      direct: {
        ...makeProbe(marketId(16), "BTC", 3600, 8000).direct,
        status: 0,
        statusLabel: "Listed",
      },
    });
    const evidence = evaluateLiveGate(input([stale, listed]));

    expect(evidence.status).toBe("NO_LIVE_COMPATIBLE_MARKET");
    expect(evidence.discovery.candidatesObserved.map((c) => c.rejectionCodes)).toEqual([
      ["EXPIRED"],
      ["ONCHAIN_NOT_TRADING"],
    ]);
  });

  it("keeps missing book/reference explicit without guessing", () => {
    const evidence = evaluateLiveGate(input([makeProbe(marketId(17), "BTC", 3600, 8000, {
      book: { ok: true, quoteDecimals: 6, oneCollateralRaw: "1000000", tickSizeRaw: "1000", lotSizeRaw: "1000", minQuantityRaw: "1000", bestBidRaw: null, bestAskRaw: null },
    })]));

    expect(evidence.status).toBe("LIVE_MARKETS_FOUND_NONE_PROOF_ELIGIBLE");
    expect(evidence.discovery.candidatesObserved[0]?.compatible).toBe(true);
    expect(evidence.discovery.candidatesObserved[0]?.proofEligible).toBe(false);
    expect(evidence.discovery.candidatesObserved[0]?.rejectionCodes).toContain("REFERENCE_UNAVAILABLE");
    expect(evidence.packet).toBeNull();
  });

  it("does not let the first 40 stale rows hide a later live candidate", () => {
    const stale = Array.from({ length: 40 }, (_, i) => makeProbe(marketId(100 + i), "BTC", 3600, 0));
    const live = makeProbe(marketId(999), "SOL", 777, 8000);
    const evidence = evaluateLiveGate(input([...stale, live]));

    expect(evidence.discovery.candidatesObserved.some((c) => c.marketId === marketId(999))).toBe(true);
    expect(evidence.discovery.candidatesObserved.find((c) => c.marketId === marketId(999))?.compatible).toBe(true);
  });

  it("keeps a fallback live market visible when indexer rows are incomplete", () => {
    const evidence = evaluateLiveGate({
      ...input([]),
      discoveryMeta: { incompleteIndexer: true, fallbackCandidates: 1 },
      probes: [makeProbe(marketId(1000), "SOL", 777, 8000)],
    });

    expect(evidence.discovery.meta.fallbackCandidates).toBe(1);
    expect(evidence.discovery.candidatesObserved[0]?.source).toBe("fixture");
    expect(evidence.discovery.candidatesObserved[0]?.compatible).toBe(true);
  });

  it("does not reject a compatible non-BTC/ETH asset for compatibility", () => {
    const evidence = evaluateLiveGate(input([makeProbe(marketId(1001), "SOL", 777, 8000)]));
    const candidate = evidence.discovery.candidatesObserved[0];

    expect(candidate?.compatible).toBe(true);
    expect(candidate?.rejectionCodes).not.toContain("ASSET_NOT_ALLOWED");
    expect(candidate?.proofEligible).toBe(true);
  });

  it("does not reject an unusual cadence for compatibility", () => {
    const evidence = evaluateLiveGate(input([makeProbe(marketId(1002), "BTC", 777, 8000)]));
    const candidate = evidence.discovery.candidatesObserved[0];

    expect(candidate?.compatible).toBe(true);
    expect(candidate?.rejectionCodes).not.toContain("CADENCE_NOT_ALLOWED");
  });

  it("separates compatibility from proof headroom", () => {
    const evidence = evaluateLiveGate(input([makeProbe(marketId(1003), "BTC", 3600, 100)]));
    const candidate = evidence.discovery.candidatesObserved[0];

    expect(candidate?.compatible).toBe(true);
    expect(candidate?.proofEligible).toBe(false);
    expect(candidate?.rejectionCodes).toContain("HEADROOM_INSUFFICIENT");
  });

  it("reports incomplete discovery instead of claiming no live market", () => {
    const evidence = evaluateLiveGate({
      ...input([]),
      discoveryMeta: { discoveryComplete: false, discoveryError: "INDEXER_TIMEOUT" },
    });

    expect(evidence.status).toBe("DISCOVERY_INCOMPLETE");
  });

  it("changes both predicted CREATE addresses when the fresh nonce changes", () => {
    const atZero = predictCreateAddresses(OWNER, 0n);
    const atOne = predictCreateAddresses(OWNER, 1n);

    expect(atZero.registryV2).not.toBe(atOne.registryV2);
    expect(atZero.executorV2).not.toBe(atOne.executorV2);
    expect(atZero.nonce).toBe("0");
    expect(atOne.nonce).toBe("1");
  });

  it("blocks on gas estimation failure and never reports READY", () => {
    const evidence = evaluateLiveGate(input([makeProbe(marketId(18), "BTC", 3600, 8000)], estimatedGas(false)));

    expect(evidence.status).toBe("BLOCKED_GAS_ESTIMATION_FAILED");
    expect(evidence.packet?.gas.complete).toBe(false);
    expect(evidence.status).not.toBe("READY_FOR_BOUNDED_LIVE_WRITE");
  });

  it("never selects the historical preflight market", () => {
    const evidence = evaluateLiveGate(input([makeProbe(EXCLUDED_HISTORICAL_MARKET_ID, "BTC", 3600, 8000)]));

    expect(evidence.status).toBe("NO_LIVE_COMPATIBLE_MARKET");
    expect(evidence.selection.selectedMarketId).toBeNull();
    expect(evidence.discovery.candidatesObserved[0]?.rejectionCodes).toContain("HISTORICAL_EXCLUDED");
  });

  it("uses only a BOOK_MIDPOINT_REFERENCE and retains raw sides", () => {
    const reference = deriveBookReference({
      ok: true,
      quoteDecimals: 6,
      oneCollateralRaw: "1000000",
      tickSizeRaw: "1000",
      lotSizeRaw: "1000",
      minQuantityRaw: "1000",
      bestBidRaw: "490000",
      bestAskRaw: "500000",
    });

    expect(reference.referenceType).toBe("BOOK_MIDPOINT_REFERENCE");
    expect(reference.bestBidRaw).toBe("490000");
    expect(reference.bestAskRaw).toBe("500000");
    expect(reference.referenceRaw).toBe("495000");
    expect(reference.referenceUpBps).toBe(4950);
  });
});
