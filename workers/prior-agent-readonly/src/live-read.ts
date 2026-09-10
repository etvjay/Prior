import { binaryModuleReadAbi } from "@somnia-chain/markets-sdk";
import { decodeFunctionResult, encodeFunctionData, type Address, type Hex } from "viem";

export const EVIDENCE_MODE = "SHANNON_RPC_READ_ONLY" as const;
export const SHANNON_CHAIN_ID = 50312;
export const SHANNON_ADDRESSES = Object.freeze({
  binaryModule: "0x3ecC694Cef705358864a646142ac17A90E29e388" as Address,
  rftRegistry: "0x5b1B51cB062B7B782c9EC2Bd5674eFAdb5308F41" as Address,
  circuitRegistry: "0x1eD3B2310F369977ef82569498d5F678f8B73104" as Address,
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

function field(value: unknown, index: number, name: string): unknown { if (Array.isArray(value)) return value[index]; if (value && typeof value === "object") return (value as Record<string, unknown>)[name]; throw new ReadFailure("UPSTREAM_MALFORMED", "RPC returned a non-tuple result"); }
function tuple(value: unknown): readonly unknown[] { if (Array.isArray(value)) return value; if (value && typeof value === "object") return Object.keys(value).filter((k) => /^\d+$/.test(k)).sort((a, b) => Number(a) - Number(b)).map((k) => (value as Record<string, unknown>)[k]); throw new ReadFailure("UPSTREAM_MALFORMED", "RPC returned a non-tuple result"); }
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
  const i = raw.intent, r = raw.runtime; if ((tuple(i).length < 1 && !(i && typeof i === "object")) || (tuple(r).length < 1 && !(r && typeof r === "object"))) throw new ReadFailure("UPSTREAM_MALFORMED", "Circuit tuple is incomplete");
  return { circuitId: bytes32(String(field(i, 0, "circuitId"))), owner: address(field(i, 1, "owner")), forecaster: address(field(i, 2, "forecaster")), marketClass: Number(field(i, 3, "marketClass")), targetWindows: Number(field(i, 4, "targetWindows")), totalBudget: bigintValue(field(i, 5, "totalBudget"), "totalBudget").toString(), maxPerMarket: bigintValue(field(i, 6, "maxPerMarket"), "maxPerMarket").toString(), minMarginBps: Number(field(i, 7, "minMarginBps")), startsAt: bigintValue(field(i, 9, "startsAt"), "startsAt").toString(), expiresAt: bigintValue(field(i, 10, "expiresAt"), "expiresAt").toString(), allowedActionsBitmap: bigintValue(field(i, 11, "allowedActionsBitmap"), "allowedActionsBitmap").toString(), status: statusLabel(field(r, 0, "status")), completed: Number(field(r, 1, "completed")), missed: Number(field(r, 2, "missed")), abstained: Number(field(r, 3, "abstained")), consecutiveLosses: Number(field(r, 4, "consecutiveLosses")), reservedSpend: bigintValue(field(r, 5, "reservedSpend"), "reservedSpend").toString(), provenance: { source: "CircuitRegistry JSON-RPC", chainId: SHANNON_CHAIN_ID } };
}
export function parseForecastRead(raw: unknown) {
  const v = tuple(raw); if (v.length < 16 && !(raw && typeof raw === "object")) throw new ReadFailure("UPSTREAM_MALFORMED", "Forecast tuple is incomplete");
  return { forecastId: bytes32(String(field(raw, 0, "trialId"))), marketId: bytes32(String(field(raw, 1, "marketId"))), forecaster: address(field(raw, 2, "forecaster")), pUpBps: Number(field(raw, 3, "pUpBps")), referenceUpBps: Number(field(raw, 4, "referenceUpBps")), referenceValid: Boolean(field(raw, 5, "referenceValid")), committedAt: bigintValue(field(raw, 6, "committedAt"), "committedAt").toString(), committedBlock: bigintValue(field(raw, 7, "committedBlock"), "committedBlock").toString(), secondsToExpiry: Number(field(raw, 8, "secondsToExpiry")), actionIntent: Number(field(raw, 10, "actionIntent")), status: (["NONE", "COMMITTED", "SCORED", "VOIDED"] as const)[Number(field(raw, 11, "status"))] ?? "UNKNOWN", outcome: Number(field(raw, 12, "outcome")), forecastBrier: Number(field(raw, 13, "forecastBrier")), marketBrier: Number(field(raw, 14, "marketBrier")), marketScoreDelta: String(field(raw, 15, "marketScoreDelta")), provenance: { source: "RFTRegistry JSON-RPC", chainId: SHANNON_CHAIN_ID } };
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
