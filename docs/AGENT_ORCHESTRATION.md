# Agent Orchestration

## Roles

### 1. Explorer

Purpose: establish external truth.

May:

- read primary docs;
- inspect package exports;
- execute read-only/live test scripts;
- produce evidence.

Must not:

- redesign product;
- claim unverified integration.

### 2. Implementer

Purpose: implement one bounded milestone.

Reads established evidence first.

May change only the milestone slice plus necessary tests/docs.

### 3. Reviewer

Purpose: adversarially compare implementation against canonical truth.

Should not be the same reasoning pass that authored the implementation when independent review is possible.

### 4. Evidence Executor

Purpose: run exact test/demo commands and classify evidence.

Does not “fix” code while collecting evidence. Failures are reported first.

## Workflow

```text
Explorer
  ↓ external truth
Implementer
  ↓ bounded code
Reviewer
  ↓ findings
Implementer
  ↓ fixes
Evidence Executor
  ↓ proof bundle
Canonical State update
```

## Parallelism

Safe parallel work:

- design implementation vs contract unit tests after specs are frozen;
- frontend read-only views vs scoring library;
- independent review vs docs audit.

Unsafe parallel work:

- two agents changing protocol storage/state machine;
- one agent inventing ABI while another implements against it;
- frontend pretending an unverified backend/API already exists.

## Stop conditions

Stop the milestone if:

- an invariant cannot be preserved;
- external ABI differs materially from spec;
- a live write unexpectedly reverts;
- decimals/tick/lot normalization is uncertain;
- a result is only mock-backed but the milestone requires live evidence.
