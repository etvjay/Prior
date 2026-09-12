import Link from "next/link";

function PlainLanguageIntro() {
  return (
    <section className="plain-intro circuit-hero" aria-labelledby="plain-intro-title">
      <div className="plain-intro-copy">
        <p className="plain-kicker">The continuity layer for recurring event markets</p>
        <h1 id="plain-intro-title">One bounded intent. Many markets. Every result connected.</h1>
        <p className="plain-lede">A Circuit carries one set of rules across a declared sequence of markets. Each market gets its own Forecast and evidence record, while the intent keeps moving.</p>
        <div className="plain-actions">
          <Link className="primary-button" href="/participate">PARTICIPATE</Link>
          <Link className="secondary-button" href="/create">CREATE &amp; RUN</Link>
          <Link className="text-link" href="/proof">EXPLORE PROOF →</Link>
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

function RoleSeparation() {
  return (
    <section className="role-separation" aria-labelledby="role-separation-title">
      <div className="role-separation-heading">
        <p className="plain-kicker">Continuity needs clear responsibility</p>
        <h2 id="role-separation-title">Different roles. One accountable flow.</h2>
        <p>No single agent gets to define the intent, invent the evidence, and act without a boundary. Each role has one job in the Circuit.</p>
      </div>
      <div className="role-grid">
        <article><span>01 · OWNER</span><h3>Sets the intent</h3><p>Declares the market scope, policy, budget, authority, and stop conditions.</p><b>CONFIGURES</b></article>
        <article><span>02 · FORECASTER</span><h3>Supplies belief</h3><p>Commits one probability for one market before that market resolves.</p><b>COMMITS</b></article>
        <article><span>03 · RUNNER</span><h3>Keeps it moving</h3><p>Finds the next eligible market and progresses the Circuit without rewriting its rules.</p><b>PROGRESSES</b></article>
        <article><span>04 · EXECUTOR</span><h3>Acts within bounds</h3><p>Performs an allowed economic action only when the Circuit grants that authority.</p><b>OPTIONAL ACTION</b></article>
      </div>
      <div className="role-boundary"><span>THE BOUNDARY</span><strong>The Runner can keep the Circuit alive. It cannot change what the Circuit means.</strong></div>
    </section>
  );
}

function ResolutionEvidence() {
  return (
    <section className="resolution-evidence" id="resolution-evidence" aria-labelledby="resolution-evidence-title">
      <div className="resolution-copy">
        <p className="plain-kicker">After reality answers</p>
        <h2 id="resolution-evidence-title">The market resolves. The belief stays attached.</h2>
        <p>A Forecast is not replaced by the outcome. Its original probability, timing, market, and forecaster remain visible inside the RFT, now joined by the canonical result and score.</p>
        <div className="resolution-caption"><span>RFT</span><strong>One evidence trail from commitment through resolution.</strong></div>
      </div>
      <div className="resolution-record" aria-label="Illustrative Forecast evidence record before and after market resolution">
        <div className="resolution-record-head"><span>ILLUSTRATIVE EVIDENCE RECORD</span><b>FINALIZED</b></div>
        <div className="resolution-belief"><small>COMMITTED BEFORE RESOLUTION</small><strong>72% UP</strong><span>Forecast · Market 1 · BTC 15M</span></div>
        <div className="resolution-divider" aria-hidden="true"><i /> <b>MARKET RESOLVES</b> <i /></div>
        <div className="resolution-outcome"><div><small>CANONICAL OUTCOME</small><strong>UP</strong></div><div><small>FORECAST SCORE</small><strong>0.0784</strong></div></div>
        <p className="resolution-footnote">The score is derived after resolution. It does not rewrite the original belief.</p>
      </div>
    </section>
  );
}

function AuthorityBoundary() {
  return (
    <section className="authority-boundary" id="authority-boundary" aria-labelledby="authority-boundary-title">
      <div className="authority-copy">
        <p className="plain-kicker">The boundary is part of the product</p>
        <h2 id="authority-boundary-title">A rule is only useful if it can say no.</h2>
        <p>The Circuit does not turn every Forecast into a trade. It checks the declared policy, budget, timing, and permissions first. If the action is outside the boundary, the Circuit abstains and the evidence still remains.</p>
        <div className="authority-callout"><span>CORE RULE</span><strong>Belief can continue even when execution is refused.</strong></div>
      </div>
      <div className="authority-record" aria-label="Illustrative Circuit authority decision showing an action refused while evidence is preserved">
        <div className="authority-record-head"><span>ILLUSTRATIVE CIRCUIT DECISION</span><b>BOUNDED</b></div>
        <div className="authority-checks">
          <div><span>FORECAST</span><strong>72% UP</strong><em>committed</em></div>
          <div><span>POLICY</span><strong>8 POINT GAP</strong><em>required threshold</em></div>
          <div><span>AUTHORITY</span><strong>NO ACTION</strong><em>not granted</em></div>
        </div>
        <div className="authority-result"><small>RESULT</small><strong>ABSTAIN</strong><p>No trade was placed. The Forecast still becomes an RFT and can be scored after resolution.</p></div>
      </div>
    </section>
  );
}

function FinalHandoff() {
  return (
    <section className="final-handoff" aria-labelledby="final-handoff-title">
      <div className="final-handoff-heading">
        <p className="plain-kicker">The whole Circuit, in one line</p>
        <h2 id="final-handoff-title">Belief becomes evidence. Intent keeps going.</h2>
        <p>PRIOR connects the Forecast, the rule, the decision, and the result without pretending they are the same thing.</p>
      </div>
      <div className="handoff-loop" aria-label="Circuit continuity summary">
        <span>INTENT</span><i>→</i><span>MARKET</span><i>→</i><span>FORECAST</span><i>→</i><span>RFT</span><i>→</i><span>POLICY</span><i>→</i><span>RESULT</span><i>↻</i><span>NEXT MARKET</span>
      </div>
      <div className="handoff-actions">
        <div className="handoff-action-copy"><span>START WITH THE OBJECT</span><strong>Follow one Circuit from its intent to its next market.</strong></div>
        <div className="handoff-buttons"><Link className="primary-button" href="/live">OPEN LIVE VIEW</Link><Link className="secondary-button" href="/forecast/0x9d0ce9d1542b3dc1261e4cf73a1f18b24b9fa61e3dec72b7407823156b954f66">INSPECT RESOLVED EVIDENCE</Link></div>
      </div>
      <div className="handoff-boundary"><span>WHAT THIS BUILD PROVES</span><p>It demonstrates bounded intent, attributable Forecast evidence, Circuit continuity, and deliberate refusal. Forecasting competence and autonomous economic execution are not established here.</p></div>
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
        <RoleSeparation />
        <ResolutionEvidence />
        <AuthorityBoundary />
        <FinalHandoff />
      </main>
    </>
  );
}
