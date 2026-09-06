import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const routes = [
  "app/page.tsx",
  "app/live/page.tsx",
  "app/circuits/page.tsx",
  "app/circuit/[id]/page.tsx",
  "app/forecast/[id]/page.tsx",
  "app/history/[address]/page.tsx",
  "app/profile/[address]/page.tsx",
];
for (const route of routes) assert.equal(fs.existsSync(path.join(root, route)), true, `missing ${route}`);

const files = fs
  .readdirSync(path.join(root, "app"), { recursive: true })
  .filter((name) => /\.(tsx|ts|css)$/.test(String(name)))
  .map((name) => path.join(root, "app", String(name)));
const source = files.map((file) => fs.readFileSync(file, "utf8")).join("\n");
const css = fs.readFileSync(path.join(root, "app/globals.css"), "utf8");
const landing = fs.readFileSync(path.join(root, "app/LandingScenes.tsx"), "utf8");
const page = fs.readFileSync(path.join(root, "app/page.tsx"), "utf8");
const normalized = landing.replace(/&apos;/g, "'").replace(/\s+/g, " ");

const actSequence = [...landing.matchAll(/data-act="(\d+)"/g)].map(([, act]) => Number(act));
assert.deepEqual(actSequence, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], "landing must contain exactly ten acts in order");

const requiredCopy = [
  "A PROFITABLE TRADE DOES NOT PROVE A GOOD PREDICTION.",
  "a good prediction can still lose at a bad price",
  "GOOD FORECAST", "BAD ENTRY", "CORRECT RESULT", "LOSS",
  "BAD FORECAST", "LUCKY ENTRY", "WRONG RESULT", "PROFIT",
  "Most histories collapse all of this to PnL.",
  "PRIOR SEPARATES", "BELIEF", "DECISION", "EXECUTION", "OUTCOME",
  "BTC · 5M", "MARKET", "◆61%", "AGENT", "●72%", "RESOLUTION", "UP",
  "ONE RESOLVED FORECAST IS ONE PIECE OF EVIDENCE.",
  "RESOLVED FORECAST TRIAL", "RFT HISTORY",
  "ILLUSTRATIVE CAPABILITY VIEW · NOT LIVE ANALYTICS",
  "ASSET", "WINDOW", "CONFIDENCE", "EXECUTION",
  "DON'T ASK WHETHER AN AGENT IS GOOD. ASK WHAT IT'S GOOD AT.",
  "ILLUSTRATIVE SPECIALIZATION · NOT A RANKING",
  "ALPHA", "BETA", "GAMMA", "NO GENERIC REPUTATION",
  "CALIBRATION · SPECIALIZATION · COMPARISON · SELECTION · TRUST ALLOCATION · RESEARCH · PROVENANCE",
  "not claims that PRIOR ships a universal ranking or routing system",
  "NOW YOU KNOW WHO YOU WANT TO LISTEN TO. WHAT SHOULD THEIR FORECAST BE ALLOWED TO DO?",
  "A CIRCUIT IS A STANDING MANDATE.",
  "whose Forecasts matter, when they matter, and what they may cause",
  "It is not merely a fixed rule.",
  "AGENT ALPHA", "CONFIDENCE", "≥70%", "BUY ONLY 8 POINTS BELOW", "$1", "20 MARKETS", "AFTER 2 LOSSES",
  "WITHOUT A CIRCUIT", "WITH A CIRCUIT", "NO DRIFT", "INSPECTABILITY", "BUDGETS", "BOUNDED AUTHORITY", "COMPARABLE EPISODES",
  "MEASURE → LEARN → ALLOCATE TRUST → ACT → MEASURE AGAIN.",
  "FIXED RULES", "MORE EVIDENCE", "HISTORY", "UNDERSTAND JUDGMENT", "CHOOSE / WEIGHT", "BOUNDED ACTION", "NEW EVIDENCE",
  "MEASURE JUDGMENT. USE IT. MEASURE AGAIN.",
  "REAL ACCEPTED CONTINUITY · ONE UNCHANGED MANDATE",
  "MARKET A", "● 0%", "◆ 1.5%", "NO TRADE", "OUTCOME · DOWN",
  "MARKET B", "● 50%", "◆ 53.25%", "OUTCOME · UP",
  "Neither market met the rule that permitted action.",
  "A Circuit is not a gambling bot.",
  "SEPARATE REAL ACCEPTED EXECUTION", "MARKET #1 · PERMITTED",
  "50% FORECAST · 35.2% MARKET · BUY UP · LIMIT 42% · FILLED 28.1% · DOWN · PNL -281 RAW",
  "FOR TRADERS", "FOR AGENTIC SYSTEMS", "RFT", "MEASURES JUDGMENT", "CIRCUIT", "BOUNDS AUTHORITY",
  "FORECASTS TELL US WHAT SOMEONE BELIEVED.",
  "RFTs TELL US HOW THAT JUDGMENT HELD UP.",
  "CIRCUITS DEFINE WHAT THAT JUDGMENT IS ALLOWED TO DO NEXT.",
  "PRIOR.",
  "MEASURE JUDGMENT. ACT WITH RULES. KEEP THE EVIDENCE.",
  "ENTER PRIOR",
  "DreamDEX Event Contracts on Somnia",
];
for (const exactCopy of requiredCopy) assert.ok(normalized.includes(exactCopy), `landing missing required narrative copy: ${exactCopy}`);

const orderedBeats = [
  "A PROFITABLE TRADE DOES NOT PROVE A GOOD PREDICTION.",
  "THE FORECAST HAS TO EXIST BEFORE THE ANSWER.",
  "WHAT DOES AGENT ALPHA'S RESOLVED HISTORY REVEAL?",
  "NO GENERIC REPUTATION.",
  "NOW YOU KNOW WHO YOU WANT TO LISTEN TO.",
  "A CIRCUIT IS A STANDING MANDATE.",
  "ONE DECISION VERSUS A GOVERNED SERIES.",
  "MEASURE → LEARN → ALLOCATE TRUST → ACT → MEASURE AGAIN.",
  "REAL ACCEPTED CONTINUITY",
  "FORECASTS TELL US WHAT SOMEONE BELIEVED.",
];
let cursor = -1;
for (const beat of orderedBeats) {
  const index = normalized.indexOf(beat);
  assert.ok(index > cursor, `narrative beat missing or out of order: ${beat}`);
  cursor = index;
}

const firstConcept = normalized.indexOf("ONE RESOLVED FORECAST IS ONE PIECE OF EVIDENCE.");
const firstRft = normalized.indexOf("RESOLVED FORECAST TRIAL");
const firstCircuitDefinition = normalized.indexOf("A CIRCUIT IS A STANDING MANDATE.");
const ecosystem = normalized.indexOf("DreamDEX Event Contracts on Somnia");
assert.ok(firstRft > firstConcept, "RFT must be named only after the evidence concept");
assert.ok(firstCircuitDefinition > firstRft, "Circuit must follow RFT capability and handoff");
assert.ok(ecosystem > normalized.indexOf("PRIOR."), "DreamDEX and Somnia belong only at the end");
assert.doesNotMatch(normalized.slice(0, firstConcept), /\b(?:RFT|DreamDEX|Somnia|Brier|protocol|autonomy)\b/i, "landing must not lead with jargon");
assert.equal((normalized.match(/DreamDEX/g) ?? []).length, 1, "DreamDEX may appear once, at the end");
assert.equal((normalized.match(/Somnia/g) ?? []).length, 1, "Somnia may appear once, at the end");
assert.doesNotMatch(normalized, /\b(?:AI|Brier|KPI|candles|autonomous)\b/i);
assert.equal((landing.match(/<EnterPriorLink(?:\s+final)?\s*\/>/g) ?? []).length, 2, "only hero and close may render ENTER PRIOR");
assert.doesNotMatch(page, /PriorHeader/, "landing must not expose dashboard controls before the explanation");
assert.match(page, /MEASURE → LEARN → ALLOCATE TRUST → ACT → MEASURE AGAIN/);

assert.match(css, /--void:\s*#08070a/);
assert.match(css, /--background:\s*#0d0b11/);
assert.match(css, /--surface-1:\s*#121017/);
assert.match(css, /--border:\s*#30263f/);
assert.match(css, /--forecast:\s*#65c7ff/);
assert.match(css, /--market:\s*#eab85e/);
assert.doesNotMatch(css, /gradient/i);
assert.doesNotMatch(source, /glassmorph|planet-orb|candlestick|crypto graphic/i);
assert.match(css, /font-family:\s*Geist/);
assert.match(css, /IBM Plex Mono/);
assert.match(landing, /<MarketNode/);
assert.match(landing, /<ForecastNode/);
assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.landing-act[^}]*opacity:\s*1/);
assert.match(landing, /data-prior-route/);
assert.match(landing, /motion\.duration\.route/);
assert.match(landing, /prefers-reduced-motion/);
assert.match(css, /html\[data-prior-route="live"\]/);
assert.match(landing, /aria-label="Prior separates belief, decision, execution, and outcome"/);
assert.match(landing, /aria-label="Illustrative Circuit standing mandate"/);
assert.match(landing, /aria-label="Two real accepted markets under one unchanged mandate"/);

assert.match(css, /grid-template-columns:\s*240px minmax\(0, 1fr\) auto/);
assert.match(css, /\.context-trigger-rail \{ width: 56px/);
assert.match(css, /grid-template-columns:\s*260px minmax\(0, 1fr\) 300px/);
assert.match(source, /role="slider"/);
assert.match(source, /ArrowUp/);
assert.match(source, /inputMode="numeric"/);
assert.match(source, /eth_getTransactionReceipt/);
assert.match(source, /marketState!=="TRADING"/);
assert.match(source, /userRequested:armed/);

console.log(`UI contract PASS: ${routes.length} routes, 10 ordered landing acts, thesis, mandate, continuity, reduced motion, geometry, ARIA, write gates`);
