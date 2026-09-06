# PRIOR Completion Goal

**Goal:** finish Prior end-to-end on Somnia Shannon to the strongest evidence level permitted by live infrastructure.

## Acceptance target

- M0 write gate: operator grant, collateral allowance, tiny IOC `placeBinaryOrderFor`, owner-scoped order evidence, `userData`, revocation rejection.
- M1: deploy and verify RFT/Circuit/Executor/Adapter contracts.
- M2: Runner reconciliation and retry/idempotency proof.
- M3: one unchanged Circuit intent across at least two consecutive real DreamDEX Event Contracts.
- Unified Prior UI, responsive behavior, evidence ledger, demo materials, and final review.

## Active test identity

- Owner/deployer candidate: `0x804c7A511D3ea06651007032F1e009d8717dbCB0`
- Secret file: `/home/ubuntu/.config/prior/owner-shannon-3.env`
- Network: Somnia Shannon `50312`
- Mainnet use: forbidden

## Governance

Every live write requires an explicit bounded authorization packet with exact transaction count, spend ceiling, route, contract scope, stop conditions, expiry, and approval reference. Read-only discovery and fee estimation happen first. No private key is committed or printed.
