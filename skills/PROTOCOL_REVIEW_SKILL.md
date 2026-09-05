# Protocol Review Skill

## Objective

Falsify RFT protocol correctness before accepting implementation.

## Review dimensions

### Authority

- Who can create a trial?
- Who can mutate it?
- Who can finalize?
- Can anyone set/forge outcome?
- Is any privileged backend/admin introduced?

### Identity

- Is `marketId` canonical?
- Can pool recycling corrupt identity?
- Can trial IDs collide across chains/contracts/users?

### Time

- Is commitment provably before resolution?
- Is expiry/lead time sourced correctly?
- Are late commitments rejected?

### Market reference

- Is it captured from authoritative chain state?
- What happens with no bid/ask?
- Can frontend data overwrite it?
- Are decimals/ticks normalized?

### Resolution

- Is DreamDEX terminal state the only outcome source?
- Is Void handled separately?

### Scoring

- exact integer math;
- overflow bounds;
- deterministic parity;
- market differential not mislabeled.

### Custody

- does RFT hold tokens or approve third-party spending?
- has optional trade execution leaked into registry authority?

### Finality

- terminal state immutable;
- double-finalization prevented;
- reorg/reconciliation implications documented for production.

## Output

Every finding must cite:

```text
invariant
code location
failure scenario
severity
minimal fix
test required
```
