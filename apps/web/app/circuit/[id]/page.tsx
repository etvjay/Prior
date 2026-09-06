import { Header } from "../../components";
import { GuidedAuthorize } from "../../GuidedAuthorize";
import { CircuitLiveState } from "../CircuitLiveState";

export default function Circuit({ params }: { params: { id: string } }) {
  return <><Header /><main className="page"><CircuitLiveState id={params.id} />
    <div className="eyebrow">Circuit control room · {params.id}</div>
    <h1>One intent. Many markets.</h1>
    <section className="notice">
      <div className="eyebrow">EXECUTION MODE — GUIDED</div>
      <h2>Owner approval required</h2>
      <p>When a live proposal exists, the Circuit computes every execution term before owner authorization. This page will not invent Forecast, reference, price, liquidity, decision, or order evidence.</p>
      <div className="list">
        <div className="list-row"><span>Proposal state</span><strong>WAITING FOR LIVE PROPOSAL</strong></div>
        <div className="list-row"><span>Authority</span><strong>OWNER AUTHORIZATION REQUIRED</strong></div>
      </div>
      <GuidedAuthorize transaction={null} />
      <p className="mono">SIGNED → SUBMITTED → FILLED / NO FILL → WAITING FOR RESOLUTION → RFT FINALIZED</p>
    </section>
    <div className="notice"><span className="eyebrow">AUTONOMOUS MODE</span><br /><br />Requires DreamDEX executor contract admission. Current live status: BLOCKED_EXTERNAL (`OnlyApprovedContracts()`).</div>
  </main></>;
}
