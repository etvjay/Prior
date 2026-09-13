"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { useChainModal, useConnectModal } from "@rainbow-me/rainbowkit";

type Circuit = { circuitId: string; blockNumber?: string; transactionHash?: string; source: string };

export function MyActivity() {
  const { address: account, isConnected } = useAccount();
  const chainId = useChainId();
  const { openConnectModal } = useConnectModal();
  const { openChainModal } = useChainModal();
  const [status, setStatus] = useState("CONNECT WALLET TO RECOVER");
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [error, setError] = useState<string | null>(null);

  function openWallet() {
    if (!isConnected) { openConnectModal?.(); return; }
    if (chainId !== 50312) { openChainModal?.(); return; }
  }

  useEffect(() => {
    if (!account) { setStatus("CONNECT WALLET TO RECOVER"); setCircuits([]); setError(null); return; }
    if (chainId !== 50312) { setStatus("WRONG NETWORK · SWITCH TO SOMNIA SHANNON"); setCircuits([]); setError(null); return; }
    let cancelled = false;
    setStatus("RECOVERING BOUNDED RECENT CIRCUITS"); setError(null);
    void fetch(`/api/circuits?owner=${encodeURIComponent(account)}`, { cache: "no-store" }).then(async (response) => {
      const body = await response.json() as { items?: Circuit[]; message?: string };
      if (!response.ok) throw new Error(body.message ?? "OWNER_RECOVERY_UNAVAILABLE");
      if (!cancelled) { setCircuits(body.items ?? []); setStatus("LIVE · RECOVERY READ"); }
    }).catch((reason) => { if (!cancelled) { setStatus("RECOVERY BLOCKED"); setError(reason instanceof Error ? reason.message : "OWNER_RECOVERY_UNAVAILABLE"); } });
    return () => { cancelled = true; };
  }, [account, chainId]);

  return <section className="my-activity" aria-labelledby="my-title">
    <header className="page-heading"><span className="instrument-label">MY PRIOR · OWNER-SCOPED RECOVERY</span><h1 id="my-title">Recover your continuity.</h1><p>Connect the owner wallet to read recent participant-specific Circuits. This is bounded event recovery, not a global index, and no fixture Circuit is shown as yours.</p></header>
    <div className="my-identity"><div><span>OWNER</span><strong className="mono">{account ?? "NOT CONNECTED"}</strong></div><div><span>SOURCE</span><strong>{status}</strong><small>Somnia Shannon · recent CircuitCreated events</small></div><button type="button" className="primary-button" onClick={openWallet}>{!isConnected ? "CONNECT SHANNON WALLET" : chainId !== 50312 ? "SWITCH TO SHANNON" : "REFRESH MY CIRCUITS"}</button></div>
    {error && <div className="source-warning" role="alert"><strong>OWNER RECOVERY UNAVAILABLE</strong><span>{error}</span><small>No local or fixture state was substituted.</small></div>}
    {!error && account && circuits.length === 0 && <div className="catalog-empty"><span className="instrument-label">NO RECENT CIRCUITS FOUND</span><h2>Your participant history starts here.</h2><p>Create a forecast-only Circuit or return when a canonical CircuitCreated event is inside the bounded recovery window.</p><Link className="secondary-button" href="/create">CREATE A CIRCUIT</Link></div>}
    {circuits.length > 0 && <div className="my-circuit-list">{circuits.map((circuit) => <article className="my-circuit-card" key={circuit.circuitId}><div><span className="instrument-label">PARTICIPANT CIRCUIT · LIVE</span><h2 className="mono">{circuit.circuitId}</h2><small>{circuit.source}</small></div><div><Link className="primary-button" href={`/circuit/${circuit.circuitId}`}>OPEN CONTROL ROOM</Link><Link className="text-link" href={`/live?circuitId=${circuit.circuitId}`}>OPEN LIVE MARKET →</Link></div></article>)}</div>}
  </section>;
}
