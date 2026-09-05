# Evidence Review Skill

## Objective

Ensure every implementation claim has proof of the correct class.

## Evidence hierarchy

```text
DESIGN_ONLY
UNIT_VERIFIED
MOCK_VERIFIED
FORK_VERIFIED
SHANNON_READ_VERIFIED
SHANNON_WRITE_VERIFIED
END_TO_END_VERIFIED
```

Higher classes do not automatically prove unrelated properties.

## Review

For each claim ask:

1. What exact behavior is claimed?
2. What evidence would falsify it?
3. Is the provided evidence from the required environment?
4. Can another reviewer reproduce it?
5. Does it identify dependency versions/network/market/transaction?
6. Does the evidence actually show success rather than absence of an error?
7. Is any screenshot standing in for machine-verifiable output?

## Demo theatre checks

Flag:

- UI shows “resolved” from local fixture;
- screenshot without tx/market ID;
- mocked trade presented as DreamDEX execution;
- deployed contract presented as proof of adapter functionality;
- historical score computed from fabricated seed data without disclosure.

## Output

Update `EVIDENCE_LEDGER.md` only when the claim and evidence class match.
