import Link from "next/link";
import { LandingScenes } from "./LandingScenes";

function PlainLanguageIntro() {
  return (
    <section className="plain-intro" aria-labelledby="plain-intro-title">
      <div className="plain-intro-copy">
        <p className="plain-kicker">A clearer way to work with AI decisions</p>
        <h1 id="plain-intro-title">See what an AI believed before you decide what it can do.</h1>
        <p className="plain-lede">PRIOR records a prediction before the answer is known, shows the rule that limits it, and keeps the final result attached to the original evidence.</p>
        <div className="plain-actions">
          <Link className="primary-button" href="/live">SEE A REAL EXAMPLE</Link>
          <a className="secondary-button" href="#how-it-works">HOW IT WORKS</a>
        </div>
      </div>
      <div className="plain-preview" aria-label="A simple example of a prediction becoming evidence">
        <div className="plain-preview-step"><span>1</span><strong>AI says</strong><b>72% likely</b><small>before the result</small></div>
        <div className="plain-preview-line" aria-hidden="true" />
        <div className="plain-preview-step"><span>2</span><strong>Your rule says</strong><b>no trade</b><small>the AI has no wallet</small></div>
        <div className="plain-preview-line" aria-hidden="true" />
        <div className="plain-preview-step"><span>3</span><strong>Reality says</strong><b>UP</b><small>now the record can be scored</small></div>
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
