import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const routes = ["app/page.tsx","app/live/page.tsx","app/circuits/page.tsx","app/circuit/[id]/page.tsx","app/forecast/[id]/page.tsx","app/history/[address]/page.tsx","app/profile/[address]/page.tsx"];
for (const route of routes) assert.equal(fs.existsSync(path.join(root, route)), true, `missing ${route}`);
const files = fs.readdirSync(path.join(root,"app"),{recursive:true}).filter(name=>/\.(tsx|ts|css)$/.test(String(name))).map(name=>path.join(root,"app",String(name)));
const source = files.map(file=>fs.readFileSync(file,"utf8")).join("\n");
const css = fs.readFileSync(path.join(root,"app/globals.css"),"utf8");
const landing = fs.readFileSync(path.join(root,"app/LandingScenes.tsx"),"utf8");
const sceneSequence = [...landing.matchAll(/data-scene="(\d)"/g)].map(([, scene]) => Number(scene));
assert.deepEqual(sceneSequence, [1, 2, 3, 4, 5, 6, 7, 8, 9], "landing must preserve the nine canonical scenes in order");
const normalizedLanding = landing.replace(/\s+/g, " ");
for (const explanation of [
  "external reference",
  "your probability",
  "immutable before resolution",
  "decides BUY or ABSTAIN under constraints",
  "persistent intent across changing markets",
  "observed chain and RFT result",
]) assert.match(normalizedLanding, new RegExp(explanation, "i"), `landing must explain: ${explanation}`);
assert.match(normalizedLanding,/MARKET #1/);
assert.match(normalizedLanding,/ACCEPTED SHANNON EVIDENCE/);
assert.match(normalizedLanding,/AUTONOMOUS PATH[^<]*BLOCKED_EXTERNAL/);
assert.match(landing,/href="\/live"/);
assert.match(landing,/href="\/circuits"/);
assert.match(landing,/href=\{`\/forecast\/\$\{proof\.id\}`\}/);
assert.doesNotMatch(landing,/live proof|autonomous success|autonomously executed/i);
assert.doesNotMatch(css,/\.landing-scene\.in-view\s*>\s*\*:not\(\.scene-index\)/,"landing motion must not be a generic reveal-only animation");
assert.match(css,/\.scene-flow-line/);
assert.doesNotMatch(landing,/className="scene-kicker">\d{2}\s*·/i,"scene labels must not introduce a competing number sequence");
assert.match(normalizedLanding,/DRAFT → WALLET → RECEIPT OK → IMMUTABLE/i,"commit scene must remain causal without motion");
assert.match(landing,/Market at commit <b className="market-color">/i,"evidence must retain Market amber semantics");
assert.match(landing,/Forecast <b className="forecast-color">/i,"evidence must retain Forecast blue semantics");
assert.match(css,/\.scene-flow \{[^}]*font-size:\s*10px/s,"desktop causal tracker must remain legible");
assert.match(css,/\.intent-spine small \{[^}]*font-size:\s*11px/s,"evidence boundary copy must remain legible");
assert.match(css,/@media \(prefers-reduced-motion: reduce\)[\s\S]*\.landing-scene > \*[^}]*opacity:\s*1/);
assert.match(css,/grid-template-columns:\s*240px minmax\(0, 1fr\) auto/);
assert.match(css,/\.context-trigger-rail \{ width: 56px/);
assert.match(css,/grid-template-columns:\s*260px minmax\(0, 1fr\) 300px/);
assert.match(css,/@media \(prefers-reduced-motion: reduce\)/);
assert.doesNotMatch(css,/gradient/i);
assert.doesNotMatch(source,/glassmorph|planet-orb/i);
assert.doesNotMatch(source,/Resolved Forecast Trials|Forecast Arena|Event Circuit/);
assert.match(source,/role="slider"/);
assert.match(source,/ArrowUp/);
assert.match(source,/inputMode="numeric"/);
assert.match(source,/eth_getTransactionReceipt/);
assert.match(source,/marketState!=="TRADING"/);
assert.match(source,/userRequested:armed/);
console.log(`UI contract PASS: ${routes.length} routes, 9 scenes, geometry, motion, ARIA, write gates`);
