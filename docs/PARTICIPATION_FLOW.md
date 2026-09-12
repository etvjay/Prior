# Participation Flow

## Product mapping

`/participate` discovers an application-level `PUBLIC TEMPLATE`. It does not expose a shared multi-forecaster Circuit. The current safe template is BTC five-minute Event Contracts, four eligible markets, Forecast-only, and no capital requirement.

The user flow is:

```text
/participate
→ inspect template intent
→ JOIN · CREATE MY INSTANCE
→ /create?mode=participate
→ connect Shannon wallet
→ review owner = forecaster
→ create → authorize → activate
→ /live?circuitId=…&marketId=…
→ discover and verify the current market
→ set one Forecast
→ client-sign and relay
→ wait for receipt
→ read canonical Forecast/RFT
→ bind RFT to the Circuit iteration
→ read binding back
```

## Identity and custody

The connected address is pinned as both V2 `owner` and `forecaster`. The Worker is not a signer. Forecast-only participation requests no token approval, allowance, collateral, operator permission, or capital movement.

The Live commit gate is disabled unless:

- source mode is `LIVE`;
- the selected market matches the canonical iteration;
- the market is trading;
- the connected address matches the Circuit forecaster;
- no canonical Forecast already exists; and
- the participant explicitly requests review/signing.

## Returning participants

Canonical reads, not local storage, recover a participant's Circuit, Forecast, RFT, binding, resolution, and progress. The current UI exposes the Circuit ID and opens the same Live continuity workspace after activation. A connected address that does not match the Circuit forecaster remains read-only.

## Honest limits

The public card is a template grouping. It is not a shared protocol Circuit. Public template discovery is currently a high-confidence single-template entry surface, not an exhaustive global index. Live write success and later DreamDEX resolution require a compatible deployed environment and are reported only from receipt/readback evidence.
