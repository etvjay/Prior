# PRIOR Submission Evidence Matrix

Status: `SUBMISSION_READY_WITH_LIMITATIONS` candidate matrix. This document freezes the claim boundary for the hackathon submission. It does not replace or rewrite historical evidence.

## Canonical V2 hero proof

| Claim | Evidence artifact | Chain/object identifier | Evidence class | Limitations | Submission-safe wording |
|---|---|---|---|---|---|
| Circuit exists and was created | `evidence/m4-3-live-zero-action-lifecycle.json` receipts | Circuit `0x6cdfdf64cc70b5bb2e6519ab1dc0372e3ed7fdfb6d16a0ca0043f7aea4f23437`; create tx `0x9e0f8b6a14b091b83706a7c2c4ed9e8aeea11756f8eef621a38db83297f2bc31` | `SHANNON_WRITE_VERIFIED` | One selected proof Circuit | A live Shannon Circuit was created and read back.
| Circuit was authorized and activated | same artifact | authorize tx `0x67fa524e1e143fda4bae5775874ffe065a50d4e8f84ce44d5973d86126f2a634`; activate tx `0xce952e43e2762079e9593b213bcfca622eb3531f8fefe8e89682516250cdc8a4` | `SHANNON_WRITE_VERIFIED` | Historical lifecycle only | The hero Circuit completed its authorization lifecycle.
| External Forecast identity was authenticated | same artifact | Forecaster `0x233FE0d8D75e15b668b94eFD0e6DE50A8e50D364`; signature scheme `EIP712_V2`; recovered signer matches | `SHANNON_WRITE_VERIFIED` | External agent was a separately run proof process, not a production third-party service | A separately run external Forecast agent produced an EIP-712 Forecast recovering to the configured Forecaster.
| Forecast was committed before resolution | same artifact | request `0x7078bb2eaaf60d91eaa18c58d90da8b4fb4e4a7d333dda2b45ed02ea92a167b7`; commit block `484544479` | `SHANNON_WRITE_VERIFIED` | `referenceValid=false` | The Forecast was committed as an immutable RFT before the canonical outcome.
| RFT was bound to the V2 Circuit iteration | same artifact | trial `0x9d0ce9d1542b3dc1261e4cf73a1f18b24b9fa61e3dec72b7407823156b954f66`; iteration `0x6c588551508a0a413d998743e2df2b51eb7d2c294431e3b8bc856e48840fa1c0` | `SHANNON_WRITE_VERIFIED` | This is the one-window V2 hero, not V1 continuity | V2 canonically bound this market, RFT, and Circuit iteration.
| Economic action was denied | same artifact | `BUY_UP` and `BUY_DOWN`; executor `0x6e6Bf80Dc412f4DFCb59C15494C83785d54fb66d`; selector `0x829e3733` | `SHANNON_WRITE_VERIFIED` | Zero-action policy intentionally denies both actions | The Circuit allowed no economic action; both attempted directions returned `ActionNotAllowed`.
| DreamDEX settled canonically | same artifact | market `0x…18e83`; settlement `0xbF4a49e0Dfd092e5FBE8E5761064C49533e6Ed23`; payout numerators `[0,10000000]` | `SHANNON_WRITE_VERIFIED` | Market reference was unavailable | The canonical settlement resolved `DOWN`; outcome is not inferred from the Forecast.
| RFT was finalized and scored | same artifact | finalize tx `0x7a3b71fd72d05178f20ee393975706e318338563221f6124f2b01ca03aae47ee`; trial status `SCORED`; pUp `5000`; Forecast Brier `25000000` | `SHANNON_WRITE_VERIFIED` | Market-reference Brier and delta are unavailable | The RFT was finalized and scored; market-reference metrics are unavailable.
| Circuit advanced exactly once | same artifact | advance tx `0x97c99af3f1aefb562e92774c369d2c6069ca44d8185fbb2434132bc820ad5ea3`; `processed=true` | `SHANNON_WRITE_VERIFIED` | One target window | The final V2 iteration is processed and the Circuit is `COMPLETE`.
| Restart/replay safety was exercised | same artifact | `LIVE_RECOVERY_FROM_CANONICAL_STATE`; duplicate advance prevented | `SHANNON_WRITE_VERIFIED` | One observed recovery path, not a production daemon | A fresh-process recovery reconstructed canonical Circuit/RFT/binding state and prevented duplicate effects.

## Historical V1 supporting proof

| Claim | Evidence artifact | Identifier | Evidence class | Limitation | Safe wording |
|---|---|---|---|---|---|
| One unchanged V1 intent advanced across two Bitcoin markets | `evidence/shannon/circuit-continuity-recovery.json` | Circuit `0x15e18e2aecb7d00ca3243181fb2fa38af81b021266e2d0a290eb0c55d2b5f4c1`; markets `0x…14d04`, `0x…14d96` | `CIRCUIT_CONTINUITY_TWO_MARKETS_VERIFIED` | V1 evidence; do not attribute V2 iteration guarantees | One unchanged V1 Circuit intent was advanced across two real Bitcoin markets, with one attributable RFT per market and both judgments subsequently scored.
| Both V1 judgments became evidence without orders | same artifact | RFTs `0xb467…0145c`, `0x47be…8053e`; both `ABSTAIN`; orders `false` | same | V1 did not cryptographically bind Circuit iteration to RFT or enforce V2 `allowedActionsBitmap` | Both markets produced scored RFT evidence while policy abstained from orders.

## Hosted and agent surfaces

| Claim | Evidence | Class | Limitation | Safe wording |
|---|---|---|---|---|
| Public HTTP Worker exists | `https://prior-agent-readonly.microcosm.workers.dev/health` | `HOSTED_PASS` | Read-only Worker | Prior exposes a public authenticated read Worker.
| Live Shannon detail reads work | Worker market/Circuit/RFT routes | `EXTERNAL_PASS` | Detail IDs required; list indexing is not connected | Agents can read canonical market, Circuit, and RFT detail by identifier.
| Remote MCP reads work | `POST https://prior-agent-readonly.microcosm.workers.dev/mcp` | `MCP_CONSUMER_PASS` | Read-only tools/resources only | Agents can initialize MCP and read live market, Circuit, and RFT details.
| Bearer authentication works | unauthenticated/spoofed header denied; bearer accepted | `HOSTED_PASS` | Not production identity federation | The hackathon Worker uses bounded bearer authentication; production federation is not claimed.
| Market discovery | Worker `/v1/discovery/markets` | `BOUNDED` | Recent DreamDEX indexer sample; not a canonical global index | Agents can discover a bounded recent market sample, then verify detail by marketId. |
| Circuit discovery | Worker `/v1/discovery/circuits` | `BOUNDED` | Explicit verified hero/supporting references; not global | Agents can find the submitted V2 hero and V1 continuity proof without guessing IDs. |
| Forecast submission | `workers/prior-agent-readonly/src/hosted-write.ts`; focused tests; deployed Worker boundary probe | `HOSTED_PASS` | Client signs exact Shannon `commitForecast`; Worker validates and relays without custody; no valid live Forecast broadcast/readback performed in this milestone | Hosted client-signed Forecast relay is deployed and boundary-verified; live onchain submission remains unproven. |
| Economic execution | Worker capability response and live hero | `DISABLED` / `NOT_CLAIMED` | No autonomous trading | No hosted economic execution is exposed or claimed.
| Durable multi-agent state | Worker has no bindings | `NONE` | No D1/DO/session store | Durable multi-agent production operation is deferred.

## Participation + Create & Run follow-on

| Claim | Evidence | Class | Limitation | Submission-safe wording |
|---|---|---|---|---|
| Public participation entry exists | `apps/web/app/participate` and `docs/PARTICIPATION_MODEL.md` | `LOCAL_INTEGRATED` | Public card is an application template, not a shared canonical Circuit | The human UI maps each participant to a separate V2 Circuit instance because V2 fixes one forecaster per Circuit. |
| Create & Run guided flow exists | `apps/web/app/create`, `apps/web/app/circuits/CreateCircuitWizard.tsx` | `LOCAL_INTEGRATED` | UI write choreography is not a fresh external receipt | PRIOR provides a seven-step forecast-only intent flow with explicit authority, review, and receipt/readback gates. |
| Forecast commit and binding remain non-custodial | `apps/web/app/live/LiveWorkspace.tsx`, existing hosted write boundary | `LOCAL_INTEGRATED` | New participant-specific live write/readback not exercised here | The client signs; relays do not hold participant keys or grant economic authority. |
| Full participant lifecycle | flow docs and local browser checks | `NOT_PROVEN` | No fresh participant create, resolution, finalization, or return evidence | Do not claim the public lifecycle is externally verified until receipts and canonical reads are recorded. |

## Non-claims

- Forecasting competence from one or a few trials.
- Production autonomous trading.
- Production signer custody or custodial Forecast relay.
- Complete DreamDEX market/Circuit indexing.
- Fully trustless enforcement of every application-level policy outside the verified Circuit/action boundary.
- Durable multi-agent production networking.
- Production identity federation.
- A hosted MCP write surface.
