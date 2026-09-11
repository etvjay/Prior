import { describe, expect, it } from "vitest";
import { encodeFunctionData, encodeAbiParameters, keccak256, parseTransaction } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { SHANNON_ADDRESSES } from "./live-read";
import { submitSignedForecast, bindSignedTrial } from "./hosted-write";

const abi = [{ type: "function", name: "commitForecast", inputs: [
  { name: "marketId", type: "bytes32" }, { name: "pUpBps", type: "uint16" },
  { name: "referenceUpBps", type: "uint16" }, { name: "referenceValid", type: "bool" },
  { name: "tradeTag", type: "uint64" }, { name: "actionIntent", type: "uint8" },
], outputs: [{ name: "trialId", type: "bytes32" }] }] as const;
const key = "0x0123456789012345678901234567890123456789012345678901234567890123" as const;
const account = privateKeyToAccount(key);
const marketId = `0x${"11".repeat(32)}` as `0x${string}`;
const bindAbi = [{ type: "function", name: "bindTrial", inputs: [{ name: "circuitId", type: "bytes32" }, { name: "marketId", type: "bytes32" }, { name: "trialId", type: "bytes32" }], outputs: [] }] as const;
const circuitId = `0x${"22".repeat(32)}` as `0x${string}`;
const trialId = `0x${"33".repeat(32)}` as `0x${string}`;

async function signed() {
  return account.signTransaction({ to: SHANNON_ADDRESSES.rftRegistry, chainId: 50312, nonce: 0, gas: 100000n, maxFeePerGas: 1n, maxPriorityFeePerGas: 1n, type: "eip1559", data: encodeFunctionData({ abi, functionName: "commitForecast", args: [marketId, 5000, 5000, true, 1n, 0] }) });
}

describe("client-signed Forecast relay", () => {
  it("validates the canonical target, chain, calldata, market, and signer before broadcast", async () => {
    const raw = await signed(); const calls: string[] = []; let preflight = true; const txHash = `0x${"ab".repeat(32)}`; const expectedTrialId = keccak256(encodeAbiParameters([{ type: "uint256" }, { type: "address" }, { type: "address" }, { type: "bytes32" }], [50312n, SHANNON_ADDRESSES.rftRegistry, account.address, marketId])); const submittedInput = parseTransaction(raw).data;
    const result = await submitSignedForecast({ signedTransaction: raw, expectedMarketId: marketId }, { rpc: async (method, params) => { calls.push(`${method}:${JSON.stringify(params)}`); if (method === "eth_chainId") return "0xc488"; if (method === "eth_call") { if (preflight) { preflight = false; return `0x${"00".repeat(32)}`; } return expectedTrialId; } if (method === "eth_sendRawTransaction") return txHash; if (method === "eth_getTransactionByHash") return { hash: txHash, to: SHANNON_ADDRESSES.rftRegistry, from: account.address, input: submittedInput, chainId: "0xc488", nonce: "0x0", type: "0x2" }; return { transactionHash: txHash, blockNumber: "0x1", blockHash: `0x${"cd".repeat(32)}`, to: SHANNON_ADDRESSES.rftRegistry, status: "0x1" }; } });
    expect(result).toMatchObject({ status: "INCLUDED", chainId: 50312, marketId, forecaster: account.address.toLowerCase(), custody: "CLIENT_SIGNED_NO_WORKER_KEY" });
    expect(calls).toHaveLength(6); expect(calls[0]).toContain("eth_chainId"); expect(calls[1]).toContain("eth_call"); expect(calls[2]).toContain("eth_sendRawTransaction"); expect(calls[3]).toContain("eth_getTransactionReceipt"); expect(calls[4]).toContain("eth_getTransactionByHash"); expect(calls[5]).toContain("eth_call");
  });
  it("returns the existing canonical trial without rebroadcasting", async () => {
    const raw = await signed(); let sent = false; const existing = `0x${"ef".repeat(32)}`;
    const result = await submitSignedForecast({ signedTransaction: raw, expectedMarketId: marketId }, { rpc: async (method) => { if (method === "eth_chainId") return "0xc488"; if (method === "eth_call") return existing; if (method === "eth_sendRawTransaction") sent = true; return null; } });
    expect(result).toMatchObject({ status: "ALREADY_COMMITTED", trialId: existing, broadcast: false }); expect(sent).toBe(false);
  });
  it("rejects wrong chain before any RPC call", async () => {
    const raw = await account.signTransaction({ to: SHANNON_ADDRESSES.rftRegistry, chainId: 1, nonce: 0, gas: 100000n, maxFeePerGas: 1n, maxPriorityFeePerGas: 1n, type: "eip1559", data: encodeFunctionData({ abi, functionName: "commitForecast", args: [marketId, 5000, 5000, true, 1n, 0] }) }); let called = false;
    await expect(submitSignedForecast({ signedTransaction: raw, expectedMarketId: marketId }, { rpc: async () => { called = true; return "0x"; } })).rejects.toMatchObject({ code: "CHAIN_MISMATCH" }); expect(called).toBe(false);
  });
  it("rejects non-commit calldata without broadcasting", async () => {
    const raw = await account.signTransaction({ to: SHANNON_ADDRESSES.rftRegistry, chainId: 50312, nonce: 0, gas: 100000n, maxFeePerGas: 1n, maxPriorityFeePerGas: 1n, type: "eip1559", data: "0x12345678" }); let called = false;
    await expect(submitSignedForecast({ signedTransaction: raw, expectedMarketId: marketId }, { rpc: async () => { called = true; return "0x"; } })).rejects.toBeTruthy();
    expect(called).toBe(false);
  });
  it("rejects a malformed broadcast hash before receipt polling", async () => {
    const raw = await signed();
    await expect(submitSignedForecast({ signedTransaction: raw, expectedMarketId: marketId }, { rpc: async (method) => { if (method === "eth_chainId") return "0xc488"; if (method === "eth_call") return `0x${"00".repeat(32)}`; if (method === "eth_sendRawTransaction") return "not-a-hash"; return null; } })).rejects.toMatchObject({ code: "UPSTREAM_MALFORMED" });
  });
  it("relays an owner-signed bind and verifies the canonical iteration", async () => {
    const iteration = keccak256(encodeAbiParameters([{ type: "uint256" }, { type: "address" }, { type: "bytes32" }, { type: "bytes32" }], [50312n, SHANNON_ADDRESSES.circuitRegistry, circuitId, marketId]));
    const raw = await account.signTransaction({ to: SHANNON_ADDRESSES.circuitRegistry, chainId: 50312, nonce: 0, gas: 100000n, maxFeePerGas: 1n, maxPriorityFeePerGas: 1n, type: "eip1559", data: encodeFunctionData({ abi: bindAbi, functionName: "bindTrial", args: [circuitId, marketId, trialId] }) }); const input = parseTransaction(raw).data; let calls = 0; const hash = `0x${"aa".repeat(32)}`; const tuple = (bound: boolean) => encodeAbiParameters([{ type: "tuple", components: [{ type: "bytes32" }, { type: "bytes32" }, { type: "bytes32" }, { type: "bytes32" }, { type: "bool" }, { type: "bool" }, { type: "bool" }] }], [[iteration, circuitId, marketId, bound ? trialId : `0x${"00".repeat(32)}`, bound, false, false]]);
    const result = await bindSignedTrial({ signedTransaction: raw, circuitId, marketId, trialId }, account.address, { rpc: async (method) => { calls += 1; if (method === "eth_chainId") return "0xc488"; if (method === "eth_call") return tuple(calls > 3); if (method === "eth_sendRawTransaction") return hash; if (method === "eth_getTransactionByHash") return { hash, to: SHANNON_ADDRESSES.circuitRegistry, from: account.address, input, chainId: "0xc488", nonce: "0x0", type: "0x2" }; return { transactionHash: hash, blockNumber: "0x1", blockHash: `0x${"bb".repeat(32)}`, to: SHANNON_ADDRESSES.circuitRegistry, status: "0x1" }; } });
    expect(result).toMatchObject({ status: "BOUND", circuitId, marketId, trialId, iterationId: iteration, owner: account.address.toLowerCase() });
  });
  it("rejects malformed binding input before any RPC call", async () => {
    let called = false;
    await expect(bindSignedTrial({ circuitId: `0x${"11".repeat(32)}`, marketId, trialId: `0x${"22".repeat(32)}`, signedTransaction: "0x01" }, account.address, { rpc: async () => { called = true; return null; } })).rejects.toMatchObject({ code: "MALFORMED_INPUT" });
    expect(called).toBe(false);
  });
});
