"use client";

import { useEffect, useMemo, useState } from "react";
import { encodeFunctionData } from "viem";
import { ForecastNode, MarketNode, ProbabilityTrack } from "../components";
import type { AcceptedForecast } from "../evidence";

type Provider = { request(args: { method: string; params?: unknown[] }): Promise<unknown> };
declare global { interface Window { ethereum?: Provider } }

type Fallback = {
  circuitId: string;
  marketId: string;
  forecastId: string;
  probabilityUpBps: number;
  outcome: string;
  status: string;
  commitBlock: string;
  targetWindows: number;
  completed: number;
  abstained: number;
};

type View = {
  schemaVersion: string;
  source: { mode: "LIVE" | "ACCEPTED_SNAPSHOT"; chainId: number; blockNumber?: string; fetchedAt: string; freshness?: string; endpoint: string; evidenceClassification: string };
  circuit: { circuitId: string; status: string; forecaster: string; targetWindows: number; completed: number; missed: number; abstained: number; budget?: Record<string, unknown>; authority?: Record<string, unknown> };
  iteration: { marketId: string; market: { status: string; reference?: unknown; referenceValid?: boolean }; forecast?: { trialId?: string; probability: number; status: string; forecaster: string }; rft?: { trialId: string; status: string; outcome?: string; score?: string }; binding: { bound: boolean; processed: boolean }; policy: { state: string; decision: string; reason?: string }; execution: { status: string; authorized: boolean; refusalReason?: string }; resolution: { finalized: boolean; outcome?: string; source: string } };
  next: { state: string; marketId?: string };
};

const COMMIT_ABI = [{ type: "function", name: "commitForecast", inputs: [{ name: "marketId", type: "bytes32" }, { name: "pUpBps", type: "uint16" }, { name: "referenceUpBps", type: "uint16" }, { name: "referenceValid", type: "bool" }, { name: "tradeTag", type: "uint64" }, { name: "actionIntent", type: "uint8" }], outputs: [{ name: "trialId", type: "bytes32" }] }] as const;
const RFT_REGISTRY = "0x5b1B51cB062B7B782c9EC2Bd5674eFAdb5308F41" as const;

function snapshot(f: Fallback): View { return { schemaVersion: "prior.continuity.v1", source: { mode: "ACCEPTED_SNAPSHOT", chainId: 50312, fetchedAt: "2026-09-06T00:00:00.000Z", freshness: "historical accepted snapshot", endpoint: "committed repository evidence", evidenceClassification: "SHANNON_WRITE_VERIFIED" }, circuit: { circuitId: f.circuitId, status: "COMPLETE", forecaster: "accepted evidence", targetWindows: f.targetWindows, completed: f.completed, missed: 0, abstained: f.abstained, budget: { total: "0", maxPerMarket: "0" }, authority: { allowedActionsBitmap: "0", execution: "NONE" } }, iteration: { marketId: f.marketId, market: { status: "RESOLVED", referenceValid: false }, forecast: { trialId: f.forecastId, probability: f.probabilityUpBps, status: "SCORED", forecaster: "accepted evidence" }, rft: { trialId: f.forecastId, status: "SCORED", outcome: f.outcome }, binding: { bound: true, processed: true }, policy: { state: "EVALUATED", decision: "ABSTAIN", reason: "Accepted Circuit evidence recorded a deliberate abstention." }, execution: { status: "ABSTAINED", authorized: false, refusalReason: "No economic action was requested in the accepted evidence." }, resolution: { finalized: true, outcome: f.outcome, source: "accepted evidence artifact" } }, next: { state: "COMPLETE" } }; }

export function LiveWorkspace({ fallback }: { fallback: Fallback }) {
  const [view, setView] = useState<View>(() => snapshot(fallback));
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [probability, setProbability] = useState(fallback.probabilityUpBps / 100);
  const [requested, setRequested] = useState(false);
  const [phase, setPhase] = useState("READING_LIVE_STATE");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const refresh = async () => {
    setPhase("READING_LIVE_STATE");
    try {
      const response = await fetch(`/api/continuity?circuitId=${encodeURIComponent(fallback.circuitId)}&marketId=${encodeURIComponent(fallback.marketId)}`, { cache: "no-store" });
      if (!response.ok) throw new Error((await response.json() as { message?: string }).message ?? "live state unavailable");
      setView(await response.json() as View); setSourceError(null); setPhase("READY");
    } catch (e) { setSourceError(e instanceof Error ? e.message : "live state unavailable"); setPhase("ACCEPTED_SNAPSHOT"); }
  };
  useEffect(() => { void refresh(); }, []);

  const terminal = view.iteration.resolution.finalized || view.circuit.status === "COMPLETE";
  const marketLabel = terminal ? "SELECTED HERO ITERATION" : "CURRENT ELIGIBLE MARKET";
  const marketState = terminal ? "RESOLVED" : view.iteration.market.status;
  const data = useMemo(() => encodeFunctionData({ abi: COMMIT_ABI, functionName: "commitForecast", args: [fallback.marketId as `0x${string}`, Math.round(probability * 100), 0, false, 0n, 0] }), [fallback.marketId, probability]);
  const canCommit = requested && view.source.mode === "LIVE" && view.iteration.market.status === "TRADING" && !view.iteration.forecast && phase === "READY";
  async function commit() {
    if (!canCommit || !window.ethereum) return;
    setError(null); setPhase("SIGNING");
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as string[];
      const chain = await window.ethereum.request({ method: "eth_chainId" });
      if (String(chain).toLowerCase() !== "0xc488") throw new Error("CHAIN_MISMATCH: connect to Somnia Shannon");
      const hash = await window.ethereum.request({ method: "eth_sendTransaction", params: [{ from: accounts[0], to: RFT_REGISTRY, data, value: "0x0" }] }) as string;
      setTxHash(hash); setPhase("AWAITING_RECEIPT");
      for (let attempt = 0; attempt < 60; attempt += 1) {
        const receipt = await window.ethereum.request({ method: "eth_getTransactionReceipt", params: [hash] }) as { status?: string } | null;
        if (receipt) { if (receipt.status !== "0x1") throw new Error("RECEIPT_REVERTED: commit transaction reverted"); await refresh(); setPhase("COMMITTED_READBACK"); return; }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      throw new Error("TIMEOUT: receipt was not observed");
    } catch (e) { setError(e instanceof Error ? e.message : "commit failed"); setPhase("SIGNATURE_REJECTED"); }
  }

  return <div className="operational-workspace">
    <header className="operational-header"><div><span className="instrument-label">ACTIVE CIRCUIT · OPERATIONAL VIEW</span><h1>One intent. The next eligible market.</h1></div><div className={`source-badge ${view.source.mode === "LIVE" ? "is-live" : ""}`}>{view.source.mode === "LIVE" ? "LIVE READ" : "ACCEPTED SNAPSHOT"}<small>{view.source.evidenceClassification} · CHAIN {view.source.chainId}</small></div></header>
    <section className="operational-circuit"><div><span>CIRCUIT</span><strong className="mono">{fallback.circuitId}</strong><small>{view.circuit.status} · {view.circuit.completed}/{view.circuit.targetWindows} completed · {view.circuit.abstained} abstained</small></div><div><span>INTENT</span><strong>Persistent bounded intent</strong><small>Allowed actions: {String(view.circuit.authority?.allowedActionsBitmap ?? "unknown")} · Runner provides liveness, not truth</small></div><div><span>SOURCE</span><strong>{view.source.freshness}</strong><small>{view.source.endpoint}</small></div></section>
    {sourceError && <div className="source-warning"><strong>LIVE STATE UNAVAILABLE</strong><span>{sourceError}</span><small>Accepted evidence snapshot shown below. It is not current live state.</small></div>}
    <section className="operational-market"><header><div><span className="instrument-label">{marketLabel}</span><h2>BTC · 1 HOUR</h2></div><div><span>MARKET STATE</span><strong>{marketState}</strong></div><div><span>NEXT STATE</span><strong>{view.next.state}</strong></div></header><div className="market-belief"><div><span><MarketNode label="Market reference"/> MARKET REFERENCE</span><strong>{view.iteration.market.referenceValid ? "AVAILABLE" : "UNAVAILABLE"}</strong><small>Canonical DreamDEX market detail</small></div><div><span><ForecastNode label="Your Forecast"/> YOUR FORECAST</span><strong>{view.iteration.forecast ? `${view.iteration.forecast.probability / 100}% UP` : `${probability}% UP`}</strong><small>{view.iteration.forecast ? `RFT ${view.iteration.forecast.status}` : "One probability before resolution"}</small></div></div>{!view.iteration.forecast && <><ProbabilityTrack forecast={probability} market={null} onChange={setProbability}/><div className="forecast-actions"><label><input type="checkbox" checked={requested} onChange={(e) => setRequested(e.target.checked)}/> I want to review and sign this Forecast</label><button type="button" className="primary-button" disabled={!canCommit} onClick={() => void commit()}>REVIEW &amp; SIGN FORECAST</button></div></>}{view.iteration.forecast && <div className="commit-state"><strong>{view.iteration.rft?.status === "SCORED" ? "RFT SCORED · FORECAST FINALIZED" : "FORECAST COMMITTED"}</strong><span>RFT {view.iteration.forecast.trialId ?? fallback.forecastId}</span><small>{view.iteration.rft?.status === "SCORED" ? "This selected hero iteration is complete. Choose a new eligible market to test a new Forecast." : "Canonical readback confirmed the committed Forecast."} {txHash ? `Transaction ${txHash}` : ""}</small></div>}</section>
    <section className="operational-grid"><article><span className="instrument-label">CIRCUIT POLICY</span><h2>{view.iteration.policy.decision}</h2><p>{view.iteration.policy.reason}</p></article><article><span className="instrument-label">EXECUTION</span><h2>{view.iteration.execution.status}</h2><p>{view.iteration.execution.refusalReason ?? "No execution has been requested."}</p></article><article><span className="instrument-label">RESOLUTION</span><h2>{view.iteration.resolution.finalized ? view.iteration.resolution.outcome : "WAITING"}</h2><p>{view.iteration.resolution.finalized ? "DreamDEX canonical outcome and RFT finalization are represented." : "Waiting for DreamDEX resolution. No outcome is inferred."}</p></article></section>
    <section className="progress-strip"><span className="instrument-label">CIRCUIT PROGRESS</span><div>{Array.from({ length: Math.max(view.circuit.targetWindows, 1) }, (_, i) => <i className={i < view.circuit.completed ? "complete" : i === view.circuit.completed ? "current" : "next"} key={i}>{i + 1}</i>)}</div><small>Forecast captures belief. RFT preserves evidence. Circuit preserves intent.</small></section>
    {error && <div className="source-warning"><strong>{phase}</strong><span>{error}</span></div>}
  </div>;
}

export type { Fallback };
