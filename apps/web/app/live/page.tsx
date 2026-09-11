import hero from "../../../../evidence/m4-3-live-zero-action-lifecycle.json";
import { PriorHeader } from "../components";
import { LiveWorkspace, type Fallback } from "./LiveWorkspace";

export default function LivePage() {
  const fallback: Fallback = {
    circuitId: hero.circuitId,
    marketId: hero.market.marketId,
    forecastId: hero.trialId,
    probabilityUpBps: hero.forecast.probabilityUpBps,
    outcome: hero.trialFinal.outcome,
    status: hero.trialFinal.status,
    commitBlock: hero.receipts.commit.block,
    targetWindows: hero.circuitIntent.targetWindows,
    completed: 1,
    abstained: 1,
  };
  return <><PriorHeader/><main id="main" className="live-shell"><LiveWorkspace fallback={fallback}/></main></>;
}
