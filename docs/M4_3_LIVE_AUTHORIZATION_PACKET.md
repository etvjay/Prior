# M4.3-LIVE Authorization Packet — BLOCKED_EXTERNAL

Status: `BLOCKED_EXTERNAL / NOT READY FOR BROADCAST`

This is a pre-write authorization record. It is not approval to broadcast. No
transaction has been sent.

## 1. Network

- Network: Somnia Shannon testnet
- Chain ID: `50312`
- RPC: `https://dream-rpc.somnia.network`
- Latest direct-read block: `481611197`
- Latest direct-read timestamp: `1788734278`

## 2. Candidate market read

Candidate read directly from the pinned binary-module ABI and market contract:

- marketId: `0x00000000000000000000000000000000000000000000000000000000000156a1`
- asset: `BTC` (targeted indexer read; primary module binding does not expose asset text)
- intervalSec: `300` (targeted indexer read)
- market address: `0xfd903B60691191DA181d85130E3C56C75635eaF3`
- pool: `0xD5beD053Ffd61FeB27ad515Afa527FA73A96d5D6`
- tradingStart: `1788734100`
- expiresAt: `1788734400`
- direct onchain status: `1` (`Trading`)
- indexer status at targeted read: `Trading`
- creation block: `481609411`
- indexed lastPrice: `569000` raw units
- direct raw asks: `912000 @ 200000000`, `916000 @ 330000000`, `924000 @ 460000000`
- direct raw bids: `890000 @ 200000000`, `877000 @ 330000000`, `874000 @ 460000000`
- canonical market reference: unavailable; raw book is preserved without converting it into a guessed reference

Stop condition: at the latest direct read, only `122` seconds remained before
expiry. This is insufficient for external-process receipt, real signing,
HTTP submission, PRIOR validation, gas estimation, broadcast, and receipt
readback. This candidate is rejected and will not be used.

The earlier long-lived candidate `0x...15529` was BTC/14400 seconds and did
not match the continuity Circuit's market scope. It is not a substitute.

## 3. Existing Circuit reuse decision

Existing continuity Circuit:

`0x15e18e2aecb7d00ca3243181fb2fa38af81b021266e2d0a290eb0c55d2b5f4c1`

Fresh direct read:

- status: `2` (`ACTIVE`)
- completed: `2`
- abstained: `2`
- reservedSpend: `0`
- owner: `0x804c7A511D3ea06651007032F1e009d8717dbCB0`
- immutable forecaster: `0x804c7A511D3ea06651007032F1e009d8717dbCB0`
- expiresAt: `1788764074`
- targetWindows: `4`
- marketClass: `1`

Decision: **cannot reuse**.

Reasons:

1. `CircuitRegistry.Intent.forecaster` is stored in the immutable intent and
   has no setter.
2. The new disposable agent address is not the stored forecaster.
3. The candidate's 5-minute market must not be silently treated as an
   already-authorized agent iteration.
4. `RFTRegistry.commitForecast` authenticates `msg.sender` as the Forecast
   address but accepts no `circuitId`; current deployed contracts therefore do
   not create a direct onchain Circuit-to-Forecast binding.
5. `CircuitExecutor` reads the Circuit intent but its deployed path does not
   establish the requested external-agent Forecast consumption relationship.

Minimum new Circuit if the live gate is reopened:

- one forecast-focused Circuit owned by the existing owner;
- `forecaster` set to the disposable agent address;
- `targetWindows = 1`;
- `allowedActionsBitmap = 0` is the intended policy value, but the deployed
  `CircuitExecutor.execute` currently reads and discards this field. Therefore
  zero-action placeholders are **not provably inert** at the contract layer;
  execution would require a separate fail-closed fix before this can be called
  execution-isolated.
- exact `startsAt`, `expiresAt`, and market class must be selected only after a
  fresh candidate read and owner approval.

Because the current owner key is unavailable, this new Circuit cannot be
created in this run.

## 4. Disposable Forecaster

- agentId: `0x1111111111111111111111111111111111111111111111111111111111111111`
- forecastAddress: `0x4EbF775fb6397C1a191614CDCd0E117e04B24AB5`
- sourceType: `AGENT`
- sourceVersion: `INTEGRATION_FIXTURE/v1`
- private key: generated locally at `/tmp/prior-m43-live-forecaster.key`, mode
  `0600`; never included in this document or logs

This identity is disposable and has not been funded or used onchain.

## 5. Authority

- FORECAST AUTHORITY: intended `YES`, only after a new owner-approved Circuit
  and matching AgentBinding exist
- EXECUTION AUTHORITY: `NO`
- CAPITAL AUTHORITY: `NONE`
- economic spend ceiling: `ZERO`
- DreamDEX trading: excluded

## 6. Required transactions if separately approved

No transaction is currently authorized. The exact candidate, timestamps,
owner signature, and gas estimates must be refreshed before any packet can be
executed.

Conditional transaction sequence for the minimum path:

1. `CircuitRegistry.create(Intent)`
   - caller: current Circuit owner
   - contract: `0xf92609D45f164DaB74dC51Cd59B583DA95e3C460`
   - expected transition: no Circuit -> DRAFT
   - reversible: no in-place deletion; owner may revoke later
   - unknown until refresh: exact `startsAt`, `expiresAt`, generated `circuitId`

2. `CircuitRegistry.authorize(bytes32 circuitId)`
   - caller: same owner
   - expected transition: DRAFT -> AUTHORIZED
   - reversible: not by downgrade; owner can revoke

3. `CircuitRegistry.activate(bytes32 circuitId)`
   - caller: same owner
   - expected transition: AUTHORIZED -> ACTIVE
   - reversible: owner can pause/revoke

4. `RFTRegistry.commitForecast(bytes32 marketId, uint16 pUpBps,
   uint16 referenceUpBps, bool referenceValid, uint64 tradeTag,
   uint8 actionIntent)`
   - caller: disposable Forecaster address
   - contract: `0x5b1B51cB062B7B782c9EC2Bd5674eFAdb5308F41`
   - expected transition: no trial -> COMMITTED
   - economic value: zero; no collateral or token approval
   - reversible: no; commitment is immutable once confirmed
   - circuitId: not accepted by this deployed function; this is a known
     protocol-boundary limitation, not a value to be smuggled into another
     argument

The current packet cannot provide executable calldata because the candidate
market is rejected for expiry proximity and the owner authorization key is
absent. No unknown transaction may be added during execution.

## 7. Funding ceiling

- native-token spend ceiling: `TBD / BLOCKED`
- economic collateral ceiling: `0`
- token approval: forbidden and unnecessary

A numeric native-token ceiling cannot be honestly fixed before a viable market,
exact transaction calldata, and fresh fee estimates exist. No funding request
or broadcast is made by this packet.

## 8. Stop conditions

Abort if any occurs:

- market is not `Trading`;
- less than the full external-process and receipt-readback safety window
  remains;
- signer does not recover to the expected Forecaster address;
- AgentBinding or Circuit forecaster does not match;
- Circuit is not ACTIVE after owner activation;
- market/circuit scope or interval mismatches;
- required gas exceeds the approved gas-only ceiling;
- any collateral, token approval, execution permission, or DreamDEX order is
  requested;
- any transaction or contract argument is not listed in this packet;
- the RFT contract cannot accept the intended market binding without silently
  substituting a circuit or identity;
- receipt or independent readback is unavailable.

## 9. Expected evidence if reopened

- real agent address and recovered signature address;
- fresh live market read and raw reference evidence;
- exact Circuit create/authorize/activate receipts;
- external HTTP request and submission readback;
- exact RFT commit receipt, block, timestamp, marketId, forecaster, and trialId;
- Circuit policy result with `EXECUTION AUTHORITY = NONE`;
- unauthorized execution attempt returning `REJECTED_AUTHORITY`;
- no collateral transfer or order evidence;
- resolution/finalization fields left null until independently observed.

## 10. Current classification

- external process boundary: available from M4.3 fixture path
- fixture validation/attribution: `END_TO_END_VERIFIED` within fixture scope
- real cryptographic signer authentication: `NOT_VERIFIED`
- live market gate: `BLOCKED_EXTERNAL` (candidate too near expiry)
- pre-resolution commitment: `BLOCKED_EXTERNAL`
- Circuit consumption: `BLOCKED_EXTERNAL` and not directly bindable by current
  deployed RFT commit ABI
- execution isolation: fixture path verified; live path not exercised
- provider independence: fixture path verified
- M4.3-LIVE: **NOT COMPLETE**

No chain write has occurred.
