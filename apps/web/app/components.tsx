"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CONTINUITY_ID, MARKET_ONE, percent, short } from "./evidence";

export function Header() {
  const [account, setAccount] = useState<string | null>(null);
  async function connect() {
    const ethereum = (window as Window & { ethereum?: { request: (args: { method: string }) => Promise<string[]> } }).ethereum;
    if (!ethereum) { setAccount("WALLET UNAVAILABLE"); return; }
    try { const accounts = await ethereum.request({ method: "eth_requestAccounts" }); setAccount(accounts[0] ?? null); } catch { setAccount(null); }
  }
  return <header className="topbar"><Link className="brand" href="/">PRIOR</Link><nav className="nav" aria-label="Primary"><Link href="/live">Live</Link><Link href={`/circuit/${CONTINUITY_ID}`}>Circuits</Link><Link href="/history/demo">History</Link><Link href="/profile/demo">Profile</Link></nav><button className="wallet" onClick={connect}>{account ? `${account.slice(0, 6)}…${account.slice(-4)}` : "Connect"}</button></header>;
}

export function ProbabilityTrack({ value, market, onChange, locked = false }: { value: number; market: number | null; onChange?: (n: number) => void; locked?: boolean }) {
  return <div className="control"><div className="track" aria-hidden="true"><span className="market-marker" style={{ left: `${market ?? 0}%` }} /><span className="forecast-marker" style={{ left: `${value}%` }} /></div><div className="eyebrow axis"><span>0</span><span>100</span></div><input aria-label="Forecast probability of Up" type="range" min="0" max="100" value={value} disabled={locked} onChange={event => onChange?.(Number(event.target.value))} /><div className="eyebrow axis"><span className="amber">◆ Market {market == null ? "—" : `${market}%`}</span><span className="blue">● You {value}%</span></div></div>;
}

type ForecastState = "EDITABLE" | "SIGNING" | "SUBMITTED" | "CONFIRMING" | "COMMITTED";
export function ForecastCommit({ initial = 50, market, receiptConfirmed = false }: { initial?: number; market: number | null; receiptConfirmed?: boolean }) {
  const [value, setValue] = useState(initial);
  const [state, setState] = useState<ForecastState>("EDITABLE");
  const [error, setError] = useState("");
  useEffect(() => { if (receiptConfirmed && state === "CONFIRMING") setState("COMMITTED"); }, [receiptConfirmed, state]);
  function beginCommit() {
    if (state !== "EDITABLE") return;
    setError(""); setState("SIGNING");
    // This surface never marks a wallet signature as a commitment. A real receipt read must drive COMMITTED.
    window.setTimeout(() => setState("SUBMITTED"), 450);
    window.setTimeout(() => setState("CONFIRMING"), 900);
  }
  const locked = state !== "EDITABLE";
  return <section className={`forecast-panel state-${state.toLowerCase()}`} aria-label="Forecast commitment"><div className="eyebrow">Your forecast</div><div className="prob blue">{value}%</div><div className="eyebrow">● UP · {state}</div><ProbabilityTrack value={value} market={market} onChange={setValue} locked={locked}/><button className="primary commit" disabled={locked} onClick={beginCommit}>{state === "EDITABLE" ? `COMMIT ${value}%` : state === "SIGNING" ? "CONFIRM IN WALLET" : state === "SUBMITTED" ? "SUBMITTED — AWAITING RECEIPT" : state === "CONFIRMING" ? "CONFIRMING ON CHAIN" : `COMMITTED ${value}%`}</button>{error && <p className="error">{error}</p>}<p className="state-note">{state === "SIGNING" ? "Wallet signature requested. No commitment exists yet." : state === "SUBMITTED" ? "Transaction submitted; the forecast remains pending until a receipt confirms it." : state === "CONFIRMING" ? "Reading the chain receipt. Do not treat signing as commitment." : state === "COMMITTED" ? "Immutable only after confirmed chain evidence." : "Editable until the commit flow begins."}</p></section>;
}

export function LiveCanvas() {
  const market = Number(MARKET_ONE.rft.marketReferenceBps) / 100;
  return <><Header/><main className="shell"><aside className="rail"><div className="eyebrow">Markets / Shannon</div><div className="market-row active"><strong>BTC · 5 MIN</strong><br/><span className="amber">{percent(MARKET_ONE.rft.marketReferenceBps)} Up reference</span><br/><span className="mono">END_TO_END_VERIFIED · #1</span></div><div className="state-note"><div className="eyebrow">Evidence-backed surface</div><br/>Primary rows are only shown when chain or accepted evidence exists.<br/><br/><Link href={`/circuit/${CONTINUITY_ID}`}>Open continuity Circuit →</Link></div></aside><section className="canvas"><div className="canvas-head"><span>BTC · 5 MIN · MARKET #1</span><span className="violet">{MARKET_ONE.rft.status}</span></div><div className="focus"><div className="eyebrow">Forecast vs reference · resolved proof</div><div className="prob-row"><div><div className="prob amber">{percent(MARKET_ONE.rft.marketReferenceBps)}</div><div className="eyebrow">◆ REFERENCE AT COMMIT</div></div><div><div className="prob blue">{percent(MARKET_ONE.rft.forecastBps)}</div><div className="eyebrow">● FORECAST</div></div></div><div className="proof-grid"><div><span className="eyebrow">Outcome</span><strong className="down">{MARKET_ONE.rft.outcome}</strong></div><div><span className="eyebrow">Forecast score</span><strong>{MARKET_ONE.rft.forecastBrier.toLocaleString()}</strong></div><div><span className="eyebrow">Reference score</span><strong>{MARKET_ONE.rft.marketBrier.toLocaleString()}</strong></div><div><span className="eyebrow">Difference</span><strong>{MARKET_ONE.rft.marketScoreDelta.toLocaleString()}</strong></div></div><div className="evidence-line mono">marketId {short(MARKET_ONE.marketId)} · RFT {MARKET_ONE.rft.status}</div></div><ForecastCommit initial={50} market={market}/><div className="economic-proof"><div className="eyebrow">Market #1 · economic proof</div><p>{MARKET_ONE.accounting.conclusion}.</p><div className="proof-grid"><div><span className="eyebrow">Filled</span><strong>{MARKET_ONE.order.status}</strong></div><div><span className="eyebrow">Actual fill</span><strong>{MARKET_ONE.accounting.actualFillPriceRaw}</strong></div><div><span className="eyebrow">Quantity</span><strong>{MARKET_ONE.accounting.quantityRaw}</strong></div><div><span className="eyebrow">Payout</span><strong>{MARKET_ONE.settlement.payoutRaw}</strong></div></div><div className="mono evidence-line">order tx {short(MARKET_ONE.order.tx)} · redemption {short(MARKET_ONE.settlement.redemptionTx)}</div></div></section><aside className="rail right"><span className="context">DEPTH</span><span className="context">EXEC</span><span className="context active">PROOF</span></aside></main></>;
}
