import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { SOMNIA_SHANNON_CHAIN } from "../src/anvil-adapter.js";

describe("M4.3.5A concrete fork adapter", () => {
  it("routes lifecycle writes through the stateful Anvil adapter, not the disabled stub", async () => {
    const source = await readFile(resolve(process.cwd(), "src/anvil-adapter.ts"), "utf8");
    expect(source).not.toContain("LIVE_WRITE_ADAPTER_NOT_ENABLED_FOR_M4_3_5A");
    expect(source).toContain("writeContract");
    expect(source).toContain("waitForTransactionReceipt");
    expect(source).toContain("[config.owner, config.forecaster]");
    expect(source).toContain("FORK_FUNDING_ACTOR_NOT_ALLOWED");
    expect(source).not.toContain("FORECASTER_FUNDING_FORBIDDEN");
    expect(source).toContain("getTrial");
    expect(source).toContain("getIteration");
    expect(source).toContain("--fork-block-number");
    expect(source).toContain("close: async");
  });

  it("constructs fork wallet clients with Somnia Shannon chain metadata", () => {
    expect(SOMNIA_SHANNON_CHAIN).toMatchObject({ id: 50312, name: "Somnia Shannon" });
    expect(SOMNIA_SHANNON_CHAIN.nativeCurrency).toMatchObject({ symbol: "STT", decimals: 18 });
  });
});
