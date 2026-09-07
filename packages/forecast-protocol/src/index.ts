import { keccak256, stringToHex, type Address, type Hex } from "viem";

export const FORECAST_PROTOCOL_VERSION = "1" as const;
export type ForecastProtocolVersion = typeof FORECAST_PROTOCOL_VERSION;

export const SIGNATURE_SCHEME = "FIXTURE_KECCAK_V1" as const;
export const EIP712_SIGNATURE_SCHEME = "EIP712_V2" as const;
export type SignatureScheme = typeof SIGNATURE_SCHEME | typeof EIP712_SIGNATURE_SCHEME;

export const RFT_REGISTRY_V1_ADDRESS = "0x5b1B51cB062B7B782c9EC2Bd5674eFAdb5308F41" as Address;
export const EIP712_PRIMARY_TYPE = "ForecastSubmission" as const;
export const EIP712_DOMAIN = {
  name: "PRIOR Forecast",
  version: "2",
  chainId: 50312,
  verifyingContract: RFT_REGISTRY_V1_ADDRESS,
} as const;
export const EIP712_FORECAST_SUBMISSION_TYPES = {
  ForecastSubmission: [
    { name: "protocolVersion", type: "string" },
    { name: "requestId", type: "bytes32" },
    { name: "marketId", type: "bytes32" },
    { name: "circuitId", type: "bytes32" },
    { name: "forecaster", type: "bytes32" },
    { name: "forecasterAddress", type: "address" },
    { name: "probabilityUpBps", type: "uint16" },
    { name: "generatedAt", type: "uint64" },
    { name: "validUntil", type: "uint64" },
    { name: "nonce", type: "bytes32" },
    { name: "sourceType", type: "string" },
    { name: "sourceVersion", type: "string" },
  ],
} as const;

export type SignatureVerification =
  | "FIXTURE_RECOMPUTED_NOT_PRODUCTION_CRYPTOGRAPHIC_VERIFICATION"
  | "EIP712_RECOVERED_PRODUCTION_CRYPTOGRAPHIC_VERIFICATION";

export type WireHex = Hex;
export type WireAddress = Address;
export type WireAsset = "BTC" | "ETH";
export type WireSourceType = "HUMAN" | "AGENT" | "MODEL" | "SERVICE";
export type WireTransport = "API" | "HTTP" | "MCP" | "SDK";

export interface WireProviderIdentity {
  readonly providerId: WireHex;
  readonly displayName: string;
  readonly source: string;
  readonly sourceVersion: string;
}

export interface WireMarketReference {
  readonly referenceUpBps: number;
  readonly referenceValid: boolean;
  readonly bestAskUpBps?: number;
  readonly bestAskDownBps?: number;
}

/** JSON transport form. Unix timestamps are decimal strings, never JSON numbers. */
export interface ForecastRequestWire {
  readonly protocolVersion: ForecastProtocolVersion;
  readonly requestId: WireHex;
  readonly provider: WireProviderIdentity;
  readonly sessionId: string;
  readonly circuitId: WireHex;
  readonly marketId: WireHex;
  readonly asset: WireAsset;
  readonly intervalSec: number;
  readonly opensAt: string;
  readonly expiresAt: string;
  readonly forecastDeadline: string | null;
  readonly reference: WireMarketReference | null;
  readonly forecaster: WireHex;
  readonly forecasterAddress: WireAddress;
  readonly nonce: WireHex;
}

export interface ForecastSubmissionWire {
  readonly protocolVersion: ForecastProtocolVersion;
  readonly requestId: WireHex;
  readonly provider: WireProviderIdentity;
  readonly sessionId: string;
  readonly circuitId: WireHex;
  readonly marketId: WireHex;
  readonly forecaster: WireHex;
  readonly forecasterAddress: WireAddress;
  readonly probabilityUpBps: number;
  readonly generatedAt: string;
  readonly validUntil: string;
  readonly nonce: WireHex;
  readonly sourceType: WireSourceType;
  readonly sourceVersion: string;
  readonly signatureScheme: SignatureScheme;
  readonly signature: WireHex;
}

export interface WireTransportPrincipal {
  readonly transport: WireTransport;
  readonly principalId: string;
}

export interface ForecastSubmissionAcceptedWire {
  readonly protocolVersion: ForecastProtocolVersion;
  readonly status: "ACCEPTED";
  readonly requestId: WireHex;
  readonly provider: WireProviderIdentity;
  readonly sessionId: string;
  readonly submissionId: WireHex;
  readonly idempotencyKey: WireHex;
  readonly circuitId: WireHex;
  readonly marketId: WireHex;
  readonly forecaster: WireHex;
  readonly forecasterAddress: WireAddress;
  readonly probabilityUpBps: number;
  readonly generatedAt: string;
  readonly validUntil: string;
  readonly submittedAt: string;
  readonly chainCommitment: "NOT_SUBMITTED";
  readonly signatureScheme: SignatureScheme;
  readonly signatureVerification: SignatureVerification;
  readonly transportPrincipal: WireTransportPrincipal;
}

export interface UnauthorizedExecutionResponseWire {
  readonly protocolVersion: ForecastProtocolVersion;
  readonly status: "REJECTED_AUTHORITY";
  readonly reasonCode: "REJECTED_AUTHORITY";
  readonly executionAuthority: false;
  readonly requestId: WireHex;
  readonly marketId: WireHex;
  readonly message: string;
}

export interface ForecastSignMaterial {
  readonly protocolVersion: ForecastProtocolVersion;
  readonly marketId: WireHex;
  readonly circuitId: WireHex;
  readonly forecaster: WireHex;
  readonly probabilityUpBps: number;
  readonly generatedAt: string;
  readonly validUntil: string;
  readonly nonce: WireHex;
}

export interface ForecastSubmissionSignMaterial {
  readonly protocolVersion: ForecastProtocolVersion;
  readonly requestId: WireHex;
  readonly marketId: WireHex;
  readonly circuitId: WireHex;
  readonly forecaster: WireHex;
  readonly forecasterAddress: WireAddress;
  readonly probabilityUpBps: number;
  readonly generatedAt: string;
  readonly validUntil: string;
  readonly nonce: WireHex;
  readonly sourceType: WireSourceType;
  readonly sourceVersion: string;
}

export interface FixtureProviderProfile {
  readonly key: "A" | "B";
  readonly provider: WireProviderIdentity;
  readonly sessionId: string;
  readonly forecaster: WireHex;
  readonly forecasterAddress: WireAddress;
  readonly nonce: WireHex;
  readonly probabilityUpBps: number;
  readonly sourceType: WireSourceType;
  readonly sourceVersion: string;
}

export const FIXTURE_CIRCUIT_ID = `0x${"c".repeat(64)}` as Hex;
export const FIXTURE_MARKET_ID = `0x${"3".repeat(64)}` as Hex;

export const FIXTURE_PROVIDER_A: FixtureProviderProfile = Object.freeze({
  key: "A",
  provider: Object.freeze({
    providerId: `0x${"a".repeat(64)}` as Hex,
    displayName: "Fixture Provider A",
    source: "INTEGRATION_FIXTURE",
    sourceVersion: "provider-a/v1",
  }),
  sessionId: "fixture-session-a-v1",
  forecaster: `0x${"1".repeat(64)}` as Hex,
  forecasterAddress: `0x${"11".repeat(20)}` as Address,
  nonce: `0x${"a1".repeat(32)}` as Hex,
  probabilityUpBps: 6_200,
  sourceType: "AGENT",
  sourceVersion: "INTEGRATION_FIXTURE/v1",
});

export const FIXTURE_PROVIDER_B: FixtureProviderProfile = Object.freeze({
  key: "B",
  provider: Object.freeze({
    providerId: `0x${"b".repeat(64)}` as Hex,
    displayName: "Fixture Provider B",
    source: "INTEGRATION_FIXTURE",
    sourceVersion: "provider-b/v1",
  }),
  sessionId: "fixture-session-b-v1",
  forecaster: `0x${"2".repeat(64)}` as Hex,
  forecasterAddress: `0x${"22".repeat(20)}` as Address,
  nonce: `0x${"b1".repeat(32)}` as Hex,
  probabilityUpBps: 3_800,
  sourceType: "AGENT",
  sourceVersion: "INTEGRATION_FIXTURE/v1",
});

export class WireProtocolError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  public constructor(code: string, message: string, statusCode = 422) {
    super(message);
    this.name = "WireProtocolError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

function fail(code: string, message: string, statusCode = 422): never {
  throw new WireProtocolError(code, message, statusCode);
}

function record(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail("INVALID_WIRE", `${field} must be an object`);
  }
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[], field: string): void {
  const allowed = new Set(expected);
  const actual = Object.keys(value);
  const unknown = actual.find((key) => !allowed.has(key));
  if (unknown !== undefined) fail("INVALID_WIRE", `${field} contains unknown field ${unknown}`);
  for (const key of expected) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) fail("INVALID_WIRE", `${field}.${key} is required`);
  }
}

function exactKeysWithOptional(
  value: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[],
  field: string,
): void {
  const allowed = new Set([...required, ...optional]);
  const unknown = Object.keys(value).find((key) => !allowed.has(key));
  if (unknown !== undefined) fail("INVALID_WIRE", `${field} contains unknown field ${unknown}`);
  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) fail("INVALID_WIRE", `${field}.${key} is required`);
  }
}

function stringField(value: unknown, field: string, nonEmpty = true): string {
  if (typeof value !== "string" || (nonEmpty && value.trim() === "")) {
    fail("INVALID_WIRE", `${field} must be a${nonEmpty ? " non-empty" : "n"} string`);
  }
  return value;
}

function integerField(value: unknown, field: string, minimum?: number, maximum?: number): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) fail("INVALID_WIRE", `${field} must be an integer`);
  if (minimum !== undefined && value < minimum) fail("INVALID_WIRE", `${field} must be >= ${minimum}`);
  if (maximum !== undefined && value > maximum) fail("INVALID_WIRE", `${field} must be <= ${maximum}`);
  return value;
}

function booleanField(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") fail("INVALID_WIRE", `${field} must be boolean`);
  return value;
}

function hexField(value: unknown, field: string, bytes?: number): Hex {
  if (typeof value !== "string" || !/^0x[0-9a-fA-F]*$/.test(value) || (value.length - 2) % 2 !== 0) {
    fail("INVALID_WIRE", `${field} must be hexadecimal`);
  }
  if (bytes !== undefined && value.length !== 2 + bytes * 2) {
    fail("INVALID_WIRE", `${field} must be ${bytes} bytes`);
  }
  return value as Hex;
}

function addressField(value: unknown, field: string): Address {
  return hexField(value, field, 20) as Address;
}

function timestampField(value: unknown, field: string): string {
  const timestamp = stringField(value, field);
  if (!/^(0|[1-9][0-9]*)$/.test(timestamp)) fail("INVALID_WIRE", `${field} must be a decimal timestamp string`);
  return timestamp;
}

function uint64TimestampField(value: unknown, field: string): bigint {
  const timestamp = BigInt(timestampField(value, field));
  if (timestamp > (1n << 64n) - 1n) fail("INVALID_WIRE", `${field} exceeds uint64`);
  return timestamp;
}

function protocolVersionField(value: unknown, field: string): ForecastProtocolVersion {
  if (value !== FORECAST_PROTOCOL_VERSION) fail("UNSUPPORTED_PROTOCOL_VERSION", `${field} must be protocol v1`, 400);
  return FORECAST_PROTOCOL_VERSION;
}

function bpsField(value: unknown, field: string): number {
  return integerField(value, field, 0, 10_000);
}

function assetField(value: unknown, field: string): WireAsset {
  if (value !== "BTC" && value !== "ETH") fail("INVALID_WIRE", `${field} must be BTC or ETH`);
  return value;
}

function sourceTypeField(value: unknown, field: string): WireSourceType {
  if (value !== "HUMAN" && value !== "AGENT" && value !== "MODEL" && value !== "SERVICE") {
    fail("INVALID_WIRE", `${field} is not a supported source type`);
  }
  return value;
}

function providerIdentity(value: unknown, field: string): WireProviderIdentity {
  const object = record(value, field);
  exactKeys(object, ["providerId", "displayName", "source", "sourceVersion"], field);
  return Object.freeze({
    providerId: hexField(object.providerId, `${field}.providerId`, 32),
    displayName: stringField(object.displayName, `${field}.displayName`),
    source: stringField(object.source, `${field}.source`),
    sourceVersion: stringField(object.sourceVersion, `${field}.sourceVersion`),
  });
}

function reference(value: unknown, field: string): WireMarketReference | null {
  if (value === null) return null;
  const object = record(value, field);
  exactKeysWithOptional(object, ["referenceUpBps", "referenceValid"], ["bestAskUpBps", "bestAskDownBps"], field);
  return Object.freeze({
    referenceUpBps: bpsField(object.referenceUpBps, `${field}.referenceUpBps`),
    referenceValid: booleanField(object.referenceValid, `${field}.referenceValid`),
    ...(object.bestAskUpBps === undefined ? {} : { bestAskUpBps: bpsField(object.bestAskUpBps, `${field}.bestAskUpBps`) }),
    ...(object.bestAskDownBps === undefined ? {} : { bestAskDownBps: bpsField(object.bestAskDownBps, `${field}.bestAskDownBps`) }),
  });
}

function transportPrincipal(value: unknown, field: string): WireTransportPrincipal {
  const object = record(value, field);
  exactKeys(object, ["transport", "principalId"], field);
  if (object.transport !== "API" && object.transport !== "HTTP" && object.transport !== "MCP" && object.transport !== "SDK") {
    fail("INVALID_WIRE", `${field}.transport is unsupported`);
  }
  return Object.freeze({
    transport: object.transport,
    principalId: stringField(object.principalId, `${field}.principalId`),
  });
}

function compareHex(left: string, right: string): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

function canonicalize(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (typeof value === "object") {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object)
      .filter((key) => object[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalize(object[key])}`)
      .join(",")}}`;
  }
  fail("INVALID_WIRE", "unsupported value in canonical JSON");
}

export function canonicalJson(value: unknown): string {
  return canonicalize(value);
}

export interface ForecastRequestIdentityInput {
  readonly protocolVersion: ForecastProtocolVersion;
  readonly circuitId: WireHex;
  readonly marketId: WireHex;
  readonly providerId: WireHex;
  readonly sessionId: string;
  readonly nonce: WireHex;
}

export function forecastRequestIdFor(input: ForecastRequestIdentityInput): WireHex {
  protocolVersionField(input.protocolVersion, "protocolVersion");
  const circuitId = hexField(input.circuitId, "circuitId", 32);
  const marketId = hexField(input.marketId, "marketId", 32);
  const providerId = hexField(input.providerId, "providerId", 32);
  const sessionId = stringField(input.sessionId, "sessionId");
  const nonce = hexField(input.nonce, "nonce", 32);
  return keccak256(
    stringToHex(
      canonicalize({
        domain: "PRIOR_FORECAST_REQUEST",
        protocolVersion: FORECAST_PROTOCOL_VERSION,
        circuitId,
        marketId,
        providerId,
        sessionId,
        nonce,
      }),
    ),
  );
}

export function canonicalSignMaterial(material: ForecastSignMaterial): string {
  protocolVersionField(material.protocolVersion, "signMaterial.protocolVersion");
  const marketId = hexField(material.marketId, "signMaterial.marketId", 32);
  const circuitId = hexField(material.circuitId, "signMaterial.circuitId", 32);
  const forecaster = hexField(material.forecaster, "signMaterial.forecaster", 32);
  const probabilityUpBps = bpsField(material.probabilityUpBps, "signMaterial.probabilityUpBps");
  const generatedAt = timestampField(material.generatedAt, "signMaterial.generatedAt");
  const validUntil = timestampField(material.validUntil, "signMaterial.validUntil");
  const nonce = hexField(material.nonce, "signMaterial.nonce", 32);
  return canonicalize({
    protocolVersion: FORECAST_PROTOCOL_VERSION,
    marketId,
    circuitId,
    forecaster,
    probabilityUpBps,
    generatedAt,
    validUntil,
    nonce,
  });
}

export type Eip712ForecastSubmissionMessage = {
  readonly protocolVersion: ForecastProtocolVersion;
  readonly requestId: WireHex;
  readonly marketId: WireHex;
  readonly circuitId: WireHex;
  readonly forecaster: WireHex;
  readonly forecasterAddress: WireAddress;
  readonly probabilityUpBps: number;
  readonly generatedAt: bigint;
  readonly validUntil: bigint;
  readonly nonce: WireHex;
  readonly sourceType: WireSourceType;
  readonly sourceVersion: string;
};

export function eip712TypedDataForSubmission(material: ForecastSubmissionSignMaterial) {
  const message: Eip712ForecastSubmissionMessage = {
    protocolVersion: protocolVersionField(material.protocolVersion, "submission.protocolVersion"),
    requestId: hexField(material.requestId, "submission.requestId", 32),
    marketId: hexField(material.marketId, "submission.marketId", 32),
    circuitId: hexField(material.circuitId, "submission.circuitId", 32),
    forecaster: hexField(material.forecaster, "submission.forecaster", 32),
    forecasterAddress: addressField(material.forecasterAddress, "submission.forecasterAddress"),
    probabilityUpBps: bpsField(material.probabilityUpBps, "submission.probabilityUpBps"),
    generatedAt: uint64TimestampField(material.generatedAt, "submission.generatedAt"),
    validUntil: uint64TimestampField(material.validUntil, "submission.validUntil"),
    nonce: hexField(material.nonce, "submission.nonce", 32),
    sourceType: sourceTypeField(material.sourceType, "submission.sourceType"),
    sourceVersion: stringField(material.sourceVersion, "submission.sourceVersion"),
  };
  return {
    domain: EIP712_DOMAIN,
    types: EIP712_FORECAST_SUBMISSION_TYPES,
    primaryType: EIP712_PRIMARY_TYPE,
    message,
  } as const;
}

/** Deterministic fixture digest only. It is not a wallet signature. */
export function fixtureSignature(material: ForecastSignMaterial): WireHex {
  return keccak256(stringToHex(`PRIOR_FORECAST_SIGN_V1:${canonicalSignMaterial(material)}`));
}

export function createFixtureForecastRequest(profile: FixtureProviderProfile): ForecastRequestWire {
  const requestId = forecastRequestIdFor({
    protocolVersion: FORECAST_PROTOCOL_VERSION,
    circuitId: FIXTURE_CIRCUIT_ID,
    marketId: FIXTURE_MARKET_ID,
    providerId: profile.provider.providerId,
    sessionId: profile.sessionId,
    nonce: profile.nonce,
  });
  return Object.freeze({
    protocolVersion: FORECAST_PROTOCOL_VERSION,
    requestId,
    provider: profile.provider,
    sessionId: profile.sessionId,
    circuitId: FIXTURE_CIRCUIT_ID,
    marketId: FIXTURE_MARKET_ID,
    asset: "BTC",
    intervalSec: 300,
    opensAt: "200",
    expiresAt: "500",
    forecastDeadline: "400",
    reference: null,
    forecaster: profile.forecaster,
    forecasterAddress: profile.forecasterAddress,
    nonce: profile.nonce,
  });
}

export function createFixtureForecastSubmission(
  request: ForecastRequestWire,
  overrides: Partial<Pick<ForecastSubmissionWire, "probabilityUpBps" | "generatedAt" | "validUntil" | "signature">> = {},
): ForecastSubmissionWire {
  const probabilityUpBps = overrides.probabilityUpBps ?? 6_200;
  const generatedAt = overrides.generatedAt ?? "201";
  const validUntil = overrides.validUntil ?? "400";
  const material: ForecastSignMaterial = {
    protocolVersion: request.protocolVersion,
    marketId: request.marketId,
    circuitId: request.circuitId,
    forecaster: request.forecaster,
    probabilityUpBps,
    generatedAt,
    validUntil,
    nonce: request.nonce,
  };
  return Object.freeze({
    protocolVersion: request.protocolVersion,
    requestId: request.requestId,
    provider: request.provider,
    sessionId: request.sessionId,
    circuitId: request.circuitId,
    marketId: request.marketId,
    forecaster: request.forecaster,
    forecasterAddress: request.forecasterAddress,
    probabilityUpBps,
    generatedAt,
    validUntil,
    nonce: request.nonce,
    sourceType: "AGENT",
    sourceVersion: "INTEGRATION_FIXTURE/v1",
    signatureScheme: SIGNATURE_SCHEME,
    signature: overrides.signature ?? fixtureSignature(material),
  });
}

export function parseWireJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    fail("INVALID_JSON", "request body is not valid JSON", 400);
  }
}

export function parseForecastRequestWire(value: unknown): ForecastRequestWire {
  const object = record(value, "request");
  exactKeys(
    object,
    [
      "protocolVersion",
      "requestId",
      "provider",
      "sessionId",
      "circuitId",
      "marketId",
      "asset",
      "intervalSec",
      "opensAt",
      "expiresAt",
      "forecastDeadline",
      "reference",
      "forecaster",
      "forecasterAddress",
      "nonce",
    ],
    "request",
  );
  const protocolVersion = protocolVersionField(object.protocolVersion, "request.protocolVersion");
  const requestId = hexField(object.requestId, "request.requestId", 32);
  const provider = providerIdentity(object.provider, "request.provider");
  const sessionId = stringField(object.sessionId, "request.sessionId");
  const circuitId = hexField(object.circuitId, "request.circuitId", 32);
  const marketId = hexField(object.marketId, "request.marketId", 32);
  const asset = assetField(object.asset, "request.asset");
  const intervalSec = integerField(object.intervalSec, "request.intervalSec", 1);
  const opensAt = timestampField(object.opensAt, "request.opensAt");
  const expiresAt = timestampField(object.expiresAt, "request.expiresAt");
  const forecastDeadline = object.forecastDeadline === null ? null : timestampField(object.forecastDeadline, "request.forecastDeadline");
  const parsedReference = reference(object.reference, "request.reference");
  const forecaster = hexField(object.forecaster, "request.forecaster", 32);
  const forecasterAddress = addressField(object.forecasterAddress, "request.forecasterAddress");
  const nonce = hexField(object.nonce, "request.nonce", 32);
  const expectedRequestId = forecastRequestIdFor({ protocolVersion, circuitId, marketId, providerId: provider.providerId, sessionId, nonce });
  if (!compareHex(expectedRequestId, requestId)) fail("REQUEST_ID_MISMATCH", "requestId is not bound to the request identity", 422);
  return Object.freeze({
    protocolVersion,
    requestId,
    provider,
    sessionId,
    circuitId,
    marketId,
    asset,
    intervalSec,
    opensAt,
    expiresAt,
    forecastDeadline,
    reference: parsedReference,
    forecaster,
    forecasterAddress,
    nonce,
  });
}

export function parseForecastSubmissionWire(value: unknown): ForecastSubmissionWire {
  const object = record(value, "submission");
  exactKeys(
    object,
    [
      "protocolVersion",
      "requestId",
      "provider",
      "sessionId",
      "circuitId",
      "marketId",
      "forecaster",
      "forecasterAddress",
      "probabilityUpBps",
      "generatedAt",
      "validUntil",
      "nonce",
      "sourceType",
      "sourceVersion",
      "signatureScheme",
      "signature",
    ],
    "submission",
  );
  const protocolVersion = protocolVersionField(object.protocolVersion, "submission.protocolVersion");
  const requestId = hexField(object.requestId, "submission.requestId", 32);
  const provider = providerIdentity(object.provider, "submission.provider");
  const sessionId = stringField(object.sessionId, "submission.sessionId");
  const circuitId = hexField(object.circuitId, "submission.circuitId", 32);
  const marketId = hexField(object.marketId, "submission.marketId", 32);
  const forecaster = hexField(object.forecaster, "submission.forecaster", 32);
  const forecasterAddress = addressField(object.forecasterAddress, "submission.forecasterAddress");
  const probabilityUpBps = bpsField(object.probabilityUpBps, "submission.probabilityUpBps");
  const generatedAt = timestampField(object.generatedAt, "submission.generatedAt");
  const validUntil = timestampField(object.validUntil, "submission.validUntil");
  const nonce = hexField(object.nonce, "submission.nonce", 32);
  const sourceType = sourceTypeField(object.sourceType, "submission.sourceType");
  const sourceVersion = stringField(object.sourceVersion, "submission.sourceVersion");
  if (object.signatureScheme !== SIGNATURE_SCHEME && object.signatureScheme !== EIP712_SIGNATURE_SCHEME) {
    fail("UNSUPPORTED_SIGNATURE_SCHEME", "signature scheme is unsupported", 422);
  }
  const signatureScheme = object.signatureScheme;
  const signature = hexField(object.signature, "submission.signature");
  if (signature === "0x") fail("INVALID_SIGNATURE", "submission.signature must contain bytes", 422);
  return Object.freeze({
    protocolVersion,
    requestId,
    provider,
    sessionId,
    circuitId,
    marketId,
    forecaster,
    forecasterAddress,
    probabilityUpBps,
    generatedAt,
    validUntil,
    nonce,
    sourceType,
    sourceVersion,
    signatureScheme,
    signature,
  });
}

export function parseForecastSubmissionAcceptedWire(value: unknown): ForecastSubmissionAcceptedWire {
  const object = record(value, "accepted");
  exactKeys(
    object,
    [
      "protocolVersion",
      "status",
      "requestId",
      "provider",
      "sessionId",
      "submissionId",
      "idempotencyKey",
      "circuitId",
      "marketId",
      "forecaster",
      "forecasterAddress",
      "probabilityUpBps",
      "generatedAt",
      "validUntil",
      "submittedAt",
      "chainCommitment",
      "signatureScheme",
      "signatureVerification",
      "transportPrincipal",
    ],
    "accepted",
  );
  const protocolVersion = protocolVersionField(object.protocolVersion, "accepted.protocolVersion");
  if (object.status !== "ACCEPTED") fail("INVALID_WIRE", "accepted.status must be ACCEPTED");
  const status = "ACCEPTED" as const;
  if (object.chainCommitment !== "NOT_SUBMITTED") fail("INVALID_WIRE", "accepted.chainCommitment must be NOT_SUBMITTED");
  if (object.signatureScheme !== SIGNATURE_SCHEME && object.signatureScheme !== EIP712_SIGNATURE_SCHEME) {
    fail("INVALID_WIRE", "accepted.signatureScheme is unsupported");
  }
  const signatureScheme = object.signatureScheme;
  const rawSignatureVerification = object.signatureVerification;
  if (
    (signatureScheme === SIGNATURE_SCHEME && rawSignatureVerification !== "FIXTURE_RECOMPUTED_NOT_PRODUCTION_CRYPTOGRAPHIC_VERIFICATION") ||
    (signatureScheme === EIP712_SIGNATURE_SCHEME && rawSignatureVerification !== "EIP712_RECOVERED_PRODUCTION_CRYPTOGRAPHIC_VERIFICATION")
  ) {
    fail("INVALID_WIRE", "accepted.signatureVerification does not match the signature scheme");
  }
  const signatureVerification = rawSignatureVerification as SignatureVerification;
  return Object.freeze({
    protocolVersion,
    status,
    requestId: hexField(object.requestId, "accepted.requestId", 32),
    provider: providerIdentity(object.provider, "accepted.provider"),
    sessionId: stringField(object.sessionId, "accepted.sessionId"),
    submissionId: hexField(object.submissionId, "accepted.submissionId", 32),
    idempotencyKey: hexField(object.idempotencyKey, "accepted.idempotencyKey", 32),
    circuitId: hexField(object.circuitId, "accepted.circuitId", 32),
    marketId: hexField(object.marketId, "accepted.marketId", 32),
    forecaster: hexField(object.forecaster, "accepted.forecaster", 32),
    forecasterAddress: addressField(object.forecasterAddress, "accepted.forecasterAddress"),
    probabilityUpBps: bpsField(object.probabilityUpBps, "accepted.probabilityUpBps"),
    generatedAt: timestampField(object.generatedAt, "accepted.generatedAt"),
    validUntil: timestampField(object.validUntil, "accepted.validUntil"),
    submittedAt: timestampField(object.submittedAt, "accepted.submittedAt"),
    chainCommitment: "NOT_SUBMITTED",
    signatureScheme,
    signatureVerification,
    transportPrincipal: transportPrincipal(object.transportPrincipal, "accepted.transportPrincipal"),
  });
}

export function parseUnauthorizedExecutionResponseWire(value: unknown): UnauthorizedExecutionResponseWire {
  const object = record(value, "execution response");
  exactKeys(object, ["protocolVersion", "status", "reasonCode", "executionAuthority", "requestId", "marketId", "message"], "execution response");
  protocolVersionField(object.protocolVersion, "execution response.protocolVersion");
  if (object.status !== "REJECTED_AUTHORITY" || object.reasonCode !== "REJECTED_AUTHORITY" || object.executionAuthority !== false) {
    fail("INVALID_WIRE", "execution response did not fail closed with REJECTED_AUTHORITY", 422);
  }
  return Object.freeze({
    protocolVersion: FORECAST_PROTOCOL_VERSION,
    status: "REJECTED_AUTHORITY",
    reasonCode: "REJECTED_AUTHORITY",
    executionAuthority: false,
    requestId: hexField(object.requestId, "execution response.requestId", 32),
    marketId: hexField(object.marketId, "execution response.marketId", 32),
    message: stringField(object.message, "execution response.message"),
  });
}

export function serializeWire(value: unknown): string {
  return JSON.stringify(value);
}

export function materialForSubmission(submission: ForecastSubmissionWire): ForecastSignMaterial {
  return {
    protocolVersion: submission.protocolVersion,
    marketId: submission.marketId,
    circuitId: submission.circuitId,
    forecaster: submission.forecaster,
    probabilityUpBps: submission.probabilityUpBps,
    generatedAt: submission.generatedAt,
    validUntil: submission.validUntil,
    nonce: submission.nonce,
  };
}

export function eip712MaterialForSubmission(submission: ForecastSubmissionWire): ForecastSubmissionSignMaterial {
  return {
    protocolVersion: submission.protocolVersion,
    requestId: submission.requestId,
    marketId: submission.marketId,
    circuitId: submission.circuitId,
    forecaster: submission.forecaster,
    forecasterAddress: submission.forecasterAddress,
    probabilityUpBps: submission.probabilityUpBps,
    generatedAt: submission.generatedAt,
    validUntil: submission.validUntil,
    nonce: submission.nonce,
    sourceType: submission.sourceType,
    sourceVersion: submission.sourceVersion,
  };
}

export function sameProviderIdentity(left: WireProviderIdentity, right: WireProviderIdentity): boolean {
  return (
    compareHex(left.providerId, right.providerId) &&
    left.displayName === right.displayName &&
    left.source === right.source &&
    left.sourceVersion === right.sourceVersion
  );
}

export function assertSubmissionMatchesRequest(request: ForecastRequestWire, submission: ForecastSubmissionWire): void {
  if (!compareHex(request.requestId, submission.requestId)) fail("REQUEST_ID_MISMATCH", "submission requestId does not match request");
  if (!sameProviderIdentity(request.provider, submission.provider)) fail("PROVIDER_IDENTITY_MISMATCH", "submission provider identity does not match request");
  if (request.sessionId !== submission.sessionId) fail("SESSION_ID_MISMATCH", "submission sessionId does not match request");
  if (!compareHex(request.circuitId, submission.circuitId)) fail("CIRCUIT_ID_MISMATCH", "submission circuitId does not match request");
  if (!compareHex(request.marketId, submission.marketId)) fail("MARKET_ID_MISMATCH", "submission marketId does not match request");
  if (!compareHex(request.forecaster, submission.forecaster)) fail("FORECASTER_ID_MISMATCH", "submission forecaster does not match request");
  if (!compareHex(request.forecasterAddress, submission.forecasterAddress)) fail("FORECASTER_ADDRESS_MISMATCH", "submission forecasterAddress does not match request");
  if (!compareHex(request.nonce, submission.nonce)) fail("NONCE_MISMATCH", "submission nonce does not match request");
}
