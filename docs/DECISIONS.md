# Decisions

Use ADR-style entries.

## D-001 — Separate product from primitive

**Decision:** Forecast Arena is the product; RFT is the primitive.

**Reason:** Keeps downstream applications composable and prevents UI requirements from redefining protocol truth.

## D-002 — No trading custody

**Decision:** RFTRegistry never places trades or holds collateral.

**Reason:** Trading is evidence-adjacent, not the purpose of RFT. Custody adds unnecessary risk and complexity.

## D-003 — One canonical forecast per wallet/market in v0.1

**Decision:** No forecast edits or trajectories.

**Reason:** Simple immutability is easier to prove and explain.

## D-004 — No custom backend required for MVP

**Decision:** Browser + contracts + RPC + DreamDEX SDK are sufficient.

**Reason:** A backend adds mutable authority and surface area without strengthening the core proof.

## D-005 — No MCP for submission-critical path

**Decision:** MCP is post-MVP.

**Reason:** It is useful for agent interoperability only after the core trial protocol is verified.

## D-006 — Same-commit market reference is preferred

**Decision:** Attempt to obtain reference market evidence in the forecast commit transaction through a verified DreamDEX adapter.

**Reason:** Avoids trusting browser-provided reference metadata.

**Gate:** M0 must prove the required onchain read path is compatible.

## D-007 — Evidence-instrument design

**Decision:** UI is organized around one current trial and its evidence lifecycle, not exchange/dashboard density.
## D-008 — One public-facing name

**Decision:** The visible product is `Prior`.

**Reason:** Avoids presenting protocol primitives and feature layers as separate products.

## D-009 — Circuits are designed with v0.1

**Decision:** Atomic Forecasts and Circuits share one design and implementation architecture from the beginning.

**Reason:** Avoids later visual/structural drift and lets longitudinal evidence be first-class without redefining RFT.

## D-010 — Simple public language

**Decision:** Public UI uses `Forecast`, `Circuit`, `History`, and `Profile`.

**Reason:** Technical terms remain available in evidence/protocol details but should not burden normal interaction.

## D-011 — Circuit meaning restored

**Decision:** Circuit means persistent execution intent across multiple Event Contracts.

**Supersedes:** Any earlier wording that defined Circuit primarily as an ordered evidence container or belief trajectory.

**Reason:** The original execution-centric primitive is stronger. Longitudinal belief visualization remains a derived view of Circuit history.

## D-012 — Runner required for autonomous Circuits

**Decision:** Introduce an offchain Circuit Runner for liveness.

**Reason:** Contracts do not independently react to future markets. The Runner discovers/reconciles/relays, while contracts enforce limits.

## D-013 — Owner, forecaster, runner and executor are distinct roles

**Decision:** Architecture does not assume one identity performs all roles.

**Reason:** Necessary for agent forecasts, bounded delegated execution and clean authority analysis.

## D-014 — Bounded execution authority is a first-class requirement

**Decision:** Autonomous Circuits cannot rely on an unrestricted backend-held owner key.

**Reason:** The Circuit thesis requires persistent execution without turning the Runner into a master wallet custodian.

## D-015 — Prefer DreamDEX-native operator execution

**Decision:** Target `CircuitExecutor` as the DreamDEX-approved operator for Event Contract execution.

**Reason:** Keeps order ownership/funds owner-scoped while allowing the contract to enforce Circuit limits.

**Gate:** Exact `placeBinaryOrderFor` authorization path must pass Shannon verification.

## D-016 — Runner is relayer/liveness, not trading authority

**Decision:** Runner calls `CircuitExecutor`; it is not directly entrusted with owner trading authority.

**Reason:** Runner compromise remains bounded by contract policy.

## D-017 — Circuit rule uses executable price margin

**Decision:** Trade authorization is based on Forecast-implied value versus enforceable execution limit, not raw midpoint disagreement.

**Reason:** Market midpoint is evidence, not necessarily executable price.

## D-018 — Visual system frozen

**Decision:** Prior v0.1 is dark-only, black/deep-purple, gradient-free, using Geist Sans + IBM Plex Mono, Phosphor Regular icons, blue-circle Forecast nodes and amber-diamond Market nodes.

**Reason:** Removes visual ambiguity before one-shot implementation.

## D-019 — Generated design images are reference-only

**Decision:** Generated UI concepts do not override canonical design docs.

**Reason:** Several explorations contained gradients, generic dashboard patterns, unsupported markets, or outdated terminology.
