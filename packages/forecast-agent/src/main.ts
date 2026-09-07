import {
  FIXTURE_PROVIDER_A,
  FIXTURE_PROVIDER_B,
} from "@prior/forecast-protocol";
import {
  createFixtureProviderClient,
} from "./client.js";
import { runExternalForecastAgent } from "./runtime.js";
import { createRuntimeForecastSigner } from "./signer.js";
import { DeterministicFixtureStrategy } from "./strategy.js";

const profile = process.env.FORECAST_PROVIDER_PROFILE === "B" ? FIXTURE_PROVIDER_B : FIXTURE_PROVIDER_A;
const baseUrl = process.env.PRIOR_PROVIDER_URL ?? "http://127.0.0.1:8791";

try {
  const client = createFixtureProviderClient(baseUrl, profile.key);
  const strategy = new DeterministicFixtureStrategy({ probabilityUpBps: profile.probabilityUpBps });
  const signer = createRuntimeForecastSigner({ fixtureForecasterAddress: profile.forecasterAddress });
  const result = await runExternalForecastAgent(client, strategy, signer);
  // The marker is machine-readable demo output; no credential value is read or printed.
  console.log(`EXTERNAL_FORECAST_RESULT=${JSON.stringify(result)}`);
} catch (error) {
  const message = error instanceof Error ? error.message : "external Forecast agent failed";
  console.error(`EXTERNAL_FORECAST_ERROR=${message}`);
  process.exitCode = 1;
}
