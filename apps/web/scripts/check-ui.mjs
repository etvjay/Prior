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
for (const route of routes) {
  assert.equal(fs.existsSync(path.join(root, route)), true, `missing ${route}`);
}

const files = fs
  .readdirSync(path.join(root, "app"), { recursive: true })
  .filter((name) => /\.(tsx|ts|css)$/.test(String(name)))
  .map((name) => path.join(root, "app", String(name)));
const source = files.map((file) => fs.readFileSync(file, "utf8")).join("\n");
const css = fs.readFileSync(path.join(root, "app/globals.css"), "utf8");
const landing = fs.readFileSync(path.join(root, "app/LandingScenes.tsx"), "utf8");
const page = fs.readFileSync(path.join(root, "app/page.tsx"), "utf8");
const normalized = landing.replace(/&apos;/g, "'").replace(/\s+/g, " ");

const sceneSequence = [...landing.matchAll(/data-scene="(\d)"/g)].map(([, scene]) => Number(scene));
assert.deepEqual(sceneSequence, [1, 2, 3, 4, 5, 6, 7, 8, 9], "landing must contain exactly nine semantic scenes in order");

for (const exactCopy of [
  "COMMIT BEFORE REALITY DOES.",
  "Markets record what happened. PRIOR records what you believed before it happened.",
  "Forecast live markets. Commit your probability. Let reality score it later.",
  "ENTER PRIOR",
  "MARKET ◆ 61%",
  "The market has a probability.",
  "YOU ● 72%",
  "You have one too.",
  "0—◆61—●72—100",
  "The difference matters only if we can prove when the belief existed.",
  "COMMIT IT",
  "●│",
  "│●",
  "NOW WE CAN MEASURE IT",
  "YOU 72%",
  "MARKET AT COMMIT 61%",
  "OUTCOME UP",
  "FORECAST SCORE 0.0784",
  "MARKET SCORE 0.1521",
  "BELIEF",
  "DECISION",
  "EXECUTION",
  "OUTCOME",
  "Being right is not the same as making a good trade.",
  "RESOLVED FORECAST TRIAL",
  "ONE FORECAST IS ONE MOMENT",
  "WHAT ABOUT THE NEXT MARKET?",
  "THE MARKET CHANGES. THE RULE STAYS ACCOUNTABLE.",
  "Market A",
  "0% UP",
  "1.50% UP",
  "Market B",
  "50% UP",
  "53.25% UP",
  "ABSTAIN",
  "DOWN",
  "SCORED",
  "8-point rule",
  "Forecast 50%",
  "Market 35.2%",
  "BUY UP",
  "Limit 42%",
  "Filled 28.1%",
  "PNL -281 raw",
  "Runner Restarted",
  "Circuit Recovered 2 iterations",
  "Duplicate Effects 0",
  "ONE COMMITTED BELIEF IS EVIDENCE",
  "ONE PERSISTENT INTENT ACROSS MARKETS IS A CIRCUIT",
  "THAT'S PRIOR",
  "Built on DreamDEX Event Contracts on Somnia",
]) {
  assert.ok(normalized.includes(exactCopy), `landing missing exact narrative copy: ${exactCopy}`);
}

const orderedBeats = [
  "data-scene=\"1\"",
  "data-scene=\"2\"",
  "data-scene=\"3\"",
  "data-scene=\"4\"",
  "data-scene=\"5\"",
  "data-scene=\"6\"",
  "data-scene=\"7\"",
  "data-scene=\"8\"",
  "data-scene=\"9\"",
];
let cursor = -1;
for (const beat of orderedBeats) {
  const index = landing.indexOf(beat);
  assert.ok(index > cursor, `narrative beat out of order: ${beat}`);
  cursor = index;
}

const firstRft = normalized.indexOf("RESOLVED FORECAST TRIAL");
const evidenceConcept = normalized.indexOf("NOW WE CAN MEASURE IT");
const firstCircuit = normalized.indexOf("Circuit");
assert.ok(firstRft > evidenceConcept, "Resolved Forecast Trial must be named only after the evidence concept");
assert.ok(firstCircuit > firstRft, "Circuit must be introduced only after a Resolved Forecast Trial");
assert.doesNotMatch(normalized.slice(0, evidenceConcept), /RFT|DreamDEX|Somnia|Brier|protocol architecture|autonomous/i, "landing must not lead with internal jargon");
assert.doesNotMatch(normalized, /autonomous bot|trades every market|guaranteed|profit|testimonial|AI-powered|live proof/i);
assert.doesNotMatch(normalized, /AUTONOMOUS PATH/);
assert.equal((landing.match(/<EnterPriorLink(?:\s+final)?\s*\/>/g) ?? []).length, 2, "only hero and final scene may render ENTER PRIOR");
assert.doesNotMatch(page, /PriorHeader/, "landing must not expose dashboard controls before the explanation");

assert.match(css, /--void:\s*#08070a/);
assert.match(css, /--background:\s*#0d0b11/);
assert.match(css, /--surface-1:\s*#121017/);
assert.match(css, /--border:\s*#30263f/);
assert.match(css, /--purple:\s*#8b5cf6/);
assert.match(css, /--forecast:\s*#65c7ff/);
assert.match(css, /--market:\s*#eab85e/);
assert.doesNotMatch(css, /gradient/i);
assert.doesNotMatch(source, /glassmorph|planet-orb|candlestick|crypto graphic/i);
assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.landing-scene[^}]*opacity:\s*1/);
assert.match(landing, /className="iteration-comparison"[\s\S]*FORECAST[\s\S]*MARKET/, "continuity comparisons must label both semantic values, not rely on color");
assert.match(css, /\.evidence-fact span \{[^}]*font-size:\s*10px/s, "evidence labels must remain legible");
assert.match(css, /\.belief-specimen > span[^}]*color:\s*var\(--text-secondary\)/s, "hero specimen labels need readable contrast");
assert.match(landing, /data-prior-route/, "ENTER PRIOR must expose a semantic route-transition state");
assert.match(landing, /motion\.duration\.route/, "the /live transition must use the canonical route duration token");
assert.match(landing, /prefers-reduced-motion/, "the /live transition must become immediate in reduced motion");
assert.match(css, /html\[data-prior-route="live"\]/, "route transition must have a visible settled state");
assert.match(css, /\.commit-crossing/);
assert.match(css, /\.moving-market/);
assert.match(css, /\.evidence-lock/);
assert.match(css, /\.circuit-iterations/);
assert.match(landing, /aria-label="Shared probability axis/);
assert.match(landing, /aria-label="Commitment boundary/);
assert.match(landing, /aria-label="Circuit continuity/);

assert.match(css, /grid-template-columns:\s*240px minmax\(0, 1fr\) auto/);
assert.match(css, /\.context-trigger-rail \{ width: 56px/);
assert.match(css, /grid-template-columns:\s*260px minmax\(0, 1fr\) 300px/);
assert.match(source, /role="slider"/);
assert.match(source, /ArrowUp/);
assert.match(source, /inputMode="numeric"/);
assert.match(source, /eth_getTransactionReceipt/);
assert.match(source, /marketState!=="TRADING"/);
assert.match(source, /userRequested:armed/);

console.log(`UI contract PASS: ${routes.length} routes, 9 ordered landing scenes, narrative, truth, reduced motion, geometry, ARIA, write gates`);
