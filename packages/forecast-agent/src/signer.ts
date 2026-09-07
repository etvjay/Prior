import { readFileSync } from "node:fs";
import {
  EIP712_SIGNATURE_SCHEME,
  canonicalSignMaterial,
  eip712TypedDataForSubmission,
  fixtureSignature,
  type ForecastSignMaterial,
  type ForecastSubmissionSignMaterial,
  type WireAddress,
  type WireHex,
} from "@prior/forecast-protocol";
import { privateKeyToAccount } from "viem/accounts";
import type { Hex } from "viem";

export type ForecastSigningMaterial = ForecastSignMaterial | ForecastSubmissionSignMaterial;

export interface ForecastSignerResult {
  readonly forecasterAddress: WireAddress;
  readonly signature: WireHex;
  readonly signatureScheme: "FIXTURE_KECCAK_V1" | typeof EIP712_SIGNATURE_SCHEME;
  readonly label: "fixture signature" | "EIP-712 signature";
  readonly productionCryptographicVerification: boolean;
}

/** Signer port. It has no execution or transport methods. */
export interface ForecastSigner {
  sign(material: ForecastSigningMaterial): Promise<ForecastSignerResult>;
}

export interface FixtureForecastSignerOptions {
  readonly forecasterAddress: WireAddress;
}

/**
 * Minimal deterministic signer for the integration fixture. This is a
 * domain-bound keccak digest, not a wallet signature and not production crypto.
 */
export class FixtureForecastSigner implements ForecastSigner {
  public readonly label = "fixture signature" as const;
  public readonly productionCryptographicVerification = false as const;
  private readonly forecasterAddress: WireAddress;

  public constructor(options: FixtureForecastSignerOptions) {
    this.forecasterAddress = options.forecasterAddress;
  }

  public async sign(material: ForecastSigningMaterial): Promise<ForecastSignerResult> {
    const fixtureMaterial: ForecastSignMaterial = "requestId" in material
      ? {
          protocolVersion: material.protocolVersion,
          marketId: material.marketId,
          circuitId: material.circuitId,
          forecaster: material.forecaster,
          probabilityUpBps: material.probabilityUpBps,
          generatedAt: material.generatedAt,
          validUntil: material.validUntil,
          nonce: material.nonce,
        }
      : material;
    // Validate and materialize the exact domain before producing the fixture digest.
    canonicalSignMaterial(fixtureMaterial);
    if ("forecasterAddress" in material && material.forecasterAddress.toLowerCase() !== this.forecasterAddress.toLowerCase()) {
      throw new Error("fixture signer address does not match the requested forecaster address");
    }
    return Object.freeze({
      forecasterAddress: this.forecasterAddress,
      signature: fixtureSignature(fixtureMaterial),
      signatureScheme: "FIXTURE_KECCAK_V1",
      label: this.label,
      productionCryptographicVerification: this.productionCryptographicVerification,
    });
  }
}

export interface Eip712ForecastSignerOptions {
  readonly privateKey: Hex;
}

/** Ethereum-compatible EIP-712 signer for the ForecastSubmission v2 domain. */
export class Eip712ForecastSigner implements ForecastSigner {
  public readonly label = "EIP-712 signature" as const;
  public readonly productionCryptographicVerification = true as const;
  private readonly account: ReturnType<typeof privateKeyToAccount>;

  public constructor(options: Eip712ForecastSignerOptions) {
    if (!/^0x[0-9a-fA-F]{64}$/.test(options.privateKey)) {
      throw new Error("EIP-712 signer private key must be a 32-byte hexadecimal value");
    }
    this.account = privateKeyToAccount(options.privateKey);
  }

  public async sign(material: ForecastSigningMaterial): Promise<ForecastSignerResult> {
    if (!("requestId" in material)) {
      throw new Error("EIP-712 signer requires complete ForecastSubmission signing material");
    }
    if (material.forecasterAddress.toLowerCase() !== this.account.address.toLowerCase()) {
      throw new Error("EIP-712 signer address does not match the requested forecaster address");
    }
    const signature = await this.account.signTypedData(eip712TypedDataForSubmission(material));
    return Object.freeze({
      forecasterAddress: this.account.address,
      signature,
      signatureScheme: EIP712_SIGNATURE_SCHEME,
      label: this.label,
      productionCryptographicVerification: this.productionCryptographicVerification,
    });
  }
}

export interface RuntimeForecastSignerOptions {
  readonly fixtureForecasterAddress: WireAddress;
  readonly env?: Readonly<Record<string, string | undefined>>;
}

function configuredPrivateKey(env: Readonly<Record<string, string | undefined>>): Hex | undefined {
  const keyPath = env.PRIOR_FORECASTER_PRIVATE_KEY_PATH?.trim();
  if (keyPath !== undefined && keyPath !== "") {
    const key = readFileSync(keyPath, "utf8").trim();
    return key as Hex;
  }
  const key = env.PRIOR_FORECASTER_PRIVATE_KEY?.trim();
  return key === undefined || key === "" ? undefined : (key as Hex);
}

/**
 * Runtime selection is fixture by default. Live mode requires an explicit
 * private-key environment value or file path and never emits key material.
 */
export function createRuntimeForecastSigner(options: RuntimeForecastSignerOptions): ForecastSigner {
  const env = options.env ?? process.env;
  const mode = env.PRIOR_FORECAST_SIGNER_MODE ?? "fixture";
  if (mode === "fixture") return new FixtureForecastSigner({ forecasterAddress: options.fixtureForecasterAddress });
  if (mode !== "live") throw new Error("PRIOR_FORECAST_SIGNER_MODE must be fixture or live");
  const privateKey = configuredPrivateKey(env);
  if (privateKey === undefined) {
    throw new Error("live Forecast signer requires an explicit private key environment value or file path");
  }
  return new Eip712ForecastSigner({ privateKey });
}
