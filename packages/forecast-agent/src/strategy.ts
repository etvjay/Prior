import type {
  ForecastRequestWire,
  WireSourceType,
} from "@prior/forecast-protocol";

export interface ForecastStrategyOutput {
  readonly probabilityUpBps: number;
  readonly generatedAt: string;
  readonly validUntil: string;
  readonly sourceType: WireSourceType;
  readonly sourceVersion: string;
  readonly classification: "INTEGRATION_FIXTURE";
}

/** Vendor-neutral forecast port. It returns a probability, never a signer or transport response. */
export interface ForecastStrategy {
  forecast(request: ForecastRequestWire): Promise<ForecastStrategyOutput>;
}

export interface DeterministicFixtureStrategyOptions {
  readonly probabilityUpBps: number;
  readonly sourceVersion?: string;
}

/**
 * Deterministic integration strategy used when no legitimately configured model
 * credential is supplied. It is intentionally not coupled to a model vendor.
 */
export class DeterministicFixtureStrategy implements ForecastStrategy {
  public readonly classification = "INTEGRATION_FIXTURE" as const;
  private readonly probabilityUpBps: number;
  private readonly sourceVersion: string;

  public constructor(options: DeterministicFixtureStrategyOptions) {
    if (!Number.isSafeInteger(options.probabilityUpBps) || options.probabilityUpBps < 0 || options.probabilityUpBps > 10_000) {
      throw new Error("fixture strategy probabilityUpBps must be an integer in [0, 10000]");
    }
    this.probabilityUpBps = options.probabilityUpBps;
    this.sourceVersion = options.sourceVersion ?? "INTEGRATION_FIXTURE/v1";
  }

  public async forecast(request: ForecastRequestWire): Promise<ForecastStrategyOutput> {
    const generatedAt = (BigInt(request.opensAt) + 1n).toString(10);
    const validUntil = request.forecastDeadline ?? request.expiresAt;
    if (BigInt(generatedAt) >= BigInt(validUntil)) {
      throw new Error("fixture strategy cannot generate inside an expired request window");
    }
    return Object.freeze({
      probabilityUpBps: this.probabilityUpBps,
      generatedAt,
      validUntil,
      sourceType: "AGENT" as const,
      sourceVersion: this.sourceVersion,
      classification: this.classification,
    });
  }
}
