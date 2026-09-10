import { binaryModuleReadAbi } from "@somnia-chain/markets-sdk";
import { decodeFunctionResult, encodeFunctionData, type Address, type Hex } from "viem";

export const EVIDENCE_MODE = "SHANNON_RPC_READ_ONLY" as const;
export const SHANNON_CHAIN_ID = 50312;
export const SHANNON_ADDRESSES = Object.freeze({
  binaryModule: "0x3ecC694Cef705358864a646142ac17A90E29e388" as Address,
  rftRegistry: "0x5b1B51cB062B7B782c9EC2Bd5674eFAdb5308F41" as Address,
  circuitRegistry: "0xf92609D45f164DaB74dC51Cd59B583DA95e3C460" as Address,
});
const DEFAULT_RPC = "https://dream-rpc.somnia.network";

type RpcRequest = (method: string, params: unknown[]) => Promise<unknown>;
export class RpcReadError extends Error { readonly code = "UPSTREAM_UNAVAILABLE"; constructor(message: string) { super(message); } }
class ReadFailure extends Error { constructor(readonly code: "CHAIN_MISMATCH" | "UPSTREAM_MALFORMED", message: string) { super(message); } }

const circuitAbi = [
  { type: "function", name: "intents", stateMutability: "view", inputs: [{ name: "id", type: "bytes32" }], outputs: [{ type: "tuple", components: [{type:"bytes32",name:"circuitId"},{type:"address",name:"owner"},{type:"address",name:"forecaster"},{type:"uint8",name:"marketClass"},{type:"uint16",name:"targetWindows"},{type:"uint128",name:"totalBudget"},{type:"uint128",name:"maxPerMarket"},{type:"uint16",name:"minMarginBps"},{type:"uint8",name:"maxConsecutiveLosses"},{type:"uint64",name:"startsAt"},{type:"uint64",name:"expiresAt"},{type:"uint256",name:"allowedActionsBitmap"}]}] },
  { type: "function", name: "runtime", stateMutability: "view", inputs: [{ name: "id", type: "bytes32" }], outputs: [{ type: "tuple", components: [{type:"uint8",name:"status"},{type:"uint16",name:"completed"},{type:"uint16",name:"missed"},{type:"uint16",name:"abstained"},{type:"uint8",name:"consecutiveLosses"},{type:"uint128",name:"reservedSpend"}]}] },
] as const;
const rftAbi = [{ type: "function", name: "getTrial", stateMutability: "view", inputs: [{type:"bytes32",name:"trialId"}], outputs: [{type:"tuple",components:[{type:"bytes32",name:"trialId"},{type:"bytes32",name:"marketId"},{type:"address",name:"forecaster"},{type:"uint16",name:"pUpBps"},{type:"uint16",name:"referenceUpBps"},{type:"bool",name:"referenceValid"},{type:"uint64",name:"committedAt"},{type:"uint64",name:"committedBlock"},{type:"uint32",name:"secondsToExpiry"},{type:"uint64",name:"tradeTag"},{type:"uint8",name:"actionIntent"},{type:"uint8",name:"status"},{type:"uint8",name:"outcome"},{type:"uint32",name:"forecastBrier"},{type:"uint32",name:"marketBrier"},{type:"int64",name:"marketScoreDelta"}]}] }] as const;

function tuple(value: unknown): readonly unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return Object.keys(value).filter((k) => /^\d+$/.test(k)).sort((a, b) => Number(a) - Number(b)).map((k) => (value as Record<string, unknown>)[k]);
  throw new ReadFailure("UPSTREAM_MALFORMED", "RPC returned a non-tuple result");
}
function bytes32(value: string): Hex { if (!/^0x[\da-f]{64}$/i.test(value)) throw new ReadFailure("UPSTREAM_MALFORMED", "RPC returned an invalid bytes32 value"); return value as Hex; }
function address(value: unknown): Address { if (typeof value !== "string" || !/^0x[\da-f]{40}$/i.test(value)) throw new ReadFailure("UPSTREAM_MALFORMED", "RPC returned an invalid address"); return value as Address; }
function bigintValue(value: unknown, label: string): bigint { try { const result = typeof value === "bigint" ? value : BigInt(value as string | number); if (result < 0n) throw new Error(); return result; } catch { throw new ReadFailure("UPSTREAM_MALFORMED", `RPC returned an invalid ${label}`); } }

export function parseMarketRead(raw: unknown, nonce: bigint, marketId: Hex) {
  const v = tuple(raw); if (v.length < 14) throw new ReadFailure("UPSTREAM_MALFORMED", "market tuple is incomplete");
  const oracleQuestionId = bigintValue(v[0], "oracleQuestionId");
  const canonicalMarketId = marketId;
  return { marketId: canonicalMarketId, marketAddress: address(v[8]), binaryPoolAddress: address(v[9]), collateral: address(v[3]), oracleQuestionId: oracleQuestionId.toString(), nonce: bigintValue(nonce, "nonce").toString(), lifecycle: "CONNECTED" as const };
}
function statusLabel(value: unknown): string { return (["DRAFT", "AUTHORIZED", "ACTIVE", "PAUSED", "STOPPED", "COMPLETE", "EXPIRED", "REVOKED"] as const)[Number(value)] ?? "UNKNOWN"; }
export function parseCircuitRead(raw: { intent: unknown; runtime: unknown }, _now: bigint) {
  const i = tuple(raw.intent), r = tuple(raw.runtime); if (i.length < 12 || r.length < 6) throw new ReadFailure("UPSTREAM_MALFORMED", "Circuit tuple is incomplete");
  return { circuitId: bytes32(String(i[0])), owner: address(i[1]), forecaster: address(i[2]), marketClass: Number(i[3]), targetWindows: Number(i[4]), totalBudget: bigintValue(i[5], "totalBudget").toString(), maxPerMarket: bigintValue(i[6], "maxPerMarket").toString(), minMarginBps: Number(i[7]), startsAt: bigintValue(i[9], "startsAt").toString(), expiresAt: bigintValue(i[10], "expiresAt").toString(), allowedActionsBitmap: bigintValue(i[11], "allowedActionsBitmap").toString(), status: statusLabel(r[0]), completed: Number(r[1]), missed: Number(r[2]), abstained: Number(r[3]), consecutiveLosses: Number(r[4]), reservedSpend: bigintValue(r[5], "reservedSpend").toString(), provenance: { source: "CircuitRegistry JSON-RPC", chainId: SHANNON_CHAIN_ID } };
}
export function parseForecastRead(raw: unknown) {
  const v = tuple(raw); if (v.length < 16) throw new ReadFailure("UPSTREAM_MALFORMED", "Forecast tuple is incomplete");
  return { forecastId: bytes32(String(v[0])), marketId: bytes32(String(v[1])), forecaster: address(v[2]), pUpBps: Number(v[3]), referenceUpBps: Number(v[4]), referenceValid: Boolean(v[5]), committedAt: bigintValue(v[6], "committedAt").toString(), committedBlock: bigintValue(v[7], "committedBlock").toString(), secondsToExpiry: Number(v[8]), actionIntent: Number(v[10]), status: (["NONE", "COMMITTED", "SCORED", "VOIDED"] as const)[Number(v[11])] ?? "UNKNOWN", outcome: Number(v[12]), forecastBrier: Number(v[13]), marketBrier: Number(v[14]), marketScoreDelta: String(v[15]), provenance: { source: "RFTRegistry JSON-RPC", chainId: SHANNON_CHAIN_ID } };
}

export class LiveReadAdapter {
  private readonly request: RpcRequest;
  private checked = false;
  constructor(private readonly config: { rpcUrl?: string; request?: RpcRequest } = {}) {
    this.request = config.request ?? (async (method, params) => { const response = await fetch(config.rpcUrl ?? DEFAULT_RPC, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) }); if (!response.ok) throw new RpcReadError(`RPC HTTP ${response.status}`); const body = await response.json() as { result?: unknown; error?: { message?: string } }; if (body.error) throw new RpcReadError(body.error.message ?? "RPC error"); return body.result; });
  }
  private async ensureChain() { if (this.checked) return; let value: unknown; try { value = await this.request("eth_chainId", []); } catch (error) { throw error instanceof RpcReadError ? error : new RpcReadError(error instanceof Error ? error.message : "RPC unavailable"); } try { if (Number(BigInt(String(value))) !== SHANNON_CHAIN_ID) throw new ReadFailure("CHAIN_MISMATCH", "RPC chainId is not Somnia Shannon (50312)"); } catch (error) { if (error instanceof ReadFailure) throw error; throw new ReadFailure("UPSTREAM_MALFORMED", "RPC returned an invalid chainId"); } this.checked = true; }
  private async call<T = unknown>(addressToRead: Address, abi: readonly unknown[], functionName: string, args: readonly unknown[]): Promise<T> { await this.ensureChain(); let data: unknown; try { data = await this.request("eth_call", [{ to: addressToRead, data: encodeFunctionData({ abi: abi as any, functionName: functionName as any, args: args as any }) }, "latest"]); } catch (error) { throw error instanceof RpcReadError ? error : new RpcReadError(error instanceof Error ? error.message : "RPC unavailable"); } if (typeof data !== "string" || !/^0x[\da-f]*$/i.test(data) || data === "0x") throw new ReadFailure("UPSTREAM_MALFORMED", "RPC returned empty or malformed eth_call data"); try { return decodeFunctionResult({ abi: abi as any, functionName: functionName as any, data: data as Hex }) as T; } catch { throw new ReadFailure("UPSTREAM_MALFORMED", "RPC result does not match verified ABI"); } }
  async readMarket(marketId: Hex) { const market = await this.call<unknown>(SHANNON_ADDRESSES.binaryModule, binaryModuleReadAbi as any, "markets", [bytes32(marketId)]); const nonce = await this.call<unknown>(SHANNON_ADDRESSES.binaryModule, binaryModuleReadAbi as any, "marketNonce", [bytes32(marketId)]); return parseMarketRead(market, bigintValue(nonce, "nonce"), marketId); }
  async readCircuit(circuitId: Hex) { const [intent, runtime] = await Promise.all([this.call<unknown>(SHANNON_ADDRESSES.circuitRegistry, circuitAbi, "intents", [bytes32(circuitId)]), this.call<unknown>(SHANNON_ADDRESSES.circuitRegistry, circuitAbi, "runtime", [bytes32(circuitId)])]); return parseCircuitRead({ intent, runtime }, 0n); }
  async readForecast(forecastId: Hex) { const result = await this.call<unknown>(SHANNON_ADDRESSES.rftRegistry, rftAbi, "getTrial", [bytes32(forecastId)]); return parseForecastRead(result); }
}
