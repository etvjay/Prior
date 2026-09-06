import { mkdir, readFile, writeFile } from "node:fs/promises";
import { CircuitIterationStatus, type CircuitIteration } from "@prior/core";

const transitions: Record<CircuitIterationStatus, readonly CircuitIterationStatus[]> = {
  WAITING_FOR_MARKET: ["MARKET_FOUND"],
  MARKET_FOUND: ["WAITING_FOR_FORECAST"],
  WAITING_FOR_FORECAST: ["FORECAST_COMMITTING"],
  FORECAST_COMMITTING: ["POLICY_EVALUATING"],
  POLICY_EVALUATING: ["AWAITING_OWNER_AUTHORIZATION", "ABSTAINED"],
  AWAITING_OWNER_AUTHORIZATION: ["EXECUTING", "ABSTAINED"],
  EXECUTING: ["WAITING_FOR_RESOLUTION", "ABSTAINED"],
  ABSTAINED: ["ITERATION_COMPLETE"],
  WAITING_FOR_RESOLUTION: ["FINALIZING_RFT"],
  FINALIZING_RFT: ["ITERATION_COMPLETE"],
  ITERATION_COMPLETE: [],
};

export class RunnerCheckpoint {
  private readonly entries = new Map<string, CircuitIteration>();
  constructor(private readonly file: string) {}

  key(circuitId: string, marketId: string): string { return `${circuitId.toLowerCase()}:${marketId.toLowerCase()}`; }
  get(circuitId: string, marketId: string): CircuitIteration | undefined { return this.entries.get(this.key(circuitId, marketId)); }
  all(): CircuitIteration[] { return [...this.entries.values()]; }

  put(next: CircuitIteration): void {
    const key = this.key(next.circuitId, next.marketId);
    const prior = this.entries.get(key);
    if (prior && !transitions[prior.status].includes(next.status) && prior.status !== next.status) {
      throw new Error(`illegal iteration transition ${prior.status} -> ${next.status}`);
    }
    this.entries.set(key, next);
  }

  async load(): Promise<void> {
    try {
      const parsed = JSON.parse(await readFile(this.file, "utf8")) as CircuitIteration[];
      for (const item of parsed) this.entries.set(this.key(item.circuitId, item.marketId), item);
    } catch (error: any) { if (error?.code !== "ENOENT") throw error; }
  }

  async persist(): Promise<void> {
    await mkdir(this.file.substring(0, this.file.lastIndexOf("/")), { recursive: true });
    await writeFile(this.file, JSON.stringify(this.all(), (_, value) => typeof value === "bigint" ? `${value}n` : value, 2) + "\n");
  }
}

export { transitions };
