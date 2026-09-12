import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const routes = [
  "app/page.tsx",
  "app/proof/page.tsx",
  "app/api/continuity/route.ts",
  "app/api/discovery/markets/route.ts",
  "app/live/page.tsx",
  "app/participate/page.tsx",
  "app/create/page.tsx",
  "app/my/page.tsx",
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
const page = fs.readFileSync(path.join(root, "app/page.tsx"), "utf8");
const normalized = page.replace(/&apos;/g, "'").replace(/\s+/g, " ");

function relativeLuminance(hex) {
  const channels = hex.match(/[a-f\d]{2}/gi).map((channel) => Number.parseInt(channel, 16) / 255);
  const [red, green, blue] = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground, background) {
  const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

assert.match(page, /PlainLanguageIntro/);
assert.match(page, /HowItWorks/);
assert.match(page, /IterationFlow/);
assert.match(page, /RoleSeparation/);
assert.match(page, /ResolutionEvidence/);
assert.match(page, /AuthorityBoundary/);
assert.equal((page.match(/<h1\b/g) ?? []).length, 1, "landing must keep one hero heading");
assert.match(page, /RECORD BELIEF · SET BOUNDARIES · INSPECT RESULTS/);
const requiredCopy = [
  "One bounded intent. Many markets. Every result connected.",
  "A Circuit carries one set of rules across a declared sequence of markets.",
  "The Circuit persists. The evidence changes.",
  "The intent stays the same. The market gets a new answer.",
  "Different roles. One accountable flow.",
  "The market resolves. The belief stays attached.",
  "A rule is only useful if it can say no.",
  "FORECAST", "RFT", "CIRCUIT", "ABSTAIN", "NO ACTION",
  "OWNER", "FORECASTER", "RUNNER", "EXECUTOR",
];
for (const exactCopy of requiredCopy) assert.ok(normalized.includes(exactCopy), `landing missing required copy: ${exactCopy}`);

const orderedSections = [
  "One bounded intent. Many markets. Every result connected.",
  "The Circuit persists. The evidence changes.",
  "The intent stays the same. The market gets a new answer.",
  "Different roles. One accountable flow.",
  "The market resolves. The belief stays attached.",
  "A rule is only useful if it can say no.",
];
let cursor = -1;
for (const section of orderedSections) {
  const index = normalized.indexOf(section);
  assert.ok(index > cursor, `landing section missing or out of order: ${section}`);
  cursor = index;
}
assert.doesNotMatch(page, /LandingScenes|data-scene|COMMIT BEFORE REALITY DOES/);
assert.doesNotMatch(normalized, /\b(?:AI-powered|guaranteed|candles)\b/i);
assert.doesNotMatch(page, /PriorHeader/, "landing must not expose dashboard controls before the explanation");
assert.match(page, /RECORD BELIEF · SET BOUNDARIES · INSPECT RESULTS/);

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
assert.match(css, /\.landing-hero \{/);
assert.match(css, /\.plain-intro h1 \{/);
assert.match(css, /\.continuity-map \{/);
assert.match(css, /\.iteration-flow-track \{/);
assert.match(css, /\.role-grid \{/);
assert.match(css, /\.resolution-record \{/);
assert.match(css, /\.authority-record \{/);
const surface = css.match(/--surface-1:\s*(#[a-f\d]{6})/i)?.[1];
const mutedAa = css.match(/--text-muted-aa:\s*(#[a-f\d]{6})/i)?.[1];
assert.ok(surface && mutedAa, "landing AA-muted and surface tokens must exist");
assert.ok(contrastRatio(mutedAa, surface) >= 4.5, `landing muted token must meet WCAG AA on surface-1, got ${contrastRatio(mutedAa, surface).toFixed(2)}:1`);
assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);

assert.match(css, /grid-template-columns:\s*240px minmax\(0, 1fr\) auto/);
assert.match(css, /\.context-trigger-rail \{ width: 56px/);
assert.match(css, /grid-template-columns:\s*260px minmax\(0, 1fr\) 300px/);
assert.match(source, /role="slider"/);
assert.match(source, /ArrowUp/);
assert.match(source, /inputMode="numeric"/);
assert.match(source, /eth_accounts/);
assert.match(source, /accountsChanged/);
assert.match(source, /chainChanged/);
assert.match(source, /wallet_switchEthereumChain/);
assert.match(source, /connect-wallet/);
assert.match(source, /CONNECT WALLET TO VIEW HISTORY/);
assert.match(source, /CONNECT WALLET TO VIEW PROFILE/);
assert.match(source, /eth_getTransactionReceipt/);
assert.match(source, /marketState!=="TRADING"/);
assert.match(source, /userRequested:armed/);

assert.match(source, /LiveWorkspace/);
assert.match(source, /\/api\/continuity/);
assert.match(source, /\/api\/discovery\/markets/);
assert.match(source, /market-picker/);
assert.match(source, /market-select/);
assert.match(source, /REVIEW &amp; SIGN FORECAST/);
assert.match(source, /AWAITING_RECEIPT/);
assert.match(source, /COMMITTED_READBACK/);
assert.match(source, /LIVE STATE UNAVAILABLE/);
assert.match(source, /prior\.continuity\.v1/);
assert.match(source, /PUBLIC TEMPLATE/);
assert.match(source, /participant-specific/);
assert.match(source, /FORECAST_ONLY/);
assert.match(source, /allowedActionsBitmap/);
assert.match(source, /WRITE DISABLED/);
assert.match(source, /READBACK_MISMATCH/);
assert.match(source, /RECEIPT_REVERTED/);
assert.doesNotMatch(source, /SHARED CIRCUIT/);

console.log(`UI contract PASS: ${routes.length} routes, participation template, Create & Run lifecycle, Circuit continuity, evidence boundaries, reduced motion, geometry, ARIA, write gates`);
