"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Provider = { request(args: { method: string; params?: unknown[] }): Promise<unknown> };
declare global { interface Window { ethereum?: Provider } }
type Circuit = { circuitId: string; blockNumber?: string; transactionHash?: string; source: string };

export function MyActivity() {
  const [account, setAccount] = useState<string | null>(null);
  const [status, setStatus] = useState("CONNECT WALLET TO RECOVER");
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [error, setError] = useState<string | null>(null);
  async function connect() {
    const provider = window.ethereum;
    if (!provider) { setStatus("PROVIDER REQUIRED"); return; }
    setStatus("CONNECTING"); setError(null);
    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[];
      const chain = String(await provider.request({ method: "eth_chainId" })).toLowerCase();
      if (chain !== "0xc488") throw new Error("WRONG_CHAIN · SWITCH TO SOMNIA SHANNON");
      const next = accounts[0]; if (!next) throw new Error("NO_ACCOUNT");
      setAccount(next); setStatus("RECOVERING BOUNDED RECENT CIRCUITS");
      const response = await fetch(`/api/circuits?owner=${encodeURIComponent(next)}`, { cache: "no-store" });
      const body = await response.json() as { items?: Circuit[]; message?: string };
      if (!response.ok) throw new Error(body.message ?? "OWNER_RECOVERY_UNAVAILABLE");
      setCircuits(body.items ?? []); setStatus("LIVE · RECOVERY READ");
    } catch (reason) { setStatus("RECOVERY BLOCKED"); setError(reason instanceof Error ? reason.message : "OWNER_RECOVERY_UNAVAILABLE"); }
  }
  useEffect(() => { const provider = window.ethereum; if (!provider) return; void provider.request({ method: "eth_accounts" }).then((value) => { const next = (value as string[])[0]; if (next) setAccount(next); }); }, []);
  return <section className="my-activity" aria-labelledby="my-title">
    <header className="page-heading"><span className="instrument-label">MY PRIOR · OWNER-SCOPED RECOVERY</span><h1 id="my-title">Recover your continuity.</h1><p>Connect the owner wallet to read recent participant-specific Circuits. This is bounded event recovery, not a global index, and no fixture Circuit is shown as yours.</p></header>
    <div className="my-identity"><div><span>OWNER</span><strong className="mono">{account ?? "NOT CONNECTED"}</strong></div><div><span>SOURCE</span><strong>{status}</strong><small>Somnia Shannon · recent CircuitCreated events</small></div><button type="button" className="primary-button" onClick={() => void connect()}>{account ? "REFRESH MY CIRCUITS" : "CONNECT SHANNON WALLET"}</button></div>
    {error && <div className="source-warning" role="alert"><strong>OWNER RECOVERY UNAVAILABLE</strong><span>{error}</span><small>No local or fixture state was substituted.</small></div>}
    {!error && account && circuits.length === 0 && <div className="catalog-empty"><span className="instrument-label">NO RECENT CIRCUITS FOUND</span><h2>Your participant history starts here.</h2><p>Create a forecast-only Circuit or return when a canonical CircuitCreated event is inside the bounded recovery window.</p><Link className="secondary-button" href="/create">CREATE A CIRCUIT</Link></div>}
    {circuits.length > 0 && <div className="my-circuit-list">{circuits.map((circuit) => <article className="my-circuit-card" key={circuit.circuitId}><div><span className="instrument-label">PARTICIPANT CIRCUIT · LIVE</span><h2 className="mono">{circuit.circuitId}</h2><small>{circuit.source}</small></div><div><Link className="primary-button" href={`/circuit/${circuit.circuitId}`}>OPEN CONTROL ROOM</Link><Link className="text-link" href={`/live?circuitId=${circuit.circuitId}`}>OPEN LIVE MARKET →</Link></div></article>)}</div>}
  </section>;
}
