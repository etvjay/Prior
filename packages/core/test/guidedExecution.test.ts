import { describe, expect, it } from "vitest";
import { assertProposalImmutable, buildGuidedProposal, buildOwnerSignedBinaryOrder, executionIdentity, BUY_NO_KIND, BUY_YES_KIND } from "../src/guidedExecution.js";

const base = {
  circuitId: "0x1111111111111111111111111111111111111111111111111111111111111111" as `0x${string}`,
  marketId: "0x2222222222222222222222222222222222222222222222222222222222222222" as `0x${string}`,
  pool: "0x3333333333333333333333333333333333333333" as `0x${string}`,
  owner: "0x4444444444444444444444444444444444444444" as `0x${string}`,
  forecastTrialId: "0x5555555555555555555555555555555555555555555555555555555555555555" as `0x${string}`,
  forecastProbabilityUpBps: 7200, marketReferenceUpBps: 6100, minimumMarginBps: 800,
  tradeTag: 42n, quantity: 10n, expiresAtNs: 2_000_000_000_000n, createdAt: 1000n, oneCollateralRaw: 1_000_000n,
};

describe("guided owner authorization", () => {
  it("derives a fixed Up IOC proposal and specialized placeBinaryOrder calldata", () => {
    const proposal = buildGuidedProposal({ ...base, policy: { kind: "BUY_UP", maxUpPriceBps: 6400, requestedQuantityRaw: 10n, worstCaseSpendRaw: 6n } });
    expect(proposal.kind).toBe(BUY_YES_KIND);
    expect(proposal.limitPrice).toBe(640_000n);
    expect(proposal.maximumSpend).toBe(6n);
    expect(proposal.orderType).toBe(2);
    const tx = buildOwnerSignedBinaryOrder(proposal);
    expect(tx.to).toBe(base.pool);
    expect(tx.data.slice(0, 10)).toBe("0x718c2d4d");
  });

  it("rejects a quantity that differs from the policy output", () => {
    expect(() => buildGuidedProposal({ ...base, quantity: 11n, policy: { kind: "BUY_UP", maxUpPriceBps: 6400, requestedQuantityRaw: 10n, worstCaseSpendRaw: 6n } })).toThrow("policy quantity mismatch");
  });

  it("rejects mutation of signed execution fields", () => {
    const proposal = buildGuidedProposal({ ...base, policy: { kind: "BUY_UP", maxUpPriceBps: 6400, requestedQuantityRaw: 10n, worstCaseSpendRaw: 6n } });
    expect(() => assertProposalImmutable({ ...proposal, limitPriceBps: 6300 }, proposal)).toThrow("limitPriceBps");
  });

  it("maps Down to BUY_NO and keeps proposal identity stable", () => {
    const proposal = buildGuidedProposal({ ...base, policy: { kind: "BUY_DOWN", maxDownPriceBps: 6100, requestedQuantityRaw: 10n, worstCaseSpendRaw: 6n } });
    expect(proposal.kind).toBe(BUY_NO_KIND);
    expect(proposal.side).toBe("DOWN");
    expect(proposal.executionId).toBe(executionIdentity(base.circuitId, base.marketId));
  });
});
