# PRIOR Proof Index

## Economic lifecycle

- **Claim:** Market #1 completed a losing guided economic lifecycle.
- **Evidence:** `evidence/shannon/market1-lifecycle.json`
- **Transactions:** order `0x4a33bd44512d808199a83969d30110069e18b930cf7935ac50c757fe0890e94c`; redemption `0x9af95958ae30c594cd4631b578d193487b6537c1b082f7a825becf69bcf9ec6a`; RFT finalization `0x21b5f66db37481c86cdbf4608b98a7ea15a12527d72ef3c2bf332c5509ebbbcc`.
- **Classification:** `END_TO_END_VERIFIED`.

## Circuit continuity

- **Claim:** One unchanged four-window Circuit processed two real BTC 5m Event Contracts.
- **Evidence:** `evidence/shannon/circuit-continuity-recovery.json`.
- **Circuit:** `0x15e18e2aecb7d00ca3243181fb2fa38af81b021266e2d0a290eb0c55d2b5f4c1`.
- **Markets:** `0x...14d04`, `0x...14d96`.
- **Classification:** `CIRCUIT_CONTINUITY_TWO_MARKETS_VERIFIED`; two ABSTAIN decisions, no economic execution.

## Market A / Market B RFTs

- **Claim:** Each market has one pre-resolution Forecast and one scored RFT.
- **Evidence:** same continuity artifact, `markets.marketA`, `markets.marketB`, and `trials`.
- **Market A:** DOWN; Forecast Brier `0`; market Brier `22500`; delta `+22500`; finalization `0xfe04ef056af6dcda4bee997ec8bd1cd0c9427106227222181f8c5aa119c50cb6`.
- **Market B:** UP; Forecast Brier `25000000`; market Brier `21855625`; delta `-3144375`; finalization `0x68a158b227a33be81a6fd14688a1b8eef01aac7e48907e52ea18c479c3051117`.

## Unit correctness

- **Claim:** DreamDEX fixed-point collateral accounting is reproduced.
- **Evidence:** `packages/core/test/units.test.ts`, `docs/UNITS.md`.
- **Regression:** `420000 × 1000 / 1000000 = 420`; `281000 × 1000 / 1000000 = 281`; return `139`.

## Runner recovery

- **Claim:** Restart reconstruction is duplicate-safe at PRIOR’s orchestration layer.
- **Evidence:** continuity artifact `restart`; `scripts/runner-recovery-test.ts`.
- **Classification:** local recovery harness `PASS`; live process restart evidence remains bounded by its recorded evidence limits.

## DreamDEX ground truth

- **Claim:** ABI, MarketCreated events, onchain status, and pool binding are read from Shannon.
- **Evidence:** `evidence/shannon/m0-*`, pinned SDK `0.29.0`, `docs/SOURCES.md`.

## Reviews

- **Evidence:** `docs/REVIEW_REPORT_2026-09-06.md`.
- **Status:** prior ten-lane review batch recorded; final post-UI review rerun remains required.
