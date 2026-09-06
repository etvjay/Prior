"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ForecastNode, MarketNode } from "./components";
import { motion } from "./lib/motion";

const flowLabels = ["BELIEF", "MARKET", "YOU", "COMMIT", "REALITY", "EVIDENCE", "MEASURE", "HISTORY", "INTENT"] as const;

function SceneIntro({ number, label }: { number: number; label: string }) {
  return (
    <div className="landing-scene-meta" aria-label={`Scene ${number} of 9, ${label}`}>
      <span>{String(number).padStart(2, "0")} / 09</span>
      <span>{label}</span>
      <div className="narrative-progress" aria-hidden="true">
        {flowLabels.map((item, index) => <i className={index < number ? "is-reached" : ""} key={item} />)}
      </div>
    </div>
  );
}

function EvidenceFact({ label, value, tone }: { label: string; value: string; tone?: "market" | "forecast" | "down" }) {
  return <div className={`evidence-fact${tone ? ` ${tone}` : ""}`}><span>{label}</span><strong>{value}</strong></div>;
}

function EnterPriorLink({ final = false }: { final?: boolean }) {
  const router = useRouter();
  const [entering, setEntering] = useState(false);

  function enter(event: React.MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (entering) return;
    setEntering(true);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => router.push("/live"), reduced ? 0 : motion.duration.route);
  }

  return (
    <Link
      className={`landing-primary${final ? " final-cta" : ""}`}
      href="/live"
      onClick={enter}
      aria-busy={entering}
      data-route-transition={entering ? "live" : undefined}
    >
      <span className="cta-route-object" aria-hidden="true" />
      <span>ENTER PRIOR</span>
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
          <p className="hero-definition">A profitable trade does not prove a good prediction. A good prediction can still lose at a bad price.</p>
          <p className="hero-support">PRIOR preserves what was believed before the answer, then keeps judgment separate from the trade.</p>
          <EnterPriorLink />
        </div>
        <div className="belief-specimen" aria-label="A Forecast exists before an outcome is known">
          <span>BEFORE THE ANSWER</span>
          <ForecastNode label="Your uncommitted Forecast" />
          <b>?</b>
          <small>ONE PROBABILITY. RECORDED IN TIME.</small>
        </div>
        <div className="hero-separation" aria-label="Prior separates belief, decision, execution, and outcome">
          <span>BELIEF</span><i /><span>DECISION</span><i /><span>EXECUTION</span><i /><span>OUTCOME</span>
        </div>
      </section>

      <section className="landing-scene object-scene" data-scene="2" aria-labelledby="scene-2">
        <SceneIntro number={2} label="MARKET" />
        <div className="scene-statement">
          <p className="scene-kicker">MARKET VIEW</p>
          <h2 id="scene-2">The market has a probability.</h2>
          <p>It is a reference, not proof that the crowd is right.</p>
        </div>
        <div className="single-object market-object" aria-label="Market probability, amber diamond, 61 percent">
          <span>MARKET ◆ 61%</span>
          <MarketNode label="Market probability" />
        </div>
      </section>

      <section className="landing-scene object-scene you-scene" data-scene="3" aria-labelledby="scene-3">
        <SceneIntro number={3} label="YOU" />
        <div className="scene-statement">
          <p className="scene-kicker">YOUR FORECAST</p>
          <h2 id="scene-3">You have one too.</h2>
          <p>A Forecast states your probability before resolution.</p>
        </div>
        <div className="single-object forecast-object" aria-label="Your Forecast, blue circle, 72 percent">
          <span>YOU ● 72%</span>
          <ForecastNode label="Your Forecast probability" />
        </div>
      </section>

      <section className="landing-scene axis-scene" data-scene="4" aria-labelledby="scene-4">
        <SceneIntro number={4} label="SHARED AXIS" />
        <div className="scene-statement centered-statement">
          <p className="scene-kicker">SAME QUESTION. DIFFERENT BELIEF.</p>
          <h2 id="scene-4">The difference needs a timestamp.</h2>
          <p>Forecast commitment proves the belief existed before the answer.</p>
        </div>
        <div className="narrative-axis" role="img" aria-label="Shared probability axis from zero to one hundred, Market at 61 and You at 72">
          <div className="axis-labels"><span>MARKET</span><span>YOU</span></div>
          <strong>0—◆61—●72—100</strong>
          <div className="axis-key"><span><MarketNode /> MARKET</span><span><ForecastNode /> FORECAST</span></div>
        </div>
      </section>

      <section className="landing-scene commit-story" data-scene="5" aria-labelledby="scene-5">
        <SceneIntro number={5} label="COMMITMENT" />
        <div className="scene-statement centered-statement">
          <p className="scene-kicker">MAKE THE TIME BOUNDARY VISIBLE</p>
          <h2 id="scene-5">COMMIT IT</h2>
          <p>Before commitment, the probability can change. After confirmation, it cannot be rewritten.</p>
        </div>
        <div className="commit-crossing" role="img" aria-label="Commitment boundary, blue Forecast moves from before to after and becomes immutable">
          <div><span>BEFORE</span><strong>●│</strong><small>EDITABLE</small></div>
          <i aria-hidden="true" />
          <div><span>AFTER</span><strong>│●</strong><small>IMMUTABLE</small></div>
        </div>
        <p className="settled-note">SAME FORECAST. NEW STATE. THE COMMITTED OBJECT STAYS FIXED.</p>
      </section>

      <section className="landing-scene reality-story" data-scene="6" aria-labelledby="scene-6">
        <SceneIntro number={6} label="REALITY" />
        <div className="scene-statement">
          <p className="scene-kicker">TIME CONTINUES</p>
          <h2 id="scene-6">Reality keeps moving.</h2>
          <p>The market changes. Execution gets its own price. The committed Forecast stays fixed until the outcome resolves.</p>
          <p className="trade-truth-inline">Belief, decision, execution, and outcome remain separate from PnL.</p>
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
          <h2 id="scene-7">NOW WE CAN MEASURE JUDGMENT.</h2>
          <p>One resolved Forecast is one evidence sample.</p>
        </div>
        <div className="evidence-lock" aria-label="Resolved example comparing a Forecast with the market at commit">
          <EvidenceFact label="FORECAST" value="72%" tone="forecast" />
          <EvidenceFact label="MARKET AT COMMIT" value="61%" tone="market" />
          <EvidenceFact label="OUTCOME" value="UP" />
          <EvidenceFact label="FORECAST SCORE" value="0.0784" />
          <EvidenceFact label="MARKET SCORE" value="0.1521" />
          <p className="literal-facts">FORECAST 72% · MARKET AT COMMIT 61% · OUTCOME UP · FORECAST SCORE 0.0784 · MARKET SCORE 0.1521</p>
        </div>
        <div className="rft-nameplate">
          <span>NAME THE EVIDENCE OBJECT</span>
          <strong>RESOLVED FORECAST TRIAL</strong>
          <b>RFT</b>
          <p>A Forecast, its market reference, execution record when present, and outcome kept together after resolution.</p>
        </div>
      </section>

      <section className="landing-scene history-story" data-scene="8" aria-labelledby="scene-8">
        <SceneIntro number={8} label="HISTORY" />
        <div className="scene-statement centered-statement">
          <p className="scene-kicker">CAPABILITY / TRAJECTORY · NOT LIVE ANALYTICS</p>
          <h2 id="scene-8">ONE RFT IS EVIDENCE. MANY REVEAL A RECORD.</h2>
          <p>Repeated RFTs can reveal what judgment is good at, not whether an agent is universally good.</p>
        </div>
        <div className="history-trajectory" aria-label="Repeated resolved Forecast Trials form a scoped capability trajectory">
          <span><ForecastNode locked /><small>BTC · 5M</small></span><i /><span><ForecastNode locked /><small>BTC · 5M</small></span><i /><span><ForecastNode locked /><small>ETH · 1H</small></span><i /><span><ForecastNode locked /><small>BTC · 5M</small></span>
        </div>
        <div className="capability-strip">
          <p><span>CALIBRATION</span>Does confidence hold up?</p>
          <p><span>SPECIALIZATION</span>Which asset and window fit?</p>
          <p><span>FORECAST VS EXECUTION</span>Was judgment sound even when entry was not?</p>
        </div>
        <p className="capability-note">RFT histories make specialization, comparison, selection, and trust allocation measurable capabilities. These are enabled trajectories, not a live ranking or routing system.</p>
        <h3 className="handoff-question">Once judgment is measurable, decide what it may cause.</h3>
      </section>

      <section className="landing-scene circuit-story" data-scene="9" aria-labelledby="scene-9">
        <SceneIntro number={9} label="PERSISTENT INTENT" />
        <div className="circuit-question">
          <p>FROM MEASURED JUDGMENT TO BOUNDED ACTION</p>
          <h2 id="scene-9">A CIRCUIT IS A STANDING MANDATE.</h2>
          <p>It defines whose Forecasts matter, when they matter, and what they may cause.</p>
        </div>

        <div className="fixed-intent" aria-label="Illustrative fixed Circuit standing mandate">
          <span>FIXED INTENT · ILLUSTRATIVE</span>
          <strong>AGENT ALPHA · BTC 5M · CONFIDENCE ≥70% · BUY ONLY 8 POINTS BELOW · $1 PER MARKET · 20 MARKETS · STOP AFTER 2 LOSSES</strong>
          <small>WHO · WHEN · PERMITTED ACTION · BUDGET · DURATION · STOP CONDITION</small>
        </div>

        <div className="circuit-contrast" aria-label="Without and with a Circuit">
          <p><span>WITHOUT A CIRCUIT</span>Forecast → ad hoc decision → context disappears</p>
          <p><span>WITH A CIRCUIT</span>Standing mandate → Forecast → bounded action or abstention → evidence remains</p>
        </div>

        <div className="judgment-loop" aria-label="RFT history to trust allocation to Circuit to bounded action to new evidence">
          <span>RFT HISTORY</span><i>→</i><span>TRUST ALLOCATION</span><i>→</i><span>CIRCUIT</span><i>→</i><span>BOUNDED ACTION</span><i>→</i><span>NEW EVIDENCE</span>
        </div>

        <div className="proof-disclosures">
          <details>
            <summary><span>REAL MARKET A / B</span><b>UNCHANGED MANDATE · TWO ABSTENTIONS</b></summary>
            <div className="circuit-iterations" aria-label="Circuit continuity across two real accepted markets">
              <article>
                <header><span>Market A</span><b>NO TRADE</b></header>
                <div className="iteration-comparison"><span className="forecast-color"><small>FORECAST</small>0% UP</span><i>VS</i><span className="market-color"><small>MARKET</small>1.50% UP</span></div>
                <div className="iteration-result"><strong>RULE · NOT PERMITTED</strong><span>OUTCOME · DOWN</span><span>STATE · SCORED</span></div>
              </article>
              <article>
                <header><span>Market B</span><b>NO TRADE</b></header>
                <div className="iteration-comparison"><span className="forecast-color"><small>FORECAST</small>50% UP</span><i>VS</i><span className="market-color"><small>MARKET</small>53.25% UP</span></div>
                <div className="iteration-result"><strong>RULE · NOT PERMITTED</strong><span>OUTCOME · UP</span><span>STATE · SCORED</span></div>
              </article>
            </div>
            <p>Neither market met the rule that permitted action. Both Forecasts still became evidence. Abstention is a valid decision.</p>
          </details>

          <details>
            <summary><span>SEPARATE REAL MARKET #1</span><b>LOSING EXECUTION SHOWN IN FULL</b></summary>
            <div className="economic-proof" aria-label="Separate real Market number one economic execution facts">
              <div className="execution-facts">
                <EvidenceFact label="FORECAST" value="50%" tone="forecast" />
                <EvidenceFact label="MARKET" value="35.2%" tone="market" />
                <EvidenceFact label="DECISION" value="BUY UP" />
                <EvidenceFact label="LIMIT" value="42%" />
                <EvidenceFact label="FILLED" value="28.1%" />
                <EvidenceFact label="OUTCOME" value="DOWN" tone="down" />
                <EvidenceFact label="ECONOMIC RESULT" value="PNL -281 RAW" tone="down" />
              </div>
              <p>50% FORECAST · 35.2% MARKET · BUY UP · LIMIT 42% · FILLED 28.1% · DOWN · PNL -281 RAW</p>
            </div>
          </details>
        </div>

        <div className="outcome-split">
          <article><span>FOR TRADERS</span><h3>SEE WHETHER JUDGMENT, ENTRY, EXECUTION, OR OUTCOME DROVE THE RESULT.</h3></article>
          <article><span>FOR AGENTIC SYSTEMS</span><h3>TURN MEASURED JUDGMENT INTO BOUNDED, INSPECTABLE AUTHORITY.</h3></article>
        </div>

        <div className="final-definition">
          <p><strong>RFT</strong> MEASURES JUDGMENT.</p>
          <p><strong>CIRCUIT</strong> BOUNDS AUTHORITY.</p>
          <div className="closing-lines">
            <p>FORECASTS TELL US WHAT SOMEONE BELIEVED.</p>
            <p>RFTs TELL US HOW THAT JUDGMENT HELD UP.</p>
            <p>CIRCUITS DEFINE WHAT THAT JUDGMENT IS ALLOWED TO DO NEXT.</p>
          </div>
          <h3>PRIOR.</h3>
          <p>MEASURE JUDGMENT. ACT WITH RULES. KEEP THE EVIDENCE.</p>
          <EnterPriorLink final />
          <small>Built with DreamDEX Event Contracts on Somnia.</small>
        </div>
      </section>
    </div>
  );
}
