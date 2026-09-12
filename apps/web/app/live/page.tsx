import hero from "../../../../evidence/m4-3-live-zero-action-lifecycle.json";
import { PriorHeader } from "../components";
import { LiveWorkspace, type Fallback } from "./LiveWorkspace";

export default function LivePage({ searchParams }: { searchParams?: { circuitId?: string; marketId?: string } }) {
  const fallback: Fallback = {
    circuitId: searchParams?.circuitId ?? hero.circuitId,
    marketId: searchParams?.marketId ?? hero.market.marketId,
    forecastId: hero.trialId,
    probabilityUpBps: hero.forecast.probabilityUpBps,
    outcome: hero.trialFinal.outcome,
    status: hero.trialFinal.status,
    commitBlock: hero.receipts.commit.block,
    targetWindows: hero.circuitIntent.targetWindows,
    completed: searchParams?.circuitId ? 0 : 1,
    abstained: searchParams?.circuitId ? 0 : 1,
  };
  return <><PriorHeader/><main id="main" className="live-shell operational-shell"><LiveWorkspace fallback={fallback}/></main></>;
}
