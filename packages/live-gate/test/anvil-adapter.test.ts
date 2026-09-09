import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

describe("M4.3.5A concrete fork adapter", () => {
  it("routes lifecycle writes through the stateful Anvil adapter, not the disabled stub", async () => {
    const source = await readFile(resolve(process.cwd(), "src/anvil-adapter.ts"), "utf8");
    expect(source).not.toContain("LIVE_WRITE_ADAPTER_NOT_ENABLED_FOR_M4_3_5A");
    expect(source).toContain("writeContract");
    expect(source).toContain("waitForTransactionReceipt");
    expect(source).toContain("anvil_impersonateAccount");
    expect(source).toContain("getTrial");
    expect(source).toContain("getIteration");
    expect(source).toContain("--fork-block-number");
    expect(source).toContain("close: async");
  });
});
