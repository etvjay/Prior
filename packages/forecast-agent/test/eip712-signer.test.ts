import { describe, expect, it } from "vitest";
import { verifyTypedData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  eip712TypedDataForSubmission,
  type ForecastSubmissionSignMaterial,
} from "@prior/forecast-protocol";
import {
  Eip712ForecastSigner,
  FixtureForecastSigner,
  createRuntimeForecastSigner,
} from "../src/signer.js";

// Disposable test-only identity. It is never used by runtime/demo code.
const TEST_FORECASTER_PRIVATE_KEY = `0x${"00".repeat(31)}01` as `0x${string}`;
const TEST_FORECASTER_ADDRESS = "0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf" as `0x${string}`;

const material: ForecastSubmissionSignMaterial = {
  protocolVersion: "1",
  requestId: `0x${"11".repeat(32)}`,
  marketId: `0x${"22".repeat(32)}`,
  circuitId: `0x${"33".repeat(32)}`,
  forecaster: `0x${"44".repeat(32)}`,
  forecasterAddress: TEST_FORECASTER_ADDRESS,
  probabilityUpBps: 6_200,
  generatedAt: "201",
  validUntil: "400",
  nonce: `0x${"55".repeat(32)}`,
  sourceType: "AGENT",
  sourceVersion: "INTEGRATION_FIXTURE/v1",
};

describe("EIP-712 Forecast signer", () => {
  it("signs the exact ForecastSubmission typed data and verifies with viem", async () => {
    const signer = new Eip712ForecastSigner({ privateKey: TEST_FORECASTER_PRIVATE_KEY });
    const result = await signer.sign(material);
    const account = privateKeyToAccount(TEST_FORECASTER_PRIVATE_KEY);

    expect(account.address).toBe(TEST_FORECASTER_ADDRESS);
    expect(result.forecasterAddress).toBe(TEST_FORECASTER_ADDRESS);
    expect(result.signatureScheme).toBe("EIP712_V2");
    expect(result.productionCryptographicVerification).toBe(true);
    expect(result.label).toBe("EIP-712 signature");
    await expect(
      verifyTypedData({
        ...eip712TypedDataForSubmission(material),
        address: TEST_FORECASTER_ADDRESS,
        signature: result.signature,
      }),
    ).resolves.toBe(true);
  });

  it("keeps the default runtime/demo signer on the explicit fixture path", () => {
    const signer = createRuntimeForecastSigner({
      fixtureForecasterAddress: "0x1111111111111111111111111111111111111111",
      env: {},
    });

    expect(signer).toBeInstanceOf(FixtureForecastSigner);
  });

  it("fails closed when live mode has no explicit key environment or path", () => {
    expect(() =>
      createRuntimeForecastSigner({
        fixtureForecasterAddress: "0x1111111111111111111111111111111111111111",
        env: { PRIOR_FORECAST_SIGNER_MODE: "live" },
      }),
    ).toThrow(/live.*signer.*private key|private key.*path/i);
  });
});
