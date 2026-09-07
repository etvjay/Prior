# M4.3.2C V2 Deployment-Only Authorization Packet

Status: `READY_FOR_V2_INFRA_DEPLOYMENT`

This is a pre-broadcast packet. It authorizes review only, not wallet signing or broadcast.

## Scope

Exactly two native-gas deployment transactions are proposed:

1. `CircuitRegistryV2`
2. `CircuitExecutorV2`

No Circuit creation, Forecast commitment, RFT mutation, DreamDEX interaction, collateral approval, operator approval, or Forecaster funding is included.

## Network

- Network: Somnia Shannon
- Chain ID: `50312`
- RPC: `https://dream-rpc.somnia.network`
- Observed head: `481976786`
- Observed head timestamp: `1788770845`
- Source HEAD: `41e1b30edf9c4ed1c7826d8f4090260792a98f20`
- Compiler: Solidity `0.8.24`
- Foundry profile: optimizer enabled, 200 runs, via-ir, bytecode hash none, CBOR metadata disabled

## Existing dependency

RFTRegistry V1 bytecode was independently read at:

`0x5b1B51cB062B7B782c9EC2Bd5674eFAdb5308F41`

Observed code length: `4399` bytes.

## Deployment account

- Deployer/owner: `0x82Daa64CEDfA4d15615ADC6D577Dba0d9FfccF55`
- Nonce read at observed head: `0`
- Current gas price: `6000000000` wei (`6 gwei`)
- Account funding: not performed

## RegistryV2

Constructor:

```text
CircuitRegistryV2(
  rftRegistry = 0x5b1B51cB062B7B782c9EC2Bd5674eFAdb5308F41
)
```

- Predicted address: `0x1eD3B2310F369977ef82569498d5F678f8B73104`
- Nonce: `0`
- Runtime bytecode SHA-256: `e9dcb495cc7bfda36fc4919733236ab8d2a7cbd52ff98d90b3872c3c2afcef37`
- Init-code keccak256: `0x1af8dd55f8d4fb7d0f35f0fc10beac74767ef2973c0c8e5c212ffc77c5a8ccdc`
- Gas estimate: `33,703,803`

## ExecutorV2

Canonical constructor dependencies:

- RegistryV2 predicted address: `0x1eD3B2310F369977ef82569498d5F678f8B73104`
- BinaryMarketsModule: `0x3ecC694Cef705358864a646142ac17A90E29e388`
- OperatorPermissionsRegistry: `0x15C7e8CE38F021c5b45d098AaD788f63090bF20A`

Constructor:

```text
CircuitExecutorV2(
  circuits = 0x1eD3B2310F369977ef82569498d5F678f8B73104,
  binaryModule = 0x3ecC694Cef705358864a646142ac17A90E29e388,
  operatorRegistry = 0x15C7e8CE38F021c5b45d098AaD788f63090bF20A
)
```

- Predicted address: `0x6e6Bf80Dc412f4DFCb59C15494C83785d54fb66d`
- Nonce: `1`
- Runtime bytecode SHA-256: `93ba84e7234f385aa39ce69345e20e4bcbf07508a212db1da2157dfc736a2c37`
- Init-code keccak256: `0x812b4397778a9c871c95f09dafa4eeb7fa31a60c83f490e159eb8ee68222c447`
- Gas estimate: `13,054,470`

## Funding ceiling

Safety multiplier: `1.25`.

- Registry raw estimate: `202222818000000000` wei
- Registry ceiling: `252778522500000000` wei (`0.2527785225 STT`)
- Executor raw estimate: `78326820000000000` wei
- Executor ceiling: `97908525000000000` wei (`0.097908525 STT`)
- Maximum owner/deployer ceiling: `350687047500000000` wei (`0.3506870475 STT`)
- Forecaster funding: `0 STT`
- Economic collateral: `0`

The ceiling covers only the two listed deployment transactions and native gas. It does not authorize a transfer or funding action.

## Exact transaction sequence

| # | Operation | Caller | Value | Expected effect |
|---|---|---|---:|---|
| 1 | deploy `CircuitRegistryV2` | disposable owner | `0` | deploy registry with immutable RFT V1 dependency |
| 2 | deploy `CircuitExecutorV2` | disposable owner | `0` | deploy executor with immutable RegistryV2, BinaryMarketsModule, and OperatorPermissionsRegistry dependencies |

Any third transaction is an immediate stop condition.

## Required post-deployment readbacks

After transaction 1:

- receipt status, transaction hash, block number;
- code at predicted/returned RegistryV2 address is non-empty;
- `rftRegistry()` equals `0x5b1B51cB062B7B782c9EC2Bd5674eFAdb5308F41`;
- deployed bytecode identity matches the packet source/build artifact.

After transaction 2:

- receipt status, transaction hash, block number;
- code at predicted/returned ExecutorV2 address is non-empty;
- `circuits()` equals RegistryV2 address;
- `binaryModule()` equals `0x3ecC694Cef705358864a646142ac17A90E29e388`;
- `operatorRegistry()` equals `0x15C7e8CE38F021c5b45d098AaD788f63090bF20A`;
- deployed bytecode identity matches the packet source/build artifact.

These readbacks are pending because deployment has not occurred.

## Explicit non-effects

- No Circuit is created.
- No Forecast is signed or committed.
- No RFT state changes.
- No DreamDEX read or write is part of the deployment sequence.
- No collateral is approved.
- No operator permission is granted.
- No execution authority is granted.
- No Forecaster funding occurs.
- No token approval occurs.

## Stop conditions

Abort before broadcast if:

- RFT V1 bytecode is absent or dependency address differs;
- source HEAD, compiler profile, bytecode hash, or init-code hash changes;
- fresh nonce is not `0`;
- predicted addresses differ;
- gas price or ceiling changes beyond the reviewed packet;
- either deployment requires nonzero value beyond native gas;
- any transaction other than the two listed is required;
- any Circuit, RFT, Forecast, DreamDEX, collateral, or permission operation appears;
- deployment receipt fails;
- post-deployment constructor readback mismatches;
- deployed bytecode does not match the tested source artifact.

## Current state

- `deployments/shannon-v2.json`: remains `NOT_DEPLOYED`.
- Broadcast: `NOT_AUTHORIZED`.
- Deployment receipts: none.
- Deployment addresses: predicted only, not deployed evidence.
