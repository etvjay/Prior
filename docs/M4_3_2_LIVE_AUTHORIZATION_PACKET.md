# M4.3.2 Live External Forecaster Packet — BLOCKED

Status: `BLOCKED`

No funding, deployment, live Forecast, or Shannon write has occurred.

## 1. Signer implementation

- commit: `1e62280663f1eec5db5e089921704b49444b0b6a`
- live-mode correction: local uncommitted correction is verified in the current
  checkout; fixture submissions are rejected with `LIVE_REQUIRES_EIP712`
- live scheme: `EIP712_FORECAST_V2`
- fixture scheme: `FIXTURE_KECCAK_V1`, fixture-only
- domain: `PRIOR Forecast`, version `2`, chain `50312`
- verifyingContract: `0x5b1B51cB062B7B782c9EC2Bd5674eFAdb5308F41`
- expected Forecaster: `0x4EbF775fb6397C1a191614CDCd0E117e04B24AB5`
- test-vector EIP-712 digest:
  `0x94ddeefda97911b9d18904c3b11f66a50effd7db4e80e23a84a6d70520bd65ec`
- protocol/agent/server tests: `6 + 5 + 7` passed
- core tests: `67` passed
- typechecks: passed

Authentication classification: `REAL_CRYPTOGRAPHIC_CAPABLE / OFFCHAIN`
Forecast strategy classification: `INTEGRATION_FIXTURE / QUALITY_NOT_CLAIMED`

## 2. Fresh market discovery

Fresh direct scan:

- read block: `481936750`
- read timestamp: `1788766841`
- chain ID: `50312`
- RPC: `https://dream-rpc.somnia.network`

New future markets with substantial headroom were `BOTNAV`, 4-hour markets:

- `0x...15bcf`, expiry `1788780375`
- `0x...15bd0`, expiry `1788780386`
- `0x...15bd1`, expiry `1788780398`

They are not BTC and are excluded by the live proof target.

The only preferred BTC 1-hour candidate visible in the latest indexer snapshot
was:

- marketId: `0x0000000000000000000000000000000000000000000000000000000000015b8f`
- BTC, interval `3600`
- expiry `1788768000`
- status `Trading` at the earlier read

This candidate is explicitly historical/preflight only and must not be reused.

No fresh BTC 1-hour or BTC 4-hour candidate with verified ≥900-second
headroom is currently available. BTC 5-minute candidates are not being used.

## 3. Deployment plan, not authorized

Existing RFT V1 dependency:

`0x5b1B51cB062B7B782c9EC2Bd5674eFAdb5308F41`

Planned new contracts:

- `CircuitRegistryV2(rftRegistryV1)`
- `CircuitExecutorV2(registryV2, binaryModule, operatorRegistry)` only for
  live zero-action rejection evidence

Owner nonce read: `0`.

Predicted addresses if no intervening owner transaction occurs:

- Registry V2: `0x1eD3B2310F369977ef82569498d5F678f8B73104`
- Executor V2: `0x6e6Bf80Dc412f4DFCb59C15494C83785d54fb66d`

These predictions expire if the nonce changes. No deployment has occurred.

## 4. Provisional intent

The next fresh BTC candidate must determine the exact timing and market class.
The invariant policy is:

```text
owner: disposable owner only
forecaster: 0x4EbF775fb6397C1a191614CDCd0E117e04B24AB5
targetWindows: 1
totalBudget: 1
maxPerMarket: 1
allowedActionsBitmap: 0
execution authority: NONE
capital authority: NONE
economic spend: ZERO
```

The two numeric budget values are schema-required inert placeholders. They are
not usable capital authority.

## 5. Conditional transaction sequence

Not authorized and not executable from this packet:

1. deploy `CircuitRegistryV2`;
2. deploy `CircuitExecutorV2`;
3. owner `create(Intent)`;
4. owner `authorize(circuitId)`;
5. owner `activate(circuitId)`;
6. external agent receives a fresh BTC ForecastRequest;
7. Forecaster signs EIP-712 submission;
8. server recovers and verifies the Forecaster address;
9. Forecaster calls V1 `commitForecast(...)`;
10. read receipt and canonical `trialId`;
11. owner calls V2 `bindTrial(circuitId, marketId, trialId)`;
12. read `CircuitTrialBound` and `getIteration(...)`;
13. record application policy decision;
14. simulate `BUY_UP` and `BUY_DOWN`, both expected to revert
    `ActionNotAllowed`;
15. owner advances exactly once;
16. simulate duplicate advancement, expected to revert.

No collateral approval, operator permission, DreamDEX order, or trade is
permitted.

## 6. Gas and funding

Previously measured deployment estimates, tied to the old excluded candidate,
are not carried forward as a live authorization:

- Registry V2 deployment: `33703803` gas
- Executor V2 deployment: `13054470` gas
- gas price at prior read: `6 gwei`

Current packet funding ceiling:

```text
owner: NOT ISSUED
Forecaster: NOT ISSUED
total: 0 STT authorized
collateral: ZERO
```

Fresh calldata, timing, fee, and gas estimates must be regenerated after a
fresh eligible BTC market is observed.

## 7. Single blocker

`BLOCKED_NO_FRESH_SAFE_BTC_MARKET`

The signer gates pass. The old BTC 1-hour candidate is excluded. New safe
markets currently observed are BOTNAV rather than BTC. No alternative market
or cadence is being substituted.

## 8. Final classification

- signer implementation: `PASS`
- fixture regression: `PASS`
- live-mode fixture rejection: `PASS`
- fresh safe BTC market: `BLOCKED_EXTERNAL`
- contracts deployed: `NOT_DEPLOYED`
- funding: `NOT_REQUESTED`
- broadcast: `NOT_AUTHORIZED`
- M4.3.2: `BLOCKED`
