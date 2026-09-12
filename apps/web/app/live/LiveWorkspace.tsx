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

type MarketOption = { marketId: string; asset?: string; intervalSec?: string; clobStatus?: string; expiry?: string; marketAddress?: string; baseSymbol?: string };

type View = {
  schemaVersion: string;
  source: { mode: "LIVE" | "ACCEPTED_SNAPSHOT"; chainId: number; blockNumber?: string; fetchedAt: string; freshness?: string; endpoint: string; evidenceClassification: string };
  circuit: { circuitId: string; status: string; forecaster: string; targetWindows: number; completed: number; missed: number; abstained: number; budget?: Record<string, unknown>; authority?: Record<string, unknown> };
  iteration: { marketId: string; market: { status: string; reference?: unknown; referenceValid?: boolean }; forecast?: { trialId?: string; probability: number; status: string; forecaster: string }; rft?: { trialId: string; status: string; outcome?: string; score?: string }; binding: { bound: boolean; processed: boolean }; policy: { state: string; decision: string; reason?: string }; execution: { status: string; authorized: boolean; refusalReason?: string }; resolution: { finalized: boolean; outcome?: string; source: string } };
  next: { state: string; marketId?: string };
};

const COMMIT_ABI = [{ type: "function", name: "commitForecast", inputs: [{ name: "marketId", type: "bytes32" }, { name: "pUpBps", type: "uint16" }, { name: "referenceUpBps", type: "uint16" }, { name: "referenceValid", type: "bool" }, { name: "tradeTag", type: "uint64" }, { name: "actionIntent", type: "uint8" }], outputs: [{ name: "trialId", type: "bytes32" }] }] as const;
const RFT_REGISTRY = "0x5b1B51cB062B7B782c9EC2Bd5674eFAdb5308F41" as const;
const CIRCUIT_REGISTRY = "0x1eD3B2310F369977ef82569498d5F678f8B73104" as const;
const BIND_ABI = [{ type: "function", name: "bindTrial", inputs: [{ name: "circuitId", type: "bytes32" }, { name: "marketId", type: "bytes32" }, { name: "trialId", type: "bytes32" }], outputs: [] }] as const;

function snapshot(f: Fallback, historical = true): View { return { schemaVersion: "prior.continuity.v1", source: { mode: "ACCEPTED_SNAPSHOT", chainId: 50312, fetchedAt: "2026-09-06T00:00:00.000Z", freshness: historical ? "historical accepted snapshot" : "participant readback pending", endpoint: "committed repository evidence", evidenceClassification: historical ? "SHANNON_WRITE_VERIFIED" : "LOCAL_INTEGRATED" }, circuit: { circuitId: f.circuitId, status: historical ? "COMPLETE" : f.status, forecaster: historical ? "accepted evidence" : "participant readback pending", targetWindows: f.targetWindows, completed: f.completed, missed: 0, abstained: f.abstained, budget: { total: "0", maxPerMarket: "0" }, authority: { allowedActionsBitmap: "0", execution: "NONE" } }, iteration: { marketId: f.marketId, market: { status: historical ? "RESOLVED" : "UNKNOWN", referenceValid: false }, forecast: historical ? { trialId: f.forecastId, probability: f.probabilityUpBps, status: "SCORED", forecaster: historical ? "accepted evidence" : "participant readback pending" } : undefined, rft: historical ? { trialId: f.forecastId, status: "SCORED", outcome: f.outcome } : undefined, binding: { bound: historical, processed: historical }, policy: historical ? { state: "EVALUATED", decision: "ABSTAIN", reason: "Accepted Circuit evidence recorded a deliberate abstention." } : { state: "UNAVAILABLE", decision: "WAITING", reason: "Participant state requires a live canonical read." }, execution: historical ? { status: "ABSTAINED", authorized: false, refusalReason: "No economic action was requested in the accepted evidence." } : { status: "DISABLED", authorized: false, refusalReason: "No participant execution state is available from the fallback." }, resolution: historical ? { finalized: true, outcome: f.outcome, source: "accepted evidence artifact" } : { finalized: false, source: "live canonical read required" } }, next: { state: historical ? "COMPLETE" : "WAITING_FOR_LIVE_READ" } }; }

export function LiveWorkspace({ fallback, snapshotEvidence = true }: { fallback: Fallback; snapshotEvidence?: boolean }) {
  const [view, setView] = useState<View>(() => snapshot(fallback, snapshotEvidence));
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [probability, setProbability] = useState(fallback.probabilityUpBps / 100);
  const [requested, setRequested] = useState(false);
  const [phase, setPhase] = useState("READING_LIVE_STATE");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [walletAccount, setWalletAccount] = useState<string | null>(null);
  const [markets, setMarkets] = useState<MarketOption[]>([]);
  const [selectedMarketId, setSelectedMarketId] = useState(fallback.marketId);
  const selectedMarket = markets.find((market) => market.marketId.toLowerCase() === selectedMarketId.toLowerCase());
  useEffect(() => {
    const provider = window.ethereum;
    if (!provider) return;
    const syncAccount = async () => { const accounts = await provider.request({ method: "eth_accounts" }) as string[]; setWalletAccount(accounts[0] ?? null); };
    void syncAccount();
    const events = provider as Provider & { on?: (event: string, listener: (value: unknown) => void) => void; removeListener?: (event: string, listener: (value: unknown) => void) => void };
    const onAccounts = () => void syncAccount();
    events.on?.("accountsChanged", onAccounts);
    return () => events.removeListener?.("accountsChanged", onAccounts);
  }, []);
  const accountMatches = Boolean(walletAccount && /^0x[0-9a-fA-F]{40}$/.test(view.circuit.forecaster) && walletAccount.toLowerCase() === view.circuit.forecaster.toLowerCase());

  const refresh = async (marketId = selectedMarketId): Promise<View | null> => {
    setPhase("READING_LIVE_STATE");
    try {
      const response = await fetch(`/api/continuity?circuitId=${encodeURIComponent(fallback.circuitId)}&marketId=${encodeURIComponent(marketId)}`, { cache: "no-store" });
      if (!response.ok) throw new Error((await response.json() as { message?: string }).message ?? "live state unavailable");
      const nextView = await response.json() as View;
      setView(nextView); setSourceError(null); setPhase("READY"); return nextView;
    } catch (e) { setSourceError(e instanceof Error ? e.message : "live state unavailable"); setPhase("ACCEPTED_SNAPSHOT"); return null; }
  };
  useEffect(() => { void refresh(fallback.marketId); void fetch("/api/discovery/markets?limit=12", { cache: "no-store" }).then(async (response) => { if (!response.ok) throw new Error("bounded market discovery unavailable"); const body = await response.json() as { items?: MarketOption[] }; const items = body.items ?? []; setMarkets(items); const initial = items.find((item) => item.marketId.toLowerCase() === fallback.marketId.toLowerCase()) ?? items[0]; if (initial) { setSelectedMarketId(initial.marketId); void refresh(initial.marketId); } }).catch((e) => setSourceError(e instanceof Error ? e.message : "bounded market discovery unavailable")); }, []);

  const aligned = view.iteration.marketId.toLowerCase() === selectedMarketId.toLowerCase();
  const terminal = aligned && (view.iteration.resolution.finalized || view.circuit.status === "COMPLETE");
  const marketStatus = selectedMarket?.clobStatus?.toUpperCase() === "TRADING" ? "TRADING" : selectedMarket?.clobStatus?.toUpperCase() ?? view.iteration.market.status;
  const marketLabel = selectedMarket ? "DISCOVERED MARKET · VERIFYING" : terminal ? "SELECTED HERO ITERATION" : "CURRENT ELIGIBLE MARKET";
  const marketState = selectedMarket ? marketStatus : terminal ? "RESOLVED" : view.iteration.market.status;
  const data = useMemo(() => encodeFunctionData({ abi: COMMIT_ABI, functionName: "commitForecast", args: [selectedMarketId as `0x${string}`, Math.round(probability * 100), 0, false, 0n, 0] }), [selectedMarketId, probability]);
  const canCommit = requested && view.source.mode === "LIVE" && aligned && accountMatches && marketStatus === "TRADING" && !view.iteration.forecast && phase === "READY";
  const accountReason = view.source.mode === "LIVE" && aligned && !accountMatches ? walletAccount ? "WRITE DISABLED · connected wallet is not this Circuit’s forecaster" : "CONNECT THE CIRCUIT FORECASTER WALLET TO CONTINUE" : null;
  async function commit() {
    if (!canCommit || !window.ethereum) return;
    setError(null); setPhase("SIGNING");
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as string[];
      if (!accounts[0] || !accountMatches || accounts[0].toLowerCase() !== view.circuit.forecaster.toLowerCase()) throw new Error("FORECASTER_MISMATCH: connected wallet does not own this Circuit");
      const chain = await window.ethereum.request({ method: "eth_chainId" });
      if (String(chain).toLowerCase() !== "0xc488") throw new Error("CHAIN_MISMATCH: connect to Somnia Shannon");
      const hash = await window.ethereum.request({ method: "eth_sendTransaction", params: [{ from: accounts[0], to: RFT_REGISTRY, data, value: "0x0" }] }) as string;
      setTxHash(hash); setPhase("AWAITING_RECEIPT");
      for (let attempt = 0; attempt < 60; attempt += 1) {
        const receipt = await window.ethereum.request({ method: "eth_getTransactionReceipt", params: [hash] }) as { status?: string } | null;
        if (receipt) {
          if (receipt.status !== "0x1") throw new Error("RECEIPT_REVERTED: commit transaction reverted");
          const canonical = await refresh();
          const trialId = canonical?.iteration.forecast?.trialId;
          if (!canonical || !trialId) throw new Error("READBACK_MISMATCH: canonical Forecast was not found");
          if (!canonical.iteration.binding.bound) {
            setPhase("BINDING_RFT");
            const bindData = encodeFunctionData({ abi: BIND_ABI, functionName: "bindTrial", args: [fallback.circuitId as `0x${string}`, selectedMarketId as `0x${string}`, trialId as `0x${string}`] });
            const bindHash = await window.ethereum.request({ method: "eth_sendTransaction", params: [{ from: accounts[0], to: CIRCUIT_REGISTRY, data: bindData, value: "0x0" }] }) as string;
            let bindConfirmed = false;
            for (let bindAttempt = 0; bindAttempt < 60; bindAttempt += 1) {
              const bindReceipt = await window.ethereum.request({ method: "eth_getTransactionReceipt", params: [bindHash] }) as { status?: string } | null;
              if (bindReceipt) { if (bindReceipt.status !== "0x1") throw new Error("BIND_RECEIPT_REVERTED: Circuit binding was not confirmed"); bindConfirmed = true; break; }
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            if (!bindConfirmed) throw new Error("BIND_RECEIPT_TIMEOUT: Circuit binding receipt was not observed");
          }
          const bound = await refresh();
          if (!bound?.iteration.binding.bound) throw new Error("BIND_READBACK_MISMATCH: Circuit iteration is not bound");
          setPhase("COMMITTED_READBACK"); return;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      throw new Error("TIMEOUT: receipt was not observed");
    } catch (e) { setError(e instanceof Error ? e.message : "commit failed"); setPhase("SIGNATURE_REJECTED"); }
  }

  return <div className="operational-workspace">
    <section className="market-picker" aria-labelledby="market-picker-title"><div><span className="instrument-label">STEP 1 · DISCOVER</span><h2 id="market-picker-title">Choose an eligible DreamDEX market</h2><p>Bounded recent discovery only. The selected market is verified against this Circuit before a write is enabled.</p></div><label htmlFor="market-select">MARKET<select id="market-select" value={selectedMarketId} onChange={(event) => { const next = event.target.value; setSelectedMarketId(next); setRequested(false); setTxHash(null); setError(null); void refresh(next); }}>{markets.length === 0 && <option value={fallback.marketId}>Loading bounded market sample…</option>}{markets.map((market) => <option key={market.marketId} value={market.marketId}>{market.asset ?? market.baseSymbol ?? "MARKET"} · {market.intervalSec ? `${Number(market.intervalSec) / 60}m` : "interval unknown"} · {market.clobStatus ?? "state unknown"}</option>)}</select></label></section>
    <header className="operational-header"><div><span className="instrument-label">ACTIVE CIRCUIT · OPERATIONAL VIEW</span><h1>One intent. The next eligible market.</h1></div><div className={`source-badge ${view.source.mode === "LIVE" ? "is-live" : ""}`}>{view.source.mode === "LIVE" ? "LIVE READ" : "ACCEPTED SNAPSHOT"}<small>{view.source.evidenceClassification} · CHAIN {view.source.chainId}</small></div></header>
    <section className="operational-circuit"><div><span>CIRCUIT</span><strong className="mono">{fallback.circuitId}</strong><small>{view.circuit.status} · {view.circuit.completed}/{view.circuit.targetWindows} completed · {view.circuit.abstained} abstained</small></div><div><span>INTENT</span><strong>Persistent bounded intent</strong><small>Allowed actions: {String(view.circuit.authority?.allowedActionsBitmap ?? "unknown")} · Runner provides liveness, not truth</small></div><div><span>SOURCE</span><strong>{view.source.freshness}</strong><small>{view.source.endpoint}</small></div></section>
    {sourceError && <div className="source-warning"><strong>LIVE STATE UNAVAILABLE</strong><span>{sourceError}</span><small>Accepted evidence snapshot shown below. It is not current live state.</small></div>}
    {selectedMarket && !aligned && <div className="source-warning"><strong>VERIFYING SELECTED MARKET</strong><span>{selectedMarket.marketId}</span><small>Forecast commit stays disabled until this Circuit’s canonical iteration matches the selected market.</small></div>}
    <section className="operational-market"><header><div><span className="instrument-label">{marketLabel}</span><h2>{selectedMarket?.asset ?? "BTC"} · {selectedMarket?.intervalSec ? `${Number(selectedMarket.intervalSec) / 60} MIN` : "1 HOUR"}</h2></div><div><span>MARKET STATE</span><strong>{aligned ? marketState : "VERIFYING"}</strong></div><div><span>NEXT STATE</span><strong>{aligned ? (view.circuit.status === "COMPLETE" ? "CIRCUIT COMPLETE" : view.next.state) : "PENDING READ"}</strong></div></header><div className="participation-next"><span className="instrument-label">STEP 2 · FORECAST</span><strong>{aligned && marketStatus === "TRADING" ? "Set your probability, request review, then sign with your Shannon wallet." : "Wait for canonical verification before drafting a Forecast."}</strong></div><div className="market-belief"><div><span><MarketNode label="Market reference"/> MARKET REFERENCE</span><strong>{aligned && view.iteration.market.referenceValid ? "AVAILABLE" : "UNAVAILABLE"}</strong><small>Canonical DreamDEX market detail</small></div><div><span><ForecastNode label="Your Forecast"/> YOUR FORECAST</span><strong>{aligned && view.iteration.forecast ? `${view.iteration.forecast.probability / 100}% UP` : `${probability}% UP`}</strong><small>{aligned && view.iteration.forecast ? `RFT ${view.iteration.forecast.status}` : "Draft probability, pending canonical verification"}</small></div></div>{(!aligned || !view.iteration.forecast) && <><ProbabilityTrack forecast={probability} market={null} onChange={setProbability}/><div className="forecast-actions"><div><small className="write-gate">{canCommit ? "READY · wallet sign is next" : accountReason ?? (aligned && marketStatus === "TRADING" ? "NEXT · review the probability, then check the box to request a signature" : "WRITE DISABLED · canonical market/Circuit verification is still required")}</small><label><input aria-label="I want to review and sign this Forecast" type="checkbox" checked={requested} onChange={(e) => setRequested(e.target.checked)}/> I want to review and sign this Forecast</label><button type="button" className="primary-button" disabled={!canCommit} onClick={() => void commit()}>REVIEW &amp; SIGN FORECAST</button></div></div></>}{aligned && view.iteration.forecast && <div className="commit-state"><strong>{view.iteration.rft?.status === "SCORED" ? "RFT SCORED · FORECAST FINALIZED" : "FORECAST COMMITTED"}</strong><span>RFT {view.iteration.forecast.trialId ?? fallback.forecastId}</span><small>{view.iteration.rft?.status === "SCORED" ? "This selected hero iteration is complete. Choose a new eligible market to test a new Forecast." : "Canonical readback confirmed the committed Forecast."} {txHash ? `Transaction ${txHash}` : ""}</small></div>}</section>
    <section className="operational-grid"><article><span className="instrument-label">CIRCUIT POLICY</span><h2>{view.iteration.policy.decision}</h2><p>{view.iteration.policy.reason}</p></article><article><span className="instrument-label">EXECUTION</span><h2>{view.iteration.execution.status}</h2><p>{view.iteration.execution.refusalReason ?? "No execution has been requested."}</p></article><article><span className="instrument-label">RESOLUTION</span><h2>{view.iteration.resolution.finalized ? view.iteration.resolution.outcome : "WAITING"}</h2><p>{view.iteration.resolution.finalized ? "DreamDEX canonical outcome and RFT finalization are represented." : "Waiting for DreamDEX resolution. No outcome is inferred."}</p></article></section>
    <section className="progress-strip"><span className="instrument-label">CIRCUIT PROGRESS</span><div>{Array.from({ length: Math.max(view.circuit.targetWindows, 1) }, (_, i) => <i className={i < view.circuit.completed ? "complete" : i === view.circuit.completed ? "current" : "next"} key={i}>{i + 1}</i>)}</div><small>Forecast captures belief. RFT preserves evidence. Circuit preserves intent.</small></section>
    {error && <div className="source-warning"><strong>{phase}</strong><span>{error}</span></div>}
  </div>;
}

export type { Fallback };
