import Link from "next/link";
import { CONTINUITY, CONTINUITY_ID, short } from "../evidence";
import { PriorHeader } from "../components";
import { CircuitBuilder } from "./CircuitBuilder";

export default function CircuitsPage() {
  return <><PriorHeader/><main id="main" className="page-shell"><header className="page-heading"><span className="instrument-label">PERSISTENT EXECUTION INTENT</span><h1>CIRCUITS</h1><p>Rules stay fixed. Markets change. Every iteration remains evidence.</p></header><section className="circuit-groups"><div className="group-label">ACTIVE AT ACCEPTED SNAPSHOT</div><article className="circuit-row"><div><span>BTC · 5m</span><h2>CIRCUIT 04</h2><small className="mono">{short(CONTINUITY_ID)}</small></div><div><strong>{CONTINUITY.restart.reconstructed.completed} / {CONTINUITY.immutableIntent.targetWindows}</strong><span>markets processed</span></div><div><strong>2</strong><span>policy abstentions</span></div><div className="micro-timeline" aria-label="Two resolved, two future at accepted snapshot"><i className="resolved">✓</i><i className="resolved">✓</i><i>○</i><i>○</i></div><div><span className="blocked">AUTONOMOUS PATH BLOCKED_EXTERNAL</span><Link className="secondary-button" href={`/circuit/${CONTINUITY_ID}`}>OPEN</Link></div></article><div className="group-label">PAUSED</div><p className="empty-row">No paused Circuits in accepted evidence.</p><div className="group-label">COMPLETE</div><p className="empty-row">No completed multi-market Circuits in accepted evidence.</p></section><CircuitBuilder/></main></>;
}
