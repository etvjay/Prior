"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ForecastNode, MarketNode } from "./components";
import { motion } from "./lib/motion";

const actLabels = [
  "MEASURE",
  "COMMIT",
  "CAPABILITY",
  "SPECIALIZE",
  "HANDOFF",
  "MANDATE",
  "BOUND",
  "LOOP",
  "CONTINUITY",
  "PRIOR",
] as const;

function ActIntro({ number, label }: { number: number; label: string }) {
  return (
    <div className="landing-act-meta" aria-label={`Act ${number} of 10, ${label}`}>
      <span>{String(number).padStart(2, "0")} / 10</span>
      <span>{label}</span>
      <div className="landing-progress" aria-hidden="true">
        {actLabels.map((item, index) => <i className={index < number ? "is-reached" : ""} key={item} />)}
      </div>
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
    <Link className={`landing-primary${final ? " final-cta" : ""}`} href="/live" onClick={enter} aria-busy={entering}>
      ENTER PRIOR
    </Link>
  );
}

function Fact({ label, value, tone }: { label: string; value: string; tone?: "market" | "forecast" | "down" | "up" }) {
  return <div className={`landing-fact${tone ? ` ${tone}` : ""}`}><span>{label}</span><strong>{value}</strong></div>;
}

export function LandingScenes() {
  useEffect(() => {
    const scenes = document.querySelectorAll<HTMLElement>("[data-act]");
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.target.classList.toggle("in-view", entry.isIntersecting)),
      { threshold: 0.18 },
    );
    scenes.forEach((scene) => observer.observe(scene));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-scenes">
      <section className="landing-act landing-problem in-view" data-act="1" aria-labelledby="act-1">
        <ActIntro number={1} label="THE MEASUREMENT PROBLEM" />
        <div className="landing-hero-copy">
          <p className="landing-wordmark" aria-hidden="true">P R I O R</p>
          <h1 id="act-1">A PROFITABLE TRADE DOES NOT PROVE A GOOD PREDICTION.</h1>
          <p>And a good prediction can still lose at a bad price.</p>
          <EnterPriorLink />
        </div>
        <div className="trade-contrast" aria-label="Prediction quality and trading result can disagree">
          <article>
            <span>PATH 01</span>
            <strong>GOOD FORECAST</strong>
            <strong>BAD ENTRY</strong>
            <strong>CORRECT RESULT</strong>
            <b>LOSS</b>
          </article>
          <article>
            <span>PATH 02</span>
            <strong>BAD FORECAST</strong>
            <strong>LUCKY ENTRY</strong>
            <strong>WRONG RESULT</strong>
            <b>PROFIT</b>
          </article>
        </div>
        <div className="separation-statement">
          <p>Most histories collapse all of this to PnL.</p>
          <h2>PRIOR SEPARATES</h2>
          <div aria-label="Prior separates belief, decision, execution, and outcome">
            <span>BELIEF</span><i /><span>DECISION</span><i /><span>EXECUTION</span><i /><span>OUTCOME</span>
          </div>
        </div>
      </section>

      <section className="landing-act landing-commitment" data-act="2" aria-labelledby="act-2">
        <ActIntro number={2} label="FORECAST COMMITMENT" />
        <div className="act-heading">
          <p>FIRST, KEEP THE BELIEF</p>
          <h2 id="act-2">THE FORECAST HAS TO EXIST BEFORE THE ANSWER.</h2>
        </div>
        <div className="forecast-specimen" aria-label="BTC five minute resolved Forecast example">
          <header><span>BTC · 5M</span><b>BEFORE RESOLUTION</b></header>
          <div className="probability-pair">
            <div><MarketNode label="Market probability" /><span>MARKET</span><strong>◆61%</strong></div>
            <div><ForecastNode label="Agent forecast" locked /><span>AGENT</span><strong>●72%</strong></div>
          </div>
          <div className="resolution-line"><span>RESOLUTION</span><strong>UP</strong><small>THE FORECAST STAYED FIXED</small></div>
        </div>
        <p className="single-evidence">ONE RESOLVED FORECAST IS ONE PIECE OF EVIDENCE.</p>
        <div className="rft-definition">
          <div><span>NAME THE EVIDENCE OBJECT</span><h3>RESOLVED FORECAST TRIAL</h3><b>RFT</b></div>
          <p>A Forecast, its market reference, and the result kept together after resolution.</p>
        </div>
        <div className="one-vs-history">
          <div><span>ONE RFT</span><p>One judgment, fixed before one result.</p></div>
          <div><span>RFT HISTORY</span><p>Many resolved judgments, compared across the conditions that produced them.</p></div>
        </div>
      </section>

      <section className="landing-act landing-capability" data-act="3" aria-labelledby="act-3">
        <ActIntro number={3} label="CAPABILITY AND TRAJECTORY" />
        <div className="act-heading">
          <p>ILLUSTRATIVE CAPABILITY VIEW · NOT LIVE ANALYTICS</p>
          <h2 id="act-3">WHAT DOES AGENT ALPHA&apos;S RESOLVED HISTORY REVEAL?</h2>
        </div>
        <div className="capability-questions" aria-label="Illustrative questions that resolved Forecast history can support">
          <article><span>ASSET</span><strong>Does its judgment hold up better on BTC or ETH?</strong></article>
          <article><span>WINDOW</span><strong>Is it better at 5 minutes or 1 hour?</strong></article>
          <article><span>CONFIDENCE</span><strong>When it says 70% or more, does reality agree often enough?</strong></article>
          <article><span>EXECUTION</span><strong>Is the Forecast sound even when the entry price is not?</strong></article>
        </div>
        <div className="trajectory-note"><ForecastNode locked /><span>ONE RESOLVED POINT</span><i /><span>A SCOPED HISTORY</span><i /><span>A CAPABILITY TRAJECTORY</span></div>
        <h3 className="act-maxim">DON&apos;T ASK WHETHER AN AGENT IS GOOD. ASK WHAT IT&apos;S GOOD AT.</h3>
      </section>

      <section className="landing-act landing-specialization" data-act="4" aria-labelledby="act-4">
        <ActIntro number={4} label="AGENTIC PAYOFF" />
        <div className="act-heading">
          <p>ILLUSTRATIVE SPECIALIZATION · NOT A RANKING</p>
          <h2 id="act-4">NO GENERIC REPUTATION. USE THE RIGHT JUDGMENT FOR THE RIGHT QUESTION.</h2>
        </div>
        <div className="agent-lanes" aria-label="Illustrative agent specialization examples">
          <article><span>ALPHA</span><strong>BTC · 5M</strong><p>Candidate for short-window, high-confidence Forecasts.</p></article>
          <article><span>BETA</span><strong>ETH · 1H</strong><p>Candidate for longer-window judgment.</p></article>
          <article><span>GAMMA</span><strong>ENTRY DISCIPLINE</strong><p>Candidate when execution quality matters.</p></article>
        </div>
        <div className="enabled-basis">
          <span>RESOLVED HISTORY CAN BECOME A BASIS FOR</span>
          <p>CALIBRATION · SPECIALIZATION · COMPARISON · SELECTION · TRUST ALLOCATION · RESEARCH · PROVENANCE</p>
          <small>These are enabled uses of evidence, not claims that PRIOR ships a universal ranking or routing system.</small>
        </div>
      </section>

      <section className="landing-act landing-handoff" data-act="5" aria-labelledby="act-5">
        <ActIntro number={5} label="THE HANDOFF" />
        <div className="handoff-line"><span>RFT</span><i /><span>?</span><i /><span>CIRCUIT</span></div>
        <h2 id="act-5">NOW YOU KNOW WHO YOU WANT TO LISTEN TO. WHAT SHOULD THEIR FORECAST BE ALLOWED TO DO?</h2>
      </section>

      <section className="landing-act landing-mandate" data-act="6" aria-labelledby="act-6">
        <ActIntro number={6} label="CIRCUIT" />
        <div className="act-heading">
          <p>FROM EVIDENCE TO BOUNDED ACTION</p>
          <h2 id="act-6">A CIRCUIT IS A STANDING MANDATE.</h2>
          <p>It defines whose Forecasts matter, when they matter, and what they may cause. It is not merely a fixed rule.</p>
        </div>
        <div className="mandate-panel" aria-label="Illustrative Circuit standing mandate">
          <header><span>STANDING MANDATE</span><b>ILLUSTRATIVE</b></header>
          <div className="mandate-tree">
            <Fact label="WHOSE FORECASTS" value="AGENT ALPHA" tone="forecast" />
            <Fact label="WHEN" value="BTC · 5M" />
            <Fact label="CONFIDENCE" value="≥70%" />
            <Fact label="ACTION CONDITION" value="BUY ONLY 8 POINTS BELOW" tone="market" />
            <Fact label="PER MARKET" value="$1" />
            <Fact label="DURATION" value="20 MARKETS" />
            <Fact label="STOP CONDITION" value="AFTER 2 LOSSES" tone="down" />
          </div>
          <p>ALPHA → BTC 5M → CONFIDENCE ≥70% → BUY ONLY 8 POINTS BELOW → $1 / MARKET → 20 MARKETS → STOP AFTER 2 LOSSES</p>
        </div>
      </section>

      <section className="landing-act landing-bounds" data-act="7" aria-labelledby="act-7">
        <ActIntro number={7} label="PERSISTENT INTENT" />
        <div className="act-heading"><p>THE DIFFERENCE IS CONTINUITY</p><h2 id="act-7">ONE DECISION VERSUS A GOVERNED SERIES.</h2></div>
        <div className="flow-contrast">
          <article>
            <span>WITHOUT A CIRCUIT</span>
            <p>Forecast</p><i /><p>ad hoc decision</p><i /><p>trade or no trade</p><i /><p>context disappears</p>
          </article>
          <article>
            <span>WITH A CIRCUIT</span>
            <p>standing mandate</p><i /><p>Forecast</p><i /><p>rule evaluation</p><i /><p>bounded action or no action</p><i /><p>evidence remains</p>
          </article>
        </div>
        <div className="mandate-benefits" aria-label="Benefits of a persistent mandate">
          <span>NO DRIFT</span><span>INSPECTABILITY</span><span>BUDGETS</span><span>BOUNDED AUTHORITY</span><span>COMPARABLE EPISODES</span>
        </div>
      </section>

      <section className="landing-act landing-loop" data-act="8" aria-labelledby="act-8">
        <ActIntro number={8} label="RFT + CIRCUIT" />
        <div className="act-heading"><p>THE PRODUCT LOOP</p><h2 id="act-8">MEASURE → LEARN → ALLOCATE TRUST → ACT → MEASURE AGAIN.</h2></div>
        <div className="loop-diagram" aria-label="Resolved Forecast Trial and Circuit feedback loop">
          <div className="loop-primary"><span>FIXED RULES</span><i>→</i><span>MARKET</span><i>→</i><span>FORECAST</span><i>→</i><span>DECISION</span><i>→</i><span>RFT</span><i>→</i><span>MORE EVIDENCE</span></div>
          <div className="loop-secondary"><span>HISTORY</span><i>→</i><span>UNDERSTAND JUDGMENT</span><i>→</i><span>CHOOSE / WEIGHT</span><i>→</i><span>CIRCUIT</span><i>→</i><span>BOUNDED ACTION</span><i>→</i><span>NEW EVIDENCE</span></div>
        </div>
        <h3 className="act-maxim">MEASURE JUDGMENT. USE IT. MEASURE AGAIN.</h3>
      </section>

      <section className="landing-act landing-continuity" data-act="9" aria-labelledby="act-9">
        <ActIntro number={9} label="REAL ACCEPTED CONTINUITY" />
        <div className="act-heading">
          <p>REAL ACCEPTED CONTINUITY · ONE UNCHANGED MANDATE</p>
          <h2 id="act-9">THE RULE CAN REFUSE TO ACT.</h2>
        </div>
        <div className="continuity-markets" aria-label="Two real accepted markets under one unchanged mandate">
          <article><header><span>MARKET A</span><b>NO TRADE</b></header><div><strong className="forecast-color">● 0%</strong><i>VS</i><strong className="market-color">◆ 1.5%</strong></div><footer><span>RULE · NOT PERMITTED</span><b>OUTCOME · DOWN</b></footer></article>
          <article><header><span>MARKET B</span><b>NO TRADE</b></header><div><strong className="forecast-color">● 50%</strong><i>VS</i><strong className="market-color">◆ 53.25%</strong></div><footer><span>RULE · NOT PERMITTED</span><b>OUTCOME · UP</b></footer></article>
        </div>
        <p className="continuity-explainer">Neither market met the rule that permitted action. Both Forecasts still became evidence. A Circuit is not a gambling bot. It is a mandate that can act only inside its authority.</p>
        <div className="accepted-execution" aria-label="Separate real accepted Market number one permitted execution facts">
          <header><span>SEPARATE REAL ACCEPTED EXECUTION</span><b>MARKET #1 · PERMITTED</b></header>
          <div>
            <Fact label="FORECAST" value="50%" tone="forecast" />
            <Fact label="MARKET" value="35.2%" tone="market" />
            <Fact label="DECISION" value="BUY UP" />
            <Fact label="LIMIT" value="42%" />
            <Fact label="FILLED" value="28.1%" />
            <Fact label="OUTCOME" value="DOWN" tone="down" />
            <Fact label="ECONOMIC RESULT" value="PNL -281 RAW" tone="down" />
          </div>
          <p>50% FORECAST · 35.2% MARKET · BUY UP · LIMIT 42% · FILLED 28.1% · DOWN · PNL -281 RAW</p>
        </div>
      </section>

      <section className="landing-act landing-close" data-act="10" aria-labelledby="act-10">
        <ActIntro number={10} label="PRIOR" />
        <div className="outcome-split">
          <article><span>FOR TRADERS</span><h2 id="act-10">SEE WHETHER JUDGMENT, ENTRY, EXECUTION, OR OUTCOME DROVE THE RESULT.</h2></article>
          <article><span>FOR AGENTIC SYSTEMS</span><h2>TURN MEASURED JUDGMENT INTO BOUNDED, INSPECTABLE AUTHORITY.</h2></article>
        </div>
        <div className="primitive-pair"><p><strong>RFT</strong> MEASURES JUDGMENT.</p><p><strong>CIRCUIT</strong> BOUNDS AUTHORITY.</p></div>
        <div className="closing-copy">
          <p>FORECASTS TELL US WHAT SOMEONE BELIEVED.</p>
          <p>RFTs TELL US HOW THAT JUDGMENT HELD UP.</p>
          <p>CIRCUITS DEFINE WHAT THAT JUDGMENT IS ALLOWED TO DO NEXT.</p>
          <h3>PRIOR.</h3>
          <p>MEASURE JUDGMENT. ACT WITH RULES. KEEP THE EVIDENCE.</p>
          <EnterPriorLink final />
          <small>Built with DreamDEX Event Contracts on Somnia.</small>
        </div>
      </section>
    </div>
  );
}
