# Review Orchestrator Skill

## Purpose

Run the correct adversarial reviews before accepting a milestone.

## Review order

### For protocol/contract milestones

1. `PROTOCOL_REVIEW_SKILL.md`
2. `SECURITY_REVIEW_SKILL.md`
3. `IMPLEMENTATION_REVIEW_SKILL.md`
4. `EVIDENCE_REVIEW_SKILL.md`

### For frontend milestones

1. `PRODUCT_REVIEW_SKILL.md`
2. `DESIGN_REVIEW_SKILL.md`
3. `VISUAL_LANGUAGE_REVIEW_SKILL.md`
4. `MOTION_REVIEW_SKILL.md`
5. `IMPLEMENTATION_REVIEW_SKILL.md`
6. `EVIDENCE_REVIEW_SKILL.md`


1. `PRODUCT_REVIEW_SKILL.md`
2. `DESIGN_REVIEW_SKILL.md`
3. `IMPLEMENTATION_REVIEW_SKILL.md`
4. `EVIDENCE_REVIEW_SKILL.md`

### For end-to-end/demo milestones

Run all six:

```text
Product
Protocol
Security
Implementation
Design
Evidence
```

## Severity

```text
BLOCKER
HIGH
MEDIUM
LOW
NOTE
```

A milestone cannot close with unresolved `BLOCKER`.

A `HIGH` finding requires either a fix or an explicit decision record explaining why it is accepted.

## Required synthesis

Produce:

```text
Milestone:
Commit/revision:
Reviewers/skills:
Blockers:
High:
Medium:
Low:
Evidence gaps:
Scope drift:
Canonical-doc conflicts:
Verdict:
```

Verdict:

```text
ACCEPT
ACCEPT_WITH_RECORDED_DEBT
REJECT
```

## Independence rule

Where practical, the final review pass should not simply repeat the implementation agent's own reasoning. Review from canonical documents and observed behavior first, then inspect implementation.
