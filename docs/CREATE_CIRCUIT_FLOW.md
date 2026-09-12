# Create Circuit Flow

## Guided flow

`/create` is a vertical human flow on mobile and a two-column control-room flow on desktop:

```text
market scope
→ run length
→ Forecast source
→ deterministic policy
→ authority
→ immutable intent review
→ create → authorize → activate
```

The judge-friendly preset is:

- market scope: BTC · 5m, market class 5;
- run length: four eligible markets;
- Forecast source: the connected person (`ME`);
- policy: Forecast-only, no economic actions, abstain when reference is unavailable;
- budget fields: bounded non-zero V2-compatible values, with no economic authority;
- owner = forecaster = connected address;
- Runner: not required for the Forecast-only preset.

## Receipt-gated writes

Every V2 write follows:

```text
DRAFT
→ explicit review approval
→ client wallet signature
→ submitted
→ receipt confirmed
→ canonical readback
→ next lifecycle step
```

Creation reads `CircuitRegistryV2.intents(circuitId)` after the create receipt and checks owner and forecaster against the connected address. Authorization and activation each wait for a successful receipt. Activation reads `CircuitRegistryV2.runtime(circuitId)` and requires the canonical status to be active before the UI reports success.

No browser state, transaction hash alone, or optimistic response is treated as canonical success.

## After activation

The user is sent to the participant-specific control room. It reuses the Live continuity read model, bounded market discovery, market alignment gate, Forecast input, canonical RFT readback, and V2 `bindTrial` receipt/readback path.

## Honest limits

The current human flow does not expose a strategy DSL, agent signer, autonomous economic execution, token approval, or new protocol primitive. Live create/authorize/activate and later resolution are environment-dependent and must be evidenced separately as `SHANNON_WRITE_VERIFIED` or `END_TO_END_VERIFIED`; the UI cannot promote them from a draft or transaction hash.
