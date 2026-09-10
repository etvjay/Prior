# Agent integration surface

Requirement: expose the existing offchain Forecast Provider boundary and canonical read state through one application-service boundary, without adding custody or arbitrary execution.

Implementation: `packages/agent-integration/src/service.ts` is the shared boundary. HTTP, `PriorClient`, and `PriorMcpCore` delegate to it. It uses `ForecastProviderWorkflow` and the existing protocol DTOs. Forecast submissions remain signed/provider-scoped and are explicitly offchain (`chainCommitment: NOT_SUBMITTED`).

Touched invariants: forecast identity and immutability, `marketId` canonical identity, scoped capability separation, no execution authority, deterministic replay behavior, and bounded reads.

Evidence: local unit/transport tests only. This package does not claim live RPC, onchain commitment, production hosting, or production MCP transport. No MCP SDK dependency is present; `PriorMcpCore` is the transport-agnostic adapter boundary. The local package currently supports the existing fixture signature path; the existing provider-server package remains the production-shaped EIP-712 boundary.
