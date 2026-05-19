import type { AxiosError } from "axios";
import type { Metadata } from "../models/Metadata";

/**
 * Merge optimistic-lock metadata for PATCH bodies. Earlier sources are overwritten by later ones
 * (e.g. `customer` state then form values) so form wins when present, otherwise React state from GET still supplies version.
 */
export function mergeMetadataLockFields(
  ...sources: (Metadata | undefined)[]
): Partial<Pick<Metadata, "version" | "modifiedAt">> {
  const out: Partial<Pick<Metadata, "version" | "modifiedAt">> = {};
  for (const md of sources) {
    if (!md) continue;
    if (md.version !== undefined) out.version = md.version;
    if (md.modifiedAt !== undefined) out.modifiedAt = md.modifiedAt;
  }
  return out;
}

/** Detect Emporix-style optimistic locking failures (HTTP + message). */
export function isOptimisticLockConflictError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const ax = error as AxiosError<{ message?: string }>;
  const status = ax.response?.status;
  const msg = ax.response?.data?.message ?? (error as Error)?.message ?? "";
  if (status === 409 || status === 412) return true;
  return /version.*outdated|outdated.*version|optimistic.*lock|stale.*version/i.test(
    String(msg),
  );
}
