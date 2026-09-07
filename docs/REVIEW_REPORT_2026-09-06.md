# Review Stack Report — 2026-09-06

Scope: Prior continuity milestone. Reviews were independent, read-only, and ran against the pre-final working tree at `5a3814481`; subsequent fixes in this pass are listed separately. Browser automation was unavailable because the Chromium harness could not attach.

| Review | Verdict | Counts reported | Main findings / status |
|---|---|---|---|
| Product | FAIL | 2 BLOCKER, 3 HIGH, 2 MEDIUM, 1 LOW, 2 NOTE | Prior live commitment flow and proposal hydration were incomplete at review time; current `/live` now reads live indexer rows, but commit hydration remains open. |
| Protocol | REJECT_PENDING_FIXES | 0 critical, 5 HIGH, 2 MEDIUM, 1 LOW | Review identified lifecycle/authority/evidence gaps; Market #1 and the new Circuit evidence were subsequently expanded. |
| Security | FAIL | counts not fully preserved in transcript | Identified live autonomous gate, weak deployed `advance` authority, and spend/policy enforcement risks. Source now restricts `advance` to owner; deployed continuity Circuit still predates that hardening. |
| Implementation | CHANGES_REQUESTED | 0 critical, 4 HIGH, 3 MEDIUM, 1 LOW | Identified unit/documentation/recovery issues; spend units and docs were corrected, runner recovery was exercised again. |
| Evidence | CONDITIONAL_FAIL | counts not fully preserved in transcript | Requested stronger process-level restart evidence and temporal consistency; actual kill/restart plus chain-derived checkpoint readback is now captured. |
| Circuit | REJECT_FOR_CIRCUIT_MILESTONE | counts not fully preserved in transcript | Review correctly rejected the earlier one-window claim; the new four-window Circuit now has two distinct market iterations, both explicit abstentions. |
| Runner | CONDITIONAL_FAIL | 0 BLOCKER, 3 HIGH, 3 MEDIUM, 0 LOW, 5 passes | Full transaction orchestration remains incomplete; live discovery, effective status, checkpoint reload, and two-iteration restart proof pass. |
| Design | FAIL_PENDING_REVIEW | 0 critical, 5 major, 4 moderate, 1 minor, 3 accepted | Frozen geometry/mobile sections remain incomplete; live proposal hydration and browser interaction remain open. |
| Visual Language | FAIL | 0 blocker, 5 major, 4 minor, 5 compliant | Frozen visual-language deviations remain; no redesign was attempted in this milestone. |
| Motion | BLOCK | 2 feel-breaking, 2 timing, 3 cohesion, 2 accessibility findings | Motion choreography is largely unimplemented; no motion rework was attempted before continuity closeout. |

## Current disposition

- No review lane established a clean ACCEPT verdict.
- No unresolved review finding was hidden.
- Autonomous execution remains `BLOCKED_EXTERNAL` by DreamDEX `OnlyApprovedContracts()`.
- Continuity evidence is now valid for two real BTC 5m markets with committed and scored RFTs and explicit abstention decisions; no economic execution occurred.
- Guided proposal source fixes are now verified: raw maximum spend uses `priceRaw × quantityRaw / unitScaleRaw`, quantity and policy spend are bound, and all material signed fields are compared. Core suite: 46 tests passing.
- Contract-level criticals remain open: `CircuitExecutor.execute` lacks a configured caller boundary and does not enforce exact onchain spend/policy constraints. No autonomous deployment claim is made.

## M4.3.1 security review boundary

Review target: local `CircuitRegistryV2` / `CircuitExecutorV2` source and the
Foundry adversarial matrix. This is a source/test review, not a live deployment
or production security approval.

Verified in the V2 tests:

- owner-only binding and advancement;
- immutable configured RFT dependency;
- canonical stored trial/iteration relationship;
- COMMITTED-only binding using RFT-read `marketId` and `forecaster`;
- same RFT reuse by distinct legitimate Circuits without mutating RFT state;
- exactly-once `processedMarket` for bound and missed iterations;
- bitmap 0/UP/DOWN action rejection before market/operator/allowance reads,
  reservation, or pool calls, with owner/arbitrary/intended-caller coverage;
- unchanged RFT commit, identity, immutability, scoring, and VOIDED terminal
  regressions.

Historical claim boundary:

- V1 remains unchanged and its continuity evidence is limited to one unchanged
  intent advanced alongside two real BTC 5m markets, one attributable RFT per
  market, and Runner-level duplicate prevention.
- V1 evidence does not prove deployed cryptographic Circuit-to-RFT binding or
  contract-level duplicate-iteration prevention.
- V2 local tests do not upgrade V1 evidence and do not prove live V2 behavior.

Open security gates remain intentionally in scope as limitations: V2 has no
configured execution-caller allowlist, exact executable-price/margin
validation is not added, DreamDEX `OnlyApprovedContracts()` admission remains
externally blocked, and V2 is not deployed. Verdict: `MOCK_VERIFIED /
LIVE SECURITY GATE OPEN`.
