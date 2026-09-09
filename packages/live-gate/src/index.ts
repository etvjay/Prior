import {
  encodeAbiParameters,
  getAddress,
  getContractAddress,
  keccak256,
  type Address,
  type Hex,
} from "viem";

export const EXCLUDED_HISTORICAL_MARKET_ID =
  "0x00000000000000000000000000000000000000000000000000000000000015b8f";

export const PROFILE_B_ABSOLUTE_FLOOR_SEC = 180;
export const PROFILE_B_RELATIVE_FRACTION = 0.25;
export const PROFILE_B_RELATIVE_CAP_SEC = 900;
export const PROFILE_A_ABSOLUTE_FLOOR_SEC = 90;
export const PROFILE_A_RELATIVE_FRACTION = 0.25;
export const PROFILE_A_RELATIVE_CAP_SEC = 600;

export const MARKET_PRIORITY = [
  { asset: "BTC", intervalSec: 3600, label: "BTC_1H" },
  { asset: "BTC", intervalSec: 14400, label: "BTC_4H" },
  { asset: "BTC", intervalSec: 900, label: "BTC_15M" },
  { asset: "BTC", intervalSec: 300, label: "BTC_5M" },
  { asset: "BTC", intervalSec: 60, label: "BTC_1M" },
  { asset: "ETH", intervalSec: 3600, label: "ETH_1H" },
  { asset: "ETH", intervalSec: 14400, label: "ETH_4H" },
  { asset: "ETH", intervalSec: 900, label: "ETH_15M" },
  { asset: "ETH", intervalSec: 300, label: "ETH_5M" },
  { asset: "ETH", intervalSec: 60, label: "ETH_1M" },
] as const;

/**
 * V2 stores a uint8 market class while cadence remains APP_ENFORCED. Values
 * 0..3 preserve the already-used Prior classes; the additional live-gate
 * cadences occupy new, deterministic values without changing any contract.
 */
export const MARKET_CLASS_BY_ASSET_CADENCE: Readonly<Record<string, number>> = {
  BTC_15M: 0,
  BTC_1H: 1,
  ETH_15M: 2,
  ETH_1H: 3,
  BTC_1M: 4,
  BTC_5M: 5,
  BTC_4H: 6,
  ETH_1M: 7,
  ETH_5M: 8,
  ETH_4H: 9,
};

export type GateStatus =
  | "READY_FOR_BOUNDED_LIVE_WRITE"
  | "COMPATIBLE_MARKET_REQUIRES_AUTHORIZATION"
  | "LIVE_MARKETS_FOUND_NONE_PROOF_ELIGIBLE"
  | "NO_LIVE_COMPATIBLE_MARKET"
  | "DISCOVERY_INCOMPLETE"
  | "DISCOVERY_FAILED"
  | "BLOCKED_NO_ELIGIBLE_LIVE_MARKET"
  | "BLOCKED_GAS_ESTIMATION_FAILED"
  | "BLOCKED_OWNER_NONCE_READ_FAILED"
  | "BLOCKED_LIVE_READ_FAILED";

export type DiscoveryOutcomeInput = {
  discoveryComplete: boolean;
  compatible: number;
  proofEligible: number;
};

export function discoveryOutcome(input: DiscoveryOutcomeInput): GateStatus {
  if (!input.discoveryComplete) return "DISCOVERY_INCOMPLETE";
  if (input.proofEligible > 0) return "READY_FOR_BOUNDED_LIVE_WRITE";
  if (input.compatible > 0) return "LIVE_MARKETS_FOUND_NONE_PROOF_ELIGIBLE";
  return "NO_LIVE_COMPATIBLE_MARKET";
}

export type ProfileName = "A" | "B";

export interface NetworkEvidence {
  chainId: number;
  headBlock: number;
  headTimestampSec: number;
  rpcUrl: string;
  indexerUrl: string;
}

export interface OwnerEvidenceInput {
  address: string;
  nonce: string;
  source: string;
  nonceReadFresh: boolean;
}

export interface DiscoveredCandidate {
  marketId: string;
  source: "indexer" | "logs" | "fixture";
  marketType: string;
  asset: string | null;
  intervalSec: number | null;
  expirySec: number | null;
  tradingStartSec: number | null;
  statusFromIndexer: string | null;
  marketAddress: string | null;
  poolAddress: string | null;
  createdAtBlock: number | null;
}

export interface DirectMarketRead {
  ok: boolean;
  error?: string;
  marketAddress?: string;
  pool?: string;
  collateral?: string;
  yesId?: string;
  noId?: string;
  nonce?: string;
  expirySec?: number;
  status?: number;
  statusLabel?: string;
  readAtBlock?: number;
}

export interface BookRead {
  ok: boolean;
  error?: string;
  quoteDecimals: number | null;
  oneCollateralRaw: string | null;
  tickSizeRaw: string | null;
  lotSizeRaw: string | null;
  minQuantityRaw: string | null;
  bestBidRaw: string | null;
  bestAskRaw: string | null;
}

export interface CandidateProbe {
  discovered: DiscoveredCandidate;
  direct: DirectMarketRead;
  book: BookRead;
}

export interface GasOperation {
  name: string;
  status: "ESTIMATED" | "FAILED" | "UNAVAILABLE" | "NOT_INCLUDED";
  gas: string | null;
  feeWei: string | null;
  conservativeFeeWei?: string | null;
  reason?: string;
  fundingRequirement?: "GAS_ONLY" | "NONE";
}

export interface GasReport {
  status: "ESTIMATED" | "FAILED";
  complete: boolean;
  method: string;
  gasPriceWei: string | null;
  conservativeMultiplierBps: number;
  operations: GasOperation[];
  limitation: string | null;
}

export interface GateEvaluationInput {
  generatedAt: string;
  network: NetworkEvidence;
  owner: OwnerEvidenceInput;
  forecaster: string;
  rftRegistry: string;
  probes: CandidateProbe[];
  gas: GasReport | null;
  profileAProvenSufficient: boolean;
  discoveryMeta?: Record<string, unknown>;
  deployedAddresses?: { registryV2: string; executorV2: string };
}

export interface PredictedAddresses {
  nonce: string;
  registryV2: string;
  executorV2: string;
  sequence: Array<{ nonce: string; contract: "CircuitRegistryV2" | "CircuitExecutorV2" }>;
}

export interface ReferenceEvidence {
  referenceType: "BOOK_MIDPOINT_REFERENCE";
  referenceUnavailable: boolean;
  referenceValid: boolean;
  unavailableReason: string | null;
  bestBidRaw: string | null;
  bestAskRaw: string | null;
  referenceRaw: string | null;
  referenceRawNumerator: string | null;
  referenceRawDenominator: string | null;
  referenceUpBps: number | null;
  referenceUpBpsNumerator: string | null;
  referenceUpBpsDenominator: string | null;
  unitScaleRaw: string | null;
}

export interface CandidateEvidence extends DiscoveredCandidate {
  decision: "SELECTED" | "REJECTED";
  compatible: boolean;
  proofEligible: boolean;
  compatibilityReasons: string[];
  proofEligibilityReasons: string[];
  rejectionCodes: string[];
  direct: DirectMarketRead;
  remainingSec: number | null;
  requiredHeadroomSec: number | null;
  priorityIndex: number | null;
  priorityLabel: string | null;
}

export interface CircuitIntentEvidence {
  circuitId: string;
  owner: string;
  forecaster: string;
  marketClass: number;
  marketClassLabel: string;
  targetWindows: 1;
  totalBudget: "1";
  maxPerMarket: "1";
  minMarginBps: 0;
  maxConsecutiveLosses: 1;
  startsAt: string;
  expiresAt: string;
  allowedActionsBitmap: "0";
  scope: {
    venue: "DreamDEX";
    marketId: string;
    asset: string;
    intervalSec: number;
    cadenceAuthority: "APP_ENFORCED";
  };
  executionAuthority: "NONE";
  capitalAuthority: "NONE";
  economicSpend: "ZERO";
}

export interface PacketEvidence {
  market: {
    candidate: CandidateEvidence;
    direct: DirectMarketRead;
    book: BookRead;
    reference: ReferenceEvidence;
  };
  circuitIntent: CircuitIntentEvidence;
  forecastCommitSimulation: {
    contract: string;
    caller: string;
    pUpBps: 5000;
    referenceUpBps: number;
    referenceValid: boolean;
    tradeTag: "0";
    actionIntent: "3";
    trialId: string;
    note: string;
  };
  gas: GasReport;
}

export interface ProfileEvidence {
  selected: ProfileName;
  default: boolean;
  reason: string;
  profileA: { sufficient: boolean; reason: string };
  minimumHeadroomRule: string;
}

export interface LiveGateEvidence {
  schemaVersion: "M4.3.2B.v1";
  milestone: "M4.3.2B";
  generatedAt: string;
  status: GateStatus;
  blocker: string | null;
  network: NetworkEvidence;
  sideEffects: {
    chainWrites: false;
    funding: false;
    faucet: false;
    signatures: false;
    privateKeyImported: false;
    deployments: false;
    broadcasts: false;
  };
  rules: {
    compatibility: {
      marketType: "BINARY";
      requiredFields: ["marketId", "marketAddress", "pool", "status", "expiry", "probability/book"];
      directStatusRequired: "Trading";
      expiryRequired: "GREATER_THAN_OBSERVED_CHAIN_TIMESTAMP";
    };
    proofProfile: {
      preferredAssets: string[];
      allowOtherCompatibleAssets: true;
      preferredCadencesSec: number[];
      headroomRule: string;
      requireBookReference: boolean;
      referencePolicy?: string;
    };
    priority: typeof MARKET_PRIORITY;
    historicalMarketExcluded: string;
    statusAuthority: "DIRECT_ONCHAIN";
    cadenceAuthority: "APP_ENFORCED";
    bookReference: "BOOK_MIDPOINT_REFERENCE";
  };
  discovery: {
    sourceHierarchy: ["DIRECT_CHAIN_READS", "PINNED_SDK_ABI_TYPES", "INDEXER_ASSISTANCE", "MARKET_CREATED_LOG_FALLBACK"];
    candidatesObserved: CandidateEvidence[];
    counts: { discoverable: number; directRead: number; currentlyTrading: number; compatible: number; proofEligible: number };
    meta: Record<string, unknown>;
  };
  selection: {
    selectedMarketId: string | null;
    priorityLabel: string | null;
    reason: string;
  };
  profile: ProfileEvidence;
  owner: OwnerEvidenceInput & { predictedAddresses: PredictedAddresses };
  packet: PacketEvidence | null;
  gas: GasReport | null;
  evidenceCeiling: "SHANNON_READ_VERIFIED" | "UNIT_VERIFIED" | "BLOCKED_EXTERNAL";
}

function normalizeId(id: string): string {
  return id.toLowerCase();
}

function priorityFor(asset: string | null, intervalSec: number | null): { index: number; label: string } | null {
  if (asset == null || intervalSec == null) return null;
  const index = MARKET_PRIORITY.findIndex(
    (p) => p.asset === asset.toUpperCase() && p.intervalSec === intervalSec,
  );
  return index < 0 ? null : { index, label: MARKET_PRIORITY[index].label };
}

function requiredHeadroom(intervalSec: number, profile: ProfileName): number {
  if (profile === "A") {
    return Math.max(PROFILE_A_ABSOLUTE_FLOOR_SEC, Math.min(PROFILE_A_RELATIVE_CAP_SEC, Math.ceil(intervalSec * PROFILE_A_RELATIVE_FRACTION)));
  }
  return Math.max(PROFILE_B_ABSOLUTE_FLOOR_SEC, Math.min(PROFILE_B_RELATIVE_CAP_SEC, Math.ceil(intervalSec * PROFILE_B_RELATIVE_FRACTION)));
}

function isSameAddress(a: string | null | undefined, b: string | null | undefined): boolean {
  return a != null && b != null && a.toLowerCase() === b.toLowerCase();
}

function marketClassFor(asset: string, intervalSec: number): { value: number; label: string } {
  const p = priorityFor(asset, intervalSec);
  if (!p) throw new Error(`unsupported market class ${asset}/${intervalSec}`);
  return { value: MARKET_CLASS_BY_ASSET_CADENCE[p.label], label: p.label };
}

export function predictCreateAddresses(owner: string, nonce: bigint | number | string): PredictedAddresses {
  const from = getAddress(owner as Address);
  const n = typeof nonce === "bigint" ? nonce : BigInt(nonce);
  return {
    nonce: n.toString(),
    registryV2: getContractAddress({ from, nonce: n }),
    executorV2: getContractAddress({ from, nonce: n + 1n }),
    sequence: [
      { nonce: n.toString(), contract: "CircuitRegistryV2" },
      { nonce: (n + 1n).toString(), contract: "CircuitExecutorV2" },
    ],
  };
}

function circuitIdFor(args: {
  chainId: number;
  registry: string;
  owner: string;
  marketClass: number;
  startsAt: number;
  targetWindows: number;
}): Hex {
  return keccak256(
    encodeAbiParameters(
      [
        { type: "uint256" },
        { type: "address" },
        { type: "address" },
        { type: "uint8" },
        { type: "uint64" },
        { type: "uint16" },
      ],
      [
        BigInt(args.chainId),
        getAddress(args.registry) as Address,
        getAddress(args.owner) as Address,
        args.marketClass,
        BigInt(args.startsAt),
        args.targetWindows,
      ],
    ),
  );
}

function trialIdFor(args: { chainId: number; rftRegistry: string; forecaster: string; marketId: string }): Hex {
  return keccak256(
    encodeAbiParameters(
      [{ type: "uint256" }, { type: "address" }, { type: "address" }, { type: "bytes32" }],
      [
        BigInt(args.chainId),
        getAddress(args.rftRegistry) as Address,
        getAddress(args.forecaster) as Address,
        args.marketId as Hex,
      ],
    ),
  );
}

export function deriveBookReference(book: BookRead): ReferenceEvidence {
  const base: ReferenceEvidence = {
    referenceType: "BOOK_MIDPOINT_REFERENCE",
    referenceUnavailable: true,
    referenceValid: false,
    unavailableReason: null,
    bestBidRaw: book.bestBidRaw,
    bestAskRaw: book.bestAskRaw,
    referenceRaw: null,
    referenceRawNumerator: null,
    referenceRawDenominator: null,
    referenceUpBps: null,
    referenceUpBpsNumerator: null,
    referenceUpBpsDenominator: null,
    unitScaleRaw: book.oneCollateralRaw,
  };

  if (!book.ok) {
    base.unavailableReason = book.error ?? "BOOK_READ_FAILED";
    return base;
  }
  if (book.oneCollateralRaw == null || book.bestBidRaw == null || book.bestAskRaw == null) {
    base.unavailableReason = "BEST_BID_OR_BEST_ASK_MISSING";
    return base;
  }

  try {
    const scale = BigInt(book.oneCollateralRaw);
    const bid = BigInt(book.bestBidRaw);
    const ask = BigInt(book.bestAskRaw);
    if (scale <= 0n || bid < 0n || ask < 0n) {
      base.unavailableReason = "INVALID_BOOK_UNITS";
      return base;
    }
    const sum = bid + ask;
    const bpsNumerator = sum * 10_000n;
    const bpsDenominator = 2n * scale;
    base.referenceUnavailable = false;
    base.referenceRawNumerator = sum.toString();
    base.referenceRawDenominator = "2";
    base.referenceRaw = sum % 2n === 0n ? (sum / 2n).toString() : null;
    base.referenceUpBpsNumerator = bpsNumerator.toString();
    base.referenceUpBpsDenominator = bpsDenominator.toString();
    base.unitScaleRaw = scale.toString();
    if (bpsNumerator % bpsDenominator !== 0n) {
      base.unavailableReason = "MIDPOINT_NOT_EXACT_INTEGER_BPS";
      return base;
    }
    const bps = bpsNumerator / bpsDenominator;
    if (bps > 10_000n) {
      base.unavailableReason = "MIDPOINT_OUT_OF_RANGE";
      return base;
    }
    base.referenceUpBps = Number(bps);
    base.referenceValid = true;
    return base;
  } catch {
    base.unavailableReason = "INVALID_BOOK_NUMBER";
    return base;
  }
}

function chooseBlocker(_records: CandidateEvidence[]): GateStatus {
  return "BLOCKED_NO_ELIGIBLE_LIVE_MARKET";
}

function profileEvidence(profileAProvenSufficient: boolean): ProfileEvidence {
  if (profileAProvenSufficient) {
    return {
      selected: "A",
      default: false,
      reason: "Profile A is selected because the implementation supplied explicit sufficient evidence; Profile B zero-action rejection evidence is not required for this run.",
      profileA: { sufficient: true, reason: "Caller supplied a demonstrated Profile A sufficiency gate." },
      minimumHeadroomRule: "max(90 seconds, min(600 seconds, ceil(0.25 × cadenceSec)))",
    };
  }
  return {
    selected: "B",
    default: true,
    reason: "Profile B is selected by default because live zero-action rejection evidence is required; this run does not demonstrate that Profile A is sufficient.",
    profileA: { sufficient: false, reason: "No live Profile A sufficiency evidence was supplied." },
    minimumHeadroomRule: "max(180 seconds, min(900 seconds, ceil(0.25 × cadenceSec)))",
  };
}

export function evaluateLiveGate(input: GateEvaluationInput): LiveGateEvidence {
  const profile = profileEvidence(input.profileAProvenSufficient);
  const freshPredicted = predictCreateAddresses(input.owner.address, input.owner.nonce);
  const predictedAddresses: PredictedAddresses = input.deployedAddresses
    ? { ...freshPredicted, registryV2: input.deployedAddresses.registryV2, executorV2: input.deployedAddresses.executorV2 }
    : freshPredicted;
  const unique = new Map<string, CandidateProbe>();
  for (const probe of input.probes) {
    const id = normalizeId(probe.discovered.marketId);
    if (!unique.has(id)) unique.set(id, probe);
  }

  const records: CandidateEvidence[] = [];
  for (const probe of unique.values()) {
    const discovered = probe.discovered;
    const rejectionCodes: string[] = [];
    const direct = probe.direct;
    const priority = priorityFor(discovered.asset, discovered.intervalSec);
    const directExpiry = direct.ok ? direct.expirySec ?? null : null;
    const expirySec = directExpiry ?? discovered.expirySec;
    const remainingSec = expirySec == null ? null : expirySec - input.network.headTimestampSec;
    const required =
      discovered.intervalSec == null ? null : requiredHeadroom(discovered.intervalSec, profile.selected);

    if (normalizeId(discovered.marketId) === normalizeId(EXCLUDED_HISTORICAL_MARKET_ID)) {
      rejectionCodes.push("HISTORICAL_EXCLUDED");
    }
    if (discovered.marketType.toUpperCase() !== "BINARY") rejectionCodes.push("NOT_BINARY");
    const proofEligibilityReasons: string[] = [];
    if (!direct.ok) {
      rejectionCodes.push("DIRECT_READ_FAILED");
    } else {
      if (direct.status !== 1) rejectionCodes.push("ONCHAIN_NOT_TRADING");
      if (directExpiry == null || directExpiry <= input.network.headTimestampSec) {
        rejectionCodes.push("EXPIRED");
      }
      if (discovered.marketAddress != null && !isSameAddress(discovered.marketAddress, direct.marketAddress)) {
        rejectionCodes.push("MARKET_BINDING_MISMATCH");
      }
      if (discovered.poolAddress != null && !isSameAddress(discovered.poolAddress, direct.pool)) {
        rejectionCodes.push("POOL_BINDING_MISMATCH");
      }
      if (discovered.expirySec != null && directExpiry != null && discovered.expirySec !== directExpiry) {
        rejectionCodes.push("EXPIRY_BINDING_MISMATCH");
      }
    }
    if (remainingSec != null && remainingSec < 0 && !rejectionCodes.includes("EXPIRED")) {
      rejectionCodes.push("EXPIRED");
    }
    const compatibilityReasons: string[] = [...rejectionCodes];
    if (required != null && remainingSec != null && remainingSec > 0 && remainingSec < required) {
      proofEligibilityReasons.push("HEADROOM_INSUFFICIENT");
    }
    const reference = deriveBookReference(probe.book);
    // M4.3 reference data is optional for the zero-action proof. Preserve the
    // unavailable state in the packet; never turn it into a fabricated value.
    const dedupedRejections = [...new Set(rejectionCodes)];
    const compatible = compatibilityReasons.length === 0;
    const proofEligible = compatible && proofEligibilityReasons.length === 0;
    records.push({
      ...discovered,
      decision: proofEligible ? "SELECTED" : "REJECTED",
      rejectionCodes: [...new Set([...dedupedRejections, ...proofEligibilityReasons])],
      compatible,
      proofEligible,
      compatibilityReasons: [...new Set(compatibilityReasons)],
      proofEligibilityReasons: [...new Set(proofEligibilityReasons)],
      direct,
      remainingSec,
      requiredHeadroomSec: required,
      priorityIndex: priority?.index ?? null,
      priorityLabel: priority?.label ?? null,
    });
  }

  const eligible = records
    .filter((r) => r.decision === "SELECTED")
    .sort((a, b) => {
      const pa = a.priorityIndex ?? Number.MAX_SAFE_INTEGER;
      const pb = b.priorityIndex ?? Number.MAX_SAFE_INTEGER;
      if (pa !== pb) return pa - pb;
      return (b.remainingSec ?? -1) - (a.remainingSec ?? -1) || a.marketId.localeCompare(b.marketId);
    });
  const selected = eligible[0] ?? null;
  for (const r of records) {
    if (selected != null && normalizeId(r.marketId) !== normalizeId(selected.marketId) && r.decision === "SELECTED") {
      r.decision = "REJECTED";
      r.rejectionCodes.push("LOWER_PRIORITY");
    }
  }

  const ownerOutput = { ...input.owner, predictedAddresses };
  const base: Omit<LiveGateEvidence, "status" | "blocker" | "packet" | "gas" | "selection" | "evidenceCeiling"> = {
    schemaVersion: "M4.3.2B.v1",
    milestone: "M4.3.2B",
    generatedAt: input.generatedAt,
    network: input.network,
    sideEffects: {
      chainWrites: false,
      funding: false,
      faucet: false,
      signatures: false,
      privateKeyImported: false,
      deployments: false,
      broadcasts: false,
    },
    rules: {
      compatibility: {
        marketType: "BINARY",
        requiredFields: ["marketId", "marketAddress", "pool", "status", "expiry", "probability/book"],
        directStatusRequired: "Trading",
        expiryRequired: "GREATER_THAN_OBSERVED_CHAIN_TIMESTAMP",
      },
      proofProfile: {
        preferredAssets: ["BTC", "ETH"],
        allowOtherCompatibleAssets: true,
        preferredCadencesSec: [60, 300, 900, 3600, 14400],
        headroomRule: profile.minimumHeadroomRule,
        requireBookReference: false,
        referencePolicy: "OPTIONAL_FOR_M4_3_ZERO_ACTION",
      },
      priority: MARKET_PRIORITY,
      historicalMarketExcluded: EXCLUDED_HISTORICAL_MARKET_ID,
      statusAuthority: "DIRECT_ONCHAIN",
      cadenceAuthority: "APP_ENFORCED",
      bookReference: "BOOK_MIDPOINT_REFERENCE",
    },
    discovery: {
      sourceHierarchy: ["DIRECT_CHAIN_READS", "PINNED_SDK_ABI_TYPES", "INDEXER_ASSISTANCE", "MARKET_CREATED_LOG_FALLBACK"],
      candidatesObserved: records,
      counts: {
        discoverable: Number(input.discoveryMeta?.rowsDiscovered ?? records.length),
        directRead: records.filter((record) => record.direct.ok).length,
        currentlyTrading: records.filter((record) => record.direct.ok && record.direct.status === 1).length,
        compatible: records.filter((record) => record.compatible).length,
        proofEligible: records.filter((record) => record.proofEligible).length,
      },
      meta: input.discoveryMeta ?? {},
    },
    profile,
    owner: ownerOutput,
  };

  if (input.discoveryMeta?.discoveryComplete === false && selected == null) {
    const status: GateStatus = input.discoveryMeta.fatalCode === "DISCOVERY_FAILED" ? "DISCOVERY_FAILED" : "DISCOVERY_INCOMPLETE";
    return {
      ...base,
      status,
      blocker: status,
      selection: { selectedMarketId: null, priorityLabel: null, reason: "Discovery did not complete with a supported paginated indexer plus MarketCreated-log fallback; no exhaustive market claim was inferred." },
      packet: null,
      gas: null,
      evidenceCeiling: "SHANNON_READ_VERIFIED",
    };
  }

  if (selected == null) {
    const status: GateStatus = input.discoveryMeta?.fatalCode === "BLOCKED_LIVE_READ_FAILED"
      ? "DISCOVERY_FAILED"
      : input.discoveryMeta?.discoveryComplete === false
        ? "DISCOVERY_INCOMPLETE"
        : records.some((r) => r.compatible)
          ? "LIVE_MARKETS_FOUND_NONE_PROOF_ELIGIBLE"
          : "NO_LIVE_COMPATIBLE_MARKET";
    return {
      ...base,
      status,
      blocker: status,
      selection: {
        selectedMarketId: null,
        priorityLabel: null,
        reason: status === "DISCOVERY_FAILED" || status === "DISCOVERY_INCOMPLETE"
          ? "The configured discovery/read sources did not complete; no market claim was inferred."
          : status === "LIVE_MARKETS_FOUND_NONE_PROOF_ELIGIBLE"
            ? "Compatible live markets were found, but none passed the proof-eligibility profile gates."
            : "No candidate passed direct binding, Trading status, expiry, and market identity gates.",
      },
      packet: null,
      gas: null,
      evidenceCeiling: "SHANNON_READ_VERIFIED",
    };
  }

  if (!input.owner.nonceReadFresh) {
    return {
      ...base,
      status: "BLOCKED_OWNER_NONCE_READ_FAILED",
      blocker: "BLOCKED_OWNER_NONCE_READ_FAILED",
      selection: {
        selectedMarketId: selected.marketId,
        priorityLabel: selected.priorityLabel,
        reason: "A candidate passed market gates, but the disposable owner nonce was not freshly read; predicted CREATE addresses are not safe to carry forward.",
      },
      packet: null,
      gas: null,
      evidenceCeiling: "SHANNON_READ_VERIFIED",
    };
  }

  const selectedProbe = unique.get(normalizeId(selected.marketId));
  if (!selectedProbe) throw new Error(`selected probe missing for ${selected.marketId}`);
  const reference = deriveBookReference(selectedProbe.book);
  if (selected.priorityLabel == null) {
    return {
      ...base,
      status: "COMPATIBLE_MARKET_REQUIRES_AUTHORIZATION",
      blocker: "MARKET_CLASS_UNMAPPED",
      selection: { selectedMarketId: selected.marketId, priorityLabel: null, reason: "A compatible proof-eligible market was found, but its asset/cadence has no deployed Circuit market class mapping." },
      packet: null,
      gas: null,
      evidenceCeiling: "SHANNON_READ_VERIFIED",
    };
  }
  const classInfo = marketClassFor(selected.asset as string, selected.intervalSec as number);
  const startsAt = selected.tradingStartSec;
  const expiresAt = selected.direct.expirySec ?? selected.expirySec;
  if (startsAt == null || expiresAt == null) {
    selected.decision = "REJECTED";
    selected.rejectionCodes.push("TIMING_UNAVAILABLE");
    return {
      ...base,
      status: "BLOCKED_NO_ELIGIBLE_LIVE_MARKET",
      blocker: "TIMING_UNAVAILABLE",
      selection: { selectedMarketId: null, priorityLabel: null, reason: "Selected candidate lacked exact candidate timing." },
      packet: null,
      gas: null,
      evidenceCeiling: "SHANNON_READ_VERIFIED",
    };
  }
  const circuitId = circuitIdFor({
    chainId: input.network.chainId,
    registry: predictedAddresses.registryV2,
    owner: input.owner.address,
    marketClass: classInfo.value,
    startsAt,
    targetWindows: 1,
  });
  const trialId = trialIdFor({
    chainId: input.network.chainId,
    rftRegistry: input.rftRegistry,
    forecaster: input.forecaster,
    marketId: selected.marketId,
  });
  const circuitIntent: CircuitIntentEvidence = {
    circuitId,
    owner: input.owner.address,
    forecaster: input.forecaster,
    marketClass: classInfo.value,
    marketClassLabel: classInfo.label,
    targetWindows: 1,
    totalBudget: "1",
    maxPerMarket: "1",
    minMarginBps: 0,
    maxConsecutiveLosses: 1,
    startsAt: String(startsAt),
    expiresAt: String(expiresAt),
    allowedActionsBitmap: "0",
    scope: {
      venue: "DreamDEX",
      marketId: selected.marketId,
      asset: selected.asset as string,
      intervalSec: selected.intervalSec as number,
      cadenceAuthority: "APP_ENFORCED",
    },
    executionAuthority: "NONE",
    capitalAuthority: "NONE",
    economicSpend: "ZERO",
  };
  const forecastCommitSimulation = {
    contract: input.rftRegistry,
    caller: input.forecaster,
    pUpBps: 5000 as const,
    referenceUpBps: reference.referenceUpBps ?? 0,
    referenceValid: reference.referenceValid,
    tradeTag: "0" as const,
    actionIntent: "3" as const,
    trialId,
    note: "Gas-estimation-only neutral placeholder. No Forecast is signed or committed by this scanner.",
  };
  const packet: PacketEvidence = {
    market: { candidate: selected, direct: selected.direct, book: selectedProbe.book, reference },
    circuitIntent,
    forecastCommitSimulation,
    gas: input.gas ?? {
      status: "FAILED",
      complete: false,
      method: "not supplied",
      gasPriceWei: null,
      conservativeMultiplierBps: 12500,
      operations: [],
      limitation: "No gas report supplied.",
    },
  };
  const gasComplete = input.gas?.complete === true;
  const status: GateStatus = gasComplete ? "READY_FOR_BOUNDED_LIVE_WRITE" : "BLOCKED_GAS_ESTIMATION_FAILED";
  return {
    ...base,
    status,
    blocker: gasComplete ? null : "BLOCKED_GAS_ESTIMATION_FAILED",
    selection: {
      selectedMarketId: selected.marketId,
      priorityLabel: selected.priorityLabel,
      reason: "Selected by explicit asset/cadence priority, then longest safe headroom within that priority.",
    },
    packet,
    gas: input.gas,
    evidenceCeiling: "SHANNON_READ_VERIFIED",
  };
}

export function humanSummary(evidence: LiveGateEvidence): string {
  const selected = evidence.selection.selectedMarketId ?? "none";
  const candidateCount = evidence.discovery.candidatesObserved.length;
  return [
    `status=${evidence.status}`,
    `selectedMarket=${selected}`,
    `candidatesObserved=${candidateCount}`,
    `profile=${evidence.profile.selected}`,
    `chainWrites=false funding=false broadcasts=false`,
  ].join("\n");
}

function markdownCell(value: unknown): string {
  return String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
}

function markdownJson(value: unknown): string {
  return ["```json", JSON.stringify(value, null, 2), "```"].join("\n");
}

export function renderLiveGateMarkdown(evidence: LiveGateEvidence): string {
  const candidateRows = evidence.discovery.candidatesObserved.length === 0
    ? "| none | none | none | none | none | none |\n"
    : evidence.discovery.candidatesObserved
        .map((candidate) =>
          `| ${markdownCell(candidate.marketId)} | ${markdownCell(candidate.asset)} | ${markdownCell(candidate.intervalSec)} | ${markdownCell(candidate.direct.statusLabel ?? candidate.statusFromIndexer)} | ${markdownCell(candidate.remainingSec)} | ${markdownCell(candidate.decision === "SELECTED" ? "SELECTED" : candidate.rejectionCodes.join(", "))} |`,
        )
        .join("\n") + "\n";
  const noPacket = evidence.packet == null
    ? "No candidate passed the selection gates, so no partial Circuit packet was generated."
    : [
        "Circuit intent:",
        markdownJson(evidence.packet.circuitIntent),
        "Market and reference:",
        markdownJson(evidence.packet.market),
        "Gas and operation estimates:",
        markdownJson(evidence.packet.gas),
      ].join("\n\n");
  return [
    `# M4.3.2B Live Gate Authorization Packet - ${evidence.status}`,
    "",
    `Generated at: \`${evidence.generatedAt}\``,
    `Status: \`${evidence.status}\``,
    evidence.blocker == null ? "Blocker: none" : `Blocker: \`${evidence.blocker}\``,
    "",
    "No chain write, funding, faucet call, signature, deployment, broadcast, or private-key import occurred. This packet is read-only evidence and a conditional pre-write plan.",
    "",
    "## Network",
    "",
    `- Chain ID: \`${evidence.network.chainId}\``,
    `- Shannon head block: \`${evidence.network.headBlock}\``,
    `- Shannon head timestamp: \`${evidence.network.headTimestampSec}\``,
    `- RPC: \`${evidence.network.rpcUrl}\``,
    `- Indexer: \`${evidence.network.indexerUrl}\``,
    "",
    "## Rules",
    "",
    `- Structural compatibility: binary Event Contract with readable marketId, market, pool, status, expiry, and book/probability fields`,
    `- Direct status: \`${evidence.rules.compatibility.directStatusRequired}\``,
    `- Expiry: \`${evidence.rules.compatibility.expiryRequired}\``,
    `- Proof preferences: \`${evidence.rules.proofProfile.preferredAssets.join(", ")}\`; other compatible assets allowed: \`${evidence.rules.proofProfile.allowOtherCompatibleAssets}\``,
    `- Proof headroom: \`${evidence.rules.proofProfile.headroomRule}\``,
    `- Reference required for proof eligibility: \`${evidence.rules.proofProfile.requireBookReference}\``,
    `- Priority: \`${evidence.rules.priority.map((p) => p.label).join(" -> ")}\``,
    `- Historical exclusion: \`${evidence.rules.historicalMarketExcluded}\``,
    `- Status authority: \`${evidence.rules.statusAuthority}\``,
    `- Cadence authority: \`${evidence.rules.cadenceAuthority}\``,
    `- Reference method: \`${evidence.rules.bookReference}\``,
    "",
    "## Discovery and candidate gates",
    "",
    "| marketId | asset | cadenceSec | direct/indexer status | remainingSec | decision |",
    "|---|---:|---:|---|---:|---|",
    candidateRows.trimEnd(),
    "",
    `Candidates observed: \`${evidence.discovery.candidatesObserved.length}\``,
    markdownJson(evidence.discovery.meta),
    "",
    "## Selection",
    "",
    `- Selected market: \`${evidence.selection.selectedMarketId ?? "none"}\``,
    `- Selected priority: \`${evidence.selection.priorityLabel ?? "none"}\``,
    `- Reason: ${evidence.selection.reason}`,
    "",
    "## Profile decision",
    "",
    `- Selected profile: \`PROFILE ${evidence.profile.selected}\``,
    `- Default: \`${evidence.profile.default}\``,
    `- Reason: ${evidence.profile.reason}`,
    `- Headroom rule: \`${evidence.profile.minimumHeadroomRule}\``,
    "",
    "## Owner nonce and predicted CREATE addresses",
    "",
    `- Owner: \`${evidence.owner.address}\` (source: \`${evidence.owner.source}\`)`,
    `- Fresh nonce: \`${evidence.owner.nonce}\``,
    markdownJson(evidence.owner.predictedAddresses),
    "",
    "## Conditional packet",
    "",
    noPacket,
    "",
    "## Side-effect boundary and evidence ceiling",
    "",
    markdownJson(evidence.sideEffects),
    `Evidence ceiling: \`${evidence.evidenceCeiling}\``,
    "",
    "The Circuit market cadence remains APP_ENFORCED. Placeholder budgets `1/1` are schema-required inert values, not collateral authority. Zero-action and duplicate-call simulations are not funding requirements.",
    "",
  ].join("\n");
}
