import { Header } from "../../components";
import { GuidedAuthorize } from "../../GuidedAuthorize";

export default function Circuit({ params }: { params: { id: string } }) {
  return <><Header /><main className="page">
    <div className="eyebrow">Circuit control room · {params.id}</div>
    <h1>One intent. Many markets.</h1>
    <section className="notice">
      <div className="eyebrow">EXECUTION MODE — GUIDED</div>
      <h2>Owner approval required</h2>
      <p>The Circuit derives the complete action. Your signature authorizes only this exact proposal; it cannot change the market, side, price, quantity, or expiry.</p>
      <div className="list">
        <div className="list-row"><span>Forecast</span><strong>72% Up</strong></div>
        <div className="list-row"><span>Minimum margin</span><strong>8 points</strong></div>
        <div className="list-row"><span>Max permitted price</span><strong>64%</strong></div>
        <div className="list-row"><span>Current executable price</span><strong>63%</strong></div>
        <div className="list-row"><span>Decision</span><strong>BUY UP · IOC</strong></div>
        <div className="list-row"><span>Authority</span><strong>OWNER APPROVAL REQUIRED</strong></div>
      </div>
      <GuidedAuthorize transaction={null} />
      <p className="mono">SIGNED → SUBMITTED → FILLED / NO FILL → WAITING FOR RESOLUTION → RFT FINALIZED</p>
    </section>
    <div className="notice"><span className="eyebrow">AUTONOMOUS MODE</span><br /><br />Requires DreamDEX executor contract admission. Current live status: BLOCKED_EXTERNAL (`OnlyApprovedContracts()`).</div>
  </main></>;
}
