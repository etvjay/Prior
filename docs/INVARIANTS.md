# RFT Invariants

Each invariant must have tests and, where applicable, live evidence.

## Protocol invariants

### INV-001 — Forecast precedes resolution
A valid trial can only be committed while the referenced DreamDEX market is live Trading and before the configured lead-time boundary.

### INV-002 — Forecast immutability
After commitment, `pUpBps`, `marketId`, `forecaster`, `committedAt`, and `committedBlock` cannot be mutated.

### INV-003 — One canonical v0.1 forecast
A forecaster cannot create a second canonical forecast for the same `marketId`.

### INV-004 — DreamDEX owns outcome
No RFT caller/admin/backend can directly set Up/Down outcome.

### INV-005 — Void is not scored
A DreamDEX-voided market creates an RFT `VOIDED` terminal state and no probabilistic forecast score.

### INV-006 — Market identity
Durable DreamDEX binding uses `marketId`, never a recycled pool address.

### INV-007 — Reference state is evidence, not input authority
The user/browser cannot provide an authoritative market-reference probability when an onchain reference can be obtained.

### INV-008 — Missing reference does not falsify evidence
Failure to obtain a valid reference market probability must be represented explicitly as unavailable; it must never be replaced with an invented/default probability.

### INV-009 — Trading is optional
A trial remains valid without a DreamDEX order.

### INV-010 — RFT is non-custodial
RFT contracts do not hold or route user trading capital.

### INV-011 — Forecast score and PnL are distinct
Protocol/state/UI must not collapse forecast score and economic return into one metric.

### INV-012 — Market disagreement is not edge
`p - q` is a probability differential. “Edge” is not claimed solely from disagreement.

### INV-013 — Deterministic scoring
Independent implementations given canonical inputs produce identical integer scores.

### INV-014 — Terminal finality
A `SCORED` or `VOIDED` trial cannot return to an earlier state.

### INV-015 — No frontend truth
Frontend state cannot override chain-confirmed transaction failure, market status, outcome, or persisted trial data.

## Product invariants

### PINV-001 — Trial first
The primary interaction is a live/resolved trial, not a portfolio/dashboard.

### PINV-002 — Belief and market are visually distinct
The UI always labels user forecast separately from market-implied reference.

### PINV-003 — Evidence is drillable
Aggregates must link to underlying trials.

### PINV-004 — Capability is scoped
Any aggregate performance view must state market class, horizon and sample size.

### PINV-005 — Every action exposes state
Commit/trade/finalize controls visibly represent wallet pending, chain pending, success and failure.

## Implementation invariants

### IINV-001 — No invented external ABI
DreamDEX ABI and SDK behavior must be verified against current primary docs/package/live reads.

### IINV-002 — Exact dependency pinning
The verified `@somnia-chain/markets-sdk` version is pinned exactly for the hackathon build.

### IINV-003 — Onchain status before writes
Every DreamDEX write gates on current onchain market status, not stale indexed state.

### IINV-004 — Integer financial/probability math
No JS floating-point value becomes canonical protocol state or raw trade pricing without explicit normalization.

### IINV-005 — Mocks never count as live proof
Mock/fork/live evidence classifications remain separate.

### CINV-016 — Runner is not DreamDEX operator
Target architecture grants DreamDEX trading authority to the bounded CircuitExecutor contract, not the Runner account.

### CINV-017 — Binary placement path
Circuit execution against Event Contracts uses the verified specialized BinaryPool placement path; generic spot placement is forbidden.

### CINV-018 — Execution threshold uses executable value
A Circuit must not treat midpoint disagreement alone as sufficient trade authorization.

### CINV-019 — Limit price is protocol-enforced
The economic action cannot execute at a price worse than the Circuit-derived maximum acceptable price.

### CINV-020 — Collateral allowance is separate authority
DreamDEX operator approval and ERC-20 pool allowance are tracked separately; missing either cannot be silently bypassed.
