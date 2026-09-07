# M4.3.2C-R1 Correct V2 Deployment Packet

Status: `READY_FOR_GAS_FUNDING`

This packet is pre-broadcast. Do not deploy until the funding gate is separately authorized and re-read.

## Source identity

- Repository HEAD: `f2f9e4803c9db87aa803df84dfaff342196a09db`
- Pinned tested/compiled contract source: `41e1b30edf9c4ed1c7826d8f4090260792a98f20`
- Contract diff since pinned source: `NONE`
- Compiler/build: `solc 0.8.24`, `optimizer=true,runs=200,via_ir=true,bytecode_hash=none,cbor_metadata=false`
- No V2 contract source changed between pinned source/build and this packet.

## Fresh chain state

- Chain ID: `50312`
- RPC: `https://dream-rpc.somnia.network`
- Observed head: `481988968`
- Deployer: `0x82Daa64CEDfA4d15615ADC6D577Dba0d9FfccF55`
- Nonce: `0`
- Balance: `0.000000000000000000 STT` (`0 wei`)
- RFT V1: `0x5b1B51cB062B7B782c9EC2Bd5674eFAdb5308F41`, 4399 bytes of code

## Fresh gas

- Gas price: `6000000000 wei`
- Safety multiplier: `1.25x`
- Registry estimate: `33703803` gas, `202222818000000000 wei`
- Executor estimate: `13054470` gas, `78326820000000000 wei`
- Maximum deployer funding: `0.3506870475 STT`

## TX 1 - CircuitRegistryV2

- Nonce: `0`
- Value: `0 wei`
- Constructor arguments: `["0x5b1B51cB062B7B782c9EC2Bd5674eFAdb5308F41"]`
- Expected address: `0x1eD3B2310F369977ef82569498d5F678f8B73104`
- Artifact file SHA-256: `e3fcf7095729875f33b1217fe9bb226b84e41a534d1852f86d40ea1bdead3e8b`
- Creation bytecode SHA-256: `d053098834ce78f998c2b1d6c51529c60b0c5201179ad79ab2b1592ba38cad53`
- Init-code keccak256: `0x1af8dd55f8d4fb7d0f35f0fc10beac74767ef2973c0c8e5c212ffc77c5a8ccdc`
- Runtime bytecode SHA-256 (`.deployedBytecode.object`): `2db7fcdce5d938f273a24369cdbb20f626baf0d083c01fbe48202b62a008a7cd`
- Gas estimate: `33703803`

## TX 2 - CircuitExecutorV2

- Nonce: `1`
- Value: `0 wei`
- Constructor arguments: `["0x1eD3B2310F369977ef82569498d5F678f8B73104", "0x3ecC694Cef705358864a646142ac17A90E29e388", "0x15C7e8CE38F021c5b45d098AaD788f63090bF20A"]`
- Expected address: `0x6e6Bf80Dc412f4DFCb59C15494C83785d54fb66d`
- Artifact file SHA-256: `ec62c29a220adb626edecbd3cb243fed572edc77062754eb2d6ff7b31e3b35e3`
- Creation bytecode SHA-256: `31bbbf9843138b4f6e22585150640839ba343d539bacbb87e714451de00782e9`
- Init-code keccak256: `0x812b4397778a9c871c95f09dafa4eeb7fa31a60c83f490e159eb8ee68222c447`
- Runtime bytecode SHA-256 (`.deployedBytecode.object`): `54a800b19ed18d0a791228df773989e4e7e83ef3e362aeddd78eba7ba69e52c8`
- Gas estimate: `13054470`

## Funding request

- Destination: `0x82Daa64CEDfA4d15615ADC6D577Dba0d9FfccF55`
- Maximum: `0.3506870475 STT`
- Purpose: V2 deployment gas only
- Exactly two deployment transactions
- Economic collateral: `0`
- Forecaster funding: `0 STT`
- Token approvals: `NONE`
- DreamDEX writes: `NONE`
- Validity: before any nonce, gas-price, bytecode, dependency, or predicted-address change; re-read all gates after funding

Funding is a separate authorization. No faucet or transfer is performed by this packet.

## Superseded-packet root cause

The first M4.3.2C packet recorded hashes of contract artifact files rather than hashes of the actual deployed runtime bytecode object. Deployment was correctly halted before broadcast by the bytecode-mismatch stop condition.

The earlier packet is preserved at `evidence/M4_3_2C_V2_DEPLOYMENT_PACKET_SUPERSEDED.md` with status `SUPERSEDED_PRE_BROADCAST`.

## Stop conditions

- nonce must remain 0; do not recalculate and continue automatically
- balance must be sufficient for the refreshed gas ceiling
- chain ID must remain 50312
- RFT V1 bytecode must remain present
- runtime bytecode must match deployedBytecode.object hashes
- RegistryV2 must deploy at the expected address before TX2
- exactly two Shannon writes are authorized
- no Circuit, Forecast, RFT, DreamDEX, approval, permission, or Forecaster-funding operation is authorized

Current deployment metadata remains `NOT_DEPLOYED`. Writes occurred: `false`.
