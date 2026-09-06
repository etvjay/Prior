/** Guided, owner-authorized fallback for DreamDEX BinaryPool execution. */
import type { Address, Hex } from "viem";
import { encodeFunctionData, keccak256, parseAbi, stringToHex } from "viem";
import type { CircuitId, MarketId, TradeTag } from "./types.js";
import type { PolicyDecision } from "./policy.js";

export const BINARY_ORDER_TYPE = 2 as const; // Immediate-or-Cancel
export const DEFAULT_SELF_MATCHING_OPTION = 0 as const;
export const BUY_YES_KIND = 0 as const;
export const BUY_NO_KIND = 2 as const;

const binaryPoolWriteAbi = parseAbi([
  "function placeBinaryOrder(uint8 kind, uint256 price, uint256 quantity, uint64 expireTimestampNs, uint8 orderType, uint8 selfMatchingOption, address builder, uint96 builderFeeBpsTimes1k, uint64 userData) payable returns (bool success, uint128 id)",
]);

export interface GuidedExecutionProposal {
  readonly executionId: Hex;
  readonly circuitId: CircuitId;
  readonly marketId: MarketId;
  readonly pool: Address;
  readonly owner: Address;
  readonly side: "UP" | "DOWN";
  /** DreamDEX OrderKind: 0 BUY_YES / 2 BUY_NO. */
  readonly kind: typeof BUY_YES_KIND | typeof BUY_NO_KIND;
  readonly quantity: bigint;
  readonly maximumSpend: bigint;
  readonly limitPrice: bigint;
  readonly limitPriceBps: number;
  readonly orderType: typeof BINARY_ORDER_TYPE;
  readonly selfMatchingOption: number;
  readonly builder: Address;
  readonly builderFeeBpsTimes1k: bigint;
  readonly userData: bigint;
  readonly forecastTrialId: Hex;
  readonly forecastProbabilityUpBps: number;
  readonly marketReferenceUpBps: number;
  readonly minimumMarginBps: number;
  readonly policyResult: "BUY_UP" | "BUY_DOWN";
  readonly expiresAtNs: bigint;
  readonly createdAt: bigint;
}

export interface BinaryOrderTransaction { readonly to: Address; readonly data: Hex; readonly value: bigint; }

export function executionIdentity(circuitId: CircuitId, marketId: MarketId): Hex {
  return keccak256(stringToHex(`${circuitId.toLowerCase()}:${marketId.toLowerCase()}`));
}

export function buildGuidedProposal(args: {
  circuitId: CircuitId; marketId: MarketId; pool: Address; owner: Address;
  forecastTrialId: Hex; forecastProbabilityUpBps: number; marketReferenceUpBps: number;
  minimumMarginBps: number; tradeTag: TradeTag;
  policy: Exclude<PolicyDecision, { kind: "ABSTAIN" }>;
  quantity: bigint; expiresAtNs: bigint; createdAt: bigint; oneCollateralRaw: bigint;
}): GuidedExecutionProposal {
  const isUp = args.policy.kind === "BUY_UP";
  const limitPriceBps = isUp
    ? (args.policy.kind === "BUY_UP" ? args.policy.maxUpPriceBps : 0)
    : (args.policy.kind === "BUY_DOWN" ? args.policy.maxDownPriceBps : 0);
  if (limitPriceBps <= 0 || limitPriceBps > 10_000) throw new Error("invalid execution ceiling");
  if (args.quantity <= 0n) throw new Error("quantity must be positive");
  if (args.oneCollateralRaw <= 0n) throw new Error("collateral unit must be positive");
  if (args.expiresAtNs <= args.createdAt * 1_000_000_000n) throw new Error("order expiry must be future");
  if (args.quantity !== args.policy.requestedQuantityRaw) throw new Error("policy quantity mismatch");
  const limitPrice = BigInt(limitPriceBps) * args.oneCollateralRaw / 10_000n;
  const maximumSpend = limitPrice * args.quantity;
  if (args.policy.worstCaseSpendRaw > maximumSpend) throw new Error("policy spend exceeds ceiling");
  return {
    executionId: executionIdentity(args.circuitId, args.marketId), circuitId: args.circuitId,
    marketId: args.marketId, pool: args.pool, owner: args.owner, side: isUp ? "UP" : "DOWN",
    kind: isUp ? BUY_YES_KIND : BUY_NO_KIND, quantity: args.quantity, maximumSpend,
    limitPrice, limitPriceBps, orderType: BINARY_ORDER_TYPE,
    selfMatchingOption: DEFAULT_SELF_MATCHING_OPTION,
    builder: "0x0000000000000000000000000000000000000000" as Address,
    builderFeeBpsTimes1k: 0n, userData: args.tradeTag, forecastTrialId: args.forecastTrialId,
    forecastProbabilityUpBps: args.forecastProbabilityUpBps, marketReferenceUpBps: args.marketReferenceUpBps,
    minimumMarginBps: args.minimumMarginBps, policyResult: args.policy.kind,
    expiresAtNs: args.expiresAtNs, createdAt: args.createdAt,
  };
}

export function assertProposalImmutable(proposal: GuidedExecutionProposal, expected: GuidedExecutionProposal): void {
  const fields: Array<keyof GuidedExecutionProposal> = [
    "executionId", "circuitId", "marketId", "pool", "owner", "side", "kind", "quantity", "maximumSpend",
    "limitPrice", "limitPriceBps", "orderType", "selfMatchingOption", "builder", "builderFeeBpsTimes1k", "userData",
    "forecastTrialId", "forecastProbabilityUpBps", "marketReferenceUpBps", "minimumMarginBps", "policyResult", "expiresAtNs", "createdAt",
  ];
  for (const field of fields) if (proposal[field] !== expected[field]) throw new Error(`proposal mutation: ${String(field)}`);
}

/** The owner signs this exact specialized BinaryPool call; no For() path is used. */
export function buildOwnerSignedBinaryOrder(proposal: GuidedExecutionProposal): BinaryOrderTransaction {
  return {
    to: proposal.pool, value: 0n,
    data: encodeFunctionData({ abi: binaryPoolWriteAbi, functionName: "placeBinaryOrder", args: [
      proposal.kind, proposal.limitPrice, proposal.quantity, proposal.expiresAtNs,
      proposal.orderType, proposal.selfMatchingOption, proposal.builder,
      proposal.builderFeeBpsTimes1k, proposal.userData,
    ] }),
  };
}

export const guidedInternals = { binaryPoolWriteAbi };
