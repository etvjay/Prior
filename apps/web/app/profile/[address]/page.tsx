import Link from "next/link";
import { ACCEPTED_FORECASTS, CONTINUITY_ID, OWNER, short } from "../../evidence";
import { ForecastMiniature, PriorHeader } from "../../components";

export default function ProfilePage({ params }: { params: { address: string } }) {
  const accepted = params.address.toLowerCase() === OWNER.toLowerCase();
  const average = ACCEPTED_FORECASTS.reduce((sum, item) => sum + item.forecastBrier, 0) / ACCEPTED_FORECASTS.length / 100_000_000;
  return <><PriorHeader/><main id="main" className="page-shell"><header className="page-heading profile-heading"><span className="instrument-label">SCOPED CAPABILITY</span><h1>{accepted ? short(OWNER, 10, 8) : short(params.address, 10, 8)}</h1><p>Performance is scoped by market class, horizon, network, and accepted sample size. Prior does not issue a universal reputation score.</p></header>{accepted ? <><section className="profile-scope"><header><span>BTC · 5m</span><b>SOMNIA SHANNON</b></header><div className="scope-stats"><div><strong>{ACCEPTED_FORECASTS.length}</strong><span>accepted Forecasts</span></div><div><strong>{average.toFixed(3)}</strong><span>average Brier</span></div><div><strong>2</strong><span>Circuit abstentions</span></div></div><div className="profile-evidence">{ACCEPTED_FORECASTS.map((forecast) => <ForecastMiniature forecast={forecast} key={forecast.id}/>)}</div></section><section className="profile-links"><Link className="primary-button" href={`/history/${OWNER}`}>OPEN FULL HISTORY</Link><Link className="secondary-button" href={`/circuit/${CONTINUITY_ID}`}>OPEN ACCEPTED CIRCUIT</Link></section></> : <section className="empty-state"><h2>NO PROFILE EVIDENCE YET.</h2><p>No aggregate is calculated without accepted underlying Forecasts.</p></section>}</main></>;
}
