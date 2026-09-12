"use client";

import Link from "next/link";
import { useState } from "react";

const TEMPLATE = {
  title: "BTC · 5m",
  name: "Public Forecast Circuit",
  description: "A forecast-only starting point for following recurring BTC five-minute Event Contracts.",
  run: "4 eligible markets",
  source: "You provide one Forecast per market",
  execution: "Forecast-only",
  capital: "None",
};

export function ParticipationSurface() {
  const [showDetail, setShowDetail] = useState(false);
  return <div className="participation-page">
    <header className="page-heading participation-heading">
      <span className="instrument-label">PARTICIPATE · HUMAN ENTRY</span>
      <h1>Join a Forecast run.</h1>
      <p>Inspect the intent first. Then create your own participant Circuit instance and make one attributable Forecast per eligible market.</p>
    </header>
    <div className="scope-banner"><strong>PUBLIC TEMPLATES</strong><span>Application-level starting points. Not shared canonical Circuits.</span></div>
    <section className="participation-card" aria-labelledby="public-template-title">
      <div className="participation-card-main">
        <div className="template-kicker"><span className="market-node" aria-hidden="true"/> PUBLIC TEMPLATE · FORECAST-ONLY</div>
        <h2 id="public-template-title">{TEMPLATE.title}</h2>
        <p>{TEMPLATE.description}</p>
        <div className="template-stats">
          <div><span>RUN</span><strong>{TEMPLATE.run}</strong></div>
          <div><span>FORECAST SOURCE</span><strong>{TEMPLATE.source}</strong></div>
          <div><span>EXECUTION</span><strong>{TEMPLATE.execution}</strong></div>
          <div><span>CAPITAL REQUIRED</span><strong>{TEMPLATE.capital}</strong></div>
        </div>
      </div>
      <div className="participation-card-action">
        <span className="instrument-label">CURRENT ENTRY</span>
        <strong>Inspect before connecting.</strong>
        <p className="mapping-line"><span>PUBLIC TEMPLATE</span><b>→</b><span>YOUR CIRCUIT INSTANCE</span></p><p className="wallet-note">Wallet required to create your instance. Exploration stays read-only.</p><div className="participation-actions"><Link className="primary-button" href="/create?mode=participate&template=btc-5m">JOIN · CREATE MY INSTANCE</Link><button className="secondary-button" type="button" onClick={() => setShowDetail((value) => !value)}>{showDetail ? "HIDE DETAILS" : "INSPECT TEMPLATE"}</button></div>
      </div>
    </section>
    {showDetail && <section className="participation-detail" aria-label="Public template details">
      <div><span className="instrument-label">INTENT</span><h2>Persistent bounded intent.</h2><p>The participant instance follows the selected market class for four windows. Economic execution is disabled and no capital approval is requested.</p></div>
      <div><span className="instrument-label">EVIDENCE</span><h2>Forecast → RFT.</h2><p>Each committed Forecast remains attributable to the participant. Its RFT can later carry the belief through DreamDEX resolution.</p></div>
      <div><span className="instrument-label">CANONICAL LIMIT</span><h2>One forecaster per Circuit.</h2><p>V2 binds a committed trial only when its forecaster matches the Circuit intent. That is why each participant receives a separate canonical instance.</p></div>
    </section>}
    <section className="participation-next-step"><span className="instrument-label">NO WALLET REQUIRED TO EXPLORE</span><h2>Want to see completed evidence instead?</h2><p>Explore the accepted Circuit and Forecast readback without connecting a wallet.</p><div className="participation-next-actions"><Link className="text-link" href="/circuits">OPEN CIRCUITS →</Link><span className="cta-divider" aria-hidden="true">·</span><Link className="text-link" href="/my">OPEN MY ACTIVITY →</Link></div></section>
  </div>;
}
