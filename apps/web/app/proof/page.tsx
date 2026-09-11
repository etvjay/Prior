import Link from "next/link";
import hero from "../../../../evidence/m4-3-live-zero-action-lifecycle.json";
import { PriorHeader } from "../components";

const short = (value: string, head = 12, tail = 10) => `${value.slice(0, head)}…${value.slice(-tail)}`;
const pct = (bps: number) => `${(bps / 100).toFixed(2)}% UP`;

function Fact({ label, value, source = "ARCHIVED EVIDENCE" }: { label: string; value: string; source?: string }) {
  return <div className="proof-fact"><span>{label}</span><strong>{value}</strong><small>{source}</small></div>;
}

export default function ProofPage() {
  return <><PriorHeader/><main id="main" className="proof-page">
    <header className="proof-hero">
      <div><span className="instrument-label">PRIOR · CANONICAL V2 HERO PROOF</span><h1>JUDGMENT<br/><em>WITH BOUNDS.</em></h1><p>One external Forecast became attributable evidence. One Circuit determined what it could cause. The market resolved. The RFT recorded what happened.</p></div>
      <aside className="proof-status"><span>ARCHIVED EVIDENCE</span><strong>LIVE SHANNON<br/>READBACK</strong><small>Canonical artifact · chain ID 50312 · zero economic execution</small></aside>
    </header>

    <section className="proof-chain" aria-label="Canonical causal proof chain">
      <div className="proof-step"><b>01</b><span>WHO MADE THE JUDGMENT?</span><h2>External Forecaster</h2><Fact label="Forecaster" value={short(hero.forecaster)} source="EIP712 RECOVERED"/><Fact label="Signature" value="EIP712_V2" source="RECOVERED ADDRESS MATCH"/></div>
      <div className="proof-arrow">↓</div>
      <div className="proof-step"><b>02</b><span>WHAT DID THEY BELIEVE?</span><h2>50.00% probability</h2><Fact label="Forecast" value={pct(hero.forecast.probabilityUpBps)} source="RFT COMMITMENT"/><Fact label="Market" value={`${hero.market.asset} · ${hero.market.intervalSec / 3600}H`} source="MARKET ID CANONICAL"/><Fact label="Committed" value={`Block ${hero.receipts.commit.block}`} source="SHANNON WRITE VERIFIED"/></div>
      <div className="proof-arrow">↓</div>
      <div className="proof-step"><b>03</b><span>WHAT AUTHORITY EXISTED?</span><h2>Bounded Circuit</h2><Fact label="Circuit" value={short(hero.circuitId)} source="CIRCUITREGISTRYV2"/><Fact label="Owner" value={short(hero.owner)} source="CANONICAL READBACK"/><Fact label="Budget" value="0 economic authority" source="INTENT: NONE"/><Fact label="Allowed actions" value="0" source="BITMAP"/></div>
      <div className="proof-arrow">↓</div>
      <div className="proof-step proof-consequence"><b>04</b><span>WHAT WAS IT ALLOWED TO DO?</span><h2>Deliberate refusal</h2><div className="refusal"><strong>BUY_UP</strong><span>ActionNotAllowed</span></div><div className="refusal"><strong>BUY_DOWN</strong><span>ActionNotAllowed</span></div><small>No order · no collateral · no approvals · no operator permissions</small></div>
      <div className="proof-arrow">↓</div>
      <div className="proof-step"><b>05</b><span>WHAT ACTUALLY HAPPENED?</span><h2>Canonical outcome</h2><Fact label="Settlement" value="DOWN" source="DREAMDEX READBACK"/><Fact label="Finalized" value="true" source={`BLOCK ${hero.receipts.finalize.block}`}/><Fact label="Payout" value="[0, 10000000]" source="SETTLEMENT CONTRACT"/></div>
      <div className="proof-arrow">↓</div>
      <div className="proof-step proof-final"><b>06</b><span>HOW DID JUDGMENT PERFORM?</span><h2>RFT · SCORED</h2><Fact label="Trial / RFT" value={short(hero.trialId)} source="RFTREGISTRY"/><Fact label="Forecast Brier" value={hero.trialFinal.forecastBrier} source="CANONICAL SCORE"/><Fact label="Market reference" value="Unavailable" source="REFERENCEVALID = FALSE"/><Fact label="Circuit" value="COMPLETE · processed=true" source={`ADVANCE BLOCK ${hero.receipts.advance.block}`}/></div>
    </section>

    <section className="proof-verify"><header><span className="instrument-label">VERIFY THE CHAIN</span><h2>Every claim has an object, receipt, or readback.</h2></header><div className="proof-identifiers"><Fact label="Market ID" value={hero.market.marketId}/><Fact label="Circuit ID" value={hero.circuitId}/><Fact label="Trial ID" value={hero.trialId}/><Fact label="Commit tx" value={short(hero.receipts.commit.tx)}/><Fact label="Finalize tx" value={short(hero.receipts.finalize.tx)}/><Fact label="Advance tx" value={short(hero.receipts.advance.tx)}/></div><p className="proof-note">The canonical market reference was unavailable, so no comparison metric is fabricated. This proof demonstrates attributable judgment and bounded consequence—not Forecast competence or autonomous trading.</p><div className="proof-actions"><Link className="primary-button" href={`/forecast/${hero.trialId}`}>OPEN RFT EVIDENCE →</Link><Link className="secondary-button" href={`/circuit/${hero.circuitId}`}>OPEN CIRCUIT VIEW →</Link><a className="text-link" href="https://prior-agent-readonly.microcosm.workers.dev/v1/forecasts/0x9d0ce9d1542b3dc1261e4cf73a1f18b24b9fa61e3dec72b7407823156b954f66">LIVE RFT JSON ↗</a></div></section>
  </main></>;
}
