# Contradictions

Record unresolved conflicts between docs, live protocol behavior, implementation or design.

Template:

```text
## C-XXX — Title

Observed:
Expected:
Sources:
Affected invariant/spec:
Risk:
Decision required:
Status:
```

No current contradiction is canonical until verified.

If current DreamDEX/Somnia behavior conflicts with a document, implementation must not silently choose one interpretation.

## C-001 — Circuit definition drift

Observed:
Earlier design text temporarily redefined Circuit as a longitudinal container/trajectory of RFTs.

Expected:
Circuit is the original execution-centric primitive: one persistent bounded intent operating across multiple Event Contracts.

Affected:
Ground truth, product spec, design, state machine.

Resolution:
Execution-centric definition restored in v0.2. Belief trajectory retained only as a Circuit visualization.

Status:
RESOLVED / superseded by D-011.
