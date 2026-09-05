# Test Specification

## Evidence classes

Every test/evidence result is classified:

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

Mocks are never promoted to live claims.

# Unit — scoring

Test exact integer parity between Solidity and TypeScript:

- 0% / Down.
- 100% / Up.
- 100% / Down.
- 50% / either outcome.
- 72% / Up.
- 72% / Down.
- randomized/property vectors.

# Contract — commitment

Must cover:

- probability > 10000 reverts;
- missing market reverts;
- non-Trading market reverts;
- too-near-expiry reverts;
- Trading market succeeds;
- duplicate forecaster × market reverts;
- stored forecast cannot mutate;
- same market can accept different forecasters.

# Contract — reference

- bid+ask valid → reference valid;
- missing bid → invalid reference;
- missing ask → invalid reference;
- invalid crossed/corrupt normalized book → invalid/revert according to adapter rule;
- normalization across testnet decimals;
- browser-supplied fake reference is impossible.

# Contract — finalization

- Trading → revert.
- Locked → revert.
- Resolved Up → score.
- Resolved Down → score.
- Voided → `VOIDED`.
- terminal trial cannot finalize twice.

# Mock DreamDEX

Implement controllable mocks for:

- status;
- expiry;
- outcome;
- pool;
- top-of-book;
- void.

Mocks exist for deterministic protocol tests only.

# Fork

Use Somnia fork tests to verify:

- deployed DreamDEX core addresses;
- ABI compatibility;
- registry/module reads;
- pool reads.

Fork tests are not substitutes for live rolling-market tests.

# Shannon M0 read tests

Prove and save artifacts for:

1. SDK version.
2. market discovery.
3. one market's identity/status/expiry/pool.
4. top-of-book via SDK.
5. top-of-book via onchain read if adapter requires it.
6. one recently finalized market's outcome/void state.

# Shannon write tests

Small controlled values only.

1. deploy RFT.
2. commit forecast.
3. verify successful receipt.
4. read persisted trial.
5. optional tiny IOC DreamDEX order.
6. verify `userData`/trade tag if supported.
7. after DreamDEX terminal state, finalize.
8. independently recompute scores.
9. assert exact equality.

# End-to-end artifact

Produce machine-readable evidence:

```json
{
  "network": "shannon",
  "chainId": 50312,
  "sdkVersion": "...",
  "rftContract": "0x...",
  "trialId": "0x...",
  "marketId": "0x...",
  "commitTx": "0x...",
  "commitBlock": 0,
  "forecastBps": 7200,
  "referenceBps": 6100,
  "referenceValid": true,
  "dreamdexOutcome": "UP",
  "rftOutcome": "UP",
  "forecastBrier": 7840000,
  "marketBrier": 15210000,
  "finalizeTx": "0x..."
}
```

# Frontend E2E

Playwright:

- disconnected state;
- connect;
- market loading;
- live Trading market;
- forecast input;
- commit wallet rejection;
- commit chain success;
- immutable committed UI;
- optional trade flow;
- abstain flow;
- Locked waiting state;
- Resolved finalizable state;
- Void finalizable state;
- final score display;
- refresh trial page reconstructs from external state.

# Circuit deterministic tests

## Policy

- below threshold → abstain;
- above threshold Up → Buy Up;
- above threshold Down → Buy Down;
- missing market reference → abstain;
- budget exhausted → stop/no execution;
- max consecutive losses reached → pause;
- revoked/expired → no action.

## Authority

- request > per-market max rejected;
- cumulative request > total budget rejected;
- wrong market class rejected;
- disallowed action rejected;
- duplicate market execution rejected;
- post-revocation action rejected.

## Continuity

- market 1 RFT finalizes;
- Circuit advances without intent mutation;
- market 2 uses same Circuit config;
- missed market preserved.

# Runner recovery tests

1. start active Circuit;
2. process Forecast;
3. kill Runner before execution receipt handling;
4. restart with empty memory;
5. reconcile receipt;
6. ensure no duplicate order;
7. continue to next market.

Repeat with Runner death:

```text
before Forecast relay
after Forecast commit
after execution submit
after market resolution
before RFT finalize
```

# Live Shannon Circuit evidence

Minimum target:

```text
one unchanged Circuit intent
+
two consecutive eligible live markets
+
two canonical RFTs
+
policy decisions
+
at least one execution or explicit abstention
+
successful Runner continuation/reconciliation
```

Four consecutive windows is preferred if testnet conditions permit.

# M0 binary authority tests

Against a live Shannon Event Contract pool:

1. extract exact `placeBinaryOrderFor` ABI/signature/selector from pinned SDK;
2. verify generic `placeOrderFor` is not used;
3. deploy minimal test CircuitExecutor/operator;
4. owner grants per-pool binary placement permission;
5. `isOperatorAuthorized` returns true for exact selector;
6. establish collateral allowance;
7. place tiny binary IOC through operator;
8. verify order owner is the Circuit owner;
9. verify `userData` tradeTag;
10. verify funds/positions accrue to owner;
11. revoke operator permission;
12. prove subsequent operator placement is rejected.

## Execution policy tests

- Forecast 72%, margin 8% → Up limit 64%.
- order at 63% permitted.
- order at 65% forbidden/no fill.
- Down calculation uses `1 - p`.
- worst-case spend cannot exceed maxPerMarket.
- cumulative reserved spend cannot exceed totalBudget.
- midpoint difference alone cannot authorize an order beyond derived limit.
