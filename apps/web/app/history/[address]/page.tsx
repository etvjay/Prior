import { ACCEPTED_FORECASTS, OWNER, short } from "../../evidence";
import { HistoryModes, PriorHeader } from "../../components";

export default function HistoryPage({ params }: { params: { address: string } }) {
  const accepted = params.address.toLowerCase() === OWNER.toLowerCase();
  return <><PriorHeader/><main id="main" className="page-shell"><header className="page-heading"><span className="instrument-label">FORECAST HISTORY</span><h1>ONE FORECAST IS EVIDENCE.<br/>MANY BECOME A RECORD.</h1><p className="mono">{short(params.address, 12, 10)}</p></header>{accepted ? <><div className="scope-banner">BTC · 5 MIN · SOMNIA SHANNON · ACCEPTED EVIDENCE ONLY · n={ACCEPTED_FORECASTS.length}</div><HistoryModes forecasts={ACCEPTED_FORECASTS}/></> : <section className="empty-state"><h2>NO RESOLVED FORECASTS YET.</h2><p>No accepted chain and DreamDEX evidence is associated with this address.</p></section>}</main></>;
}
