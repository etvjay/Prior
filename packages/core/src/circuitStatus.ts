import type { CircuitStatus } from "./types.js";
import { CircuitStatus as Status } from "./types.js";

/** Runtime status derived from immutable intent lifetime plus stored state. */
export function effectiveCircuitStatus(stored: CircuitStatus, expiresAt: bigint, now: bigint): CircuitStatus {
  if ((stored === Status.DRAFT || stored === Status.AUTHORIZED || stored === Status.ACTIVE) && now >= expiresAt) return Status.EXPIRED;
  return stored;
}

export const _effectiveStatusInternals = { effectiveCircuitStatus };
