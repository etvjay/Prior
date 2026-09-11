import { NextResponse } from "next/server";
import { composeLiveContinuityView } from "../../../../../packages/agent-integration/src/continuity";
import { LiveReadAdapter } from "../../../../../workers/prior-agent-readonly/src/live-read";

export const dynamic = "force-dynamic";

function id(value: string | null, name: string): `0x${string}` {
  if (!value || !/^0x[0-9a-fA-F]{64}$/.test(value)) throw new Error(`${name} must be bytes32`);
  return value as `0x${string}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  try {
    const circuitId = id(url.searchParams.get("circuitId"), "circuitId");
    const marketId = id(url.searchParams.get("marketId"), "marketId");
    const adapter = new LiveReadAdapter({ rpcUrl: process.env.SHANNON_RPC_HTTP });
    const data = await adapter.readCircuitIteration(circuitId, marketId);
    return NextResponse.json(composeLiveContinuityView({
      circuit: data.circuit,
      market: data.market,
      forecast: data.forecast,
      iteration: data.iteration,
      fetchedAt: new Date().toISOString(),
      endpoint: "Next.js server → Somnia Shannon RPC",
    }));
  } catch (error) {
    return NextResponse.json({ code: "LIVE_STATE_UNAVAILABLE", message: error instanceof Error ? error.message : "canonical Shannon read failed" }, { status: 503 });
  }
}
