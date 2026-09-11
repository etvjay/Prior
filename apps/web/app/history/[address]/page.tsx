import { ACCEPTED_FORECASTS, OWNER, short } from "../../evidence";
import { HistoryModes, PriorHeader } from "../../components";

export default function HistoryPage({ params }: { params: { address: string } }) {
  const disconnected = params.address.toLowerCase() === "connect-wallet";
  const accepted = !disconnected && params.address.toLowerCase() === OWNER.toLowerCase();
  const scoped=ACCEPTED_FORECASTS.filter(f=>f.label==="BTC"&&f.interval==="5 MIN");return <><PriorHeader/><main id="main" className="page-shell"><header className="page-heading"><span className="instrument-label">FORECAST HISTORY</span><h1>{disconnected ? "CONNECT WALLET TO VIEW HISTORY." : <>ONE FORECAST IS EVIDENCE.<br/>MANY BECOME A RECORD.</>}</h1><p className="mono">{disconnected ? "No wallet connected" : short(params.address, 12, 10)}</p></header>{accepted ? <><div className="scope-banner">BTC · 5 MIN · SOMNIA SHANNON · ACCEPTED EVIDENCE ONLY · n={scoped.length}</div><HistoryModes forecasts={scoped}/></> : <section className="empty-state"><h2>{disconnected ? "WALLET CONNECTION REQUIRED." : "NO RESOLVED FORECASTS YET."}</h2><p>{disconnected ? "Use CONNECT WALLET above to load history for the connected account." : "No accepted chain and DreamDEX evidence is associated with this address."}</p></section>}</main></>;
}
