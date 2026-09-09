import { mkdir, readFile, rename, writeFile, unlink } from "node:fs/promises";
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
const statuses = new Set(Object.keys(transitions));
const id = (value: unknown, field: string): string => {
  if (typeof value !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(value)) throw new Error(`invalid checkpoint ${field}`);
  return value;
};
function revive(value: unknown): unknown {
  if (typeof value === "string" && /^-?\d+n$/.test(value)) return BigInt(value.slice(0, -1));
  if (Array.isArray(value)) return value.map(revive);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, revive(v)]));
  return value;
}
function validate(value: unknown): CircuitIteration {
  if (!value || typeof value !== "object") throw new Error("invalid checkpoint record");
  const v = value as Record<string, unknown>;
  const circuitId = id(v.circuitId, "circuitId");
  const marketId = id(v.marketId, "marketId");
  if (typeof v.status !== "string" || !statuses.has(v.status)) throw new Error("invalid checkpoint status");
  if (typeof v.updatedAt !== "bigint" || v.updatedAt < 0n) throw new Error("invalid checkpoint updatedAt");
  return v as unknown as CircuitIteration;
}
function same(a: CircuitIteration, b: CircuitIteration): boolean {
  return JSON.stringify(a, (_, v) => typeof v === "bigint" ? `${v}n` : v) === JSON.stringify(b, (_, v) => typeof v === "bigint" ? `${v}n` : v);
}

export class RunnerCheckpoint {
  private readonly entries = new Map<string, CircuitIteration>();
  constructor(private readonly file: string) {}
  key(circuitId: string, marketId: string): string { return `${circuitId.toLowerCase()}:${marketId.toLowerCase()}`; }
  get(circuitId: string, marketId: string): CircuitIteration | undefined { return this.entries.get(this.key(circuitId, marketId)); }
  all(): CircuitIteration[] { return [...this.entries.values()]; }
  put(next: CircuitIteration): void {
    const valid = validate(next);
    const key = this.key(valid.circuitId, valid.marketId);
    const prior = this.entries.get(key);
    if (prior && !same(prior, valid) && !transitions[prior.status].includes(valid.status)) throw new Error(`illegal iteration transition ${prior.status} -> ${valid.status}`);
    this.entries.set(key, valid);
  }
  async load(): Promise<void> {
    try {
      const parsed: unknown = JSON.parse(await readFile(this.file, "utf8"));
      if (!Array.isArray(parsed)) throw new Error("invalid checkpoint root");
      const incoming = new Map<string, CircuitIteration>();
      for (const raw of parsed) {
        const item = validate(revive(raw));
        const key = this.key(item.circuitId, item.marketId);
        const prior = incoming.get(key);
        if (prior && !same(prior, item)) throw new Error(`duplicate checkpoint identity ${key}`);
        incoming.set(key, item);
      }
      this.entries.clear();
      for (const item of incoming.values()) this.entries.set(this.key(item.circuitId, item.marketId), item);
    } catch (error: any) { if (error?.code !== "ENOENT") throw error; }
  }
  async persist(): Promise<void> {
    const slash = this.file.lastIndexOf("/");
    const directory = slash < 0 ? "." : this.file.slice(0, slash);
    await mkdir(directory, { recursive: true });
    const temp = `${this.file}.tmp-${process.pid}-${Date.now()}`;
    try {
      await writeFile(temp, JSON.stringify(this.all(), (_, value) => typeof value === "bigint" ? `${value}n` : value, 2) + "\n", "utf8");
      await rename(temp, this.file);
    } finally { await unlink(temp).catch(() => undefined); }
  }
}
export { transitions };
