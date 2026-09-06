/**
 * M0 SDK exports + ABI inspection.
 *
 * Per docs/ONESHOT_BUILD_INPUTS.md §8 we must, from the *installed pinned* package,
 *  - locate binaryPoolWriteAbi / binaryModuleReadAbi / etc.
 *  - locate placeBinaryOrderFor
 *  - compute its selector
 *  - locate operator-registry ABI methods
 *  - record SOMNIA_TESTNET_ADDRESSES
 *
 * No selectors are typed from memory. Everything is derived from the installed package.
 */
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

// viem
import { keccak256, toHex, getAddress, toFunctionSelector } from "viem";

import * as marketsSdk from "@somnia-chain/markets-sdk";
import * as chains from "@somnia-chain/markets-sdk/chains";
import * as native from "@somnia-chain/markets-sdk/native";

const ROOT = resolve(__dirname, "..");
const EVIDENCE_DIR = resolve(ROOT, "evidence", "shannon");
mkdirSync(EVIDENCE_DIR, { recursive: true });

const sdkPkg = JSON.parse(
  readFileSync(
    resolve(__dirname, "..", "node_modules", "@somnia-chain", "markets-sdk", "package.json"),
    "utf8"
  )
);
const sdkVersion: string = sdkPkg.version;

const exportNames = Object.keys(marketsSdk).sort();
const chainExports = Object.keys(chains).sort();
const nativeExports = Object.keys(native).sort();

const addressesExport = (marketsSdk as any).SOMNIA_TESTNET_ADDRESSES;
const addresses = addressesExport
  ? Object.fromEntries(
      Object.entries(addressesExport).map(([k, v]) => [
        k,
        typeof v === "string" ? v : JSON.stringify(v),
      ])
    )
  : null;

const abiNames = [
  "binaryPoolWriteAbi",
  "binaryModuleReadAbi",
  "binaryModuleWriteAbi",
  "binarySettlementAbi",
  "erc6909Abi",
  "oracleHubAbi",
  "operatorRegistryWriteAbi",
  "orderBookEventsAbi",
].filter((n) => (marketsSdk as any)[n] !== undefined);

// Locate placeBinaryOrderFor in every ABI
const placeBinaryMatches: Array<{
  abiName: string;
  name: string;
  inputs: any[];
  outputs?: any[];
  stateMutability?: string;
  type: string;
  selector: string;
}> = [];
for (const name of abiNames) {
  const abi = (marketsSdk as any)[name] as any[];
  if (!Array.isArray(abi)) continue;
  for (const item of abi) {
    if (item && (item.name === "placeBinaryOrderFor" || item.name === "placeBinaryOrder")) {
      const selector = toFunctionSelector(item as any);
      placeBinaryMatches.push({
        abiName: name,
        name: item.name,
        type: item.type,
        inputs: item.inputs,
        outputs: item.outputs,
        stateMutability: item.stateMutability,
        selector,
      });
    }
  }
}

const operatorMatches: Array<{
  abiName: string;
  fn: string;
  inputs: any[];
  outputs?: any[];
  selector: string;
}> = [];
const interesting = [
  "setOperatorApproval",
  "setOperatorApprovalForPool",
  "setOperatorApprovalWithSelector",
  "isOperatorAuthorized",
  "isAuthorized",
  "revokeOperator",
  "setOperatorApprovalForPoolWithSelector",
];
for (const name of abiNames) {
  const abi = (marketsSdk as any)[name] as any[];
  if (!Array.isArray(abi)) continue;
  for (const item of abi) {
    if (
      item &&
      item.type === "function" &&
      interesting.some((s) => item.name === s || item.name?.startsWith(s))
    ) {
      operatorMatches.push({
        abiName: name,
        fn: item.name,
        inputs: item.inputs,
        outputs: item.outputs,
        selector: toFunctionSelector(item as any),
      });
    }
  }
}

const sha256 = (obj: any) =>
  createHash("sha256").update(JSON.stringify(obj, null, 2)).digest("hex");

const out = {
  timestamp: new Date().toISOString(),
  sdkVersion,
  nodeVersion: process.version,
  packagePath: resolve(__dirname, "..", "node_modules", "@somnia-chain", "markets-sdk"),
  packageHash: sha256(sdkPkg),
  exports: {
    root: exportNames,
    chains: chainExports,
    native: nativeExports,
  },
  addresses: addresses
    ? { SOMNIA_TESTNET_ADDRESSES: addresses, hash: sha256(addresses) }
    : null,
  abiExports: abiNames,
  placeBinaryMatches,
  operatorMatches,
  // Hash every located ABI for full reproducibility
  abiHashes: Object.fromEntries(
    abiNames.map((n) => [n, sha256((marketsSdk as any)[n])])
  ),
};

const outPath = resolve(EVIDENCE_DIR, "m0-sdk-exports.json");
writeFileSync(outPath, JSON.stringify(out, null, 2));

const abiPath = resolve(EVIDENCE_DIR, "m0-binary-abi.json");
writeFileSync(
  abiPath,
  JSON.stringify(
    {
      timestamp: out.timestamp,
      sdkVersion,
      abiExports: abiNames,
      placeBinaryOrder: placeBinaryMatches.find((m) => m.name === "placeBinaryOrder"),
      placeBinaryOrderFor: placeBinaryMatches.find((m) => m.name === "placeBinaryOrderFor"),
      operatorFunctions: operatorMatches,
      abiHashes: out.abiHashes,
    },
    null,
    2
  )
);

console.log("M0 SDK exports captured.");
console.log("sdkVersion =", sdkVersion);
console.log("exports (root,", exportNames.length, "):", exportNames.slice(0, 12).join(", "), "...");
console.log("chains:", chainExports.join(", "));
console.log("abiExports:", abiNames.join(", "));
console.log("placeBinaryOrder matches:", placeBinaryMatches.filter((m) => m.name === "placeBinaryOrder").length);
console.log("placeBinaryOrderFor matches:", placeBinaryMatches.filter((m) => m.name === "placeBinaryOrderFor").length);
for (const m of placeBinaryMatches) {
  console.log("  ", m.abiName, m.type, m.selector);
}
console.log("operator function matches:", operatorMatches.length);
for (const m of operatorMatches) {
  console.log("  ", m.abiName, m.fn, m.selector);
}
console.log("addresses keys:", addresses ? Object.keys(addresses).join(", ") : "(none)");
console.log("evidence ->", outPath);
console.log("evidence ->", abiPath);
