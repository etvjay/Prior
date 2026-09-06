import {
  encodePacked,
  formatUnits,
  keccak256,
  stringToHex,
  type Address,
  type Hex,
} from "viem";
import {
  AgentSourceType,
  ApiTransport,
  AuthorizedActionKind,
  ExecuteCapability,
  ForecastCapability,
  MandateLifecycle,
  MarketAsset,
  MarketClass,
  MarketVenue,
  ReadCapability,
  type AgentBinding,
  type AgentId,
  type AgentPrincipal,
  type AuthorizedAction,
  type BindingId,
  type ForecastId,
  type ForecastRequest,
  type ForecastSubmission,
  type IterationId,
  type MandatePolicy,
  type MandateMarketClass,
  type MarketReference,
  type PolicyHash,
} from "./types.js";
import {
  asCollateralRaw,
  asPriceRaw,
  asQuantityRaw,
  asUnitScaleRaw,
  maxCollateralSpendRaw,
  type CollateralRaw,
  type PriceRaw,
  type QuantityRaw,
  type UnitScaleRaw,
} from "./units.js";

const BYTE_LENGTHS = {
  id: 32,
  address: 20,
} as const;

const LIFECYCLE_VALUES = new Set<string>(Object.values(MandateLifecycle));
const SOURCE_VALUES = new Set<string>(Object.values(AgentSourceType));
const READ_VALUES = new Set<string>(Object.values(ReadCapability));
const FORECAST_VALUES = new Set<string>(Object.values(ForecastCapability));
const EXECUTE_VALUES = new Set<string>(Object.values(ExecuteCapability));
const ACTION_VALUES = new Set<string>(Object.values(AuthorizedActionKind));
const ASSET_VALUES = new Set<string>(Object.values(MarketAsset));
const MARKET_CLASS_VALUES = new Set<number>(Object.values(MarketClass));

const ACTION_FIELDS: readonly (keyof AuthorizedAction)[] = [
  "actionId",
  "circuitId",
  "marketId",
  "executionId",
  "executorAgentId",
  "action",
  "maxPriceRaw",
  "quantityRaw",
  "maximumSpendRaw",
  "validAfter",
  "expiresAt",
  "policyHash",
];

export interface AuthorizedActionValidationContext {
  readonly policy: MandatePolicy;
  /** Raw units representing one whole collateral value. */
  readonly unitScaleRaw: bigint;
  readonly binding?: AgentBinding;
  readonly expectedCircuitId?: Hex;
  readonly now?: bigint;
  readonly reservedSpendRaw?: bigint;
  readonly realizedLossRaw?: bigint;
}

export interface AuthorizedActionValidationArgs extends AuthorizedActionValidationContext {
  readonly action: AuthorizedAction;
}

export type PolicyExpansionField =
  | "version"
  | "mandateId"
  | "owner"
  | "forecasters"
  | "executors"
  | "marketScope"
  | "marketScope.assets"
  | "marketScope.intervalsSec"
  | "marketScope.marketIds"
  | "forecastAuthority"
  | "forecastAuthority.agentIds"
  | "forecastAuthority.capabilities"
  | "forecastAuthority.maxSubmissionsPerMarket"
  | "forecastAuthority.minLeadTimeSec"
  | "executionAuthority"
  | "executionAuthority.agentIds"
  | "executionAuthority.capabilities"
  | "executionAuthority.allowedActions"
  | "executionAuthority.minMarginBps"
  | "executionAuthority.maxActionLifetimeSec"
  | "capitalAuthority.maxPerMarketRaw"
  | "capitalAuthority.totalBudgetRaw"
  | "capitalAuthority.stopLossRaw"
  | "temporalAuthority.issuedAt"
  | "temporalAuthority.startsAt"
  | "temporalAuthority.expiresAt"
  | "revocation"
  | "lifecycle";

function fail(message: string): never {
  throw new Error(message);
}

function assertHex(value: unknown, field: string, bytes?: number): asserts value is Hex {
  if (typeof value !== "string" || !/^0x[0-9a-fA-F]*$/.test(value) || (value.length - 2) % 2 !== 0) {
    fail(`${field} must be a hexadecimal value`);
  }
  if (bytes !== undefined && value.length !== 2 + bytes * 2) {
    fail(`${field} must be ${bytes} bytes`);
  }
}

function assertAddress(value: unknown, field: string): asserts value is Address {
  assertHex(value, field, BYTE_LENGTHS.address);
}

function assertBigInt(value: unknown, field: string, nonNegative = true): asserts value is bigint {
  if (typeof value !== "bigint") fail(`${field} must be bigint`);
  if (nonNegative && value < 0n) fail(`${field} must be non-negative`);
}

function assertInteger(value: unknown, field: string, minimum?: number): asserts value is number {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) fail(`${field} must be an integer`);
  if (minimum !== undefined && value < minimum) fail(`${field} must be >= ${minimum}`);
}

function assertKnown(value: unknown, values: ReadonlySet<string>, field: string): void {
  if (typeof value !== "string" || !values.has(value)) fail(`${field} is not a supported value`);
}

function assertUnique<T>(values: readonly T[], field: string, key: (value: T) => string = String): void {
  const seen = new Set<string>();
  for (const value of values) {
    const normalized = key(value);
    if (seen.has(normalized)) fail(`${field} contains duplicate ${normalized}`);
    seen.add(normalized);
  }
}

function idKey(value: string): string {
  return value.toLowerCase();
}

function sameAddress(left: Address, right: Address): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

function sameId(left: string, right: string): boolean {
  return idKey(left) === idKey(right);
}

function hasValue<T extends string | number>(values: readonly T[], value: T): boolean {
  return values.includes(value);
}

function assertSubset<T>(child: readonly T[], parent: readonly T[], field: string, key: (value: T) => string = String): void {
  const parentKeys = new Set(parent.map(key));
  for (const value of child) {
    if (!parentKeys.has(key(value))) fail(`${field} is not a subset of the approved authority`);
  }
}

function validateAgentPrincipal(principal: AgentPrincipal, field: string): void {
  assertHex(principal.agentId, `${field}.agentId`, BYTE_LENGTHS.id);
  if (typeof principal.displayName !== "string" || principal.displayName.trim() === "") {
    fail(`${field}.displayName must be non-empty`);
  }
  assertKnown(principal.sourceType, SOURCE_VALUES, `${field}.sourceType`);
  if (principal.forecastAddress !== undefined) assertAddress(principal.forecastAddress, `${field}.forecastAddress`);
  if (principal.executorAddress !== undefined) assertAddress(principal.executorAddress, `${field}.executorAddress`);
}

function validateMarketScope(scope: MandatePolicy["marketScope"]): void {
  if (scope.venue !== MarketVenue.DREAMDEX) fail("marketScope.venue must be DreamDEX");
  if (!Array.isArray(scope.assets) || scope.assets.length === 0) fail("marketScope.assets must be non-empty");
  for (const asset of scope.assets) assertKnown(asset, ASSET_VALUES, "marketScope.assets");
  assertUnique(scope.assets, "marketScope.assets");

  if (!Array.isArray(scope.intervalsSec) || scope.intervalsSec.length === 0) {
    fail("marketScope.intervalsSec must be non-empty");
  }
  for (const interval of scope.intervalsSec) assertInteger(interval, "marketScope.intervalsSec", 1);
  assertUnique(scope.intervalsSec, "marketScope.intervalsSec");

  if (!(typeof scope.marketClass === "string" || typeof scope.marketClass === "number")) {
    fail("marketScope.marketClass must be a known market class");
  }
  if (typeof scope.marketClass === "number") {
    if (!Number.isInteger(scope.marketClass) || !MARKET_CLASS_VALUES.has(scope.marketClass)) {
      fail("marketScope.marketClass is not a supported Circuit market class");
    }
  } else if (scope.marketClass !== "BTC_5M") {
    fail("marketScope.marketClass is not a supported mandate market class");
  }

  if (!Array.isArray(scope.marketIds)) fail("marketScope.marketIds must be an array");
  for (const marketId of scope.marketIds) assertHex(marketId, "marketScope.marketIds", BYTE_LENGTHS.id);
  assertUnique(scope.marketIds, "marketScope.marketIds", idKey);
}

function validateCapabilityArray<T extends string>(values: readonly T[], supported: ReadonlySet<string>, field: string): void {
  if (!Array.isArray(values)) fail(`${field} must be an array`);
  for (const value of values) assertKnown(value, supported, field);
  assertUnique(values, field);
}

function principalFor(policy: MandatePolicy, agentId: AgentId): AgentPrincipal | undefined {
  return [...policy.forecasters, ...policy.executors].find((principal) => sameId(principal.agentId, agentId));
}

function canonicalPrincipal(principal: AgentPrincipal): Record<string, unknown> {
  return {
    agentId: principal.agentId,
    displayName: principal.displayName,
    sourceType: principal.sourceType,
    ...(principal.forecastAddress === undefined ? {} : { forecastAddress: principal.forecastAddress }),
    ...(principal.executorAddress === undefined ? {} : { executorAddress: principal.executorAddress }),
  };
}

function optionalNumber(value: number | undefined, fallback: number): number {
  return value === undefined ? fallback : value;
}

function optionalBoolean(value: boolean | undefined, fallback: boolean): boolean {
  return value === undefined ? fallback : value;
}

/** Validate the complete typed policy without consulting an external system. */
export function validateMandatePolicy(policy: MandatePolicy, _now?: bigint): void {
  if (typeof policy !== "object" || policy === null) fail("mandate policy must be an object");
  assertInteger(policy.version, "version", 1);
  assertHex(policy.mandateId, "mandateId", BYTE_LENGTHS.id);
  assertAddress(policy.owner, "owner");

  if (!Array.isArray(policy.forecasters)) fail("forecasters must be an array");
  if (!Array.isArray(policy.executors)) fail("executors must be an array");
  for (const [index, principal] of policy.forecasters.entries()) {
    validateAgentPrincipal(principal, `forecasters[${index}]`);
  }
  for (const [index, principal] of policy.executors.entries()) {
    validateAgentPrincipal(principal, `executors[${index}]`);
  }
  assertUnique(policy.forecasters, "forecasters", (principal) => idKey(principal.agentId));
  assertUnique(policy.executors, "executors", (principal) => idKey(principal.agentId));

  validateMarketScope(policy.marketScope);

  const forecastAuthority = policy.forecastAuthority;
  validateCapabilityArray(forecastAuthority.capabilities, FORECAST_VALUES, "forecastAuthority.capabilities");
  if (!Array.isArray(forecastAuthority.agentIds)) fail("forecastAuthority.agentIds must be an array");
  for (const agentId of forecastAuthority.agentIds) assertHex(agentId, "forecastAuthority.agentIds", BYTE_LENGTHS.id);
  assertUnique(forecastAuthority.agentIds, "forecastAuthority.agentIds", idKey);
  assertSubset(forecastAuthority.agentIds, policy.forecasters.map((principal) => principal.agentId), "forecastAuthority.agentIds", idKey);
  if (forecastAuthority.agentIds.length > 0 && !hasValue(forecastAuthority.capabilities, ForecastCapability.SUBMIT_FORECAST)) {
    fail("forecastAuthority must declare submitForecast when it has forecasters");
  }
  if (forecastAuthority.capabilities.length > 0 && forecastAuthority.agentIds.length === 0) {
    fail("forecastAuthority capabilities require a forecaster");
  }
  const maxSubmissions = optionalNumber(forecastAuthority.maxSubmissionsPerMarket, 1);
  assertInteger(maxSubmissions, "forecastAuthority.maxSubmissionsPerMarket", 1);
  if (maxSubmissions !== 1) fail("forecastAuthority.maxSubmissionsPerMarket must be 1 for immutable v0.1 Forecasts");
  const requireAttributableSigner = optionalBoolean(forecastAuthority.requireAttributableSigner, true);
  if (!requireAttributableSigner) fail("forecastAuthority.requireAttributableSigner cannot be disabled");
  if (forecastAuthority.minLeadTimeSec !== undefined) assertInteger(forecastAuthority.minLeadTimeSec, "forecastAuthority.minLeadTimeSec", 0);

  const executionAuthority = policy.executionAuthority;
  validateCapabilityArray(executionAuthority.capabilities, EXECUTE_VALUES, "executionAuthority.capabilities");
  validateCapabilityArray(executionAuthority.allowedActions, ACTION_VALUES, "executionAuthority.allowedActions");
  if (!Array.isArray(executionAuthority.agentIds)) fail("executionAuthority.agentIds must be an array");
  for (const agentId of executionAuthority.agentIds) assertHex(agentId, "executionAuthority.agentIds", BYTE_LENGTHS.id);
  assertUnique(executionAuthority.agentIds, "executionAuthority.agentIds", idKey);
  assertSubset(executionAuthority.agentIds, policy.executors.map((principal) => principal.agentId), "executionAuthority.agentIds", idKey);
  if (executionAuthority.agentIds.length > 0 && executionAuthority.capabilities.length === 0) {
    fail("executionAuthority agents require typed execute capabilities");
  }
  if (executionAuthority.capabilities.length > 0 && executionAuthority.agentIds.length === 0) {
    fail("executionAuthority capabilities require an executor");
  }
  assertBpsValue(executionAuthority.minMarginBps, "executionAuthority.minMarginBps");
  if (executionAuthority.maxActionLifetimeSec !== undefined) {
    assertInteger(executionAuthority.maxActionLifetimeSec, "executionAuthority.maxActionLifetimeSec", 1);
  }

  const capital = policy.capitalAuthority;
  assertBigInt(capital.maxPerMarketRaw, "capitalAuthority.maxPerMarketRaw");
  assertBigInt(capital.totalBudgetRaw, "capitalAuthority.totalBudgetRaw");
  assertBigInt(capital.stopLossRaw, "capitalAuthority.stopLossRaw");
  if (capital.totalBudgetRaw < capital.maxPerMarketRaw) fail("totalBudgetRaw must cover maxPerMarketRaw");
  if (capital.stopLossRaw > capital.totalBudgetRaw) fail("stopLossRaw cannot exceed totalBudgetRaw");

  const temporal = policy.temporalAuthority;
  assertBigInt(temporal.issuedAt, "temporalAuthority.issuedAt");
  assertBigInt(temporal.startsAt, "temporalAuthority.startsAt");
  assertBigInt(temporal.expiresAt, "temporalAuthority.expiresAt");
  if (temporal.issuedAt > temporal.startsAt) fail("temporalAuthority.issuedAt cannot be after startsAt");
  if (temporal.expiresAt <= temporal.startsAt) fail("temporalAuthority.expiresAt must be after startsAt");

  assertKnown(policy.lifecycle, LIFECYCLE_VALUES, "lifecycle");
  if (policy.revocation.enabled !== true) fail("owner revocation must remain enabled");
  if (policy.revocation.ownerOnly !== true) fail("owner revocation must remain owner-only");
}

function assertBpsValue(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0 || value > 10_000) fail(`${field} must be integer bps in [0, 10000]`);
}

/** Expiry is derived without changing a terminal lifecycle or mutating the policy. */
export function effectiveMandateLifecycle(policy: MandatePolicy, now: bigint): MandateLifecycle {
  assertBigInt(now, "now");
  if (
    (policy.lifecycle === MandateLifecycle.DRAFT ||
      policy.lifecycle === MandateLifecycle.APPROVED ||
      policy.lifecycle === MandateLifecycle.ACTIVE ||
      policy.lifecycle === MandateLifecycle.PAUSED) &&
    now >= policy.temporalAuthority.expiresAt
  ) {
    return MandateLifecycle.EXPIRED;
  }
  return policy.lifecycle;
}

const LIFECYCLE_TRANSITIONS: Record<MandateLifecycle, readonly MandateLifecycle[]> = {
  [MandateLifecycle.DRAFT]: [MandateLifecycle.APPROVED, MandateLifecycle.REVOKED],
  [MandateLifecycle.APPROVED]: [MandateLifecycle.ACTIVE, MandateLifecycle.EXPIRED, MandateLifecycle.REVOKED],
  [MandateLifecycle.ACTIVE]: [MandateLifecycle.PAUSED, MandateLifecycle.EXPIRED, MandateLifecycle.REVOKED, MandateLifecycle.COMPLETED],
  [MandateLifecycle.PAUSED]: [MandateLifecycle.ACTIVE, MandateLifecycle.EXPIRED, MandateLifecycle.REVOKED, MandateLifecycle.COMPLETED],
  [MandateLifecycle.EXPIRED]: [],
  [MandateLifecycle.REVOKED]: [],
  [MandateLifecycle.COMPLETED]: [],
};

export function assertLifecycleTransition(from: MandateLifecycle, to: MandateLifecycle): void {
  assertKnown(from, LIFECYCLE_VALUES, "from lifecycle");
  assertKnown(to, LIFECYCLE_VALUES, "to lifecycle");
  if (from === to) return;
  if (!LIFECYCLE_TRANSITIONS[from].includes(to)) fail(`invalid mandate lifecycle transition ${from} -> ${to}`);
}

function principalSet(policy: MandatePolicy, key: "forecasters" | "executors"): Map<string, string> {
  return new Map(policy[key].map((principal) => [idKey(principal.agentId), canonicalize(canonicalPrincipal(principal))]));
}

function numberSet(values: readonly number[]): Set<number> {
  return new Set(values);
}

function stringSet(values: readonly string[]): Set<string> {
  return new Set(values);
}

function subsetNumbers(child: readonly number[], parent: readonly number[]): boolean {
  const parentValues = numberSet(parent);
  return child.every((value) => parentValues.has(value));
}

function subsetStrings(child: readonly string[], parent: readonly string[]): boolean {
  const parentValues = stringSet(parent);
  return child.every((value) => parentValues.has(value));
}

function subsetIds(child: readonly Hex[], parent: readonly Hex[], parentMayBeUnrestricted: boolean): boolean {
  if (parentMayBeUnrestricted && parent.length === 0) return true;
  if (parent.length === 0 && child.length > 0) return false;
  const parentValues = new Set(parent.map(idKey));
  return child.length > 0 && child.every((value) => parentValues.has(idKey(value)));
}

function lifecycleIsAttenuation(parent: MandateLifecycle, child: MandateLifecycle): boolean {
  if (parent === child) return true;
  if (parent === MandateLifecycle.ACTIVE) {
    return child === MandateLifecycle.PAUSED || child === MandateLifecycle.EXPIRED || child === MandateLifecycle.REVOKED || child === MandateLifecycle.COMPLETED;
  }
  if (parent === MandateLifecycle.PAUSED) {
    return child === MandateLifecycle.EXPIRED || child === MandateLifecycle.REVOKED || child === MandateLifecycle.COMPLETED;
  }
  if (parent === MandateLifecycle.DRAFT || parent === MandateLifecycle.APPROVED) {
    return child === MandateLifecycle.EXPIRED || child === MandateLifecycle.REVOKED;
  }
  return false;
}

/** Return the exact fields whose authority would expand or change incompatibly. */
export function policyExpansionFields(parent: MandatePolicy, child: MandatePolicy): readonly PolicyExpansionField[] {
  validateMandatePolicy(parent);
  validateMandatePolicy(child);
  const expanded: PolicyExpansionField[] = [];

  if (child.version !== parent.version) expanded.push("version");
  if (!sameId(child.mandateId, parent.mandateId)) expanded.push("mandateId");
  if (!sameAddress(child.owner, parent.owner)) expanded.push("owner");

  const parentForecasters = principalSet(parent, "forecasters");
  const childForecasters = principalSet(child, "forecasters");
  if ([...childForecasters].some(([key, value]) => parentForecasters.get(key) !== value)) expanded.push("forecasters");
  const parentExecutors = principalSet(parent, "executors");
  const childExecutors = principalSet(child, "executors");
  if ([...childExecutors].some(([key, value]) => parentExecutors.get(key) !== value)) expanded.push("executors");

  if (child.marketScope.venue !== parent.marketScope.venue || child.marketScope.marketClass !== parent.marketScope.marketClass) {
    expanded.push("marketScope");
  }
  if (!subsetStrings(child.marketScope.assets, parent.marketScope.assets)) expanded.push("marketScope.assets");
  if (!subsetNumbers(child.marketScope.intervalsSec, parent.marketScope.intervalsSec)) expanded.push("marketScope.intervalsSec");
  if (!subsetIds(child.marketScope.marketIds, parent.marketScope.marketIds, true)) expanded.push("marketScope.marketIds");

  const parentForecastIds = new Set(parent.forecastAuthority.agentIds.map(idKey));
  if (!child.forecastAuthority.agentIds.every((agentId) => parentForecastIds.has(idKey(agentId)))) expanded.push("forecastAuthority.agentIds");
  if (!subsetStrings(child.forecastAuthority.capabilities, parent.forecastAuthority.capabilities)) expanded.push("forecastAuthority.capabilities");
  if (optionalNumber(child.forecastAuthority.maxSubmissionsPerMarket, 1) > optionalNumber(parent.forecastAuthority.maxSubmissionsPerMarket, 1)) {
    expanded.push("forecastAuthority.maxSubmissionsPerMarket");
  }
  if (optionalNumber(child.forecastAuthority.minLeadTimeSec, 0) < optionalNumber(parent.forecastAuthority.minLeadTimeSec, 0)) {
    expanded.push("forecastAuthority.minLeadTimeSec");
  }

  const parentExecutionIds = new Set(parent.executionAuthority.agentIds.map(idKey));
  if (!child.executionAuthority.agentIds.every((agentId) => parentExecutionIds.has(idKey(agentId)))) expanded.push("executionAuthority.agentIds");
  if (!subsetStrings(child.executionAuthority.capabilities, parent.executionAuthority.capabilities)) expanded.push("executionAuthority.capabilities");
  if (!subsetStrings(child.executionAuthority.allowedActions, parent.executionAuthority.allowedActions)) expanded.push("executionAuthority.allowedActions");
  if (child.executionAuthority.minMarginBps < parent.executionAuthority.minMarginBps) expanded.push("executionAuthority.minMarginBps");
  const childLifetime = child.executionAuthority.maxActionLifetimeSec;
  const parentLifetime = parent.executionAuthority.maxActionLifetimeSec;
  if (parentLifetime !== undefined && (childLifetime === undefined || childLifetime > parentLifetime)) {
    expanded.push("executionAuthority.maxActionLifetimeSec");
  }
  if (parentLifetime === undefined && childLifetime !== undefined) {
    // Adding a finite lifetime is a reduction, not an expansion.
  }

  if (child.capitalAuthority.maxPerMarketRaw > parent.capitalAuthority.maxPerMarketRaw) expanded.push("capitalAuthority.maxPerMarketRaw");
  if (child.capitalAuthority.totalBudgetRaw > parent.capitalAuthority.totalBudgetRaw) expanded.push("capitalAuthority.totalBudgetRaw");
  if (child.capitalAuthority.stopLossRaw > parent.capitalAuthority.stopLossRaw) expanded.push("capitalAuthority.stopLossRaw");

  if (child.temporalAuthority.issuedAt < parent.temporalAuthority.issuedAt) expanded.push("temporalAuthority.issuedAt");
  if (child.temporalAuthority.startsAt < parent.temporalAuthority.startsAt) expanded.push("temporalAuthority.startsAt");
  if (child.temporalAuthority.expiresAt > parent.temporalAuthority.expiresAt) expanded.push("temporalAuthority.expiresAt");

  if (!child.revocation.enabled || child.revocation.ownerOnly !== true) expanded.push("revocation");
  if (!lifecycleIsAttenuation(parent.lifecycle, child.lifecycle)) expanded.push("lifecycle");
  return [...new Set(expanded)];
}

/** Reject any non-owner or stale policy change that would increase authority. */
export function assertSafeAttenuation(parent: MandatePolicy, child: MandatePolicy): void {
  const expanded = policyExpansionFields(parent, child);
  if (expanded.length > 0) fail(`policy attenuation expands authority: ${expanded.join(", ")}`);
}

export function isSafeAttenuation(parent: MandatePolicy, child: MandatePolicy): boolean {
  try {
    assertSafeAttenuation(parent, child);
    return true;
  } catch {
    return false;
  }
}

/** Owner-only expansion gate. Expansions still require a new approval/hash in the caller. */
export function assertPolicyChangeAuthorized(actor: Address, parent: MandatePolicy, child: MandatePolicy): void {
  validateMandatePolicy(parent);
  validateMandatePolicy(child);
  assertAddress(actor, "actor");
  if (!sameAddress(actor, parent.owner)) {
    assertSafeAttenuation(parent, child);
    return;
  }
  if (!sameAddress(parent.owner, child.owner) || !sameId(parent.mandateId, child.mandateId)) {
    fail("owner and mandate identity are immutable");
  }
}

/** Apply an already validated reduction without mutating the parent snapshot. */
export function attenuateMandatePolicy(parent: MandatePolicy, child: MandatePolicy): MandatePolicy {
  assertSafeAttenuation(parent, child);
  return freezeMandatePolicy(child);
}

function freezeMandatePolicy(policy: MandatePolicy): MandatePolicy {
  Object.freeze(policy.forecasters);
  Object.freeze(policy.executors);
  Object.freeze(policy.marketScope.assets);
  Object.freeze(policy.marketScope.intervalsSec);
  Object.freeze(policy.marketScope.marketIds);
  Object.freeze(policy.forecastAuthority.agentIds);
  Object.freeze(policy.forecastAuthority.capabilities);
  Object.freeze(policy.executionAuthority.agentIds);
  Object.freeze(policy.executionAuthority.capabilities);
  Object.freeze(policy.executionAuthority.allowedActions);
  Object.freeze(policy.forecasters);
  Object.freeze(policy.executors);
  return Object.freeze(policy);
}

export function revokeMandatePolicy(policy: MandatePolicy, owner: Address, _now?: bigint): MandatePolicy {
  validateMandatePolicy(policy);
  assertAddress(owner, "owner");
  if (!sameAddress(owner, policy.owner)) fail("only the mandate owner may revoke");
  if (!policy.revocation.enabled || !policy.revocation.ownerOnly) fail("owner revocation is disabled");
  if (policy.lifecycle === MandateLifecycle.REVOKED) fail("mandate is already revoked");
  if (policy.lifecycle === MandateLifecycle.COMPLETED || policy.lifecycle === MandateLifecycle.EXPIRED) {
    fail(`cannot revoke terminal mandate ${policy.lifecycle}`);
  }
  assertLifecycleTransition(policy.lifecycle, MandateLifecycle.REVOKED);
  return freezeMandatePolicy({ ...policy, lifecycle: MandateLifecycle.REVOKED });
}

export function canonicalizeMandatePolicy(policy: MandatePolicy): string {
  validateMandatePolicy(policy);
  return canonicalize({
    version: policy.version,
    mandateId: policy.mandateId,
    owner: policy.owner,
    forecasters: [...policy.forecasters].sort(comparePrincipal).map(canonicalPrincipal),
    executors: [...policy.executors].sort(comparePrincipal).map(canonicalPrincipal),
    marketScope: {
      venue: policy.marketScope.venue,
      assets: [...policy.marketScope.assets].sort(compareStrings),
      intervalsSec: [...policy.marketScope.intervalsSec].sort((left, right) => left - right),
      marketClass: policy.marketScope.marketClass,
      marketIds: [...policy.marketScope.marketIds].sort(compareStrings),
    },
    forecastAuthority: {
      agentIds: [...policy.forecastAuthority.agentIds].sort(compareStrings),
      capabilities: [...policy.forecastAuthority.capabilities].sort(compareStrings),
      maxSubmissionsPerMarket: optionalNumber(policy.forecastAuthority.maxSubmissionsPerMarket, 1),
      requireAttributableSigner: optionalBoolean(policy.forecastAuthority.requireAttributableSigner, true),
      minLeadTimeSec: optionalNumber(policy.forecastAuthority.minLeadTimeSec, 0),
    },
    executionAuthority: {
      agentIds: [...policy.executionAuthority.agentIds].sort(compareStrings),
      capabilities: [...policy.executionAuthority.capabilities].sort(compareStrings),
      allowedActions: [...policy.executionAuthority.allowedActions].sort(compareStrings),
      minMarginBps: policy.executionAuthority.minMarginBps,
      ...(policy.executionAuthority.maxActionLifetimeSec === undefined
        ? {}
        : { maxActionLifetimeSec: policy.executionAuthority.maxActionLifetimeSec }),
    },
    capitalAuthority: {
      maxPerMarketRaw: policy.capitalAuthority.maxPerMarketRaw,
      totalBudgetRaw: policy.capitalAuthority.totalBudgetRaw,
      stopLossRaw: policy.capitalAuthority.stopLossRaw,
    },
    temporalAuthority: policy.temporalAuthority,
    lifecycle: policy.lifecycle,
    revocation: policy.revocation,
  });
}

export function mandatePolicyHash(policy: MandatePolicy): PolicyHash {
  return keccak256(stringToHex(canonicalizeMandatePolicy(policy)));
}

export const policyHashFor = mandatePolicyHash;
export const computePolicyHash = mandatePolicyHash;

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function comparePrincipal(left: AgentPrincipal, right: AgentPrincipal): number {
  return compareStrings(idKey(left.agentId), idKey(right.agentId));
}

function validateApiPrincipal(principal: AgentBinding["apiPrincipal"]): void {
  if (!principal || typeof principal !== "object") fail("apiPrincipal must be an authenticated principal");
  assertKnown(principal.transport, new Set(Object.values(ApiTransport)), "apiPrincipal.transport");
  if (typeof principal.principalId !== "string" || principal.principalId.trim() === "") {
    fail("apiPrincipal.principalId must be non-empty");
  }
}

function bindingCapabilitySet<T extends string>(values: readonly T[], supported: ReadonlySet<string>, field: string): void {
  validateCapabilityArray(values, supported, field);
}

/** Validate identity, authenticated transport linkage, and authority capabilities. */
export function validateAgentBinding(binding: AgentBinding, policy: MandatePolicy, now?: bigint): void {
  validateMandatePolicy(policy);
  assertHex(binding.bindingId, "bindingId", BYTE_LENGTHS.id);
  assertHex(binding.agentId, "agentId", BYTE_LENGTHS.id);
  assertHex(binding.circuitId, "circuitId", BYTE_LENGTHS.id);
  validateApiPrincipal(binding.apiPrincipal);
  if (binding.forecastAddress !== undefined) assertAddress(binding.forecastAddress, "forecastAddress");
  if (binding.executorAddress !== undefined) assertAddress(binding.executorAddress, "executorAddress");
  bindingCapabilitySet(binding.readCapabilities, READ_VALUES, "readCapabilities");
  bindingCapabilitySet(binding.forecastCapabilities, FORECAST_VALUES, "forecastCapabilities");
  bindingCapabilitySet(binding.executeCapabilities, EXECUTE_VALUES, "executeCapabilities");
  assertBigInt(binding.issued, "issued");
  assertBigInt(binding.expires, "expires");
  if (binding.issued >= binding.expires) fail("binding.issued must be before binding.expires");
  if (binding.issued < policy.temporalAuthority.issuedAt) fail("binding is issued before the mandate");
  if (binding.expires > policy.temporalAuthority.expiresAt) fail("binding expires after the mandate");
  assertHex(binding.mandateId, "binding.mandateId", BYTE_LENGTHS.id);
  assertHex(binding.policyHash, "binding.policyHash", BYTE_LENGTHS.id);
  if (!sameId(binding.mandateId, policy.mandateId)) fail("binding mandateId does not match policy");
  if (!sameId(binding.policyHash, mandatePolicyHash(policy))) fail("binding policy hash does not match canonical policy");

  const principal = principalFor(policy, binding.agentId);
  if (!principal) fail("binding agentId is not in the mandate principal roster");
  if (!binding.forecastCapabilities.every((capability) => policy.forecastAuthority.capabilities.includes(capability))) {
    fail("binding forecast capabilities exceed forecast authority");
  }
  if (!binding.executeCapabilities.every((capability) => policy.executionAuthority.capabilities.includes(capability))) {
    fail("binding execute capabilities exceed execution authority");
  }
  if (binding.forecastCapabilities.length > 0) {
    if (!policy.forecastAuthority.agentIds.some((agentId) => sameId(agentId, binding.agentId))) fail("agent is not forecast-authorized");
    if (binding.forecastAddress === undefined) fail("Forecast capability requires a forecast signer address");
  }
  if (binding.executeCapabilities.length > 0) {
    if (!policy.executionAuthority.agentIds.some((agentId) => sameId(agentId, binding.agentId))) fail("agent is not execution-authorized");
    if (binding.executorAddress === undefined) fail("execute capability requires an executor address");
  }
  if (principal.forecastAddress !== undefined && binding.forecastAddress !== undefined && !sameAddress(principal.forecastAddress, binding.forecastAddress)) {
    fail("binding forecast address does not match agent principal");
  }
  if (principal.executorAddress !== undefined && binding.executorAddress !== undefined && !sameAddress(principal.executorAddress, binding.executorAddress)) {
    fail("binding executor address does not match agent principal");
  }
  if (now !== undefined) {
    assertBigInt(now, "now");
    if (now < binding.issued || now >= binding.expires) fail("binding is not active at now");
  }
}

export const validateAgentBindingPolicyLinkage = validateAgentBinding;
export const assertAgentBindingPolicyLinkage = validateAgentBinding;

function validateReference(reference: MarketReference): void {
  assertBpsValue(reference.referenceUpBps, "reference.referenceUpBps");
  if (reference.bestAskUpBps !== undefined) assertBpsValue(reference.bestAskUpBps, "reference.bestAskUpBps");
  if (reference.bestAskDownBps !== undefined) assertBpsValue(reference.bestAskDownBps, "reference.bestAskDownBps");
  if (typeof reference.referenceValid !== "boolean") fail("reference.referenceValid must be boolean");
}

function requestIsInScope(request: ForecastRequest, policy: MandatePolicy): void {
  if (!policy.marketScope.assets.includes(request.asset)) fail("ForecastRequest asset is outside mandate scope");
  if (!policy.marketScope.intervalsSec.includes(request.intervalSec)) fail("ForecastRequest interval is outside mandate scope");
  if (policy.marketScope.marketIds.length > 0 && !policy.marketScope.marketIds.some((marketId) => sameId(marketId, request.marketId))) {
    fail("ForecastRequest marketId is outside mandate scope");
  }
}

export function validateForecastRequest(request: ForecastRequest, policy: MandatePolicy, _now?: bigint): void {
  validateMandatePolicy(policy);
  if (request.forecastId !== undefined) assertHex(request.forecastId, "forecastId", BYTE_LENGTHS.id);
  assertHex(request.circuitId, "circuitId", BYTE_LENGTHS.id);
  assertHex(request.marketId, "marketId", BYTE_LENGTHS.id);
  assertKnown(request.asset, ASSET_VALUES, "asset");
  assertInteger(request.intervalSec, "intervalSec", 1);
  assertBigInt(request.opensAt, "opensAt");
  assertBigInt(request.expiresAt, "expiresAt");
  if (request.expiresAt <= request.opensAt) fail("ForecastRequest expiresAt must be after opensAt");
  if (request.opensAt < policy.temporalAuthority.startsAt) fail("ForecastRequest opens before mandate authority");
  if (request.expiresAt > policy.temporalAuthority.expiresAt) fail("ForecastRequest expires after mandate authority");
  if (request.forecastDeadline !== undefined) {
    assertBigInt(request.forecastDeadline, "forecastDeadline");
    if (request.forecastDeadline < request.opensAt || request.forecastDeadline > request.expiresAt) {
      fail("forecastDeadline must be within the market window");
    }
  }
  if (request.reference !== undefined) validateReference(request.reference);
  requestIsInScope(request, policy);
}

function hasForbiddenForecastField(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const forbidden = ["chainOfThought", "chain_of_thought", "reasoning", "rationale", "prompt"];
  return forbidden.find((field) => Object.prototype.hasOwnProperty.call(value, field));
}

/** Validate an attributable signed probability, never a model explanation. */
export function validateForecastSubmission(
  submission: ForecastSubmission,
  request: ForecastRequest,
  policy: MandatePolicy,
  binding?: AgentBinding,
  now?: bigint,
): void {
  validateForecastRequest(request, policy, now);
  const forbiddenField = hasForbiddenForecastField(submission);
  if (forbiddenField) fail(`ForecastSubmission cannot contain ${forbiddenField}`);
  assertHex(submission.marketId, "submission.marketId", BYTE_LENGTHS.id);
  assertHex(submission.forecaster, "submission.forecaster", BYTE_LENGTHS.id);
  assertAddress(submission.forecasterAddress, "submission.forecasterAddress");
  assertBpsValue(submission.probabilityUpBps, "submission.probabilityUpBps");
  assertBigInt(submission.generatedAt, "submission.generatedAt");
  assertBigInt(submission.validUntil, "submission.validUntil");
  assertKnown(submission.sourceType, SOURCE_VALUES, "submission.sourceType");
  if (typeof submission.sourceVersion !== "string" || submission.sourceVersion.trim() === "") fail("submission.sourceVersion must be non-empty");
  assertHex(submission.signature, "submission.signature");
  if (!sameId(submission.marketId, request.marketId)) fail("ForecastSubmission marketId does not match request");
  if (submission.generatedAt < request.opensAt) fail("ForecastSubmission generated before market opens");
  if (submission.generatedAt >= request.expiresAt) fail("ForecastSubmission generated after market expiry");
  if (submission.validUntil <= submission.generatedAt || submission.validUntil > request.expiresAt) fail("ForecastSubmission validity window is invalid");
  if (request.forecastDeadline !== undefined && submission.generatedAt > request.forecastDeadline) fail("ForecastSubmission misses the forecast deadline");
  if (effectiveMandateLifecycle(policy, submission.generatedAt) !== MandateLifecycle.ACTIVE) fail("ForecastSubmission requires active mandate lifecycle");
  if (!policy.forecastAuthority.agentIds.some((agentId) => sameId(agentId, submission.forecaster))) fail("forecaster is not authorized by mandate");
  const principal = principalFor(policy, submission.forecaster);
  if (!principal) fail("forecaster principal is missing");
  if (principal.sourceType !== submission.sourceType) fail("submission sourceType does not match agent principal");
  if (principal.forecastAddress !== undefined && !sameAddress(principal.forecastAddress, submission.forecasterAddress)) {
    fail("submission address does not match agent principal");
  }
  if (binding !== undefined) {
    validateAgentBinding(binding, policy, now ?? submission.generatedAt);
    if (!sameId(binding.circuitId, request.circuitId)) fail("Forecast binding circuitId does not match request");
    if (!sameId(binding.agentId, submission.forecaster)) fail("Forecast binding agentId does not match submission");
    if (!binding.forecastCapabilities.includes(ForecastCapability.SUBMIT_FORECAST)) fail("binding lacks submitForecast capability");
    if (binding.forecastAddress !== undefined && !sameAddress(binding.forecastAddress, submission.forecasterAddress)) {
      fail("submission address does not match binding");
    }
  }
}

export function iterationIdentity(circuitId: Hex, marketId: Hex): IterationId {
  assertHex(circuitId, "circuitId", BYTE_LENGTHS.id);
  assertHex(marketId, "marketId", BYTE_LENGTHS.id);
  return keccak256(encodePacked(["bytes32", "bytes32"], [circuitId, marketId]));
}

export function forecastRequestIdentity(request: ForecastRequest): ForecastId {
  if (request.forecastId !== undefined) assertHex(request.forecastId, "forecastId", BYTE_LENGTHS.id);
  assertHex(request.circuitId, "circuitId", BYTE_LENGTHS.id);
  assertHex(request.marketId, "marketId", BYTE_LENGTHS.id);
  assertKnown(request.asset, ASSET_VALUES, "asset");
  assertInteger(request.intervalSec, "intervalSec", 1);
  assertBigInt(request.opensAt, "opensAt");
  assertBigInt(request.expiresAt, "expiresAt");
  if (request.expiresAt <= request.opensAt) fail("ForecastRequest expiresAt must be after opensAt");
  if (request.forecastId !== undefined) return request.forecastId;
  return keccak256(encodePacked(["string", "bytes32", "bytes32"], ["PRIOR_FORECAST", request.circuitId, request.marketId]));
}

/** Validate policy linkage, current lifecycle, exact fixed-point spend, and expiry. */
export function validateAuthorizedAction(action: AuthorizedAction, context: AuthorizedActionValidationContext): void;
export function validateAuthorizedAction(args: AuthorizedActionValidationArgs): void;
export function validateAuthorizedAction(
  first: AuthorizedAction | AuthorizedActionValidationArgs,
  second?: AuthorizedActionValidationContext,
): void {
  const isArgumentObject = typeof first === "object" && first !== null && "policy" in first;
  const action = isArgumentObject ? (first as AuthorizedActionValidationArgs).action : (first as AuthorizedAction);
  const context = isArgumentObject ? (first as AuthorizedActionValidationArgs) : second;
  if (!context) fail("AuthorizedAction validation context is required");
  const { policy } = context;
  validateMandatePolicy(policy);
  assertHex(action.actionId, "actionId", BYTE_LENGTHS.id);
  assertHex(action.circuitId, "circuitId", BYTE_LENGTHS.id);
  assertHex(action.marketId, "marketId", BYTE_LENGTHS.id);
  assertHex(action.executionId, "executionId", BYTE_LENGTHS.id);
  assertHex(action.executorAgentId, "executorAgentId", BYTE_LENGTHS.id);
  assertKnown(action.action, ACTION_VALUES, "action");
  assertBigInt(action.maxPriceRaw, "maxPriceRaw");
  assertBigInt(action.quantityRaw, "quantityRaw");
  assertBigInt(action.maximumSpendRaw, "maximumSpendRaw");
  assertBigInt(action.validAfter, "validAfter");
  assertBigInt(action.expiresAt, "expiresAt");
  assertHex(action.policyHash, "policyHash", BYTE_LENGTHS.id);
  if (action.maxPriceRaw <= 0n || action.quantityRaw <= 0n) fail("AuthorizedAction price and quantity must be positive");
  if (action.validAfter >= action.expiresAt) fail("AuthorizedAction validAfter must be before expiresAt");
  if (!sameId(action.policyHash, mandatePolicyHash(policy))) fail("AuthorizedAction policy hash does not match policy");
  if (context.expectedCircuitId !== undefined && !sameId(context.expectedCircuitId, action.circuitId)) fail("AuthorizedAction circuitId does not match expected circuit");
  if (context.binding !== undefined) {
    validateAgentBinding(context.binding, policy, context.now);
    if (!sameId(context.binding.circuitId, action.circuitId)) fail("AuthorizedAction circuitId does not match binding");
    if (!sameId(context.binding.agentId, action.executorAgentId)) fail("AuthorizedAction executorAgentId does not match binding");
    if (!context.binding.executeCapabilities.includes(ExecuteCapability.EXECUTE_AUTHORIZED_ACTION)) {
      fail("binding lacks executeAuthorizedAction capability");
    }
    if (context.binding.executorAddress === undefined) fail("execute capability requires an executor address");
  }
  if (!policy.executionAuthority.agentIds.some((agentId) => sameId(agentId, action.executorAgentId))) fail("executor is not authorized by mandate");
  if (!policy.executionAuthority.allowedActions.includes(action.action)) fail("action is not allowed by mandate");
  if (policy.marketScope.marketIds.length > 0 && !policy.marketScope.marketIds.some((marketId) => sameId(marketId, action.marketId))) {
    fail("AuthorizedAction marketId is outside mandate scope");
  }
  if (action.validAfter < policy.temporalAuthority.startsAt) fail("AuthorizedAction is before mandate start");
  if (action.expiresAt > policy.temporalAuthority.expiresAt) fail("AuthorizedAction expires after mandate");
  const maxActionLifetime = policy.executionAuthority.maxActionLifetimeSec;
  if (maxActionLifetime !== undefined && action.expiresAt - action.validAfter > BigInt(maxActionLifetime)) {
    fail("AuthorizedAction lifetime exceeds mandate limit");
  }
  const now = context.now ?? action.validAfter;
  assertBigInt(now, "now");
  if (now >= action.expiresAt) fail("AuthorizedAction is expired");
  if (effectiveMandateLifecycle(policy, now) !== MandateLifecycle.ACTIVE) fail("AuthorizedAction requires active mandate lifecycle");

  const unitScaleRaw = asUnitScaleRaw(context.unitScaleRaw);
  const maxPriceRaw = asPriceRaw(action.maxPriceRaw);
  const quantityRaw = asQuantityRaw(action.quantityRaw);
  const expectedMaximumSpend = maxCollateralSpendRaw(maxPriceRaw, quantityRaw, unitScaleRaw);
  if (action.maximumSpendRaw !== expectedMaximumSpend) fail("maximumSpendRaw does not match fixed-point price and quantity");
  if (action.maximumSpendRaw > policy.capitalAuthority.maxPerMarketRaw) fail("AuthorizedAction exceeds maxPerMarketRaw");
  const reservedSpend = context.reservedSpendRaw ?? 0n;
  assertBigInt(reservedSpend, "reservedSpendRaw");
  if (reservedSpend + action.maximumSpendRaw > policy.capitalAuthority.totalBudgetRaw) fail("AuthorizedAction exceeds totalBudgetRaw");
  if (context.realizedLossRaw !== undefined) {
    assertBigInt(context.realizedLossRaw, "realizedLossRaw");
    if (context.realizedLossRaw > policy.capitalAuthority.stopLossRaw) fail("realized loss exceeds stopLossRaw");
  }
}

export const assertAuthorizedAction = validateAuthorizedAction;

export function createAuthorizedAction(action: AuthorizedAction, context: AuthorizedActionValidationContext): AuthorizedAction {
  validateAuthorizedAction(action, context);
  return freezeAuthorizedAction(action);
}

export function canonicalizeAuthorizedAction(action: AuthorizedAction): string {
  return canonicalize({
    actionId: action.actionId,
    circuitId: action.circuitId,
    marketId: action.marketId,
    executionId: action.executionId,
    executorAgentId: action.executorAgentId,
    action: action.action,
    maxPriceRaw: action.maxPriceRaw,
    quantityRaw: action.quantityRaw,
    maximumSpendRaw: action.maximumSpendRaw,
    validAfter: action.validAfter,
    expiresAt: action.expiresAt,
    policyHash: action.policyHash,
  });
}

export function assertAuthorizedActionImmutable(previous: AuthorizedAction, next: AuthorizedAction): void {
  for (const field of ACTION_FIELDS) {
    if (previous[field] !== next[field]) fail(`AuthorizedAction mutation: ${String(field)}`);
  }
}

export function freezeAuthorizedAction(action: AuthorizedAction): AuthorizedAction {
  return Object.freeze({ ...action });
}

/** In-memory idempotency primitive for a future executeAuthorizedAction adapter. */
export class AuthorizedActionLedger {
  private readonly actions = new Map<string, string>();
  private readonly effects = new Set<string>();

  reserve(action: AuthorizedAction): void {
    const key = idKey(action.actionId);
    if (this.actions.has(key)) fail(`duplicate actionId: ${action.actionId}`);
    this.actions.set(key, canonicalizeAuthorizedAction(action));
  }

  markEffect(actionId: Hex): void {
    const key = idKey(actionId);
    if (!this.actions.has(key)) fail(`actionId was not reserved: ${actionId}`);
    if (this.effects.has(key)) fail(`duplicate actionId effect: ${actionId}`);
    this.effects.add(key);
  }

  recordEffect(action: AuthorizedAction): void {
    this.reserve(action);
    this.markEffect(action.actionId);
  }

  hasAction(actionId: Hex): boolean {
    return this.actions.has(idKey(actionId));
  }

  hasEffect(actionId: Hex): boolean {
    return this.effects.has(idKey(actionId));
  }
}

export const ActionLedger = AuthorizedActionLedger;

export function formatMandatePolicy(policy: MandatePolicy, options: { collateralDecimals?: number; now?: bigint } = {}): string {
  validateMandatePolicy(policy);
  const decimals = options.collateralDecimals ?? 6;
  if (!Number.isInteger(decimals) || decimals < 0) fail("collateralDecimals must be a non-negative integer");
  const names = new Map<string, AgentPrincipal>();
  for (const principal of [...policy.forecasters, ...policy.executors]) names.set(idKey(principal.agentId), principal);
  const agentLines = [...names.values()].sort(comparePrincipal).map((principal) => {
    const capabilities: string[] = [];
    if (policy.forecastAuthority.agentIds.some((agentId) => sameId(agentId, principal.agentId))) capabilities.push("Forecast");
    if (policy.executionAuthority.agentIds.some((agentId) => sameId(agentId, principal.agentId))) capabilities.push("execute");
    return `agent: ${principal.displayName} [${principal.sourceType}] capabilities: ${capabilities.join(", ") || "none"}`;
  });
  const intervals = policy.marketScope.intervalsSec.map(formatInterval).join(", ");
  const nowLine = options.now === undefined ? "" : `\nstateAt=${options.now.toString()} effectiveLifecycle=${effectiveMandateLifecycle(policy, options.now)}`;
  return [
    `Mandate ${policy.mandateId}`,
    `owner: ${policy.owner} (owner may revoke)`,
    `lifecycle: ${policy.lifecycle}${nowLine}`,
    ...agentLines,
    `scope: ${policy.marketScope.venue} ${policy.marketScope.assets.join(", ")} ${intervals} marketClass=${formatMarketClass(policy.marketScope.marketClass)}`,
    `rule: minimum Forecast margin ${formatPoints(policy.executionAuthority.minMarginBps)} points`,
    `capital: ${formatCurrency(policy.capitalAuthority.maxPerMarketRaw, decimals)}/market, ${formatCurrency(policy.capitalAuthority.totalBudgetRaw, decimals)} total, stop-loss ${formatCurrency(policy.capitalAuthority.stopLossRaw, decimals)}`,
    `temporal: issuedAt=${policy.temporalAuthority.issuedAt.toString()} startsAt=${policy.temporalAuthority.startsAt.toString()} expiresAt=${policy.temporalAuthority.expiresAt.toString()}`,
  ].join("\n");
}

export const formatMandate = formatMandatePolicy;

function formatInterval(seconds: number): string {
  if (seconds % 3600 === 0) return `${seconds / 3600}h`;
  if (seconds % 60 === 0) return `${seconds / 60}m`;
  return `${seconds}s`;
}

function formatMarketClass(marketClass: MandateMarketClass): string {
  if (typeof marketClass === "string") return marketClass;
  const labels: Record<number, string> = {
    [MarketClass.BTC_15M]: "BTC_15M",
    [MarketClass.BTC_1H]: "BTC_1H",
    [MarketClass.ETH_15M]: "ETH_15M",
    [MarketClass.ETH_1H]: "ETH_1H",
  };
  return labels[marketClass] ?? `class-${marketClass}`;
}

function formatPoints(bps: number): string {
  const whole = Math.floor(bps / 100);
  const fraction = bps % 100;
  if (fraction === 0) return whole.toString();
  return `${whole}.${fraction.toString().padStart(2, "0")}`.replace(/0+$/, "").replace(/\.$/, "");
}

function formatCurrency(value: CollateralRaw, decimals: number): string {
  const formatted = formatUnits(value, decimals);
  const trimmed = formatted.includes(".") ? formatted.replace(/0+$/, "").replace(/\.$/, "") : formatted;
  return `$${trimmed}`;
}

function canonicalize(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "bigint") return JSON.stringify(value.toString(10));
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const entries = Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort(compareStrings)
      .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`);
    return `{${entries.join(",")}}`;
  }
  fail("unsupported value in canonicalization");
}

// Keep the fixed-point brands visible to consumers of this module without
// introducing a second arithmetic implementation.
export type { Address, AgentId, BindingId, CollateralRaw, PriceRaw, QuantityRaw, UnitScaleRaw };
