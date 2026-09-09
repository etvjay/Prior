# M4.3.5A Stateful fork gas estimation

## Boundary

This milestone is **FORK_SIMULATION_ONLY**. It does not broadcast, sign, fund Shannon, create a Circuit, or claim live economic evidence. The simulator forks a pinned Shannon block, checks bytecode at the deployed RFT/RegistryV2/ExecutorV2 addresses, impersonates only the exact owner and forecaster on the fork, and injects fork-only native balance.

## Phase A order

`owner create → owner authorize → owner activate → forecaster commitForecast → owner bindTrial → owner advance`

The simulator performs canonical readbacks after writes. It verifies trial identity, market identity, forecaster, COMMITTED status, CircuitIteration binding, and exactly-once advance. Binding before commit, duplicate advance, stale identity, missing code, fork failures, and missing gas price fail closed with structured reason codes.

Reference data remains optional. The ABI placeholder `referenceValid=false` and `referenceUpBps=0` are preserved and are never treated as market evidence.

BUY_UP and BUY_DOWN are simulated as expected `ActionNotAllowed` reverts with zero budget impact. Both exact actors receive fork-only native balance; live Shannon balances remain separate and untouched. Required additional funding is reported per actor, with forecaster funding derived from measured commit gas × fresh Shannon gas price × 1.25.

## Gas packet

Each write records caller, deployed target, function, exact argument envelope, estimation method, `gasUsed`, `ceil(gasUsed × 1.25)`, gas price, and cost. The authorization packet is `evidence/` output with schema `M4.3.5A.v1`. Failures are `BLOCKED_GAS_ESTIMATION_FAILED` and identify the failing phase and exact reason code.

Phase B is explicitly unresolved/post-resolution fresh-estimate-only. No Phase-B success is inferred from Phase-A simulation. Selected candidates are revalidated directly against Shannon after the fork run; status, expiry, binding, or headroom changes invalidate the candidate.

## Readiness

M4.3.5A is locally implemented and unit-verified. Fork/live output is classified `FORK_SIMULATION_ONLY`; it must not be promoted to Shannon write evidence.
