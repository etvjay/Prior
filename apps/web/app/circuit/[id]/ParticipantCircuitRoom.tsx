"use client";

import { LiveWorkspace } from "../../live/LiveWorkspace";

export function ParticipantCircuitRoom({ circuitId, marketId }: { circuitId: string; marketId: string }) {
  return <main id="main" className="circuit-page participant-circuit-room">
    <header className="circuit-header"><div><span className="instrument-label">CIRCUIT CONTROL ROOM · PARTICIPANT INSTANCE</span><h1>Your bounded intent.</h1></div><div><span>CANONICAL ID</span><strong className="mono">{circuitId}</strong></div><div><span>AUTHORITY</span><strong>FORECAST-ONLY · NO CAPITAL</strong></div></header>
    <LiveWorkspace snapshotEvidence={false} fallback={{ circuitId, marketId, forecastId: "0x" + "00".repeat(32), probabilityUpBps: 5000, outcome: "PENDING", status: "ACTIVE", commitBlock: "0", targetWindows: 4, completed: 0, abstained: 0 }} />
  </main>;
}
