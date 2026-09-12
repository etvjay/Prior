import { NextResponse } from "next/server";
import { keccak256, stringToHex } from "viem";

export const runtime = "edge";
export const dynamic = "force-dynamic";
const REGISTRY = "0x1eD3B2310F369977ef82569498d5F678f8B73104";
const RPC = process.env.SHANNON_RPC_HTTP ?? "https://dream-rpc.somnia.network";
const CREATED_TOPIC = keccak256(stringToHex("CircuitCreated(bytes32,address,uint8,uint16)"));

function ownerTopic(owner: string) { return `0x${"0".repeat(24)}${owner.slice(2).toLowerCase()}`; }
export async function GET(request: Request) {
  const owner = new URL(request.url).searchParams.get("owner") ?? "";
  if (!/^0x[0-9a-fA-F]{40}$/.test(owner)) return NextResponse.json({ code: "INVALID_OWNER", message: "owner must be an EVM address" }, { status: 400 });
  try {
    const call = async (method: string, params: unknown[]) => { const response = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) }); if (!response.ok) throw new Error(`RPC_HTTP_${response.status}`); const body = await response.json() as { result?: unknown; error?: { message?: string } }; if (body.error) throw new Error(body.error.message ?? "RPC_ERROR"); return body.result; };
    const latest = BigInt(String(await call("eth_blockNumber", [])));
    const fromBlock = latest > 200_000n ? latest - 200_000n : 0n;
    const logs = await call("eth_getLogs", [{ address: REGISTRY, fromBlock: `0x${fromBlock.toString(16)}`, toBlock: `0x${latest.toString(16)}`, topics: [CREATED_TOPIC, null, ownerTopic(owner)] }]) as Array<{ topics?: string[]; blockNumber?: string; transactionHash?: string }>;
    const items = (logs ?? []).map((log) => ({ circuitId: log.topics?.[1], owner, blockNumber: log.blockNumber, transactionHash: log.transactionHash, source: "LIVE · BOUNDED RECENT CircuitCreated EVENTS" })).filter((item) => item.circuitId);
    return NextResponse.json({ schemaVersion: "prior.circuits.discovery.v1", source: { mode: "LIVE", chainId: 50312, completeness: "BOUNDED", fromBlock: `0x${fromBlock.toString(16)}`, toBlock: `0x${latest.toString(16)}` }, items });
  } catch (error) { return NextResponse.json({ code: "OWNER_RECOVERY_UNAVAILABLE", message: error instanceof Error ? error.message : "bounded owner recovery failed" }, { status: 503 }); }
}
