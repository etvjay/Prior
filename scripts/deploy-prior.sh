#!/usr/bin/env bash
set -euo pipefail
: "${SHANNON_RPC_HTTP:=https://dream-rpc.somnia.network}"
: "${PRIOR_DEPLOYER_PRIVATE_KEY:?Set PRIOR_DEPLOYER_PRIVATE_KEY to a disposable Shannon-only key}"
: "${DREAMDEX_BINARY_MODULE:=0x3ecC694Cef705358864a646142ac17A90E29e388}"
: "${DREAMDEX_BINARY_SETTLEMENT:=0xbF4a49e0Dfd092e5FBE8E5761064C49533e6Ed23}"
: "${DREAMDEX_OPERATOR_PERMISSIONS_REGISTRY:=0x15C7e8CE38F021c5b45d098AaD788f63090bF20A}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/deployments"
cd "$ROOT/contracts"

rft=$(forge create --broadcast --rpc-url "$SHANNON_RPC_HTTP" --private-key "$PRIOR_DEPLOYER_PRIVATE_KEY" src/RFTRegistry.sol:RFTRegistry --constructor-args "$DREAMDEX_BINARY_MODULE" "$DREAMDEX_BINARY_SETTLEMENT" --json | tee /tmp/prior-rft.json | jq -r .deployedTo)
circuit=$(forge create --broadcast --rpc-url "$SHANNON_RPC_HTTP" --private-key "$PRIOR_DEPLOYER_PRIVATE_KEY" src/CircuitRegistry.sol:CircuitRegistry --json | tee /tmp/prior-circuit.json | jq -r .deployedTo)
executor=$(forge create --broadcast --rpc-url "$SHANNON_RPC_HTTP" --private-key "$PRIOR_DEPLOYER_PRIVATE_KEY" src/CircuitExecutor.sol:CircuitExecutor --constructor-args "$circuit" "$DREAMDEX_BINARY_MODULE" "$DREAMDEX_OPERATOR_PERMISSIONS_REGISTRY" --json | tee /tmp/prior-executor.json | jq -r .deployedTo)
adapter=$(forge create --broadcast --rpc-url "$SHANNON_RPC_HTTP" --private-key "$PRIOR_DEPLOYER_PRIVATE_KEY" src/DreamDexAdapter.sol:DreamDexAdapter --constructor-args "$DREAMDEX_BINARY_MODULE" --json | tee /tmp/prior-adapter.json | jq -r .deployedTo)
cast send --rpc-url "$SHANNON_RPC_HTTP" --private-key "$PRIOR_DEPLOYER_PRIVATE_KEY" "$circuit" "setExecutor(address)" "$executor" >/tmp/prior-set-executor.json

cat > "$ROOT/deployments/shannon.json" <<JSON
{
  "chainId": 50312,
  "deployer": "$(cast wallet address --private-key "$PRIOR_DEPLOYER_PRIVATE_KEY")",
  "RFTRegistry": "$rft",
  "CircuitRegistry": "$circuit",
  "CircuitExecutor": "$executor",
  "DreamDexAdapter": "$adapter",
  "sdkVersion": "0.29.0"
}
JSON
printf 'deployment written to %s\n' "$ROOT/deployments/shannon.json"
