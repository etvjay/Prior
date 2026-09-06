"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  ACCEPTED_FORECASTS,
  CONTINUITY_ID,
  formatBps,
  score,
} from "./evidence";
import {
  ForecastMiniature,
  ForecastNode,
  MarketNode,
  ProbabilityTrack,
} from "./components";
import { sceneNames } from "./lib/motion";

const flowLabels = [
  "PRIOR",
  "MARKET",
  "YOU",
  "SPACE",
  "COMMIT",
  "REALITY",
  "EVIDENCE",
  "CIRCUIT",
  "PRODUCT",
] as const;

function SceneFlow({ active }: { active: number }) {
  return (
    <div className="scene-flow" aria-label={`Causal progression, ${flowLabels[active]} is in focus`}>
      {flowLabels.map((label, index) => (
        <span
          className={index < active ? "is-complete" : index === active ? "is-current" : ""}
          key={label}
        >
          <i aria-hidden="true" />
          <b>{label}</b>
          {index < flowLabels.length - 1 && <em className="scene-flow-line" aria-hidden="true" />}
        </span>
      ))}
    </div>
  );
}

function SceneIntro({ number, title }: { number: number; title: string; active?: number }) {
  return (
    <>
      <div className="scene-index">
        {String(number).padStart(2, "0")} / 09 · {title}
      </div>
      <SceneFlow active={number - 1} />
    </>
  );
}

export function LandingScenes() {
  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>("[data-scene]");
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.target.classList.toggle("in-view", entry.isIntersecting)),
      { threshold: 0.28 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const proof = ACCEPTED_FORECASTS[0];
  const continuityA = ACCEPTED_FORECASTS[1];
  const continuityB = ACCEPTED_FORECASTS[2];

  return (
    <div className="landing-scenes">
      <section className="landing-scene hero-scene in-view" data-scene="1" aria-labelledby="scene-1">
        <SceneIntro number={1} title={sceneNames[0]} active={0} />
        <div className="hero-copy">
          <p className="wordmark ghost">P R I O R</p>
          <h1 id="scene-1">
            <span>COMMIT BEFORE</span>
            <span>REALITY DOES.</span>
          </h1>
          <p className="hero-support">
            Put your probability on record before an external market resolves. Prior keeps the belief,
            the reference, and the observed result together as evidence.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" href="/live">Enter live market</Link>
            <Link className="secondary-button" href={`/forecast/${proof.id}`}>Open accepted Forecast proof</Link>
          </div>
          <dl className="mechanism-brief" aria-label="Prior mechanism in brief">
            <div><dt>MARKET</dt><dd>external reference</dd></div>
            <div><dt>FORECAST</dt><dd>your probability</dd></div>
            <div><dt>COMMITMENT</dt><dd>immutable before resolution</dd></div>
            <div><dt>POLICY</dt><dd>BUY or ABSTAIN under constraints</dd></div>
            <div><dt>CIRCUIT</dt><dd>intent across changing markets</dd></div>
            <div><dt>EVIDENCE</dt><dd>observed chain and RFT result</dd></div>
          </dl>
        </div>
        <div className="hero-specimen" aria-label="Market #1 accepted resolved Forecast specimen">
          <div className="specimen-head">
            <span>MARKET #1 · BTC · 5 MIN</span>
            <span>ACCEPTED SHANNON EVIDENCE · OUTCOME {proof.outcome} · BRIER {score(proof.forecastBrier)}</span>
          </div>
          <div className="duel">
            <div>
              <span>MARKET AT COMMIT · EXTERNAL</span>
              <strong className="market-color">{formatBps(proof.referenceBps!)}</strong>
              <MarketNode label="Market #1 reference" />
            </div>
            <div>
              <span>FORECAST · COMMITTED</span>
              <strong className="forecast-color">{formatBps(proof.forecastBps)}</strong>
              <ForecastNode label="Market #1 accepted Forecast" locked />
            </div>
          </div>
          <ProbabilityTrack forecast={proof.forecastBps / 100} market={proof.referenceBps! / 100} locked />
          <div className="chronology" aria-label="Forecast lifecycle">
            <span>FORECAST</span><span>COMMIT</span><span>RESOLVE</span><span>EVIDENCE</span>
          </div>
          <div className="specimen-result">
            <span>OBSERVED OUTCOME <b>{proof.outcome}</b></span>
            <span>RFT SCORE · BRIER <b>{score(proof.forecastBrier)}</b></span>
          </div>
        </div>
      </section>

      <section className="landing-scene narrative-scene market-scene" data-scene="2" aria-labelledby="scene-2">
        <SceneIntro number={2} title={sceneNames[1]} active={1} />
        <div className="scene-copy">
          <p className="scene-kicker">01 · OBSERVE</p>
          <h2 id="scene-2">THE MARKET<br />HAS A VIEW.</h2>
          <p>
            Market is the external reference: the probability implied by the DreamDEX market when a
            Forecast is committed. It is context, not ground truth and not your belief.
          </p>
        </div>
        <div className="scene-visual market-stage">
          <span className="object-role">MARKET #1 · AT COMMIT</span>
          <strong className="scene-number market-color">{formatBps(proof.referenceBps!)}</strong>
          <MarketNode label="Market #1 external reference" />
          <small>AMBER DIAMOND · FIXED REFERENCE</small>
        </div>
      </section>

      <section className="landing-scene narrative-scene forecast-scene" data-scene="3" aria-labelledby="scene-3">
        <SceneIntro number={3} title={sceneNames[2]} active={1} />
        <div className="scene-copy">
          <p className="scene-kicker">02 · FORM A BELIEF</p>
          <h2 id="scene-3">SO DO YOU.</h2>
          <p>
            Forecast is your probability for the same outcome. The blue circle stays distinct from the
            amber Market diamond because disagreement is information, not proof of an edge.
          </p>
        </div>
        <div className="scene-visual forecast-stage">
          <span className="object-role">MARKET #1 · YOUR FORECAST</span>
          <strong className="scene-number forecast-color">{formatBps(proof.forecastBps)}</strong>
          <ForecastNode label="Your probability" />
          <small>BLUE CIRCLE · EDITABLE BEFORE COMMIT</small>
        </div>
      </section>

      <section className="landing-scene field-scene" data-scene="4" aria-labelledby="scene-4">
        <SceneIntro number={4} title={sceneNames[3]} active={1} />
        <div className="scene-copy wide-copy">
          <p className="scene-kicker">03 · COMPARE</p>
          <h2 id="scene-4">SAME QUESTION.<br />DIFFERENT BELIEF.</h2>
          <p>
            Both values occupy one probability field. Market remains the external reference. Forecast
            remains your probability. Neither value is silently substituted for the other.
          </p>
        </div>
        <div className="shared-field" aria-label="Market and Forecast on one probability scale">
          <ProbabilityTrack forecast={proof.forecastBps / 100} market={proof.referenceBps! / 100} locked />
          <div className="field-legend"><span><MarketNode /> MARKET REFERENCE</span><span><ForecastNode locked /> YOUR FORECAST</span></div>
        </div>
      </section>

      <section className="landing-scene commit-scene" data-scene="5" aria-labelledby="scene-5">
        <SceneIntro number={5} title={sceneNames[4]} active={2} />
        <div className="scene-copy centered-copy">
          <p className="scene-kicker">04 · COMMIT</p>
          <h2 id="scene-5">ONCE COMMITTED,<br />IT CANNOT BE REWRITTEN.</h2>
          <p>
            Commitment makes the Forecast immutable before resolution. A wallet request is not a commit,
            and submission is not confirmation. Only an observed successful receipt establishes commitment.
          </p>
        </div>
        <div className="commit-diagram" aria-label="The same Forecast crosses a commitment boundary and locks">
          <span>EDITABLE</span>
          <div className="commit-rail"><i className="commit-boundary-line" /><ForecastNode label="Committed Forecast" locked /></div>
          <span>IMMUTABLE</span>
        </div>
      </section>

      <section className="landing-scene narrative-scene reality-scene" data-scene="6" aria-labelledby="scene-6">
        <SceneIntro number={6} title={sceneNames[5]} active={4} />
        <div className="scene-copy">
          <p className="scene-kicker">05 · RESOLVE</p>
          <h2 id="scene-6">REALITY ARRIVES.<br />BELIEF STAYS PUT.</h2>
          <p>
            DreamDEX supplies the finalized outcome. The committed Forecast no longer moves. Resolution
            arrives from the Market side, then the RFT result can be finalized and scored.
          </p>
        </div>
        <div className="scene-visual resolution-stage">
          <div><span>MARKET #1 OUTCOME</span><strong>{proof.outcome}</strong><MarketNode /></div>
          <i className="resolution-connector" aria-hidden="true" />
          <div><span>FORECAST</span><strong className="forecast-color">{formatBps(proof.forecastBps)}</strong><ForecastNode locked /></div>
          <b className="resolution-stamp">OBSERVED · FINALIZED</b>
        </div>
      </section>

      <section className="landing-scene evidence-scene" data-scene="7" aria-labelledby="scene-7">
        <SceneIntro number={7} title={sceneNames[6]} active={5} />
        <div className="scene-copy wide-copy">
          <p className="scene-kicker">06 · RETAIN PROOF</p>
          <h2 id="scene-7">EVIDENCE IS WHAT<br />THE CHAIN OBSERVED.</h2>
          <p>
            Evidence is the observed chain and RFT result, not a marketing claim. This Market #1 specimen
            comes from the repository&apos;s accepted Shannon lifecycle artifact.
          </p>
        </div>
        <div className="evidence-equation" aria-label="Market #1 accepted evidence values">
          <span>Forecast <b>{formatBps(proof.forecastBps)}</b></span>
          <span>Market at commit <b>{formatBps(proof.referenceBps!)}</b></span>
          <span>Outcome <b>{proof.outcome}</b></span>
          <span>Brier <b>{score(proof.forecastBrier)}</b></span>
        </div>
        <div className="proof-action-row">
          <ForecastMiniature forecast={proof} />
          <Link className="secondary-button" href={`/forecast/${proof.id}`}>Inspect accepted Forecast proof</Link>
        </div>
      </section>

      <section className="landing-scene circuit-scene" data-scene="8" aria-labelledby="scene-8">
        <SceneIntro number={8} title={sceneNames[7]} active={6} />
        <div className="scene-copy wide-copy">
          <p className="scene-kicker">07 · CONTINUE INTENT</p>
          <h2 id="scene-8">RULES STAY FIXED.<br />MARKETS CHANGE.</h2>
          <p>
            Policy decides BUY or ABSTAIN under constraints. Circuit is persistent intent across changing
            markets: one immutable rule set is evaluated again for each distinct market window.
          </p>
        </div>
        <div className="intent-spine">
          <span>CIRCUIT INTENT · LOCKED</span>
          <b>BTC · 5m · 4 windows · 8pt minimum margin</b>
          <small>AUTONOMOUS PATH · BLOCKED_EXTERNAL · accepted examples below are guided abstentions</small>
        </div>
        <div className="landing-circuit" aria-label="Accepted Circuit continuity evidence">
          {[continuityA, continuityB].map((forecast, index) => (
            <div key={forecast.id}>
              <header><b>MARKET #{index + 1}</b><span>ACCEPTED SHANNON EVIDENCE</span></header>
              <div className="circuit-values"><span><MarketNode /> {formatBps(forecast.referenceBps!)}</span><span><ForecastNode locked /> {formatBps(forecast.forecastBps)}</span></div>
              <div className="policy-chain"><span>FORECAST</span><i /><span>POLICY</span><i /><span>ABSTAIN</span><i /><span>{forecast.outcome}</span></div>
            </div>
          ))}
          <div className="future-iteration">
            <header><b>FUTURE SLOT</b><span>NO ACCEPTED FORECAST</span></header>
            <span className="future-node">○</span>
            <p>No state, action, or result is inferred beyond the accepted snapshot.</p>
          </div>
        </div>
        <div className="circuit-actions">
          <Link className="primary-button" href="/circuits">Explore Circuits</Link>
          <Link className="text-link" href={`/circuit/${CONTINUITY_ID}`}>Inspect accepted continuity evidence →</Link>
        </div>
      </section>

      <section className="landing-scene product-scene" data-scene="9" aria-labelledby="scene-9">
        <SceneIntro number={9} title={sceneNames[8]} active={6} />
        <div className="product-shell" aria-label="Prior live instrument preview">
          <aside>MARKETS<br />OBSERVED</aside>
          <div>
            <span><MarketNode /> MARKET</span>
            <span><ForecastNode /> FORECAST</span>
            <b>COMMIT → POLICY → RESOLVE → EVIDENCE</b>
          </div>
          <aside>DEPTH<br />EXEC<br />PROOF</aside>
        </div>
        <div className="scene-copy centered-copy product-copy">
          <p className="scene-kicker">08 · ENTER THE INSTRUMENT</p>
          <h2 id="scene-9">REALITY IS STILL UNKNOWN.<br />STATE WHAT YOU BELIEVE.</h2>
          <p>
            Enter the live surface when an eligible market exists, inspect Circuit intent, or begin with
            the accepted Forecast proof. Prior does not invent a live market when none is observed.
          </p>
        </div>
        <div className="final-actions">
          <Link className="primary-button" href="/live">Enter live market</Link>
          <Link className="secondary-button" href="/circuits">View Circuits</Link>
          <Link className="text-link" href={`/forecast/${proof.id}`}>Open accepted Forecast proof →</Link>
        </div>
      </section>
    </div>
  );
}
