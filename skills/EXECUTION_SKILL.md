# Execution Skill — RFT

## Objective

Move one bounded RFT milestone from requirement to verified evidence without product drift.

## Inputs

- milestone;
- canonical docs;
- current canonical state;
- external-source evidence;
- repository state.

## Procedure

### 1. Establish scope

Write:

```text
Milestone:
Required outcome:
Non-goals:
Touched invariants:
External dependencies:
Required evidence class:
```

If the milestone cannot be expressed in those terms, it is not bounded enough.

### 2. Read canonical truth

At minimum:

```text
GROUND_TRUTH
CANONICAL_STATE
relevant spec
INVARIANTS
DECISIONS
ASSUMPTIONS
CONTRADICTIONS
```

### 3. Resolve external uncertainty before implementation

For DreamDEX/Somnia behavior:

- use current primary docs;
- inspect package/ABI;
- run minimal read-only verification;
- save evidence.

Do not compensate for uncertainty with guessed code.

### 4. Implement the smallest causal slice

Prefer:

```text
one interface
one state transition
one testable outcome
```

over broad scaffolding.

### 5. Run deterministic tests

Unit/mocks first.

No live write while deterministic behavior is failing.

### 6. Run compatibility/live evidence

Use the lowest-risk live action that proves the dependency.

### 7. Review

Invoke relevant review skills:

- protocol;
- implementation;
- security;
- design;
- evidence.

### 8. Fix only evidenced findings

Do not introduce opportunistic features during fixes.

### 9. Produce evidence

Record:

- command;
- commit SHA if available;
- network;
- transaction/block/market IDs when relevant;
- exact output;
- evidence classification.

### 10. Update canonical state

Mark exactly what changed from:

```text
unverified
→ implemented
→ verified
```

Do not skip levels.

## Failure behavior

If a required external assumption fails:

1. stop implementation of dependent slices;
2. capture evidence;
3. update `CONTRADICTIONS.md` / `ASSUMPTIONS.md`;
4. propose the smallest architecture correction;
5. re-review invariants before continuing.

## Completion gate

A milestone is complete only when:

```text
requirement satisfied
+
tests green
+
required evidence produced
+
review findings closed/accepted
+
canonical state updated
```
