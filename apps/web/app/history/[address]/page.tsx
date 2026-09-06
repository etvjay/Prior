import {Header} from "../../components";
export default function History({params}:{params:{address:string}}){return <><Header/><main className="page"><div className="eyebrow">History · {params.address}</div><h1>Forecast record</h1><div className="notice">No resolved Forecasts yet.<br/><br/>History is reconstructed from canonical chain and DreamDEX evidence.</div></main></>}
