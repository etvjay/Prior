import {
  canonicalSignMaterial,
  fixtureSignature,
  SIGNATURE_SCHEME,
  type ForecastSignMaterial,
  type WireAddress,
  type WireHex,
} from "@prior/forecast-protocol";

export interface ForecastSignerResult {
  readonly forecasterAddress: WireAddress;
  readonly signature: WireHex;
  readonly signatureScheme: typeof SIGNATURE_SCHEME;
  readonly label: "fixture signature";
  readonly productionCryptographicVerification: false;
}

/** Signer port. It has no execution or transport methods. */
export interface ForecastSigner {
  sign(material: ForecastSignMaterial): Promise<ForecastSignerResult>;
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

  public async sign(material: ForecastSignMaterial): Promise<ForecastSignerResult> {
    // Validate and materialize the exact domain before producing the fixture digest.
    canonicalSignMaterial(material);
    return Object.freeze({
      forecasterAddress: this.forecasterAddress,
      signature: fixtureSignature(material),
      signatureScheme: SIGNATURE_SCHEME,
      label: this.label,
      productionCryptographicVerification: this.productionCryptographicVerification,
    });
  }
}
