import Link from "next/link";
import { LandingScenes } from "./LandingScenes";

function PlainLanguageIntro() {
  return (
    <section className="plain-intro circuit-hero" aria-labelledby="plain-intro-title">
      <div className="plain-intro-copy">
        <p className="plain-kicker">The continuity layer for recurring event markets</p>
        <h1 id="plain-intro-title">One bounded intent. Many markets. Every result connected.</h1>
        <p className="plain-lede">A Circuit carries one set of rules across a declared sequence of markets. Each market gets its own Forecast and evidence record, while the intent keeps moving.</p>
        <div className="plain-actions">
          <Link className="primary-button" href="/live">SEE A CIRCUIT IN MOTION</Link>
          <a className="secondary-button" href="#how-it-works">HOW IT WORKS</a>
        </div>
      </div>
      <div className="circuit-hero-visual" aria-label="A persistent Circuit carrying one intent across three market iterations">
        <div className="circuit-hero-intent">
          <div><span className="circuit-status-dot" /> <small>ILLUSTRATIVE CIRCUIT · ACTIVE INTENT</small></div>
          <strong>BTC · 15 MINUTES</strong>
          <p>Use this Forecast source when the difference is at least 8 points. Stop after 2 losses.</p>
          <div className="circuit-hero-limits"><span>8 markets</span><span>$15 / market</span><span>$100 total</span></div>
        </div>
        <div className="circuit-hero-connector" aria-hidden="true" />
        <ol className="circuit-hero-iterations">
          <li><b>01</b><div><strong>Market 1</strong><span>Forecast → RFT → abstain</span></div><em>RESOLVED EVIDENCE</em></li>
          <li><b>02</b><div><strong>Market 2</strong><span>Forecast → RFT → policy</span></div><em>CURRENT ITERATION</em></li>
          <li className="is-next"><b>03</b><div><strong>Market 3</strong><span>next eligible market</span></div><em>WAITING</em></li>
        </ol>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="how-it-works continuity-section" id="how-it-works" aria-labelledby="how-it-works-title">
      <div className="continuity-heading">
        <div>
          <p className="plain-kicker">One intent, repeated iterations</p>
          <h2 id="how-it-works-title">The Circuit persists. The evidence changes.</h2>
        </div>
        <p>A Forecast belongs to one market. An RFT carries that Forecast from commitment through resolution. The Circuit connects each iteration without recreating the intent.</p>
      </div>
      <div className="continuity-map" aria-label="One persistent Circuit connected to three market evidence iterations">
        <div className="continuity-spine"><span className="continuity-spine-dot" /><strong>CIRCUIT</strong><small>persistent bounded intent</small><i /></div>
        <ol className="continuity-iterations">
          <li><span className="continuity-number">01</span><div className="continuity-market"><small>MARKET 1 · BTC 15M</small><strong>Forecast</strong><b>72% UP</b><span>RFT · resolved evidence</span></div><em>DONE</em></li>
          <li className="is-current"><span className="continuity-number">02</span><div className="continuity-market"><small>MARKET 2 · BTC 15M</small><strong>Forecast</strong><b>64% UP</b><span>RFT · policy evaluation</span></div><em>CURRENT</em></li>
          <li className="is-next"><span className="continuity-number">03</span><div className="continuity-market"><small>MARKET 3 · BTC 15M</small><strong>Next eligible market</strong><b>—</b><span>new Forecast when it opens</span></div><em>NEXT</em></li>
        </ol>
      </div>
      <div className="continuity-definitions">
        <p><span>FORECAST</span>one belief about one market</p>
        <p><span>RFT</span>the evidence trail of that belief</p>
        <p><span>CIRCUIT</span>the intent spanning many markets</p>
      </div>
    </section>
  );
}

function IterationFlow() {
  return (
    <section className="iteration-flow" id="iteration-flow" aria-labelledby="iteration-flow-title">
      <div className="iteration-flow-heading">
        <p className="plain-kicker">Inside every market iteration</p>
        <h2 id="iteration-flow-title">The intent stays the same. The market gets a new answer.</h2>
        <p>Each eligible Event Contract passes through the same sequence. The Circuit does not restart. It moves forward with a new piece of evidence.</p>
      </div>
      <ol className="iteration-flow-track" aria-label="Market iteration lifecycle">
        <li><span>01</span><strong>Market opens</strong><p>A new eligible Event Contract enters the Circuit’s declared scope.</p><small>ELIGIBLE MARKET</small></li>
        <li><span>02</span><strong>Belief is stated</strong><p>The Forecaster gives one probability before this market resolves.</p><small>FORECAST</small></li>
        <li><span>03</span><strong>Evidence is carried</strong><p>The RFT preserves who believed what, when, and against which market.</p><small>RFT</small></li>
        <li><span>04</span><strong>Rule is applied</strong><p>The Circuit checks its policy, limits, and stop conditions.</p><small>POLICY</small></li>
        <li><span>05</span><strong>Reality resolves</strong><p>Trade or abstention remains separate from the final scored evidence.</p><small>RESOLUTION</small></li>
      </ol>
    </section>
  );
}

export default function LandingPage() {
  return (
    <>
      <header className="landing-topbar">
        <Link className="wordmark" href="/" aria-label="PRIOR home">PRIOR</Link>
        <span>RECORD BELIEF · SET BOUNDARIES · INSPECT RESULTS</span>
      </header>
      <main id="main">
        <PlainLanguageIntro />
        <HowItWorks />
        <IterationFlow />
        <div className="deep-dive-heading"><span>FOR PEOPLE WHO WANT THE FULL MODEL</span><h2>How belief becomes evidence.</h2></div>
        <LandingScenes />
      </main>
    </>
  );
}
