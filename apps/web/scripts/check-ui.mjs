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

function relativeLuminance(hex) {
  const channels = hex.match(/[a-f\d]{2}/gi).map((channel) => Number.parseInt(channel, 16) / 255);
  const [red, green, blue] = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground, background) {
  const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

const sceneSequence = [...landing.matchAll(/data-scene="(\d)"/g)].map(([, scene]) => Number(scene));
assert.deepEqual(sceneSequence, [1, 2, 3, 4, 5, 6, 7, 8, 9], "landing must preserve exactly nine visual scenes in order");
assert.equal((landing.match(/<h1\b/g) ?? []).length, 1, "landing must keep one hero heading");
assert.equal((landing.match(/<EnterPriorLink(?:\s+final)?\s*\/>/g) ?? []).length, 2, "only hero and close may render ENTER PRIOR");
assert.equal((landing.match(/<details>/g) ?? []).length, 2, "supporting proof must remain progressively disclosed");

const requiredCopy = [
  "COMMIT BEFORE REALITY DOES.",
  "A profitable trade does not prove a good prediction.",
  "A good prediction can still lose at a bad price.",
  "BELIEF", "DECISION", "EXECUTION", "OUTCOME", "PnL",
  "The market has a probability.", "MARKET ◆ 61%",
  "You have one too.", "YOU ● 72%",
  "Forecast commitment proves the belief existed before the answer.",
  "0—◆61—●72—100", "COMMIT IT", "●│", "│●", "IMMUTABLE",
  "Belief, decision, execution, and outcome remain separate from PnL.",
  "NOW WE CAN MEASURE JUDGMENT.",
  "One resolved Forecast is one evidence sample.",
  "RESOLVED FORECAST TRIAL", "RFT",
  "CAPABILITY / TRAJECTORY · NOT LIVE ANALYTICS",
  "ONE RFT IS EVIDENCE. MANY REVEAL A RECORD.",
  "Repeated RFTs can reveal what judgment is good at",
  "CALIBRATION", "SPECIALIZATION", "FORECAST VS EXECUTION",
  "enabled trajectories, not a live ranking or routing system",
  "A CIRCUIT IS A STANDING MANDATE.",
  "whose Forecasts matter, when they matter, and what they may cause",
  "AGENT ALPHA · BTC 5M · CONFIDENCE ≥70% · BUY ONLY 8 POINTS BELOW · $1 PER MARKET · 20 MARKETS · STOP AFTER 2 LOSSES",
  "WITHOUT A CIRCUIT", "WITH A CIRCUIT",
  "RFT HISTORY", "TRUST ALLOCATION", "CIRCUIT", "BOUNDED ACTION", "NEW EVIDENCE",
  "REAL MARKET A / B", "UNCHANGED MANDATE · TWO ABSTENTIONS",
  "Market A", "0% UP", "1.50% UP", "NO TRADE", "OUTCOME · DOWN",
  "Market B", "50% UP", "53.25% UP", "OUTCOME · UP",
  "Neither market met the rule that permitted action.",
  "Abstention is a valid decision.",
  "SEPARATE REAL MARKET #1", "LOSING EXECUTION SHOWN IN FULL",
  "50% FORECAST · 35.2% MARKET · BUY UP · LIMIT 42% · FILLED 28.1% · DOWN · PNL -281 RAW",
  "FOR TRADERS", "FOR AGENTIC SYSTEMS",
  "RFT", "MEASURES JUDGMENT", "CIRCUIT", "BOUNDS AUTHORITY",
  "FORECASTS TELL US WHAT SOMEONE BELIEVED.",
  "RFTs TELL US HOW THAT JUDGMENT HELD UP.",
  "CIRCUITS DEFINE WHAT THAT JUDGMENT IS ALLOWED TO DO NEXT.",
  "PRIOR.", "MEASURE JUDGMENT. ACT WITH RULES. KEEP THE EVIDENCE.",
  "ENTER PRIOR", "DreamDEX Event Contracts on Somnia",
];
for (const exactCopy of requiredCopy) assert.ok(normalized.includes(exactCopy), `landing missing required narrative copy: ${exactCopy}`);

const orderedBeats = [
  "A profitable trade does not prove a good prediction.",
  "The market has a probability.",
  "You have one too.",
  "Forecast commitment proves the belief existed before the answer.",
  "COMMIT IT",
  "Reality keeps moving.",
  "NOW WE CAN MEASURE JUDGMENT.",
  "ONE RFT IS EVIDENCE. MANY REVEAL A RECORD.",
  "A CIRCUIT IS A STANDING MANDATE.",
  "FORECASTS TELL US WHAT SOMEONE BELIEVED.",
];
let cursor = -1;
for (const beat of orderedBeats) {
  const index = normalized.indexOf(beat);
  assert.ok(index > cursor, `narrative beat missing or out of order: ${beat}`);
  cursor = index;
}

const firstEvidence = normalized.indexOf("NOW WE CAN MEASURE JUDGMENT.");
const firstRft = normalized.indexOf("RESOLVED FORECAST TRIAL");
const firstCircuitDefinition = normalized.indexOf("A CIRCUIT IS A STANDING MANDATE.");
const ecosystem = normalized.indexOf("DreamDEX Event Contracts on Somnia");
assert.ok(firstRft > firstEvidence, "RFT must be named only after the evidence concept");
assert.ok(firstCircuitDefinition > firstRft, "Circuit must follow RFT capability and handoff");
assert.ok(ecosystem > normalized.indexOf("PRIOR."), "DreamDEX and Somnia belong only at the end");
assert.doesNotMatch(normalized.slice(0, firstEvidence), /\b(?:RFT|DreamDEX|Somnia|Brier|protocol|autonomy)\b/i, "landing must not lead with jargon");
assert.equal((normalized.match(/DreamDEX/g) ?? []).length, 1, "DreamDEX may appear once, at the end");
assert.equal((normalized.match(/Somnia/g) ?? []).length, 1, "Somnia may appear once, at the end");
assert.doesNotMatch(normalized, /\b(?:AI-powered|guaranteed|candles|autonomous)\b/i);
assert.doesNotMatch(landing, /landing-act|capability-questions|agent-lanes|mandate-tree|loop-primary/, "dense ten-act dashboard rewrite classes must not return");
assert.doesNotMatch(page, /PriorHeader/, "landing must not expose dashboard controls before the explanation");
assert.match(page, /BELIEF → COMMITMENT → REALITY → EVIDENCE → PERSISTENT INTENT/);

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
assert.match(css, /\.landing-hero \{[^}]*grid-template-columns:\s*minmax\(0, 1\.2fr\) minmax\(360px, \.8fr\)/s, "restore frozen hero composition");
assert.match(css, /\.hero-thesis h1 \{[^}]*font-size:\s*clamp\(64px, 6\.2vw, 88px\)[^}]*letter-spacing:\s*-\.035em[^}]*line-height:\s*\.9545/s, "hero must use the frozen 88 / 84 scale");
assert.match(css, /\.scene-statement h2, \.circuit-question h2 \{[^}]*font-size:\s*clamp\(48px, 4\.5vw, 64px\)[^}]*line-height:\s*\.96875/s, "scene headings must use the frozen 64 / 62 scale");
assert.match(css, /\.landing-scene \{[^}]*min-height:\s*clamp\(680px, 88svh, 940px\)/s, "restore frozen scene pacing");
const surface = css.match(/--surface-1:\s*(#[a-f\d]{6})/i)?.[1];
const mutedAa = css.match(/--text-muted-aa:\s*(#[a-f\d]{6})/i)?.[1];
assert.ok(surface && mutedAa, "landing AA-muted and surface tokens must exist");
assert.ok(contrastRatio(mutedAa, surface) >= 4.5, `landing muted token must meet WCAG AA on surface-1, got ${contrastRatio(mutedAa, surface).toFixed(2)}:1`);
assert.match(css, /\.circuit-iterations header b[^}]*var\(--text-muted-aa\)/s, "NO TRADE must use the AA-muted token");
assert.match(css, /\.proof-disclosures summary b[^}]*var\(--text-muted-aa\)/s, "disclosure metadata must use the AA-muted token");
assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.landing-scene[^}]*opacity:\s*1/);
assert.match(landing, /data-route-transition=\{entering \? "live" : undefined\}/);
assert.match(landing, /className="cta-route-object"/);
assert.match(landing, /motion\.duration\.route/);
assert.match(landing, /prefers-reduced-motion/);
assert.doesNotMatch(landing, /data-prior-route/, "route state must stay on the activated CTA");
assert.doesNotMatch(css, /html\[data-prior-route|data-route-transition[^}]*\.forecast-node/s, "CTA route motion must not move unrelated Forecast nodes");
assert.match(css, /\.landing-primary\[data-route-transition="live"\] \.cta-route-object \{[^}]*transform:/s, "route motion needs one explicit CTA object");
assert.match(css, /@media \(hover: hover\) and \(pointer: fine\) \{\s*\.landing-primary:hover \{[^}]*transform:/s, "CTA hover transform must be fine-pointer only");
assert.equal((css.match(/\.landing-primary:hover\s*\{/g) ?? []).length, 1, "CTA hover transform must exist only once, inside its capability media query");
assert.match(landing, /aria-label="Prior separates belief, decision, execution, and outcome"/);
assert.match(landing, /aria-label="Illustrative fixed Circuit standing mandate"/);
assert.match(landing, /aria-label="Circuit continuity across two real accepted markets"/);

assert.match(css, /grid-template-columns:\s*240px minmax\(0, 1fr\) auto/);
assert.match(css, /\.context-trigger-rail \{ width: 56px/);
assert.match(css, /grid-template-columns:\s*260px minmax\(0, 1fr\) 300px/);
assert.match(source, /role="slider"/);
assert.match(source, /ArrowUp/);
assert.match(source, /inputMode="numeric"/);
assert.match(source, /eth_getTransactionReceipt/);
assert.match(source, /marketState!=="TRADING"/);
assert.match(source, /userRequested:armed/);

console.log(`UI contract PASS: ${routes.length} routes, 9 paced landing scenes, expanded judgment thesis, progressive proof, reduced motion, geometry, ARIA, write gates`);
