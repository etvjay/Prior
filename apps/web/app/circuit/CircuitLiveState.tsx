import { createPublicClient, http, isHex } from "viem";
import { CONTINUITY, CONTINUITY_ID, percent, short } from "../evidence";

const registry = "0xf92609D45f164DaB74dC51Cd59B583DA95e3C460" as const;
const abi = [{ type: "function", name: "runtime", stateMutability: "view", inputs: [{ name: "id", type: "bytes32" }], outputs: [{ type: "tuple", components: [{ type: "uint8", name: "status" }, { type: "uint16", name: "completed" }, { type: "uint16", name: "missed" }, { type: "uint16", name: "abstained" }, { type: "uint8", name: "consecutiveLosses" }, { type: "uint128", name: "reservedSpend" }] }] }] as const;
const client = createPublicClient({ chain: { id: 50312, name: "Somnia Shannon", nativeCurrency: { name: "STT", symbol: "STT", decimals: 18 }, rpcUrls: { default: { http: ["https://dream-rpc.somnia.network"] } } } as any, transport: http("https://dream-rpc.somnia.network") });
const statusNames = ["DRAFT", "AUTHORIZED", "ACTIVE", "PAUSED", "STOPPED", "COMPLETE", "EXPIRED", "REVOKED"] as const;

export async function CircuitLiveState({ id }: { id: string }) {
  if (!isHex(id) || id.length !== 66) return <div className="notice">No live Circuit selected.</div>;
  const isCanonical = id.toLowerCase() === CONTINUITY_ID.toLowerCase();
  if (!isCanonical) return <div className="notice">No accepted evidence exists for this Circuit. No primary-demo row is shown.</div>;
  let chainStatus: string | null = null;
  try {
    const runtime: any = await client.readContract({ address: registry, abi, functionName: "runtime", args: [id as `0x${string}`] });
    chainStatus = statusNames[Number(runtime.status)] ?? "UNKNOWN";
  } catch { /* accepted evidence is the truthful fallback when RPC is unavailable */ }
  const intent = CONTINUITY.immutableIntent;
  const runtimeLabel = chainStatus ?? CONTINUITY.restart.reconstructed.effectiveStatusName;
  return <section className="circuit-state"><div className="eyebrow">Circuit state · {chainStatus ? "chain read" : "accepted evidence fallback"}</div><div className="list"><div className="list-row"><span>Effective status</span><strong className="violet">{runtimeLabel}</strong></div><div className="list-row"><span>Continuity</span><strong>{CONTINUITY.restart.reconstructed.completed} completed · {CONTINUITY.restart.reconstructed.abstained} abstained</strong></div><div className="list-row"><span>Intent</span><strong>{intent.targetWindows} windows · {percent(intent.minMarginBps)} minimum margin</strong></div><div className="list-row"><span>Budget</span><strong className="mono">{intent.totalBudget} total · {intent.maxPerMarket} max / market</strong></div><div className="list-row"><span>Owner</span><strong className="mono">{short(intent.owner, 10, 8)}</strong></div><div className="list-row"><span>Runner recovery</span><strong>restart reconstructed; no duplicates</strong></div></div></section>;
}
