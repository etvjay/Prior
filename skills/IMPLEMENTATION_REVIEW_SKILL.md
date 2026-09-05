# Implementation Review Skill

## Objective

Check whether code actually implements the canonical spec against real dependencies.

## Checklist

- exact SDK version pinned;
- no invented SDK method names;
- no hand-copied stale DreamDEX ABI when package ABI exists;
- live onchain market status checked before writes;
- `marketId` used for durable identity;
- testnet/mainnet decimal assumptions separated;
- probability and raw trade math uses integers/bigints;
- transaction success derived from successful receipts;
- wallet rejection and onchain revert are separate failures;
- external data errors are explicit;
- no hidden fake/demo data in production path;
- mock adapters cannot accidentally ship as live adapters;
- environment variables documented;
- retry behavior does not double-submit writes;
- UI can reconstruct state after refresh.

## Red flags

Fail review for:

- TODO-backed critical behavior presented as implemented;
- hardcoded live market/pool;
- fake resolution;
- frontend-generated score without parity test;
- silent catch of reverted trade/commit;
- defaulting missing reference probability to 50%;
- mutable committed forecast.
