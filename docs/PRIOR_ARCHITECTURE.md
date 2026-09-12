# PRIOR Submission Architecture

```mermaid
flowchart TD
  A[Human / Agent] --> B[Forecast surface]
  B --> C[Forecast\nattributable belief]
  C --> D[RFT\nResolution and Forecast Trail]
  D --> E[Circuit\nbounded mandate]
  E --> F{Authority decision}
  F -->|allowed| G[Execution\nseparately authorized]
  F -->|denied| H[Deliberate refusal]
  G --> I[DreamDEX outcome]
  H --> I
  I --> J[RFT score / evidence]
  K[Somnia Shannon\ncanonical state] --> D
  K --> E
  K --> I
  L[Public Worker\nHTTP + MCP read transport] --> K
  M[Prior UI\nproof / RFT / Circuit views] --> J
  J --> M
```

## Core distinction

```text
belief ≠ evidence ≠ authority ≠ execution
execution ≠ outcome ≠ reputation
```

The Worker, HTTP API, MCP transport, and UI are observation/integration surfaces. They do not become authority. Shannon contracts and DreamDEX state remain canonical for the live proof.

## Current hosted boundary

- live Shannon detail reads: enabled;
- bounded market/Circuit discovery: enabled;
- HTTP and MCP reads: enabled;
- Forecast submission: disabled;
- signer custody: absent;
- economic execution: disabled;
- durable multi-agent state: absent.
