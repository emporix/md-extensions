import type { Customer, CustomerAddress } from "../models/Customer";
import type { Metadata } from "../models/Metadata";
import { deepClone } from "./utils";

/** Comparable snapshot: strips §8 password and §2 lock tokens from metadata for substantive comparison. */
export function prepareCustomerMergeSnapshot(customer: Customer): Customer {
  const c = deepClone(customer);
  delete c.password;
  const md = c.metadata
    ? ({ ...c.metadata } as Metadata & Record<string, unknown>)
    : undefined;
  if (md) {
    delete md.version;
    delete md.modifiedAt;
    c.metadata = md as Customer["metadata"];
  }
  return c;
}

function stableSortedJson(value: unknown): string {
  return JSON.stringify(sortKeysDeep(value));
}

function sortKeysDeep(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const out: Record<string, unknown> = {};
  for (const k of keys) out[k] = sortKeysDeep(obj[k]);
  return out;
}

export function substantiveCustomerEquals(a: Customer, b: Customer): boolean {
  return (
    stableSortedJson(prepareCustomerMergeSnapshot(a)) ===
    stableSortedJson(prepareCustomerMergeSnapshot(b))
  );
}

function addressKey(addr: CustomerAddress, idx: number): string {
  return addr.id ?? `__nf_${idx}`;
}

/** Emit leaf-ish paths where substantive snapshots differ (addresses keyed by id). */
export function collectChangedPaths(
  base: Customer,
  other: Customer,
): Set<string> {
  const pb = prepareCustomerMergeSnapshot(base);
  const po = prepareCustomerMergeSnapshot(other);
  const out = new Set<string>();

  const bm = new Map<string, CustomerAddress>();
  (pb.addresses ?? []).forEach((a, i) => bm.set(addressKey(a, i), a));
  const om = new Map<string, CustomerAddress>();
  (po.addresses ?? []).forEach((a, i) => om.set(addressKey(a, i), a));
  const addrKeys = new Set([...bm.keys(), ...om.keys()]);
  for (const id of addrKeys) {
    diffValues(`addresses.${id}`, bm.get(id), om.get(id), out);
  }

  diffValues("mixins", pb.mixins ?? {}, po.mixins ?? {}, out);
  diffValues("metadata", pb.metadata ?? {}, po.metadata ?? {}, out);
  diffValues("b2b", pb.b2b, po.b2b, out);

  const skip = new Set(["addresses", "mixins", "metadata", "b2b", "password"]);
  const keys = new Set([
    ...Object.keys(pb as unknown as Record<string, unknown>),
    ...Object.keys(po as unknown as Record<string, unknown>),
  ]);
  for (const k of keys) {
    if (skip.has(k)) continue;
    diffValues(
      k,
      (pb as unknown as Record<string, unknown>)[k],
      (po as unknown as Record<string, unknown>)[k],
      out,
    );
  }

  return out;
}

function diffValues(
  prefix: string,
  a: unknown,
  b: unknown,
  out: Set<string>,
): void {
  if (stableSortedJson(a) === stableSortedJson(b)) return;

  if (
    a === null ||
    b === null ||
    typeof a !== "object" ||
    typeof b !== "object" ||
    Array.isArray(a) ||
    Array.isArray(b)
  ) {
    out.add(prefix);
    return;
  }

  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;
  const keys = new Set([...Object.keys(ao), ...Object.keys(bo)]);

  if (keys.size === 0) {
    out.add(prefix);
    return;
  }

  for (const k of keys) {
    diffValues(`${prefix}.${k}`, ao[k], bo[k], out);
  }
}

export type CustomerMergeConflictDetail = {
  path: string;
  baseValue: unknown;
  localValue: unknown;
  serverValue: unknown;
};

export type CustomerThreeWayMergeResult =
  | { ok: true; merged: Customer }
  | { ok: false; paths: string[]; conflicts: CustomerMergeConflictDetail[] };

/** Compact display for modal / technical sections (password excluded upstream). */
export function formatMergeDisplayValue(value: unknown): string {
  if (value === undefined) return "—";
  if (value === null) return "null";
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean") return String(value);
  try {
    return stableSortedJson(value);
  } catch {
    return String(value);
  }
}

function collectConflictingPaths(
  base: Customer,
  local: Customer,
  server: Customer,
): string[] {
  const pathsR = collectChangedPaths(base, server);
  const pathsL = collectChangedPaths(base, local);
  const overlap = [...pathsL].filter((p) => pathsR.has(p));
  return overlap
    .filter((p) => {
      const lv = getAtCustomerPath(local, p);
      const sv = getAtCustomerPath(server, p);
      return stableSortedJson(lv) !== stableSortedJson(sv);
    })
    .sort();
}

/**
 * Build payload after explicit per-path mine/theirs choices (Phase 2 conflict UI).
 * Throws if any conflicting path is missing from `resolutions`.
 */
export function buildCustomerMergeWithResolutions(
  base: Customer,
  local: Customer,
  server: Customer,
  resolutions: Record<string, "mine" | "theirs">,
): Customer {
  const pathsR = collectChangedPaths(base, server);
  const pathsL = collectChangedPaths(base, local);
  const conflicting = collectConflictingPaths(base, local, server);

  for (const p of conflicting) {
    const choice = resolutions[p];
    if (choice !== "mine" && choice !== "theirs") {
      throw new Error(`Missing merge resolution for path: ${p}`);
    }
  }

  const merged = deepClone(server);
  const applyLocal = [...pathsL].filter((p) => !pathsR.has(p));
  for (const p of applyLocal) {
    setAtCustomerPath(merged, p, deepClone(getAtCustomerPath(local, p)));
  }

  for (const p of conflicting) {
    if (resolutions[p] === "mine") {
      setAtCustomerPath(merged, p, deepClone(getAtCustomerPath(local, p)));
    }
  }

  merged.password = local.password === "" ? undefined : local.password;
  if (merged.metadata && server.metadata) {
    merged.metadata.version = server.metadata.version;
    merged.metadata.modifiedAt = server.metadata.modifiedAt;
  }
  return merged;
}

/**
 * Phase 1–2 three-way analysis for Customer aggregate (see docs/optimistic-concurrency-three-way-merge.md).
 * Overlapping substantive edits on the same path where local ≠ server → blocked save + conflict details.
 * Disjoint edits merge onto latest server (locks preserved from server).
 */
export function analyzeCustomerThreeWayMerge(
  base: Customer | null,
  local: Customer,
  server: Customer,
): CustomerThreeWayMergeResult {
  if (!base) {
    return { ok: true, merged: alignLocksFromServer(local, server) };
  }
  if (base.id && server.id && base.id !== server.id) {
    return { ok: true, merged: alignLocksFromServer(local, server) };
  }

  const pathsR = collectChangedPaths(base, server);
  const pathsL = collectChangedPaths(base, local);

  const conflicting = collectConflictingPaths(base, local, server);

  if (conflicting.length > 0) {
    const conflicts: CustomerMergeConflictDetail[] = conflicting.map(
      (path) => ({
        path,
        baseValue: deepClone(getAtCustomerPath(base, path)),
        localValue: deepClone(getAtCustomerPath(local, path)),
        serverValue: deepClone(getAtCustomerPath(server, path)),
      }),
    );
    return { ok: false, paths: conflicting, conflicts };
  }

  return {
    ok: true,
    merged: mergeDisjointOntoServer(base, local, server, pathsL, pathsR),
  };
}

function alignLocksFromServer(local: Customer, server: Customer): Customer {
  const merged = deepClone(local);
  merged.metadata = {
    ...(merged.metadata ?? {}),
    version: server.metadata?.version,
    modifiedAt: server.metadata?.modifiedAt,
  };
  return merged;
}

function mergeDisjointOntoServer(
  base: Customer,
  local: Customer,
  server: Customer,
  pathsL: Set<string>,
  pathsR: Set<string>,
): Customer {
  const merged = deepClone(server);
  const applyLocal = [...pathsL].filter((p) => !pathsR.has(p));
  for (const p of applyLocal) {
    const v = getAtCustomerPath(local, p);
    setAtCustomerPath(merged, p, v);
  }
  merged.password = local.password === "" ? undefined : local.password;
  if (merged.metadata && server.metadata) {
    merged.metadata.version = server.metadata.version;
    merged.metadata.modifiedAt = server.metadata.modifiedAt;
  }
  return merged;
}

function getAtCustomerPath(c: Customer, path: string): unknown {
  const segments = path.split(".");
  if (segments[0] === "addresses" && segments.length >= 2) {
    const addrId = segments[1];
    const addr = (c.addresses ?? []).find(
      (a, idx) => addressKey(a, idx) === addrId,
    );
    if (!addr) return undefined;
    const rest = segments.slice(2);
    if (rest.length === 0) return addr;
    let cur: unknown = addr as unknown;
    for (const s of rest) {
      if (cur === null || cur === undefined || typeof cur !== "object")
        return undefined;
      cur = (cur as Record<string, unknown>)[s];
    }
    return cur;
  }

  let cur: unknown = c as unknown;
  for (const s of segments) {
    if (cur === null || cur === undefined || typeof cur !== "object")
      return undefined;
    cur = (cur as Record<string, unknown>)[s];
  }
  return cur;
}

function setAtCustomerPath(c: Customer, path: string, value: unknown): void {
  const segments = path.split(".");
  if (segments[0] === "addresses" && segments.length >= 2) {
    const addrId = segments[1];
    const idx = (c.addresses ?? []).findIndex(
      (a, i) => addressKey(a, i) === addrId,
    );
    if (idx < 0) return;
    const addr = c.addresses[idx];
    const rest = segments.slice(2);
    if (rest.length === 0) {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        c.addresses[idx] = { ...addr, ...(value as CustomerAddress) };
      }
      return;
    }
    let cur: Record<string, unknown> = addr as unknown as Record<
      string,
      unknown
    >;
    for (let i = 0; i < rest.length - 1; i++) {
      const key = rest[i];
      const next = cur[key];
      if (next === undefined || typeof next !== "object") return;
      cur = next as Record<string, unknown>;
    }
    cur[rest[rest.length - 1]] = value as unknown;
    return;
  }

  let cur: Record<string, unknown> = c as unknown as Record<string, unknown>;
  for (let i = 0; i < segments.length - 1; i++) {
    const key = segments[i];
    const next = cur[key];
    if (next === undefined || typeof next !== "object" || Array.isArray(next)) {
      return;
    }
    cur = next as Record<string, unknown>;
  }
  cur[segments[segments.length - 1]] = value as unknown;
}
