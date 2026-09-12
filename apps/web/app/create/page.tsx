import { PriorHeader } from "../components";
import { CreateCircuitWizard } from "../circuits/CreateCircuitWizard";

export default function CreatePage({ searchParams }: { searchParams?: { mode?: string } }) {
  return <><PriorHeader/><main id="main" className="page-shell"><CreateCircuitWizard participation={searchParams?.mode === "participate"}/></main></>;
}
