import { describe, expect, it } from "vitest";
import {
  EIP712_DOMAIN,
  EIP712_FORECAST_SUBMISSION_TYPES,
  EIP712_PRIMARY_TYPE,
  eip712TypedDataForSubmission,
  type ForecastSubmissionSignMaterial,
} from "../src/index.js";

const material: ForecastSubmissionSignMaterial = {
  protocolVersion: "1",
  requestId: `0x${"01".repeat(32)}`,
  marketId: `0x${"02".repeat(32)}`,
  circuitId: `0x${"03".repeat(32)}`,
  forecaster: `0x${"04".repeat(32)}`,
  forecasterAddress: "0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf",
  probabilityUpBps: 6_200,
  generatedAt: "201",
  validUntil: "400",
  nonce: `0x${"05".repeat(32)}`,
  sourceType: "AGENT",
  sourceVersion: "INTEGRATION_FIXTURE/v1",
};

describe("ForecastSubmission EIP-712 v2 definition", () => {
  it("binds exactly the production submission fields under the fixed domain", () => {
    const typedData = eip712TypedDataForSubmission(material);

    expect(typedData.domain).toEqual({
      name: "PRIOR Forecast",
      version: "2",
      chainId: 50312,
      verifyingContract: "0x5b1B51cB062B7B782c9EC2Bd5674eFAdb5308F41",
    });
    expect(typedData.primaryType).toBe(EIP712_PRIMARY_TYPE);
    expect(EIP712_DOMAIN).toEqual(typedData.domain);
    expect(EIP712_FORECAST_SUBMISSION_TYPES.ForecastSubmission).toEqual([
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
    ]);
    expect(Object.keys(typedData.message)).toEqual([
      "protocolVersion",
      "requestId",
      "marketId",
      "circuitId",
      "forecaster",
      "forecasterAddress",
      "probabilityUpBps",
      "generatedAt",
      "validUntil",
      "nonce",
      "sourceType",
      "sourceVersion",
    ]);
    expect(typedData.message.generatedAt).toBe(201n);
    expect(typedData.message.validUntil).toBe(400n);
  });
});
