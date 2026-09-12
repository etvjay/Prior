"use client";

import Link from "next/link";
import { encodeFunctionData, decodeFunctionResult, type Hex } from "viem";
import { useEffect, useMemo, useState } from "react";
import { instantiatePublicTemplate, transitionCircuitCreation, type CircuitCreationState } from "../lib/prior-participation";

type Provider = { request(args: { method: string; params?: unknown[] }): Promise<unknown> };
type Market = { marketId: string; asset?: string; intervalSec?: string; clobStatus?: string; expiry?: string; marketAddress?: string; baseSymbol?: string };

declare global { interface Window { ethereum?: Provider } }

const REGISTRY = "0x1eD3B2310F369977ef82569498d5F678f8B73104" as const;
const CREATE_ABI = [{ type: "function", name: "create", stateMutability: "nonpayable", inputs: [{ name: "intent", type: "tuple", components: [{ name: "circuitId", type: "bytes32" }, { name: "owner", type: "address" }, { name: "forecaster", type: "address" }, { name: "marketClass", type: "uint8" }, { name: "targetWindows", type: "uint16" }, { name: "totalBudget", type: "uint128" }, { name: "maxPerMarket", type: "uint128" }, { name: "minMarginBps", type: "uint16" }, { name: "maxConsecutiveLosses", type: "uint8" }, { name: "startsAt", type: "uint64" }, { name: "expiresAt", type: "uint64" }, { name: "allowedActionsBitmap", type: "uint256" }] }], outputs: [{ name: "circuitId", type: "bytes32" }] }] as const;
const ACTION_ABI = [{ type: "function", name: "authorize", stateMutability: "nonpayable", inputs: [{ name: "circuitId", type: "bytes32" }] }, { type: "function", name: "activate", stateMutability: "nonpayable", inputs: [{ name: "circuitId", type: "bytes32" }] }] as const;
const INTENT_ABI = [{ type: "function", name: "intents", stateMutability: "view", inputs: [{ name: "id", type: "bytes32" }], outputs: [{ type: "tuple", components: [{ name: "circuitId", type: "bytes32" }, { name: "owner", type: "address" }, { name: "forecaster", type: "address" }, { name: "marketClass", type: "uint8" }, { name: "targetWindows", type: "uint16" }, { name: "totalBudget", type: "uint128" }, { name: "maxPerMarket", type: "uint128" }, { name: "minMarginBps", type: "uint16" }, { name: "maxConsecutiveLosses", type: "uint8" }, { name: "startsAt", type: "uint64" }, { name: "expiresAt", type: "uint64" }, { name: "allowedActionsBitmap", type: "uint256" }] }] }] as const;
const RUNTIME_ABI = [{ type: "function", name: "runtime", stateMutability: "view", inputs: [{ name: "id", type: "bytes32" }], outputs: [{ type: "tuple", components: [{ name: "status", type: "uint8" }, { name: "completed", type: "uint16" }, { name: "missed", type: "uint16" }, { name: "abstained", type: "uint16" }, { name: "consecutiveLosses", type: "uint8" }, { name: "reservedSpend", type: "uint128" }] }] }] as const;

const steps = ["MARKET SCOPE", "RUN LENGTH", "FORECAST SOURCE", "POLICY", "AUTHORITY", "REVIEW", "ACTIVATE"] as const;
function short(value: string) { return `${value.slice(0, 10)}…${value.slice(-8)}`; }
function asHex(value: unknown): Hex { return String(value) as Hex; }

async function waitReceipt(provider: Provider, hash: string) {
  for (let attempt = 0; attempt < 90; attempt += 1) {
    const receipt = await provider.request({ method: "eth_getTransactionReceipt", params: [hash] }) as { status?: string; blockNumber?: string; logs?: Array<{ topics?: string[] }> } | null;
    if (receipt) {
      if (receipt.status !== "0x1") throw new Error("RECEIPT_REVERTED");
      return receipt;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("RECEIPT_TIMEOUT");
}

export function CreateCircuitWizard({ participation = false }: { participation?: boolean }) {
  const [step, setStep] = useState(0);
  const [wallet, setWallet] = useState<string | null>(null);
  const [walletStatus, setWalletStatus] = useState("DISCONNECTED");
  const [markets, setMarkets] = useState<Market[]>([]);
  const [market, setMarket] = useState<Market | null>(null);
  const [targetWindows, setTargetWindows] = useState(4);
  const [phase, setPhase] = useState("DRAFT");
  const [error, setError] = useState<string | null>(null);
  const [circuitId, setCircuitId] = useState<string | null>(null);
  const [state, setState] = useState<CircuitCreationState>({ phase: "DRAFT", error: null, hash: null, circuitId: null });

  useEffect(() => {
    void fetch("/api/discovery/markets?limit=20", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) throw new Error("DISCOVERY_UNAVAILABLE");
      const body = await response.json() as { items?: Market[] };
      const found = (body.items ?? []).find((item) => Number(item.intervalSec) === 300 && String(item.asset ?? item.baseSymbol).toUpperCase() === "BTC" && String(item.clobStatus).toUpperCase() === "TRADING") ?? (body.items ?? [])[0] ?? null;
      setMarkets(body.items ?? []); setMarket(found);
    }).catch((reason) => setError(reason instanceof Error ? reason.message : "DISCOVERY_UNAVAILABLE"));
  }, []);

  const intent = useMemo(() => wallet ? instantiatePublicTemplate({ marketClass: 5, targetWindows }, wallet) : null, [wallet, targetWindows]);
  const reviewText = `Over the next ${targetWindows} eligible BTC five-minute Event Contracts, use my Forecasts. Economic execution is disabled. Each successful Forecast commit becomes attributable evidence; no capital approval is requested.`;

  async function connect() {
    const provider = window.ethereum;
    if (!provider) { setWalletStatus("PROVIDER REQUIRED"); return; }
    setWalletStatus("CONNECTING");
    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[];
      const chain = String(await provider.request({ method: "eth_chainId" })).toLowerCase();
      if (!accounts[0]) throw new Error("NO_ACCOUNT");
      if (chain !== "0xc488") {
        await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0xc488" }] });
      }
      setWallet(accounts[0]); setWalletStatus("CONNECTED · SHANNON");
    } catch (reason) { setWalletStatus(reason instanceof Error && /reject|denied/i.test(reason.message) ? "CONNECTION REJECTED" : "WRONG NETWORK OR CONNECTION FAILED"); }
  }

  async function createAndActivate() {
    const provider = window.ethereum;
    if (!provider || !wallet || !intent || !market) { setError("WALLET_AND_CANONICAL_MARKET_REQUIRED"); return; }
    setError(null); setPhase("SIGNING_CREATE");
    let creationState = transitionCircuitCreation(state, { type: "REVIEW" });
    creationState = transitionCircuitCreation(creationState, { type: "APPROVE" });
    setState(creationState);
    try {
      const block = await provider.request({ method: "eth_getBlockByNumber", params: ["latest", false] }) as { timestamp?: string };
      const startsAt = BigInt(block.timestamp ?? "0x0");
      if (startsAt === 0n) throw new Error("CHAIN_TIMESTAMP_UNAVAILABLE");
      const expiresAt = startsAt + BigInt(targetWindows * 300 + 900);
      const data = encodeFunctionData({ abi: CREATE_ABI, functionName: "create", args: [{ circuitId: "0x" + "00".repeat(32) as Hex, owner: wallet as `0x${string}`, forecaster: wallet as `0x${string}`, marketClass: intent.marketClass, targetWindows: intent.targetWindows, totalBudget: intent.totalBudget, maxPerMarket: intent.maxPerMarket, minMarginBps: 0, maxConsecutiveLosses: 1, startsAt, expiresAt, allowedActionsBitmap: 0n }] });
      const hash = await provider.request({ method: "eth_sendTransaction", params: [{ from: wallet, to: REGISTRY, data, value: "0x0" }] }) as string;
      setPhase("AWAITING_CREATE_RECEIPT"); creationState = transitionCircuitCreation(creationState, { type: "SUBMITTED", hash }); setState(creationState);
      const receipt = await waitReceipt(provider, hash);
      creationState = transitionCircuitCreation(creationState, { type: "RECEIPT_SUCCESS" }); setState(creationState);
      const id = receipt.logs?.map((log) => log.topics?.[1]).find((topic) => /^0x[\da-f]{64}$/i.test(topic ?? ""));
      if (!id) throw new Error("CREATE_READBACK_MISSING_CIRCUIT_ID");
      const intentCall = encodeFunctionData({ abi: INTENT_ABI, functionName: "intents", args: [id as Hex] });
      const intentRaw = await provider.request({ method: "eth_call", params: [{ to: REGISTRY, data: intentCall }, "latest"] }) as Hex;
      const verifiedIntent = decodeFunctionResult({ abi: INTENT_ABI, functionName: "intents", data: intentRaw });
      const values = Array.isArray(verifiedIntent) ? verifiedIntent[0] : verifiedIntent;
      const verifiedOwner = String((values as Record<string, unknown>).owner ?? (values as unknown[])[1]);
      const verifiedForecaster = String((values as Record<string, unknown>).forecaster ?? (values as unknown[])[2]);
      const verifiedMarketClass = Number((values as Record<string, unknown>).marketClass ?? (values as unknown[])[3]);
      const verifiedWindows = Number((values as Record<string, unknown>).targetWindows ?? (values as unknown[])[4]);
      const verifiedBudget = String((values as Record<string, unknown>).totalBudget ?? (values as unknown[])[5]);
      const verifiedMaxPerMarket = String((values as Record<string, unknown>).maxPerMarket ?? (values as unknown[])[6]);
      const verifiedActions = String((values as Record<string, unknown>).allowedActionsBitmap ?? (values as unknown[])[11]);
      if (verifiedOwner.toLowerCase() !== wallet.toLowerCase() || verifiedForecaster.toLowerCase() !== wallet.toLowerCase() || verifiedMarketClass !== intent.marketClass || verifiedWindows !== intent.targetWindows || verifiedBudget !== intent.totalBudget.toString() || verifiedMaxPerMarket !== intent.maxPerMarket.toString() || verifiedActions !== "0") throw new Error("READBACK_MISMATCH");
      setCircuitId(id); setPhase("CREATED_READBACK"); creationState = transitionCircuitCreation(creationState, { type: "READBACK_MATCH", circuitId: id }); setState(creationState);
      for (const action of ["authorize", "activate"] as const) {
        setPhase(action === "authorize" ? "SIGNING_AUTHORIZE" : "SIGNING_ACTIVATE");
        const actionData = encodeFunctionData({ abi: ACTION_ABI, functionName: action, args: [id as Hex] });
        const actionHash = await provider.request({ method: "eth_sendTransaction", params: [{ from: wallet, to: REGISTRY, data: actionData, value: "0x0" }] }) as string;
        await waitReceipt(provider, actionHash);
      }
      const runtimeData = encodeFunctionData({ abi: RUNTIME_ABI, functionName: "runtime", args: [id as Hex] });
      const runtimeRaw = await provider.request({ method: "eth_call", params: [{ to: REGISTRY, data: runtimeData }, "latest"] }) as Hex;
      const runtime = decodeFunctionResult({ abi: RUNTIME_ABI, functionName: "runtime", data: runtimeRaw });
      const runtimeValues = Array.isArray(runtime) ? runtime[0] : runtime;
      const status = Number((runtimeValues as Record<string, unknown>).status ?? (runtimeValues as unknown[])[0]);
      if (status !== 2) throw new Error("ACTIVATE_READBACK_MISMATCH");
      setPhase("ACTIVE");
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "CREATE_FAILED";
      setError(message); setPhase("FAILED"); setState((current) => ({ ...current, phase: "FAILED", error: message }));
    }
  }

  const progress = Math.min(step + 1, steps.length);
  return <section className="create-wizard" aria-labelledby="create-title">
    <header className="create-wizard-heading"><span className="instrument-label">{participation ? "JOIN PUBLIC TEMPLATE" : "CREATE & RUN"} · FORECAST-ONLY</span><h1 id="create-title">Define one bounded intent.</h1><p>{participation ? "This is your participant-specific Circuit instance. The public template is not a shared multi-forecaster Circuit." : "Create a Circuit you can understand, approve, and run without granting economic authority."}</p></header>
    <div className="wizard-progress" aria-label={`Step ${progress} of ${steps.length}`}>{steps.map((label, index) => <button key={label} type="button" className={index <= step ? "is-current" : ""} onClick={() => index < step && setStep(index)} aria-label={`Step ${index + 1}: ${label}`}><i>{String(index + 1).padStart(2, "0")}</i><span>{label}</span></button>)}</div>
    <div className="create-wizard-grid"><section className="wizard-panel">
      {step === 0 && <div className="wizard-step"><span className="instrument-label">STEP 1 · MARKET SCOPE</span><h2>What should this Circuit follow?</h2><div className="wizard-options">{[{label: "BTC · 5m", detail: "verified app-enforced market class", selected: true}].map((option) => <button key={option.label} type="button" className="option-card is-selected"><strong>{option.label}</strong><small>{option.detail}</small></button>)}</div><p className="state-line">Bounded discovery will choose the first currently trading market. The marketId is verified separately before a Forecast write.</p></div>}
      {step === 1 && <div className="wizard-step"><span className="instrument-label">STEP 2 · RUN LENGTH</span><h2>How long should it run?</h2><div className="wizard-options">{[4, 8].map((value) => <button key={value} type="button" className={`option-card${targetWindows === value ? " is-selected" : ""}`} onClick={() => setTargetWindows(value)}><strong>{value} markets</strong><small>The same intent persists across this declared sequence.</small></button>)}</div></div>}
      {step === 2 && <div className="wizard-step"><span className="instrument-label">STEP 3 · FORECAST SOURCE</span><h2>Who supplies the Forecast?</h2><div className="wizard-options"><button type="button" className="option-card is-selected"><strong>ME</strong><small>I provide one Forecast for each eligible market.</small></button><button type="button" className="option-card" disabled><strong>AGENT · NOT ENABLED</strong><small>No signed agent output is configured in this human flow.</small></button></div></div>}
      {step === 3 && <div className="wizard-step"><span className="instrument-label">STEP 4 · POLICY</span><h2>What does this safe preset allow?</h2><div className="policy-summary"><div><span>FORECASTING</span><strong>YES</strong></div><div><span>ECONOMIC EXECUTION</span><strong>DISABLED</strong></div><div><span>ALLOWED ACTIONS</span><strong>NONE · 0</strong></div><div><span>REFERENCE UNAVAILABLE</span><strong>ABSTAIN</strong></div></div><p className="state-line">No strategy DSL is created. The policy is forecast-only and does not request approvals or capital.</p></div>}
      {step === 4 && <div className="wizard-step"><span className="instrument-label">STEP 5 · AUTHORITY</span><h2>Make responsibility explicit.</h2><div className="authority-summary"><div><span>OWNER</span><strong>{wallet ? short(wallet) : "CONNECT WALLET"}</strong></div><div><span>FORECASTER</span><strong>{wallet ? short(wallet) : "SAME PARTICIPANT"}</strong></div><div><span>EXECUTION</span><strong>DISABLED</strong></div><div><span>RUNNER</span><strong>NOT REQUIRED FOR FORECAST-ONLY</strong></div></div>{wallet ? <p className="success-line">{walletStatus}</p> : <button type="button" className="primary-button" onClick={() => void connect()}>CONNECT SHANNON WALLET</button>}</div>}
      {step === 5 && <div className="wizard-step"><span className="instrument-label">STEP 6 · REVIEW IMMUTABLE INTENT</span><h2>Approve this exact run.</h2><div className="intent-review"><p>{reviewText}</p><dl><div><dt>Scope</dt><dd>BTC · 5m · market class 5</dd></div><div><dt>Owner = Forecaster</dt><dd>{wallet ? short(wallet) : "wallet required"}</dd></div><div><dt>Actions</dt><dd>0 · economic execution disabled</dd></div><div><dt>Capital</dt><dd>none</dd></div><div><dt>First market</dt><dd>{market ? `${market.asset ?? market.baseSymbol} · ${Number(market.intervalSec) / 60}m · ${market.clobStatus}` : "bounded discovery pending"}</dd></div></dl></div><label className="approval-check"><input type="checkbox" checked={phase === "REVIEW_APPROVED"} onChange={(event) => setPhase(event.target.checked ? "REVIEW_APPROVED" : "REVIEW")}/> I approve this immutable intent summary</label></div>}
      {step === 6 && <div className="wizard-step"><span className="instrument-label">STEP 7 · CREATE → AUTHORIZE → ACTIVATE</span><h2>Start the Circuit.</h2><p>Each transaction is client-signed and receipt-gated. Canonical intent readback must match your address before authorization continues.</p><div className="write-sequence"><span className={phase.includes("CREATE") || ["CREATED_READBACK", "SIGNING_AUTHORIZE", "SIGNING_ACTIVATE", "ACTIVE"].includes(phase) ? "done" : ""}>CREATE</span><i>→</i><span className={phase.includes("AUTHORIZE") || ["SIGNING_ACTIVATE", "ACTIVE"].includes(phase) ? "done" : ""}>AUTHORIZE</span><i>→</i><span className={phase.includes("ACTIVATE") || phase === "ACTIVE" ? "done" : ""}>ACTIVATE</span></div>{phase === "ACTIVE" && circuitId ? <><p className="success-line">CIRCUIT ACTIVE · canonical runtime readback confirmed</p><p className="mono">{circuitId}</p><Link className="primary-button" href={`/live?circuitId=${circuitId}&marketId=${market?.marketId ?? ""}`}>OPEN CURRENT MARKET</Link><Link className="secondary-button" href={`/circuit/${circuitId}?marketId=${market?.marketId ?? ""}`}>VIEW CONTROL ROOM</Link></> : <button type="button" className="primary-button" disabled={!wallet || !intent || !market || phase !== "REVIEW_APPROVED"} onClick={() => void createAndActivate()}>{wallet ? "CREATE CIRCUIT · SIGN" : "CONNECT WALLET FIRST"}</button>}</div>}
      {error && <div className="source-warning" role="alert"><strong>{phase}</strong><span>{error}</span><small>No optimistic success was recorded.</small></div>}
      <div className="wizard-actions"><button className="secondary-button" type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0 || phase !== "DRAFT" && step === 6}>BACK</button>{step < steps.length - 1 && <button className="primary-button" type="button" onClick={() => setStep(step + 1)} disabled={step === 4 && !wallet || step === 5 && phase !== "REVIEW_APPROVED"}>CONTINUE</button>}</div>
    </section><aside className="create-truth-rail"><span className="instrument-label">CANONICAL BOUNDARY</span><h2>One participant. One Circuit instance.</h2><p>V2 fixes the forecaster inside the Circuit intent. A public template groups opportunities; it never becomes shared protocol state.</p><div className="truth-item"><span>FORECAST</span><strong>one belief · one market</strong></div><div className="truth-item"><span>RFT</span><strong>evidence beneath the Forecast</strong></div><div className="truth-item"><span>CIRCUIT</span><strong>persistent bounded intent</strong></div><div className="truth-item"><span>EXECUTION</span><strong>disabled in this preset</strong></div></aside></div>
  </section>;
}
