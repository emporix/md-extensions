# Optimistic concurrency & three-way merge (Management Dashboard modules)

Shared concept for Emporix MD federated modules that edit aggregate entities (`Customer`, `Product`, etc.) with **version-based optimistic locking** and nested saves that bump the parent revision.

---

## Problem

1. The API rejects stale writes (“version outdated”) when `metadata.version` (or equivalent) no longer matches the server.
2. **Nested operations** (e.g. save an address, PATCH mixin) can advance the parent version while the **Details** form still holds an older version.
3. **Refreshing only the version** and retrying satisfies the lock check but can hide **real concurrent edits** from another actor → potential silent overwrite.

**Goal:** After loading the latest server document, detect whether **our** edits **overlap incompatibly** with **their** edits since our **base** snapshot; only commit when merge rules say it is safe; otherwise surface a controlled UX.

---

## Mental model: three snapshots

| Snapshot | Meaning |
|----------|---------|
| **base** | Entity as loaded when the user opened the screen (or last explicit full sync / successful commit). |
| **local** | What the user intends to save (typically `getValues()` from React Hook Form, or a trimmed projection). |
| **server** | Latest `GET` after a failed save, nested save, or explicit refresh. |

**Conflict (minimal definition):** For some path `p`, **both** base→local **and** base→server change `p`, and the resulting values are **incompatible** under product rules (often: both changed and final values differ).

**Non-conflict:** Changes touch **disjoint** paths, or one side did not change `p`, or changes are **compatible** (e.g. identical outcome after normalization).

---

## Recommended implementation phases

### Phase 1 — Correctness without heavy UI

1. Persist **`base`** when entering edit mode or after a **successful full save** that defines a new truth.
2. On primary save (and optionally after nested saves), **`GET` latest → server**.
3. Compute **local** from the form (and/or dirty-field hints).
4. Run **path-level three-way checks** with **explicit normalization** (null vs missing, dates, arrays order, etc.).
5. **No conflict:** Build **merged** according to written rules; **`PATCH`/`PUT` with server version** (and any required lock fields).
6. **Conflict:** **Do not** silent retry; enter **conflict state** (banner, modal, or dedicated panel—see UX decisions below).

### Phase 2 — Concurrent multi-editor UX

- Field-level or section-level **diff**, **choose mine / theirs / merge**, optional merge preview.
- Optionally align with **`ETag` / `If-Match`** and **412** if the platform exposes them.

---

## React / `react-hook-form` notes

- **RHF does not** implement three-way merge or server conflict detection.
- **`getValues()`** → **local**.
- **`reset(snapshot)`** → realign form after merge or abort.
- **`formState.dirtyFields`** tracks changes vs **last reset defaults**, **not** vs **server base**. Useful as an optimization (**which paths to check first**), not as the sole source of truth for conflicts.

**Optional small deps** (not React-specific): structural diff (`microdiff`), JSON Patch (`fast-json-patch`). **Conflict rules** and **normalization** remain domain code.

---

## Cross-module reuse checklist

When applying this pattern to another MD module:

1. [ ] Identify **lock fields** (e.g. `metadata.version`, `modifiedAt`, ETag).
2. [ ] Define **`base` lifecycle** (load, after successful save, after discard).
3. [ ] Define **`local` projection** (which keys are ever sent on PATCH).
4. [ ] Define **normalization** per type (dates, empty strings, nested blobs).
5. [ ] Define **comparison granularity** per subtree (e.g. scalars path-by-path; **mixins: nested paths per §7** for Customer).
6. [ ] Implement **`conflicts(base, local, server)` → paths[]**.
7. [ ] Implement **`merge(base, local, server)` when `conflicts` empty**.
8. [ ] Wire **UX** for non-empty conflicts (see decisions below).

---

## UX decisions (stakeholder answers)

*Recorded here as decisions are made; keeps modules aligned.*

### 1. Who can introduce concurrent changes?

**Decision:** All of the following can apply in parallel:

- Other MD users (same tenant)
- Integrations / APIs (e.g. Make, backend jobs)
- Storefront / assisted-buying / customer self-service flows
- Nested saves within the same MD session (addresses, mixins, etc.) that bump parent version

**Implication:** Treat **true multi-writer** concurrency as normal; Phase 1 merge-with-conflict-detection should assume overlap is possible, not only “self-induced” version skew.

---

### 2. Scope of comparison

**Decision:** Use the **full aggregate** the editor cares about (Details scalars, customer-level mixins/metadata, addresses as represented in client state, etc.) when reasoning about **base / local / server** and merge/conflict.

**Transport nuance (Customer module):**

- **Addresses** are persisted via a **separate API** from the main customer body. They may **not** carry the same **version token** semantics as the parent resource, but saving an address can still **advance the parent `metadata.version`** (or equivalent) in the background.
- When that happens, **no “compared” customer fields** need to have changed on the server besides the lock/version metadata — i.e. the conflict signal is **version skew without substantive divergence** on the main payload paths.

**UX expectation for that case:** Still **inform the user** (non-silent), but resolution is **single-action** (e.g. one primary button: apply new lock / continue), not a multi-field merge workflow.

**Implementation note:** Classify outcomes into at least:

1. **Version-only drift** — server differs from base mainly by lock/revision after nested writes; **warn + one-click resolve**.
2. **True overlap** — same paths changed compatibly or incompatibly; follow merge/conflict rules.

---

### 3. On conflict — block vs partial save

**Decision:** **A) Block the entire save** until every conflicting path is resolved (user merges/discards per product rules, or aborts). **No partial persist** of non-conflicting fields in v1.

**Rationale:** Clearer under multi-writer concurrency; avoids partially-written aggregates.

---

### 4. Conflict presentation depth

**Decision:** **C) Hybrid** — primary UI uses **human-readable field labels** (with i18n where applicable); users can **expand** an optional **technical details** section showing paths / raw diff for support and power users.

**Mixin / blob rows:** **§7:** **deep** intra-mixin comparison; UI stays **hybrid** — group **per mixin key**, with expandable **nested** path diffs / raw detail for power users.

---

### 5. After nested save (e.g. address saved)

**Decision:** Generally **notify** after nested saves when the latest `GET` shows **any meaningful divergence** from what the UI assumed—not silent by default.

**Exceptions (no toast / no interrupt):**

- **Version-only drift:** Server document is an **exact semantic match** to current client truth for all **compared paths**, and the only effective change is the **lock / `metadata.version`** (and equivalent)—**ignore** duplicate notification (aligns with §2 “one button resolve” tier only when we already surfaced something, or purely silent refresh of lock tokens).

**Copy nuance:**

- When the server delta is **limited to metadata** (and not “version-only” noise), the message should **say so explicitly** (e.g. “Customer metadata was updated”) so editors understand why they’re being interrupted.

**Rationale:** Under multi-writer reality, “something changed” is common; transparency beats silent mutation. Narrow exception avoids spam when nothing substantive moved.

---

### 6. Long-lived tabs / stale base

**Decision:** **C) Hybrid**

- **Non-blocking:** show a **soft indicator / banner** (e.g. “Data may be out of date — **Reload**”) when heuristics suggest staleness (time since last sync, tab focus after idle, or version mismatch detected in background poll—implementation detail).
- **Blocking path:** always perform **full GET + three-way check** on **Save** (and other committing actions), per Phase 1.

---

### 7. Granularity for mixins / nested blobs

**Decision:** **B) Deep merge (v1)** — compare **nested paths inside each mixin payload** (`mixins['{key}'].…`) so conflicts target overlapping fields, not the whole blob.

**UI:** Still §4 **hybrid** — one **collapsible group per mixin key**; expandable technical section shows **nested** diffs/paths.

**Note:** Invest in **normalization** (key order, null vs missing, arrays) to limit noise; consider guards for **very large** mixin payloads.

---

### 8. Secrets (password, tokens)


**Decision:** **A) Exclude entirely** from three-way compare and conflict UI.

**Customer password (Emporix concrete rule):**

- The password **is not returned** from the server on GET — it exists only as a client-side **set** field when creating/updating credentials.
- **`password` must not participate** in base/server equality or conflict path enumeration (it is **not part of the comparable persisted customer shape**).
- Persist semantics stay **outside** merge/conflict (e.g. include in PATCH only when the user supplied a new value).

---

### 9. Multi-section UI (Details vs Addresses vs Mixins)

**Decision:** **B) Per-tab indicators + global narrative**

- **Primary explanation:** one **global** conflict summary / modal (per §4 hybrid presentation).
- **Tab UX:** **badge or highlight** on each tab that contains **at least one conflicting path** so users know where to act.
- Optional: deep-links / scroll-to-field from global summary into the tab.

---

### 10. Observability

**Decision:** **A) None in v1** — no conflict telemetry / analytics; rely on UX and support channels only.

**Revisit:** If concurrent-edit pain appears in the field, consider **§10 option B** (aggregated counts, no PII) before deeper logging.

---

## References (internal)

- Customers module: address save uses `useFieldArray().replace` + separate concern for parent **version** alignment (historical approaches discussed in implementation threads).
- Emporix APIs: confirm exact error shape (`409`/`412`, message text) per service.

---

## Document history

- **Created:** Concept template for reuse across `md-extensions` modules.
- **Owner:** _TBD_
