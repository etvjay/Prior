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
    <section className="how-it-works" id="how-it-works" aria-labelledby="how-it-works-title">
      <div>
        <p className="plain-kicker">Three things to remember</p>
        <h2 id="how-it-works-title">A prediction is not permission.</h2>
      </div>
      <div className="plain-cards">
        <article><span>01</span><h3>Record the belief</h3><p>The prediction is saved with a timestamp, so it cannot be quietly changed after the answer.</p></article>
        <article><span>02</span><h3>Set the boundary</h3><p>A Circuit is a written rule for who matters, when they matter, and what may happen next.</p></article>
        <article><span>03</span><h3>Inspect the result</h3><p>Compare the original belief with the market, the outcome, and any action separately.</p></article>
      </div>
      <p className="plain-note">PRIOR does not claim that one prediction proves an AI is good. It gives you a record you can inspect.</p>
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
        <div className="deep-dive-heading"><span>FOR PEOPLE WHO WANT THE FULL MODEL</span><h2>How belief becomes evidence.</h2></div>
        <LandingScenes />
      </main>
    </>
  );
}
