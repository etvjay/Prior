# PRIOR — One-Shot Build Inputs & Preflight Contract

**Version:** 0.1  
**Target:** Somnia Shannon Testnet (`50312`)  
**Purpose:** Give a coding agent every input, credential class, endpoint, SDK, file, source, state requirement, execution gate, review gate, and evidence requirement needed to build Prior without inventing missing infrastructure.

---

# 0. Rule of Use

This file is an **operational preflight**, not a replacement for canonical product/protocol documents.

The agent must first read:

```text
AGENTS.md

docs/GROUND_TRUTH.md
docs/SYSTEM_DEFINITION.md
docs/PRODUCT_SPEC.md
docs/PROTOCOL_SPEC.md
docs/CIRCUIT_SPEC.md
docs/AUTHORITY_DECISION.md
docs/AUTHORITY_MODEL.md
docs/EXECUTION_POLICY.md
docs/RUNNER_SPEC.md
docs/INVARIANTS.md
docs/DREAMDEX_INTEGRATION.md
docs/SOMNIA_INTEGRATION.md
docs/INTERFACE_SURFACES.md
docs/DESIGN.md
docs/UI_ONESHOT_SPEC.md
docs/MOTION_SYSTEM.md
docs/DESIGN_SYSTEM.md
docs/VISUAL_LANGUAGE.md
docs/SCREEN_GEOMETRY.md
docs/FRONTEND_STATE_MACHINE.md
docs/BACKEND_ARCHITECTURE.md
docs/TEST_SPEC.md
docs/DECISIONS.md
docs/ASSUMPTIONS.md
docs/CONTRADICTIONS.md
docs/CANONICAL_STATE.md
docs/EVIDENCE_LEDGER.md
```

Then read:

```text
skills/EXECUTION_SKILL.md
skills/REVIEW_ORCHESTRATOR_SKILL.md
skills/PRODUCT_REVIEW_SKILL.md
skills/PROTOCOL_REVIEW_SKILL.md
skills/CIRCUIT_REVIEW_SKILL.md
skills/RUNNER_REVIEW_SKILL.md
skills/SECURITY_REVIEW_SKILL.md
skills/IMPLEMENTATION_REVIEW_SKILL.md
skills/EVIDENCE_REVIEW_SKILL.md
skills/DESIGN_REVIEW_SKILL.md
skills/MOTION_REVIEW_SKILL.md
skills/M0_AUTHORITY_SPIKE.md
```

If this file conflicts with canonical ground truth, the canonical document wins.

---

# 1. What Must Be Supplied vs What the Agent Can Derive

## User/operator must supply

### REQUIRED FOR LIVE SHANNON WRITES

```text
PRIOR_OWNER_PRIVATE_KEY
```

A **disposable Shannon-testnet-only private key** for the Circuit owner/test user.

It must:

- contain no mainnet funds;
- be used only for this hackathon/testnet build;
- hold enough STT for gas;
- be able to obtain TestUSDC/event collateral;
- be allowed to sign DreamDEX operator approvals and token allowances.

For the shortest hackathon path, this same test-only identity may also deploy the Prior contracts:

```text
PRIOR_DEPLOYER_PRIVATE_KEY = PRIOR_OWNER_PRIVATE_KEY
```

This is acceptable **only on Shannon for the prototype**.

Production separation is a later requirement.

### REQUIRED BEFORE GIT PUSH, IF THE AGENT IS EXPECTED TO PUSH

One of:

```text
existing git authentication
or
GH_TOKEN
```

And:

```text
PRIOR_GIT_REMOTE
```

Example placeholder:

```text
git@github.com:<owner>/prior.git
```

Do not block local implementation on remote creation.

### REQUIRED BEFORE AUTOMATED HOSTING, ONLY IF CLI DEPLOYMENT IS EXPECTED

Deployment authentication such as:

```text
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

is optional until the final web-deployment milestone.

A connected deployment tool or manual deployment path can replace these.

---

## Agent may generate

The agent may create **testnet-only** identities for:

```text
PRIOR_RUNNER_PRIVATE_KEY
PRIOR_FORECASTER_PRIVATE_KEY
```

Rules:

### Runner key

- gas only;
- no user trading collateral;
- no unrestricted user authority;
- may call `CircuitExecutor`;
- must not be DreamDEX operator-approved directly under the target architecture.

### Forecaster key

- signs Forecast payloads;
- does not need trading funds;
- must be different from the Runner for the automatic-Forecast proof if possible.

The agent must print/store only the **addresses** in logs/evidence.

Private-key material must remain in secret environment storage and never be committed.

---

# 2. Secret Handling Rules

## Never commit

```text
*.env
.env
.env.local
.env.*.local
private keys
session seeds
mnemonics
GitHub tokens
deployment tokens
```

## Never print

Do not print:

```text
full private key
mnemonic
session seed
API/deployment tokens
```

Safe to print:

```text
derived address
chainId
contract addresses
marketId
transaction hash
block number
orderId
Circuit ID
Forecast ID
```

## Testnet-only rule

The build must not require or accept a mainnet-funded private key.

If a supplied key has meaningful mainnet funds or cannot be identified as a disposable test key:

```text
STOP
```

Do not proceed with live writes.

---

# 3. Canonical Environment Variables

Create:

```text
.env.example
```

containing placeholders only.

Recommended environment:

```bash
# --------------------------------------------------
# NETWORK
# --------------------------------------------------

PRIOR_CHAIN_ID=50312

SHANNON_RPC_HTTP=https://dream-rpc.somnia.network
SHANNON_RPC_WS=wss://api.infra.testnet.somnia.network/ws

DREAMDEX_INDEXER_URL=https://dev.smk.somnia.host/v1/graphql


# --------------------------------------------------
# SIGNERS — NEVER COMMIT VALUES
# --------------------------------------------------

PRIOR_OWNER_PRIVATE_KEY=

# For the Shannon prototype this MAY equal OWNER.
PRIOR_DEPLOYER_PRIVATE_KEY=

# Prefer a separately generated gas-only test account.
PRIOR_RUNNER_PRIVATE_KEY=

# Prefer a separately generated signing-only test account.
PRIOR_FORECASTER_PRIVATE_KEY=

# Optional only if Runner experiments with Somnia native
# session transactions as its gas-paying identity.
SOMNIA_SESSION_SEED=


# --------------------------------------------------
# DEPLOYED PRIOR CONTRACTS
# Filled after deployment.
# --------------------------------------------------

NEXT_PUBLIC_RFT_REGISTRY_ADDRESS=
NEXT_PUBLIC_CIRCUIT_REGISTRY_ADDRESS=
NEXT_PUBLIC_CIRCUIT_EXECUTOR_ADDRESS=


# --------------------------------------------------
# DREAMDEX STATIC SHANNON REFERENCES
# --------------------------------------------------

DREAMDEX_BINARY_MODULE=0x3ecC694Cef705358864a646142ac17A90E29e388
DREAMDEX_MARKETS_CORE=0x2802504314685D89bF6C992CA5a8e7cC78bc0294
DREAMDEX_BINARY_SETTLEMENT=0xbF4a49e0Dfd092e5FBE8E5761064C49533e6Ed23
DREAMDEX_OUTCOME_TOKEN_6909=0xB52c5934113Af5c0Bb20eb3C72290C8215f755b9
DREAMDEX_ORACLE_HUB=0xe40db387cC98601Dd11bd634fF2f3AD5686dE32b
DREAMDEX_COLLATERAL_ROUTER=0xbC0C9834B15ACE38bB50dDaa7d7f7C7CC4DC183C

DREAMDEX_OPERATOR_PERMISSIONS_REGISTRY=0x15C7e8CE38F021c5b45d098AaD788f63090bF20A


# --------------------------------------------------
# DYNAMIC VALUES — NEVER HARDCODE
# Discover through SDK/module for each live market.
# --------------------------------------------------

# DREAMDEX_COLLATERAL_ADDRESS=
# DREAMDEX_MARKET_ID=
# DREAMDEX_MARKET_ADDRESS=
# DREAMDEX_BINARY_POOL_ADDRESS=
# DREAMDEX_BINARY_PLACEMENT_SELECTOR=


# --------------------------------------------------
# OPTIONAL WEB/DEPLOYMENT
# --------------------------------------------------

NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=

VERCEL_TOKEN=
VERCEL_ORG_ID=
VERCEL_PROJECT_ID=

PRIOR_GIT_REMOTE=
GH_TOKEN=
```

The application must run without optional deployment variables.

---

# 4. Network Inputs

## Development network

```text
Somnia Shannon
chainId = 50312
native gas token = STT
```

Use Shannon for all submission-critical live writes.

## HTTP JSON-RPC

Current public Shannon alias:

```text
https://dream-rpc.somnia.network
```

The Markets SDK chain definition should remain the preferred source for current transport configuration.

## WebSocket RPC

Current testnet SDK endpoint:

```text
wss://api.infra.testnet.somnia.network/ws
```

Required for a strong live experience and useful for Runner/event reconciliation.

Fallback polling must still exist for operational resilience.

## DreamDEX/Somnia Markets indexer

Current Shannon/testnet indexer:

```text
https://dev.smk.somnia.host/v1/graphql
```

Use for discovery/hydration.

Do not treat the indexer as write authority.

Before any trade:

```text
read live onchain market status
```

---

# 5. API Keys

## DreamDEX Event Contracts

**No DreamDEX API key is required.**

Use:

```text
@somnia-chain/markets-sdk
```

with public testnet indexer/RPC endpoints.

## DreamDEX REST API

Not required for Event Contract implementation.

Do not substitute the DreamDEX spot HTTP API for the Event Contract SDK/onchain surface.

## Somnia RPC

Current public Shannon endpoints do not require a user API key for the planned development path.

If a private RPC provider is later introduced:

```text
RPC_PROVIDER_API_KEY
```

becomes an operational optimization, not a protocol dependency.

## Explorer API

Not required to implement Prior.

Contract verification may use Blockscout/Foundry-supported verification later.

Do not block M0/M1 on an explorer API key.

---

# 6. SDKs and Toolchain

## Required protocol SDK

Pin exactly after smoke validation:

```text
@somnia-chain/markets-sdk@0.29.0
```

Do not use:

```text
^0.29.0
latest
*
```

for the submission branch.

The package is public on npm.

No npm auth token is required.

## Required peer/client

```text
viem
```

Install a version compatible with the pinned Markets SDK and then lock it exactly through the package lockfile.

## Package manager

Use:

```text
pnpm
```

and commit:

```text
pnpm-lock.yaml
```

## Contracts

Use:

```text
Foundry
forge
cast
anvil
```

for:

- contract build;
- unit/property tests;
- fork tests;
- deployment;
- live read/write scripts.

## Web

Recommended:

```text
Next.js
React
TypeScript
```

Use the Markets SDK React entry only where it materially simplifies live state.

## Motion

Use one motion implementation consistently.

Recommended:

```text
Motion / Framer Motion
```

or native CSS/View Transitions where appropriate.

Do not add multiple competing animation systems.

## E2E

```text
Playwright
```

## Unit/TypeScript

Use one test runner, e.g.:

```text
Vitest
```

if the repository has no existing standard.

---

# 7. Markets SDK Configuration

Canonical Shannon construction target:

```ts
import {
  SomniaMarkets,
  SOMNIA_TESTNET_ADDRESSES,
} from "@somnia-chain/markets-sdk";

import {
  somniaShannon,
} from "@somnia-chain/markets-sdk/chains";

const exchange = new SomniaMarkets({
  indexerUrl: "https://dev.smk.somnia.host/v1/graphql",
  chain: somniaShannon,
  wsRpcUrl: "wss://api.infra.testnet.somnia.network/ws",
  addresses: SOMNIA_TESTNET_ADDRESSES,

  // Only attach a privateKey in scripts/runtime paths that write.
  privateKey,
});

await exchange.loadMarkets();
```

Do not duplicate SDK address maps by hand unless a contract specifically requires an immutable known address.

---

# 8. SDK Exports the Agent Must Inspect

Before implementing DreamDEX contract calls, inspect the installed pinned package and save the output.

Required exports include, as applicable:

```text
binaryPoolWriteAbi
binaryModuleReadAbi
binaryModuleWriteAbi
binarySettlementAbi
erc6909Abi
oracleHubAbi

operatorRegistryWriteAbi
orderBookEventsAbi

SOMNIA_TESTNET_ADDRESSES

SomniaMarkets
somniaShannon
```

The agent must locate the actual ABI item for:

```text
placeBinaryOrderFor
```

and compute the exact selector from the ABI.

Do not hand-type the selector from memory.

Save:

```text
evidence/shannon/m0-sdk-exports.json
evidence/shannon/m0-binary-abi.json
```

---

# 9. DreamDEX Static Contract References

Current protocol core addresses are identical across Shannon (`50312`) and mainnet (`5031`) due to CREATE3 deployment.

For Shannon:

```text
BinaryMarketsModule
0x3ecC694Cef705358864a646142ac17A90E29e388

MarketsCore
0x2802504314685D89bF6C992CA5a8e7cC78bc0294

BinarySettlement
0xbF4a49e0Dfd092e5FBE8E5761064C49533e6Ed23

OutcomeToken6909
0xB52c5934113Af5c0Bb20eb3C72290C8215f755b9

OracleHub
0xe40db387cC98601Dd11bd634fF2f3AD5686dE32b

CollateralRouter
0xbC0C9834B15ACE38bB50dDaa7d7f7C7CC4DC183C
```

Testnet operator registry:

```text
OperatorPermissionsRegistry
0x15C7e8CE38F021c5b45d098AaD788f63090bF20A
```

Do not use SpotPoolRegistry as proof that a BinaryPool is globally covered.

Target binary operator approval is conservative:

```text
per-pool
+
exact binary placement selector
```

until live evidence proves a broader safe path.

---

# 10. Dynamic DreamDEX State the Agent Must Discover

Never hardcode:

```text
marketId
market contract
BinaryPool
expiry
market status
oracleQuestionId
collateral address
tick/lot/price scale
current top of book
winning outcome
```

For every live execution, resolve these from the SDK/onchain state.

## Canonical identity

```text
marketId
```

Never:

```text
pool address
```

because binary pools may be recycled across windows.

---

# 11. Binary Placement Rule

Event Contracts use specialized binary placement.

The installed SDK/ABI must show:

```text
placeBinaryOrder(...)
placeBinaryOrderFor(...)
```

Generic:

```text
placeOrder(...)
placeOrderFor(...)
```

must not be used against BinaryPool.

If implementation attempts the generic path:

```text
FAIL REVIEW
```

---

# 12. Test Funds

## Gas

Owner/deployer and Runner need Shannon STT.

Source:

```text
official Somnia Shannon testnet faucet
```

Official hub:

```text
https://testnet.somnia.network/
```

The Runner only needs enough STT to relay calls.

## Event Contract collateral

Testnet Event Contracts use faucet-capable TestUSDC / configured collateral with **6 decimals**.

Do not hardcode its address from memory.

Resolve:

```text
SOMNIA_TESTNET_ADDRESSES.collateral
```

or current SDK system info.

The Markets SDK exposes a testnet faucet path:

```text
exchange.trader.faucet(...)
```

to mint configured TestUSDC to the signer.

Before live Circuit execution, confirm:

```text
owner STT > gas minimum
owner TestUSDC > planned tiny trade
owner allowance to relevant BinaryPool >= worst-case tiny spend
```

Use tiny test amounts only.

---

# 13. Required Signing Identities

For the strongest proof use four logical roles.

## 1. Owner

```text
PRIOR_OWNER_PRIVATE_KEY
```

Responsibilities:

- create/authorize Circuit;
- sign DreamDEX operator approval;
- sign ERC-20 allowance;
- own DreamDEX order/position.

## 2. Deployer

```text
PRIOR_DEPLOYER_PRIVATE_KEY
```

For prototype may equal Owner.

## 3. Runner

```text
PRIOR_RUNNER_PRIVATE_KEY
```

Responsibilities:

- gas-paying calls;
- Runner liveness;
- no owner collateral;
- no direct DreamDEX authority under target architecture.

## 4. Forecaster

```text
PRIOR_FORECASTER_PRIVATE_KEY
```

Responsibilities:

- sign automatic Forecast payload;
- no trading authority.

Evidence must prove these roles are not being accidentally conflated.

---

# 14. Agent Forecast Signing State

For automatic Circuit Forecasts, sign a domain-bound payload.

Target fields:

```text
chainId
RFTRegistry/CircuitRegistry verifying contract
circuitId
marketId
pUpBps
validUntil
forecaster
nonce/version
```

The exact EIP-712 schema is implementation work and must be reviewed before freezing.

Requirements:

- cannot replay across chain;
- cannot replay across Circuit;
- cannot replay across market;
- cannot mutate probability;
- expired Forecast rejected.

No LLM/model API is required to prove the architecture.

The test Forecaster can produce deterministic/sample probabilities.

If a real model is introduced later, its API key is a separate optional integration.

---

# 15. No AI API Is Required for the MVP

Do **not** block the build waiting for:

```text
OPENAI_API_KEY
ANTHROPIC_API_KEY
GEMINI_API_KEY
```

The core proof is:

```text
signed Forecast
→ Circuit policy
→ bounded execution
→ DreamDEX resolution
→ evidence
```

The Forecast source may initially be:

```text
manual user
or
deterministic test forecaster
```

A real model can be plugged into the same signed-Forecast interface later.

---

# 16. Circuit Authority Setup

Target architecture:

```text
Owner
  │
  │ DreamDEX operator grant
  ▼
CircuitExecutor contract
  │
  │ bounded checks
  ▼
BinaryPool.placeBinaryOrderFor(owner,...)
```

Runner:

```text
Runner
  ↓
CircuitExecutor
```

Runner must not be operator-approved directly in the target architecture.

## Setup per relevant BinaryPool

Owner may need to provide:

```text
1. exact binary-placement operator approval
2. ERC-20 collateral allowance
```

These are separate.

Before a live iteration the executor/runner must verify:

```text
marketId → current BinaryPool
operator authorization exists
collateral allowance sufficient
Circuit active
market Trading
```

---

# 17. Execution Rule Inputs

Do not use midpoint disagreement alone as execution authorization.

Circuit config contains:

```text
minMarginBps
maxPerMarket
totalBudget
targetWindows
allowed market class
allowed actions
stop condition
expiry
```

For Up:

```text
maxUpPrice = pUp - minMargin
```

For Down:

```text
maxDownPrice = (1 - pUp) - minMargin
```

Use a strict IOC limit.

If no fill exists inside the allowed price:

```text
NO FILL / ABSTAIN
```

not:

```text
increase limit automatically
```

---

# 18. Repository Files That Must Exist Before Implementation Is Accepted

Target repo:

```text
prior/
│
├── AGENTS.md
├── README.md
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── turbo.json
├── .gitignore
├── .env.example
│
├── apps/
│   ├── web/
│   └── runner/
│
├── contracts/
│   ├── src/
│   │   ├── RFTRegistry.sol
│   │   ├── CircuitRegistry.sol
│   │   ├── CircuitExecutor.sol
│   │   ├── DreamDexAdapter.sol
│   │   ├── interfaces/
│   │   └── libraries/
│   │       ├── RFTScoring.sol
│   │       └── CircuitPolicy.sol
│   │
│   ├── test/
│   └── script/
│
├── packages/
│   ├── core/
│   ├── dreamdex/
│   ├── circuit/
│   └── config/
│
├── scripts/
│   ├── discover-markets.ts
│   ├── inspect-market.ts
│   ├── inspect-abi.ts
│   ├── snapshot-book.ts
│   ├── inspect-resolution.ts
│   ├── inspect-operator.ts
│   ├── smoke-operator-grant.ts
│   ├── smoke-binary-order.ts
│   ├── smoke-revocation.ts
│   ├── deploy-prior.ts
│   └── evidence.ts
│
├── tests/
│   ├── integration/
│   └── e2e/
│
├── evidence/
│   └── shannon/
│
├── docs/
│   └── [canonical docs]
│
└── skills/
    └── [execution/review skills]
```

---

# 19. Required M0 State Capture

The agent must not begin real contract integration from guesses.

Produce:

```text
evidence/shannon/m0-environment.json
evidence/shannon/m0-sdk-exports.json
evidence/shannon/m0-binary-abi.json
evidence/shannon/m0-market.json
evidence/shannon/m0-book.json
evidence/shannon/m0-resolution.json
evidence/shannon/m0-operator.json
```

At minimum record:

```text
timestamp
git commit
node version
pnpm version
SDK version
viem version
chainId
RPC endpoint class
indexer URL
owner address
runner address
forecaster address
binary core addresses
collateral address
marketId
market address
pool
status
expiry
oracleQuestionId
book normalization
placeBinaryOrderFor signature
placeBinaryOrderFor selector
operator registry address
```

Never record private keys.

---

# 20. Required M0 Write Evidence

After read-only M0 passes:

```text
evidence/shannon/m0-operator-grant.json
evidence/shannon/m0-binary-order.json
evidence/shannon/m0-revocation.json
```

Prove:

```text
owner grants CircuitExecutor exact binary placement permission
authorization false → true
collateral allowance established
tiny IOC submitted through CircuitExecutor
order owner == owner
executor != owner
Runner != operator
tradeTag/userData preserved
position/fill belongs to owner
revocation succeeds
post-revocation operator attempt rejected
```

If any of those fail:

```text
AUTONOMOUS CIRCUIT EXECUTION IS NOT VERIFIED
```

Use guided execution fallback until fixed.

---

# 21. Prior Contract Deployment State

After M1 deployment save:

```text
deployments/shannon.json
```

Conceptual:

```json
{
  "chainId": 50312,
  "commit": "...",
  "deployer": "0x...",
  "RFTRegistry": "0x...",
  "CircuitRegistry": "0x...",
  "CircuitExecutor": "0x...",
  "DreamDexAdapter": "0x...",
  "sdkVersion": "0.29.0"
}
```

Then update:

```text
docs/CANONICAL_STATE.md
docs/EVIDENCE_LEDGER.md
.env.example
apps/web config
apps/runner config
```

Do not copy addresses into multiple uncontrolled files.

Use one deployment/config source.

---

# 22. Runner State Requirements

The Runner must be able to reconstruct without in-memory continuity.

Canonical recovery inputs:

```text
CircuitRegistry state/events
RFTRegistry state/events
DreamDEX market state
DreamDEX orders/fills
transaction receipts
block numbers
```

Optional local/checkpoint DB can store:

```text
last reconciled block
work queue
retry metadata
runtime diagnostics
```

But correctness cannot depend on it.

Required runtime state per iteration:

```text
circuitId
marketId
iterationKey
forecastId/trialId
forecast status
policy decision
execution key
execution tx/order ID
market terminal status
RFT terminal status
last reconciled block
```

---

# 23. Database

## Not required for protocol truth

Do not require a database before M0/M1.

## Useful for full product

A lightweight Postgres read model becomes useful for:

```text
History
Profile
Circuit timeline
aggregate scores
runner checkpoints
search/filter
```

If added:

```text
DATABASE_URL
```

becomes required for the hosted read model only.

The DB must be rebuildable from chain/DreamDEX sources.

No database write may override canonical evidence.

---

# 24. REST / HTTPS / WebSocket / SDK / MCP Requirements

| Surface | Needed now? | Role |
|---|---:|---|
| HTTPS | Yes | hosted Prior web/runner transport |
| Somnia JSON-RPC | Yes | canonical chain reads/writes |
| Somnia/DreamDEX WS | Yes for strong live/runner UX | live state and events |
| Markets SDK | Yes | Event Contract integration |
| Internal Prior SDK/packages | Yes | shared logic across web/runner/tests |
| Custom REST API | No | optional future read model |
| Public Prior SDK | Not submission-critical | future integrations |
| MCP | No | future agent interface |
| GraphQL owned by Prior | No | unnecessary initially |
| Database | Optional until History/Circuit scale | read model/checkpoints |

---

# 25. Frontend Inputs

No additional external UI API is required.

The web app reads:

```text
DreamDEX live markets
Prior contracts
optional read model
wallet state
```

Required product routes:

```text
/
 /live
 /forecast/[id]
 /circuits
 /circuit/[id]
 /history/[address]
 /profile/[address]
```

Design implementation must read:

```text
docs/DESIGN.md
docs/UI_ONESHOT_SPEC.md
docs/MOTION_SYSTEM.md
docs/DESIGN_SYSTEM.md
docs/VISUAL_LANGUAGE.md
docs/SCREEN_GEOMETRY.md
docs/FRONTEND_STATE_MACHINE.md
skills/DESIGN_REVIEW_SKILL.md
skills/MOTION_REVIEW_SKILL.md
```

before coding.

---

# 25A. UI implementation contract

Before frontend implementation, read:

```text
docs/UI_ONESHOT_SPEC.md
docs/MOTION_SYSTEM.md
docs/DESIGN.md
docs/DESIGN_SYSTEM.md
docs/VISUAL_LANGUAGE.md
docs/SCREEN_GEOMETRY.md
docs/FRONTEND_STATE_MACHINE.md
skills/DESIGN_REVIEW_SKILL.md
skills/MOTION_REVIEW_SKILL.md
```

`UI_ONESHOT_SPEC.md` defines:

```text
landing composition
scroll narrative
route transitions
market switching
Forecast interaction
commit choreography
execution sheet
Forecast evidence page
Circuit creation
Circuit live page
Circuit timeline
Runner state UI
History
Profile
mobile behavior
motion tokens
component inventory
empty/error/loading states
UI tests
visual review gates
```

The agent must not improvise a separate visual language for Circuits or History.

# 26. Required Build State Machines

The agent must implement/test separate state machines for:

```text
Wallet
DreamDEX market
Forecast/RFT
Circuit
Runner iteration
Execution
```

Do not collapse them into one boolean-heavy component.

Especially distinguish:

```text
Forecast committed
≠
policy evaluated
≠
order submitted
≠
order filled
≠
market resolved
≠
RFT finalized
```

---

# 27. Build Order for the One-Shot Agent

## PHASE 0 — Repository bootstrap

Create:

```text
workspace
docs
skills
packages
contracts
web
runner
tests
evidence
```

Copy canonical control-plane docs first.

Commit:

```text
chore: bootstrap Prior canonical control plane
```

---

## PHASE 1 — M0 integration truth

Do not build the final UI yet.

Run:

```text
discover Markets SDK
inspect package exports
inspect binary ABI
discover live markets
inspect market
snapshot book
inspect resolution
derive exact binary operator selector
verify operator registry
```

Update evidence/docs.

Run implementation/evidence review.

---

## PHASE 2 — M0 authority spike

Use tiny Shannon funds.

Prove:

```text
operator grant
collateral allowance
placeBinaryOrderFor
owner-scoped order
tradeTag
revocation
```

Run:

```text
Circuit review
Protocol review
Security review
Implementation review
Evidence review
```

If autonomous authority fails, explicitly switch the demo to guided execution while preserving the target architecture.

---

## PHASE 3 — RFT

Implement:

```text
RFTScoring
DreamDexAdapter
RFTRegistry
signed Forecast path
```

Test:

```text
unit
mock
fork
live Shannon commit
live Shannon finalization
```

---

## PHASE 4 — Circuit core

Implement:

```text
CircuitPolicy
CircuitRegistry
CircuitExecutor
authority checks
budget checks
duplicate-execution protection
revocation
stop conditions
```

---

## PHASE 5 — Runner

Implement:

```text
market discovery
reconciliation
Forecast acquisition
commit relay
policy/execution trigger
resolution observation
RFT finalization
Circuit advancement
restart recovery
```

Kill/restart test is mandatory.

---

## PHASE 6 — Web system

Implement one visual system across:

```text
landing
Live
Forecast
Circuit
History
Profile
```

Follow the canonical design/motion/state docs.

Do not use mock status in the live path.

---

## PHASE 7 — Multi-market live proof

Run one unchanged Circuit across:

```text
minimum 2 consecutive live Event Contracts
preferred 4
```

Capture every transaction/order/result.

---

## PHASE 8 — History/Profile/read model

Implement derived views.

No universal reputation score.

---

## PHASE 9 — Final review

Run all review skills:

```text
Product
Protocol
Circuit
Runner
Security
Implementation
Design
Evidence
```

No unresolved BLOCKER.

---

## PHASE 10 — Submission bundle

Produce:

```text
README.md
architecture diagram
demo script
2–3 minute demo
deployed web URL
Shannon deployment addresses
evidence bundle
SDK/docs feedback
known limitations
```

---

# 28. Review Stop Conditions

The agent must stop the dependent milestone and document the failure if any of these occur:

```text
placeBinaryOrderFor ABI differs from assumptions

operator permission cannot authorize CircuitExecutor

collateral cannot auto-pull safely from owner

pool recycling breaks expected authority setup

market identity cannot be reconstructed by marketId

Runner retry can double execute

signed Forecast can replay

execution can exceed Circuit limit

Forecast can mutate

market outcome is supplied by frontend/backend

voided market is scored

mock data is required for the claimed live path
```

Do not “make the demo work” by bypassing an invariant.

---

# 29. Required Reviews by Milestone

## M0 reads

```text
Implementation Review
Evidence Review
```

## M0 authority

```text
Protocol Review
Circuit Review
Security Review
Implementation Review
Evidence Review
```

## RFT

```text
Protocol
Security
Implementation
Evidence
```

## Circuit

```text
Circuit
Protocol
Security
Implementation
Evidence
```

## Runner

```text
Runner
Circuit
Security
Implementation
Evidence
```

## Frontend

```text
Product
Design
Implementation
Evidence
```

## End-to-end

Run all.

---

# 30. Required Evidence Classification

Allowed:

```text
DESIGN_ONLY
PRIMARY_SOURCE_VERIFIED
UNIT_VERIFIED
MOCK_VERIFIED
FORK_VERIFIED
SHANNON_READ_VERIFIED
SHANNON_WRITE_VERIFIED
END_TO_END_VERIFIED
```

Every public README/demo claim must map to:

```text
docs/EVIDENCE_LEDGER.md
```

---

# 31. External Primary Sources

Checked for this preflight on 2026-09-05.

## Somnia Markets SDK

```text
https://www.npmjs.com/package/@somnia-chain/markets-sdk
https://prd.smk.somnia.host/docs/typescript
https://prd.smk.somnia.host/docs/typescript/release-notes
https://prd.smk.somnia.host/docs/typescript/chains
```

## DreamDEX Event Contracts

```text
https://app.dreamdex.io/docs/developers/event-contracts
https://app.dreamdex.io/docs/developers/event-contracts/market-structure
https://app.dreamdex.io/docs/developers/event-contracts/recipes
https://app.dreamdex.io/docs/developers/event-contracts/gotchas
https://app.dreamdex.io/docs/developers/event-contracts/contracts-and-addresses
```

## DreamDEX operator permissions

```text
https://app.dreamdex.io/docs/trading/spot/operators
```

Use for shared operator-registry semantics, then verify the specialized BinaryPool selector on Shannon.

## Somnia testnet

```text
https://testnet.somnia.network/
https://shannon-explorer.somnia.network/
```

---

# 32. Inputs We Explicitly Do NOT Need Yet

Do not ask the user for:

```text
mainnet private key
mainnet capital
DreamDEX API token
OpenAI API key
Anthropic API key
Gemini API key
custom oracle key
MCP credentials
custom GraphQL server
Redis
Kafka
Kubernetes
AWS account
database credentials before read-model phase
```

None is required to prove Prior.

---

# 33. Minimum User Handoff Package

For the agent to begin and continue through live Shannon testing, the user only needs to ensure:

```text
[ ] canonical Prior docs + skills are in repo
[ ] disposable Shannon owner private key is available as secret env
[ ] owner address has/gets STT
[ ] Git auth exists if push is expected
```

The agent can then:

```text
[ ] derive owner address
[ ] generate Runner identity
[ ] generate Forecaster identity
[ ] obtain TestUSDC via SDK faucet
[ ] discover collateral address
[ ] discover live Event Contract
[ ] inspect ABI
[ ] deploy contracts
[ ] configure operator approval
[ ] configure collateral allowance
[ ] run M0 authority proof
[ ] implement RFT
[ ] implement Circuit
[ ] implement Runner
[ ] implement UI
[ ] run reviews
[ ] produce evidence
```

Deployment credentials are only needed when publishing the web app.

---

# 34. One-Shot Agent Directive

Give the coding agent this instruction together with the repository:

> You are implementing Prior on Somnia Shannon against live DreamDEX Event Contracts. Treat `AGENTS.md` and the canonical documents in `/docs` as binding, with the precedence listed in `README.md`. Read all execution/review skills before implementing. Do not invent external SDK/ABI behavior. Start with M0 integration truth and the authority spike, using the pinned Markets SDK and primary/live evidence. Never use an unrestricted backend-held owner key; the target authority path is Runner → bounded CircuitExecutor → DreamDEX BinaryPool specialized `placeBinaryOrderFor(owner, ...)`, subject to live Shannon verification. Keep RFT immutable, DreamDEX as outcome authority, `marketId` as canonical market identity, and Circuit as persistent bounded intent across markets. Use executable price limits, not midpoint disagreement alone, for Circuit trading decisions. Build the complete repository in dependency order, run the required review skills after every milestone, update `CANONICAL_STATE.md` and `EVIDENCE_LEDGER.md` continuously, and do not label mock/fork behavior as live. Continue until you have the strongest end-to-end implementation permitted by real Shannon behavior, including a restart-safe Runner, unified Prior UI, tests, deployment artifacts, evidence, known limitations, and submission-ready README/demo materials. If an external assumption fails, preserve the invariant, record the contradiction, choose the smallest safe fallback, and continue rather than fabricating success.

---

# 35. Ready-to-Run Gate

The agent may start local/bootstrap work immediately.

The agent may start **live Shannon writes** only when:

```text
OWNER_PRIVATE_KEY present
↓
derived owner address recorded
↓
STT balance confirmed
↓
chainId == 50312
↓
current SDK/version verified
↓
live Event Contract discovered
↓
M0 read-only checks pass
```

Then:

```text
TestUSDC
↓
operator approval
↓
collateral allowance
↓
tiny operator order
```

No other credential is required for the core protocol proof.
