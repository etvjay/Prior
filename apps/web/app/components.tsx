"use client";
import Link from "next/link";
import { useState } from "react";

export function Header(){
 const [account,setAccount]=useState<string|null>(null);
 async function connect(){
  const eth=(window as any).ethereum;
  if(!eth){setAccount("WALLET UNAVAILABLE");return}
  try{const a=await eth.request({method:"eth_requestAccounts"});setAccount(a?.[0]??null)}catch{setAccount(null)}
 }
 return <header className="topbar"><Link className="brand" href="/">PRIOR</Link><nav className="nav"><Link href="/live">Live</Link><Link href="/circuits">Circuits</Link><Link href="/history/demo">History</Link><Link href="/profile/demo">Profile</Link></nav><button className="wallet" onClick={connect}>{account?account.slice(0,6)+"…"+account.slice(-4):"Connect"}</button></header>
}

export function ProbabilityTrack({value,market=61,onChange,locked=false}:{value:number;market?:number;onChange?:(n:number)=>void;locked?:boolean}){
 return <div className="control"><div className="track" aria-hidden="true"/><div className="eyebrow">0 <span style={{float:"right"}}>100</span></div><input aria-label="Forecast probability of Up" type="range" min="0" max="100" value={value} disabled={locked} onChange={e=>onChange?.(Number(e.target.value))}/><div className="eyebrow"><span className="amber">Market {market}%</span><span className="blue" style={{float:"right"}}>You {value}%</span></div></div>
}

export function LiveCanvas(){
 const [value,setValue]=useState(72); const [connected,setConnected]=useState(false);
 return <><Header/><main className="shell"><aside className="rail"><div className="eyebrow">Markets / Shannon</div>{["BTC · 15m","BTC · 1h","ETH · 15m","ETH · 1h"].map((x,i)=><div className={'market-row '+(i===0?'active':'')} key={x}><strong>{x}</strong><br/><span className="amber">{[61,54,43,48][i]}% Up</span><br/><span className="mono">LIVE · —:—</span></div>)}<div className="state-note"><div className="eyebrow">Active Circuit</div><br/>No authorized Circuit yet.<br/><br/><Link href="/circuits">Configure rules →</Link></div></aside><section className="canvas"><div className="canvas-head"><span>BTC · 15 MIN</span><span className="amber">TRADING · LIVE STATE</span></div><div className="focus"><div className="eyebrow">Market reference / Up</div><div className="prob-row"><div><div className="prob amber">61%</div><div className="eyebrow">◆ MARKET</div></div><div><div className="prob blue">{value}%</div><div className="eyebrow">● YOU</div></div></div><ProbabilityTrack value={value} onChange={setValue}/></div><div className="actions"><button className="primary commit" onClick={()=>setConnected(true)}>{connected?"CONFIRM IN WALLET":"COMMIT "+value+"%"}</button></div><div className="state-note"><div className="eyebrow">Chain state</div><br/>{connected?"Wallet request opened. No commitment is shown until a confirmed receipt exists.":"Forecast is editable. Live contract configuration is required before commit."}<br/><br/><span className="mono">CHAIN 50312 · RFT CONTRACT — · MARKET ID —</span></div></section><aside className="rail right"><span className="context">DEPTH</span><span className="context">EXEC</span><span className="context">PROOF</span></aside></main></>
}
