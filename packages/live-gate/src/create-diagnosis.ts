import { encodeFunctionData, keccak256, encodeAbiParameters, type Address, type Hex } from "viem";

export type CreateIntent = {
  circuitId: Hex;
  owner: Address;
  forecaster: Address;
  marketClass: number;
  targetWindows: number;
  totalBudget: bigint;
  maxPerMarket: bigint;
  minMarginBps: number;
  maxConsecutiveLosses: number;
  startsAt: bigint;
  expiresAt: bigint;
  allowedActionsBitmap: bigint;
};

export const createAbi = [{
  type: "function", name: "create", stateMutability: "nonpayable",
  inputs: [{ name: "intent", type: "tuple", components: [
    { name: "circuitId", type: "bytes32" }, { name: "owner", type: "address" },
    { name: "forecaster", type: "address" }, { name: "marketClass", type: "uint8" },
    { name: "targetWindows", type: "uint16" }, { name: "totalBudget", type: "uint128" },
    { name: "maxPerMarket", type: "uint128" }, { name: "minMarginBps", type: "uint16" },
    { name: "maxConsecutiveLosses", type: "uint8" }, { name: "startsAt", type: "uint64" },
    { name: "expiresAt", type: "uint64" }, { name: "allowedActionsBitmap", type: "uint256" },
  ] }], outputs: [{ name: "circuitId", type: "bytes32" }],
}] as const;

export function buildCreateIntent(args: Omit<CreateIntent, "circuitId"> & { circuitId?: Hex }): CreateIntent {
  return { circuitId: args.circuitId ?? ("0x" + "00".repeat(32)) as Hex, ...args };
}

/** Build only from the single pinned market observation; no timestamp fallback. */
export function assembleCreateIntent(args: {
  owner: Address; forecaster: Address; marketClass: number; targetWindows: number;
  observationTimestamp: bigint; tradingStart: bigint; expiry: bigint;
}): CreateIntent {
  return buildCreateIntent({
    owner: args.owner, forecaster: args.forecaster, marketClass: args.marketClass,
    targetWindows: args.targetWindows, totalBudget: 1n, maxPerMarket: 1n,
    minMarginBps: 0, maxConsecutiveLosses: 1, startsAt: args.tradingStart,
    expiresAt: args.expiry, allowedActionsBitmap: 0n,
  });
}

export function encodeCreateCalldata(intent: CreateIntent): Hex {
  return encodeFunctionData({ abi: createAbi, functionName: "create", args: [intent] });
}

export function deterministicCircuitId(chainId: bigint, registry: Address, intent: CreateIntent): Hex {
  return keccak256(encodeAbiParameters(
    [{ type: "uint256" }, { type: "address" }, { type: "address" }, { type: "uint8" }, { type: "uint64" }, { type: "uint16" }],
    [chainId, registry, intent.owner, intent.marketClass, intent.startsAt, intent.targetWindows],
  ));
}

export type TimestampObservation = {
  block: bigint;
  blockTimestamp: bigint;
  observationTimestamp: bigint;
  tradingStart: bigint;
  expiry: bigint;
};

export function timestampInvariants(o: TimestampObservation) {
  return {
    tradingStartLeBlockTimestamp: o.tradingStart <= o.blockTimestamp,
    blockTimestampBeforeExpiry: o.blockTimestamp < o.expiry,
    tradingWindowOpen: o.tradingStart <= o.blockTimestamp && o.blockTimestamp < o.expiry,
    remainingMatchesObservation: o.expiry - o.observationTimestamp === o.expiry - o.blockTimestamp,
  };
}

export function decodeCreateError(raw: string): { raw: string; selector: string; error?: string } {
  const selector = raw.slice(0, 10).toLowerCase();
  const errors: Record<string, string> = {
    "0x7db5cbbe": "InvalidIntent()", "0x846ec056": "Exists()",
  };
  return { raw, selector, error: errors[selector] };
}
