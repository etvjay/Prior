import { describe, expect, it } from "vitest";
import {
  EVIDENCE_MODE,
  LiveReadAdapter,
  SHANNON_CHAIN_ID,
  SHANNON_ADDRESSES,
  parseCircuitRead,
  parseForecastRead,
  parseMarketRead,
  RpcReadError,
} from "./live-read";

const hex32 = (n: number) => `0x${n.toString(16).padStart(64, "0")}` as `0x${string}`;
const address = (n: number) => `0x${n.toString(16).padStart(40, "0")}` as `0x${string}`;

function adapter(responses: Record<string, unknown>, chainId = SHANNON_CHAIN_ID) {
  return new LiveReadAdapter({
    rpcUrl: "https://rpc.test",
    request: async (method, params) => {
      if (method === "eth_chainId") return `0x${chainId.toString(16)}`;
      if (method === "eth_call") return responses[String((params[0] as { data?: string }).data)] ?? "0x";
      throw new Error(`unexpected ${method}`);
    },
  });
}

describe("Worker live canonical read adapter", () => {
  it("parses the verified market tuple without changing marketId identity", () => {
    const parsed = parseMarketRead([99n, 2, 0, address(7), 0, hex32(8), address(9), address(10), address(11), address(12), 256n, 257n, 1n, 2n], 3n, hex32(42));
    expect(parsed).toMatchObject({ marketId: hex32(42), binaryPoolAddress: address(12), marketAddress: address(11), collateral: address(7), oracleQuestionId: "99", nonce: "3", lifecycle: "CONNECTED" });
  });

  it("parses exact Circuit intent/runtime reads and Forecast trial reads", () => {
    const circuit = parseCircuitRead({ intent: [hex32(1), address(2), address(3), 1, 4, 500n, 100n, 800, 2, 10n, 9999999999n, 1n], runtime: [2, 1, 0, 1, 0, 50n] }, 100n);
    expect(circuit).toMatchObject({ circuitId: hex32(1), status: "ACTIVE", completed: 1, abstained: 1, reservedSpend: "50" });
    const forecast = parseForecastRead([hex32(4), hex32(5), address(6), 7234, 4200, true, 10n, 11n, 300, 0, 0, 1, 0, 0, 0, 0]);
    expect(forecast).toMatchObject({ forecastId: hex32(4), marketId: hex32(5), pUpBps: 7234, status: "COMMITTED" });
  });

  it("fails closed on wrong chain, malformed RPC responses, and upstream errors", async () => {
    await expect(adapter({}, 1).readMarket(hex32(1))).rejects.toMatchObject({ code: "CHAIN_MISMATCH" });
    await expect(adapter({}).readCircuit(hex32(1))).rejects.toMatchObject({ code: "UPSTREAM_MALFORMED" });
    const failing = new LiveReadAdapter({ rpcUrl: "https://rpc.test", request: async () => { throw new Error("network down"); } });
    await expect(failing.readMarket(hex32(1))).rejects.toBeInstanceOf(RpcReadError);
  });

  it("exposes the explicit read-only evidence mode", () => {
    expect(EVIDENCE_MODE).toBe("SHANNON_RPC_READ_ONLY");
  });
  it("binds reads to canonical Shannon deployment addresses", () => {
    expect(SHANNON_ADDRESSES.binaryModule).toBe("0x3ecC694Cef705358864a646142ac17A90E29e388");
    expect(SHANNON_ADDRESSES.rftRegistry).toBe("0x5b1B51cB062B7B782c9EC2Bd5674eFAdb5308F41");
    expect(SHANNON_ADDRESSES.circuitRegistry).toBe("0xf92609D45f164DaB74dC51Cd59B583DA95e3C460");
  });
});
