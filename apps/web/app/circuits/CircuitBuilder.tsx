"use client";

import { useState } from "react";

const steps = [
  { title: "WHAT MARKET?", options: ["BTC · 15m", "BTC · 1h", "ETH · 15m", "ETH · 1h"] },
  { title: "HOW LONG?", options: ["4 markets", "8 markets", "12 markets"] },
  { title: "WHO FORECASTS?", options: ["Me", "Agent"] },
  { title: "WHEN SHOULD PRIOR ACT?", options: ["8 point minimum margin"] },
  { title: "BUDGET", options: ["$100 total · $15 maximum per market"] },
  { title: "WHEN SHOULD IT STOP?", options: ["Pause after 2 losses in a row"] },
] as const;

export function CircuitBuilder() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>(steps.map((item) => item.options[0]));
  const current = steps[step];
  function choose(value: string) { setSelected((values) => values.map((entry, index) => index === step ? value : entry)); }
  return <section className="circuit-builder" aria-labelledby="builder-title"><div className="builder-progress" aria-label={`Step ${step + 1} of ${steps.length}`}>{steps.map((_, index) => <i key={index} className={index <= step ? "done" : ""}/>)}</div><span className="scene-index">CONFIGURE INTENT · {step + 1} / {steps.length}</span><h2 id="builder-title">{current.title}</h2><div className="builder-options" role="radiogroup" aria-label={current.title}>{current.options.map((option) => <button type="button" role="radio" aria-checked={selected[step] === option} key={option} onClick={() => choose(option)}>{option}</button>)}</div>{step === 3 && <p className="intent-sentence">Only when Prior can buy at least <strong>8 points</strong> below what the Forecast says the outcome is worth.</p>}<div className="builder-actions"><button className="secondary-button" type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>BACK</button>{step < steps.length - 1 ? <button className="primary-button" type="button" onClick={() => setStep(step + 1)}>CONTINUE</button> : <button className="primary-button" type="button" disabled>AUTHORIZE &amp; START · WRITE ADAPTER UNAVAILABLE</button>}</div><p className="state-line">Configuration preview only. No authorization or autonomous success is implied.</p></section>;
}
