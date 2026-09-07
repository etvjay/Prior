# M4.3.2C TX2 Corrected Authorization Packet

Status: `READY_FOR_TX2_AUTHORIZATION`

This packet authorizes review of TX2 only. It does not authorize Circuit creation, Forecast commitment, RFT mutation, DreamDEX interaction, approvals, or Forecaster funding.

## Fresh state

- Head: `482054615`
- Chain ID: `50312`
- Deployer: `0x82Daa64CEDfA4d15615ADC6D577Dba0d9FfccF55`
- Nonce: `1`
- Balance: `10.215871835500000000 STT`
- Gas price: `6000000000 wei`

## TX1 verification

- Receipt: `0x1`
- Address: `0x1eD3B2310F369977ef82569498d5F678f8B73104`
- Transaction: `0xcaf3049627145d08b3b8908aa4fb6d2844f6b86d45c8dcb6e5596e13a81ae213`
- `rftRegistry()`: `0x5b1B51cB062B7B782c9EC2Bd5674eFAdb5308F41`
- Raw artifact runtime SHA-256: `2db7fcdce5d938f273a24369cdbb20f626baf0d083c01fbe48202b62a008a7cd`
- Immutable-aware onchain/runtime SHA-256: `c1ad8ec4e159886a4a2c5deef5e3f64600688d0065da48967f00ad417c4ba465`
- Byte-for-byte match after immutable substitution: `PASS`

## TX2 - CircuitExecutorV2

- Nonce: `1`
- Value: `0 wei`
- Expected address: `0x6e6Bf80Dc412f4DFCb59C15494C83785d54fb66d`
- Constructor: `["0x1eD3B2310F369977ef82569498d5F678f8B73104", "0x3ecC694Cef705358864a646142ac17A90E29e388", "0x15C7e8CE38F021c5b45d098AaD788f63090bF20A"]`
- Artifact file SHA-256: `ec62c29a220adb626edecbd3cb243fed572edc77062754eb2d6ff7b31e3b35e3`
- Creation bytecode SHA-256: `31bbbf9843138b4f6e22585150640839ba343d539bacbb87e714451de00782e9`
- Init-code keccak256: `0x812b4397778a9c871c95f09dafa4eeb7fa31a60c83f490e159eb8ee68222c447`
- Raw `.deployedBytecode.object` SHA-256: `54a800b19ed18d0a791228df773989e4e7e83ef3e362aeddd78eba7ba69e52c8`
- Immutable-aware expected runtime SHA-256: `0ddd2cbb15da07afa20d8699aa6d7e704af487d34e39168bce03546121cd365d`
- Gas estimate: `13054470`
- Verification: Patch .deployedBytecode.object at compiler-recorded immutableReferences with constructor addresses, then compare byte-for-byte to onchain runtime code.

## Gas ceiling

- Raw estimated cost: `78326820000000000 wei`
- Safety multiplier: `1.25x`
- Conservative ceiling: `0.097908525 STT`

## Post-TX2 readbacks

- receipt SUCCESS
- expected ExecutorV2 address
- non-empty code
- circuits() equals RegistryV2
- binaryModule() equals canonical module
- operatorRegistry() equals canonical registry
- immutable-aware runtime hash equals expected

## Stop conditions

- nonce must remain 1; do not recalculate and continue automatically
- RegistryV2 must remain at expected address with verified immutable-aware runtime
- balance must cover fresh ceiling
- chain ID and constructor dependencies must match
- any third transaction or nonzero value stops
- any Circuit, Forecast, RFT, DreamDEX, approval, permission, or Forecaster operation stops

No TX2 broadcast has occurred.
