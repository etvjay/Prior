"use client";
import { useState } from "react";

export function GuidedAuthorize({ transaction }: { transaction: { to: `0x${string}`; data: `0x${string}`; value?: bigint } | null }) {
  const [state, setState] = useState("AWAITING_OWNER_AUTHORIZATION");
  async function authorize() {
    if (!transaction) return;
    const ethereum = (window as any).ethereum;
    if (!ethereum) { setState("WALLET_UNAVAILABLE"); return; }
    try {
      setState("SIGNING");
      const [from] = await ethereum.request({ method: "eth_requestAccounts" });
      const hash = await ethereum.request({ method: "eth_sendTransaction", params: [{ from, to: transaction.to, data: transaction.data, value: `0x${(transaction.value ?? 0n).toString(16)}` }] });
      setState(`SIGNED → SUBMITTED · ${String(hash).slice(0, 10)}…`);
    } catch { setState("REJECTED_OR_FAILED"); }
  }
  return <div className="list"><div className="list-row"><span>Authority</span><strong>{state}</strong></div><button className="primary" type="button" onClick={authorize} disabled={!transaction || state === "SIGNING"}>{transaction ? "AUTHORIZE EXECUTION" : "WAITING FOR EXACT PROPOSAL"}</button></div>;
}
