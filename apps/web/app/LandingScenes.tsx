"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ForecastNode, MarketNode } from "./components";
import { motion } from "./lib/motion";

const flowLabels = ["BELIEF", "MARKET", "YOU", "PROOF", "COMMITMENT", "REALITY", "EVIDENCE", "OBJECT", "INTENT"] as const;

function SceneIntro({ number, label }: { number: number; label: string }) {
  return (
    <div className="landing-scene-meta" aria-label={`Scene ${number} of 9, ${label}`}>
      <span>{String(number).padStart(2, "0")} / 09</span>
      <span>{label}</span>
      <div className="narrative-progress" aria-hidden="true">
        {flowLabels.map((item, index) => (
          <i className={index <= number - 1 ? "is-reached" : ""} key={item} />
        ))}
      </div>
    </div>
  );
}

function EvidenceFact({ label, value, tone }: { label: string; value: string; tone?: "market" | "forecast" }) {
  return (
    <div className={`evidence-fact${tone ? ` ${tone}` : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EnterPriorLink({ final = false }: { final?: boolean }) {
  const router = useRouter();
  const [entering, setEntering] = useState(false);

  useEffect(() => () => document.documentElement.removeAttribute("data-prior-route"), []);

  function enter(event: React.MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (entering) return;
    setEntering(true);
    document.documentElement.setAttribute("data-prior-route", "live");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => router.push("/live"), reduced ? 0 : motion.duration.route);
  }

  return (
    <Link
      className={`landing-primary${final ? " final-cta" : ""}`}
      href="/live"
      onClick={enter}
      aria-busy={entering}
    >
      ENTER PRIOR
    </Link>
  );
}

export function LandingScenes() {
  useEffect(() => {
    const scenes = document.querySelectorAll<HTMLElement>("[data-scene]");
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.target.classList.toggle("in-view", entry.isIntersecting)),
      { threshold: 0.24 },
    );
    scenes.forEach((scene) => observer.observe(scene));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-scenes">
      <section className="landing-scene landing-hero in-view" data-scene="1" aria-labelledby="scene-1">
        <SceneIntro number={1} label="BELIEF" />
        <div className="hero-thesis">
          <p className="landing-wordmark" aria-hidden="true">P R I O R</p>
          <h1 id="scene-1">COMMIT BEFORE REALITY DOES.</h1>
          <p className="hero-definition">Markets record what happened. PRIOR records what you believed before it happened.</p>
          <p className="hero-support">Forecast live markets. Commit your probability. Let reality score it later.</p>
          <EnterPriorLink />
        </div>
        <div className="belief-specimen" aria-label="A belief exists before an outcome is known">
          <span>BEFORE THE ANSWER</span>
          <ForecastNode label="Your uncommitted belief" />
          <b>?</b>
          <small>ONE PROBABILITY. RECORDED IN TIME.</small>
        </div>
      </section>

      <section className="landing-scene object-scene" data-scene="2" aria-labelledby="scene-2">
        <SceneIntro number={2} label="MARKET" />
        <div className="scene-statement">
          <p className="scene-kicker">MARKET VIEW</p>
          <h2 id="scene-2">The market has a probability.</h2>
        </div>
        <div className="single-object market-object" aria-label="Market probability, amber diamond, 61 percent">
          <span>MARKET ◆ 61%</span>
          <MarketNode label="Market probability" />
        </div>
      </section>

      <section className="landing-scene object-scene you-scene" data-scene="3" aria-labelledby="scene-3">
        <SceneIntro number={3} label="YOU" />
        <div className="scene-statement">
          <p className="scene-kicker">YOUR BELIEF</p>
          <h2 id="scene-3">You have one too.</h2>
        </div>
        <div className="single-object forecast-object" aria-label="Your probability, blue circle, 72 percent">
          <span>YOU ● 72%</span>
          <ForecastNode label="Your probability" />
        </div>
      </section>

      <section className="landing-scene axis-scene" data-scene="4" aria-labelledby="scene-4">
        <SceneIntro number={4} label="SHARED AXIS" />
        <div className="scene-statement centered-statement">
          <p className="scene-kicker">SAME QUESTION. TWO BELIEFS.</p>
          <h2 id="scene-4">The difference needs a timestamp.</h2>
          <p>The difference matters only if we can prove when the belief existed.</p>
        </div>
        <div className="narrative-axis" role="img" aria-label="Shared probability axis from zero to one hundred, Market at 61 and You at 72">
          <div className="axis-labels"><span>MARKET</span><span>YOU</span></div>
          <strong>0—◆61—●72—100</strong>
          <div className="axis-key"><span><MarketNode /> MARKET</span><span><ForecastNode /> YOU</span></div>
        </div>
      </section>

      <section className="landing-scene commit-story" data-scene="5" aria-labelledby="scene-5">
        <SceneIntro number={5} label="COMMITMENT" />
        <div className="scene-statement centered-statement">
          <p className="scene-kicker">MAKE THE TIME BOUNDARY VISIBLE</p>
          <h2 id="scene-5">COMMIT IT</h2>
          <p>Before commitment, the probability can change. After confirmation, it cannot be rewritten.</p>
        </div>
        <div className="commit-crossing" role="img" aria-label="Commitment boundary, blue belief moves from before to after and becomes immutable">
          <div><span>BEFORE</span><strong>●│</strong><small>EDITABLE</small></div>
          <i aria-hidden="true" />
          <div><span>AFTER</span><strong>│●</strong><small>IMMUTABLE</small></div>
        </div>
        <p className="settled-note">SAME BELIEF. NEW STATE. THE COMMITTED OBJECT STAYS FIXED.</p>
      </section>

      <section className="landing-scene reality-story" data-scene="6" aria-labelledby="scene-6">
        <SceneIntro number={6} label="REALITY" />
        <div className="scene-statement">
          <p className="scene-kicker">TIME CONTINUES</p>
          <h2 id="scene-6">Reality keeps moving.</h2>
          <p>The market changes after commitment. The committed Forecast stays fixed. Then the outcome resolves.</p>
        </div>
        <div className="reality-field" aria-label="Market probability moves after commitment while the Forecast remains fixed, then outcome resolves Up">
          <div className="moving-market"><span>MARKET</span><MarketNode /><b>61 → 68 → 54</b></div>
          <div className="fixed-forecast"><span>COMMITTED FORECAST</span><ForecastNode locked /><b>72</b></div>
          <div className="resolved-outcome"><span>REALITY</span><strong>UP</strong><small>RESOLVED</small></div>
        </div>
      </section>

      <section className="landing-scene measure-scene" data-scene="7" aria-labelledby="scene-7">
        <SceneIntro number={7} label="EVIDENCE" />
        <div className="scene-statement centered-statement">
          <p className="scene-kicker">BELIEF MEETS OUTCOME</p>
          <h2 id="scene-7">NOW WE CAN MEASURE IT</h2>
          <p className="example-label">GUIDED EXAMPLE</p>
        </div>
        <div className="evidence-lock" aria-label="Resolved example comparing your forecast with the market at commit">
          <EvidenceFact label="YOU" value="72%" tone="forecast" />
          <EvidenceFact label="MARKET AT COMMIT" value="61%" tone="market" />
          <EvidenceFact label="OUTCOME" value="UP" />
          <EvidenceFact label="FORECAST SCORE" value="0.0784" />
          <EvidenceFact label="MARKET SCORE" value="0.1521" />
          <p className="literal-facts">YOU 72% · MARKET AT COMMIT 61% · OUTCOME UP · FORECAST SCORE 0.0784 · MARKET SCORE 0.1521</p>
        </div>
        <div className="causal-separation" aria-label="Belief, decision, execution, and outcome are separate facts">
          <span>BELIEF</span><i />
          <span>DECISION</span><i />
          <span>EXECUTION</span><i />
          <span>OUTCOME</span>
        </div>
        <p className="trade-truth">Being right is not the same as making a good trade.</p>
      </section>

      <section className="landing-scene named-object-scene" data-scene="8" aria-labelledby="scene-8">
        <SceneIntro number={8} label="EVIDENCE OBJECT" />
        <div className="scene-statement centered-statement">
          <p className="scene-kicker">NOW NAME THE OBJECT</p>
          <h2 id="scene-8">RESOLVED FORECAST TRIAL</h2>
          <p>A committed belief, its market reference, and the observed outcome remain together as one inspectable evidence object.</p>
        </div>
        <div className="trial-object" aria-label="Resolved Forecast Trial evidence object">
          <div><ForecastNode locked /><span>BELIEF<br /><b>72% UP</b></span></div>
          <i aria-hidden="true" />
          <div><MarketNode /><span>MARKET AT COMMIT<br /><b>61% UP</b></span></div>
          <i aria-hidden="true" />
          <div><span>OUTCOME<br /><b>UP</b></span></div>
          <strong>RESOLVED · SCORED · IMMUTABLE</strong>
        </div>
      </section>

      <section className="landing-scene circuit-story" data-scene="9" aria-labelledby="scene-9">
        <SceneIntro number={9} label="PERSISTENT INTENT" />
        <div className="circuit-question">
          <p>ONE FORECAST IS ONE MOMENT</p>
          <h2 id="scene-9">WHAT ABOUT THE NEXT MARKET?</h2>
          <p>A Circuit carries one bounded decision rule across new markets. It evaluates each market and may act or abstain.</p>
        </div>

        <div className="fixed-intent" aria-label="Fixed Circuit intent">
          <span>FIXED INTENT</span>
          <strong>ONLY ACT WHEN THE FORECAST AND AVAILABLE MARKET PRICE DIFFER BY AT LEAST 8 POINTS.</strong>
          <small>THE RULE DOES NOT CHANGE BETWEEN ITERATIONS.</small>
        </div>

        <div className="circuit-iterations" aria-label="Circuit continuity across two real scored markets">
          <article>
            <header><span>Market A</span><b>REAL CONTINUITY EVIDENCE</b></header>
            <div className="iteration-comparison"><span className="forecast-color"><small>FORECAST</small>0% UP</span><i>VS</i><span className="market-color"><small>MARKET</small>1.50% UP</span></div>
            <div className="iteration-result"><strong>DECISION · ABSTAIN</strong><span>OUTCOME · DOWN</span><span>STATE · SCORED</span></div>
          </article>
          <article>
            <header><span>Market B</span><b>REAL CONTINUITY EVIDENCE</b></header>
            <div className="iteration-comparison"><span className="forecast-color"><small>FORECAST</small>50% UP</span><i>VS</i><span className="market-color"><small>MARKET</small>53.25% UP</span></div>
            <div className="iteration-result"><strong>DECISION · ABSTAIN</strong><span>OUTCOME · UP</span><span>STATE · SCORED</span></div>
          </article>
        </div>

        <div className="abstention-explainer">
          <h3>ABSTENTION IS A DECISION.</h3>
          <p>The 8-point rule requires a large enough difference before economic action. Market A differed by 1.5 points. Market B differed by 3.25 points. Neither cleared the rule, so the Circuit recorded both Forecasts and did not trade.</p>
          <p className="literal-rule">8-point rule example: 1.5 &lt; 8, ABSTAIN. 3.25 &lt; 8, ABSTAIN.</p>
        </div>

        <h3 className="circuit-headline">THE MARKET CHANGES. THE RULE STAYS ACCOUNTABLE.</h3>

        <div className="economic-proof" aria-label="Real Market number one economic execution facts">
          <header><span>REAL MARKET #1 ECONOMIC EXECUTION</span><b>LOSING TRADE SHOWN IN FULL</b></header>
          <div className="execution-facts">
            <EvidenceFact label="Forecast" value="50%" tone="forecast" />
            <EvidenceFact label="Market" value="35.2%" tone="market" />
            <EvidenceFact label="Decision" value="BUY UP" />
            <EvidenceFact label="Limit" value="42%" />
            <EvidenceFact label="Filled" value="28.1%" />
            <EvidenceFact label="Outcome" value="DOWN" />
            <EvidenceFact label="Economic result" value="PNL -281 raw" />
          </div>
          <p>Forecast 50% · Market 35.2% · BUY UP · Limit 42% · Filled 28.1% · DOWN · PNL -281 raw</p>
        </div>

        <div className="recovery-proof" aria-label="Runner restart recovery evidence">
          <div><span>Runner Restarted</span><strong>YES</strong></div>
          <div><span>Circuit Recovered 2 iterations</span><strong>2 / 2</strong></div>
          <div><span>Duplicate Effects 0</span><strong>0</strong></div>
        </div>

        <div className="final-definition">
          <p>ONE COMMITTED BELIEF IS EVIDENCE</p>
          <p>ONE PERSISTENT INTENT ACROSS MARKETS IS A CIRCUIT</p>
          <h3>THAT&apos;S PRIOR</h3>
          <EnterPriorLink final />
          <small>Built on DreamDEX Event Contracts on Somnia</small>
        </div>
      </section>
    </div>
  );
}
