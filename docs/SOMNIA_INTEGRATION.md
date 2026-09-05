# Somnia Integration

## Role

Somnia is the execution/persistence substrate for RFT and the chain beneath DreamDEX Event Contracts.

RFT should use normal EVM tooling unless a Somnia-specific primitive creates a clear advantage.

## Initial environment

Use Somnia Shannon Testnet for the hackathon prototype.

Canonical chain/network values must be verified from current Somnia primary docs before deployment and recorded in `CANONICAL_STATE.md`.

Previously established target:

```text
Shannon chainId: 50312
```

Do not copy production endpoints into code without environment configuration.

## Required chain interfaces

### Required

- HTTPS JSON-RPC for reads/writes.
- wallet provider/signer.
- event/log queries.
- contract deployment.
- transaction receipt verification.

### Useful

- WebSocket RPC for low-latency live UI/event updates.
- block/event subscriptions.

### Not required for MVP

- Somnia Reactivity as an RFT dependency.
- a custom Somnia node.
- custom consensus integration.
- custom cross-chain messaging.

## Contract deployment

Use Foundry for:

- build;
- unit/property tests;
- fork compatibility tests;
- deployment scripts;
- contract verification where supported.

## Environment separation

```text
SHANNON
  - hackathon proof
  - tiny test collateral
  - live Event Contract integration

MAINNET
  - no requirement for v0.1 submission
```

Never reuse testnet decimal/collateral assumptions on mainnet.

## RPC trust

RPC is transport, not application truth. Contract state/events are the evidence.

For critical writes, the UI must display success only after a confirmed successful receipt.
