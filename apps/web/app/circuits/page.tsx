import Link from "next/link";
import { PriorHeader } from "../components";
import { CircuitCatalog } from "./CircuitCatalog";

export default function CircuitsPage() {
  return <><PriorHeader/><main id="main" className="page-shell"><header className="page-heading"><span className="instrument-label">PERSISTENT BOUNDED INTENT</span><h1>CIRCUITS</h1><p>Choose whether to inspect a public starting point, recover your own participant runs, or explore completed evidence.</p></header><CircuitCatalog/><section className="circuits-create-handoff"><div><span className="instrument-label">CREATE &amp; RUN</span><h2>Define your own Circuit.</h2><p>Use the safe forecast-only preset to create, authorize, activate, Forecast, and follow one participant-specific Circuit.</p></div><Link className="primary-button" href="/create">CREATE CIRCUIT</Link></section></main></>;
}
