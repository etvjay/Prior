import { createPublicClient, http, isHex } from "viem";

const registry = "0xf92609D45f164DaB74dC51Cd59B583DA95e3C460" as const;
const abi = [{ type:"function", name:"intents", stateMutability:"view", inputs:[{name:"id",type:"bytes32"}], outputs:[{type:"tuple",components:[{type:"bytes32",name:"circuitId"},{type:"address",name:"owner"},{type:"address",name:"forecaster"},{type:"uint8",name:"marketClass"},{type:"uint16",name:"targetWindows"},{type:"uint128",name:"totalBudget"},{type:"uint128",name:"maxPerMarket"},{type:"uint16",name:"minMarginBps"},{type:"uint8",name:"maxConsecutiveLosses"},{type:"uint64",name:"startsAt"},{type:"uint64",name:"expiresAt"},{type:"uint256",name:"allowedActionsBitmap"}]}] }, { type:"function", name:"runtime", stateMutability:"view", inputs:[{name:"id",type:"bytes32"}], outputs:[{type:"tuple",components:[{type:"uint8",name:"status"},{type:"uint16",name:"completed"},{type:"uint16",name:"missed"},{type:"uint16",name:"abstained"},{type:"uint8",name:"consecutiveLosses"},{type:"uint128",name:"reservedSpend"}]}] }] as const;
const client = createPublicClient({ chain:{id:50312,name:"Somnia Shannon",nativeCurrency:{name:"STT",symbol:"STT",decimals:18},rpcUrls:{default:{http:["https://dream-rpc.somnia.network"]}}} as any, transport:http("https://dream-rpc.somnia.network") });

export async function CircuitLiveState({ id }: { id: string }) {
  if (!isHex(id) || id.length !== 66) return <div className="notice">No live Circuit selected.</div>;
  try {
    const [intent, runtime, block] = await Promise.all([
      client.readContract({address:registry,abi,functionName:"intents",args:[id as `0x${string}`]}),
      client.readContract({address:registry,abi,functionName:"runtime",args:[id as `0x${string}`]}),
      client.getBlock(),
    ]);
    const i:any=intent, r:any=runtime; const expired=block.timestamp >= i.expiresAt && Number(r.status)!==5 && Number(r.status)!==7;
    const status=expired ? "EXPIRED" : (["DRAFT","AUTHORIZED","ACTIVE","PAUSED","STOPPED","COMPLETE","EXPIRED","REVOKED"] as const)[Number(r.status)] ?? "UNKNOWN";
    return <div className="list"><div className="list-row"><span>Effective status</span><strong>{status}</strong></div><div className="list-row"><span>Market class</span><strong>BTC · 1h</strong></div><div className="list-row"><span>Target windows</span><strong>{String(i.targetWindows)}</strong></div><div className="list-row"><span>Progress</span><strong>{String(r.completed)} / {String(i.targetWindows)} · {String(r.abstained)} abstained</strong></div><div className="list-row"><span>Owner</span><strong className="mono">{i.owner}</strong></div><div className="list-row"><span>Forecaster</span><strong className="mono">{i.forecaster}</strong></div><div className="list-row"><span>Minimum margin</span><strong>{String(i.minMarginBps)} bps</strong></div><div className="list-row"><span>Intent expiry</span><strong className="mono">{String(i.expiresAt)}</strong></div></div>;
  } catch { return <div className="notice">Live Circuit state unavailable. Retry against Shannon.</div>; }
}
