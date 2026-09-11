import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const INDEXER_URL = process.env.MARKET_INDEXER_URL ?? "https://dev.smk.somnia.host/v1/graphql";

export async function GET(request: Request) {
  const limit = Math.min(Math.max(Number(new URL(request.url).searchParams.get("limit") ?? 10), 1), 20);
  const query = `query M($n: Int!) { Market(limit: $n, order_by: {createdAtBlock: desc}) { marketId asset intervalSec clobStatus expiry marketAddress binaryPoolAddress quoteToken quoteDecimals baseSymbol baseDecimals oracleQuestionId yesTokenId noTokenId createdAtBlock } }`;
  try {
    const upstream = await fetch(INDEXER_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query, variables: { n: limit } }), cache: "no-store" });
    if (!upstream.ok) return NextResponse.json({ code: "DISCOVERY_UNAVAILABLE", message: `market discovery returned HTTP ${upstream.status}` }, { status: 503 });
    const body = await upstream.json() as { data?: { Market?: unknown[] }; errors?: unknown[] };
    if (body.errors || !Array.isArray(body.data?.Market)) return NextResponse.json({ code: "DISCOVERY_MALFORMED", message: "market discovery response was malformed" }, { status: 502 });
    return NextResponse.json({ chainId: 50312, discoveryCompleteness: "BOUNDED", source: "DreamDEX indexer for discovery; verify canonical detail by marketId", items: body.data.Market });
  } catch (error) {
    return NextResponse.json({ code: "DISCOVERY_UNAVAILABLE", message: error instanceof Error ? error.message : "market discovery unavailable" }, { status: 503 });
  }
}
