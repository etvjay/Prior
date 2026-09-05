# Security Review Skill

## Scope

RFT v0.1 should remain low-authority and non-custodial. Security review focuses on preserving that boundary.

## Review

### Contract

- reentrancy exposure;
- external calls during commit/finalize;
- malicious/reverting DreamDEX reads;
- storage collision/upgradeability if introduced;
- overflow/underflow;
- duplicate commits;
- finalization replay;
- denial through malformed external data.

### Trading integration

- RFT must not gain allowances/custody;
- trade amount/price visibly confirmed;
- live Trading status checked;
- exact tick/lot normalization;
- IOC behavior understood;
- failed/reverted transactions surfaced;
- no unrestricted private key in backend.

### Agent interfaces

If any agent execution exists:

- signer external/scoped;
- amount limits;
- market allowlist;
- action allowlist;
- revocation;
- receipts;
- no MCP/server master key.

### Frontend

- chain ID validation;
- address validation;
- no trusting query params for canonical evidence;
- no XSS from market labels/metadata;
- environment secret hygiene.

## Fail conditions

- server-held unrestricted trading key;
- RFT custody added without explicit redesign;
- user input can set outcome/reference truth;
- transaction failure can render as success.

### Circuit authority

- total budget enforced independently of Runner;
- per-market max enforced;
- market class/action scope enforced;
- expiry/revocation enforced;
- duplicate execution key enforced;
- stop conditions enforced;
- signed Forecast cannot be replayed across Circuit/market;
- Runner cannot upgrade its own authority.

### DreamDEX operator boundary

- CircuitExecutor, not Runner, is target approved operator;
- binary placement selector is exact and verified;
- approvals to recycled pools do not bypass marketId/Circuit checks;
- token allowances are distinguished from operator approvals;
- no new pool is silently approved by Runner;
- execution limit price cannot be widened beyond Circuit rule.
