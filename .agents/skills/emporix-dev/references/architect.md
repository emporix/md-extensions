# Stage `architect`

Internal technical design for an **approved** plan, before any product code.
Sketch types, function signatures, class shapes, and module boundaries with
not-implemented bodies and pseudocode. Design it twice from several model
perspectives, synthesize one chosen sketch, write it into the plan. The
build overlay (`build.md`) then fills it in; the sketch is its contract.

This is not plan approval. `approve` locks the product plan (outcome,
acceptance criteria, seams, todos) into Jira. Architect decides the internal
shape that serves it, and never widens it.

Writes only the plan file(s). No product or test code, no commit, no push,
no PR, no Jira.

```text
architect progress:
- [ ] 0. Prerequisite: approved plan; decide run or skip
- [ ] 1. Cross-repo layer (multi-product only): ground → perspectives → gate → synthesize
- [ ] 2. In-repo layer, one sketch per pending todo (or one per change): ground → perspectives → gate → synthesize
- [ ] 3. Sign-off (standalone or --checkpoint) / Approved: auto
- [ ] 4. Write ### Design sketch into the plan (multi-product: dev-plan + slices)
- [ ] 5. Report → implement
```

## 0. Prerequisite and skip

Load the approved plan the way `emporix-feature` implement does (local
file first, Buddy as fallback). `**Status:** draft`, a **Blocking** open question, or no plan →
stop; point at `/emporix-dev {KEY}`. A plan loaded only from Buddy (no local
file) has no sketch history: run architect in full.

The playbook's architect step decides whether this stage runs and what the
sketch is for (`references/playbooks/{name}.md`). This file is only the
method.

Multi-product plans (`references/multi-repo.md`) never skip the Cross-repo
layer. Skip → print `architect: skipped — {reason}` and write
`### Design sketch` with the single line `Skipped: {reason}` so review and
`auto` see the decision. Then § 5.

An existing `### Design sketch` (or a `#### Todo {id}` in it) that is not
marked `Discarded` or `stale` → reuse it; say so; no new perspectives.

Every todo already done and no sketch (the ticket was built by
`/emporix-feature` before `emporix-dev` took over) → do not design over
finished code. Write `Skipped: implemented before emporix-dev` and continue
at review.

## 1–2. Each layer: ground, perspectives, gate, synthesize

Multi-product: run the **Cross-repo** layer first and lock it before any
in-repo sketch. Single-repo: in-repo only. In-repo grain: inside the
hand-off chain, one sketch per pending todo in plan order, each grounded on
the earlier chosen sketches (not on code — none is written yet); for a
small change one sketch for the whole change is fine. Never interleave a
later sketch with fill-in.

### Ground

The parent reads, for the repo(s) the layer covers:

- The plan: **Acceptance criteria**, **Seams**, **Approach**, **Out of scope**, the playbook's extra sections (**Root cause**, **Safety net**). The sketch serves these, never widens them.
- Analogous existing features — where their pieces live, naming, layering. Existing types and utilities to reuse. Constraints: public API, persisted shapes, events, configuration, tests that pin behaviour.
- `AGENTS.md` style authorities and the `ai-project-knowledge/` files the plan's **Project knowledge → Read** names.
- The principles whose **Applies when** line matches this design (`SKILL.md` § Principles): always `foundational-thinking.md`, `model-the-domain.md`, `type-system-discipline.md`, and `boundary-discipline.md`; `subtract-before-you-add.md` when the sketch replaces an existing shape; `experience-first.md` when it adds or changes a public API, library interface, event, configuration option, or UI; `make-operations-idempotent.md` when it changes state from an event consumer, a retried call, a scheduled job, a migration or import, or a multi-step command; `separate-before-serializing.md` when two writers (requests, replicas, consumers, jobs, services) can change the same data at once; `minimize-reader-load.md` when it adds a layer, wrapper, adapter, interface, or long-lived state, and always in the Refactor playbook; plus any repo-local principle that matches. Name the ones left out. Do not invent principles.
- Unfamiliar subsystem or a placement / layering doubt → the `how` skill, read-only.
- Cross-repo layer also: how the repos already talk (HTTP, library dependency, events, shared DTOs), producer and consumer roles, version-bump sites, the plan's **Merge plan**.
- In-repo layer after Cross-repo: the chosen Cross-repo sketch verbatim. In-repo sketches honour it and never re-decide its ownership.

Output: one **grounding brief** — problem, plan contracts, repo-relative
paths of analogous code, reusable types, constraints, out of scope, the full
text of the principle files chosen above, and (when it exists) the Cross-repo sketch.
Every perspective gets the same brief.

### Perspectives

Launch the perspectives **in parallel** in one message, read-only
subagents, one per model. Each prompt is self-contained (it has no chat
context): the grounding brief, absolute repo root(s), plan path, `{KEY}`,
the active sketch format below, and:

- Read-only. No file writes, no shell commands that change state.
- Start from how the change will be called: sketch two or three call sites in the code that will use it, and let the types follow from those.
- Model the domain (`model-the-domain.md`): before choosing types, state what the code must never allow and how the data will be read, then pick the structure that encodes exactly that (state machine, discriminated union, registry, a module that owns one concept). Keep the shape plain when it is already local and will not grow.
- Return one candidate in the active format, a one-line design stance, a **structural fingerprint** (one line per axis below), and `Principles:` — which it used and any it would break, with why.
- Aim for the best fit with the existing code and the principles, not for originality. Commit to one clear shape; a cautious compromise between possible designs makes the comparison useless.
- Cross-repo prompts stay at integration grain (no class trees). In-repo prompts on a multi-product plan cite which Cross-repo contracts they implement.

**Models.** `--models <slug,slug,…>` → those. `--models N` → N perspectives.
Default **2**. Pick each from a **different model family** in the host's
subagent model list (for example one Claude, one GPT or Gemini); one may
share the family of this conversation. A requested slug the host does not
offer → skip it, say so, pick another family. Fewer than 2 runnable →
ask once. The host offers **one family only** → two different models of it
(for example the largest and a mid-size one), or the same model twice, with
opposite stances named in the prompt; record `Perspectives: single family`.
Host cannot set a model at all → run 2 perspectives on `inherit`
with opposite stances named in the prompt (for example "keep the decision in
the existing service" vs "introduce a new domain type that owns it"), and
record `Perspectives: inherit ×2 (host cannot switch)`.

### Design-it-twice gate

Model count is not candidate count: two models that converge on one shape
are **one** candidate. Gate before synthesis: **at least two structurally
distinct candidates** for this layer — also when the first looks sufficient;
the second is what tests it.

Distinct on **Cross-repo** only when they differ on at least one axis in a
way that changes which repo owns a decision, how repos connect, or the
published boundary:

| Axis | A real difference |
|---|---|
| Ownership | producer filters vs each consumer filters; shared helper vs a copy per service |
| Boundary style | library bump vs versioned HTTP API vs event; sync vs async hop |
| Contract shape | empty-list semantics; omit vs error; which DTO or header is the source of truth |
| Compat / land order | break-then-bump vs dual-read window; which PR must merge first |
| Decomposition | new cross-cutting service vs extend the existing producer and consumers |

Distinct **in-repo** only when they differ on at least one axis in a way
that changes module boundaries, class shapes, or public signatures:

| Axis | A real difference |
|---|---|
| Decomposition | which modules or classes exist and what each owns; modules by domain concept vs by processing phase |
| Decision ownership | the core rule in the controller vs a domain service vs a persistence constraint |
| Flow | sync call vs event; pipeline vs orchestrator; push vs pull |
| Type model | exceptions vs a result type; one polymorphic type vs separate types; mutable entity vs value |
| Extension point | strategy vs conditional branch; new endpoint vs extending an existing one |

Not distinct: renames, field order, a different private-helper split, the
same classes in other packages, a different library behind the same shape.

1. Group candidates by fingerprint; print the groups (`A: claude, gpt · B: gemini`) and the separating axis.
2. Two or more groups → synthesize.
3. One group → a **forced alternative**: a fresh perspective on another model (or the same subagent resumed) gets candidate A and "Design a structurally different candidate. Change at least the `{axis}` axis; same brief, same plan contracts. A variation of A is not acceptable." The parent names the axis where A's choice is least forced by the existing code.
4. Still one group after **2** forced attempts → print which existing constraint pins each axis. Standalone or `--checkpoint`: ask once — accept the single candidate, or name an axis to explore. Inside the chain without `--checkpoint`: proceed, and record `Forced: {why}` on the sketch. Never proceed silently.

### Synthesize

Print, in chat:

1. **Candidates** — per distinct candidate: fingerprint, models behind it, strongest and weakest point against the plan contracts and the existing code.
2. **Consensus** — what every candidate agrees on. Keep it.
3. **Divergences** — per decision point: the options, who proposed each, the tradeoff, **pick + why**. Fit with existing code, plan contracts, and named principles beats elegance. A pick that breaks a principle needs a one-line why, or it is rejected. On a tie, prefer the candidate whose callers need to know less, judged from the caller's side (`experience-first.md`). Count against a candidate that adds a branch to an existing chain, a second boolean that must stay in sync with another, or modules named after processing phases (`model-the-domain.md`), and against one that adds indirection without removing branches, duplicated rules, or invalid states. Also count against pass-through layers, single-caller wrappers, and state that must be kept in sync (`minimize-reader-load.md`).
4. **Chosen sketch** — one candidate or a merge, in the active format. Never splice incompatible halves; a loser goes under **Rejected shapes** with its reason.
5. **Credits** — one line per model: stance, and what was taken from it.

## Sketch formats

### Cross-repo (multi-product only)

Integration grain. No class or package trees.

1. **System map** — each repo id a node; edges = how they connect (dependency, HTTP, event, shared schema). A short Mermaid `flowchart` or a bullet graph.
2. **Ownership** — which repo owns each public decision or contract. Consumers adapt; they do not re-own a rule. Data that more than one repo writes names its single writer, or the mechanism that serializes the writes (`separate-before-serializing.md`).
3. **Boundary contracts** — the seams between repos: library API, HTTP resource, event, configuration key that must stay stable or change together. Signatures and field lists, not class trees.
4. **End-to-end flow** — numbered: trigger → hops across repos → observable effect, naming the contract each hop uses, and for each hop that can be retried or redelivered, how the receiver recognises the repeat.
5. **Compat / merge** — land order against the plan's **Merge plan**; dual behaviour windows; version-bump sequence; what breaks if the order flips.
6. **Scenario mapping** — each Scenario / Requirement → the repos involved and the **one** repo whose black-box test asserts it.
7. **Open questions** — each with a recommended answer.
8. **Rejected shapes** — one line each.

### In-repo

Real code in the repo's language. Bodies **not implemented**
(`throw new UnsupportedOperationException("not implemented")`, `TODO()`,
`raise NotImplementedError`, `throw new Error('not implemented')`) with the
logic as numbered pseudocode comments inside.

1. **Usage** — two or three call sites as the caller writes them. The types below must agree with them.
2. **Module boundaries** — new / changed files and packages as a short tree, each marked `new` or `changed`; what depends on what; which layer owns each decision. For data more than one writer can change at once (parallel requests, replicas, consumers, jobs): which writer owns which part, or the store-enforced mechanism that serializes writes to a shared invariant (`separate-before-serializing.md`).
3. **Types** — data shapes, enums, DTOs, domain types, with fields and nullability (`type-system-discipline.md`): invalid combinations that cannot be built, distinct types for values that share a primitive but differ in meaning, closed sets as sealed types or unions, and the schema, shared client, or DTO library each external shape comes from.
4. **Class shapes** — classes and interfaces, fields, injected collaborators, visibility.
5. **Function signatures** — parameters, return types, errors; body = stub + pseudocode.
6. **Flow** — numbered trigger → effect, naming the signatures. Mermaid only for branches or async hops. For each state-changing step that can be retried, redelivered, or interrupted: what a second run does, and what a run after a crash half-way through does (`make-operations-idempotent.md`).
7. **Scenario mapping** — each Scenario / Requirement this sketch covers → entry point and black-box test surface.
8. **Cross-repo honour** (multi-product) — which Cross-repo ownership, contracts, and hops it implements.
9. **Open questions** — each with a recommended answer.
10. **Rejected shapes** — one line each.

No line pins, no real bodies. Must not contradict the Cross-repo sketch.

## 3. Sign-off

| How architect was reached | Pause? |
|---|---|
| Started at this step (`/emporix-dev architect {KEY}`) | **Yes**, once per layer: show the synthesis and ask *sign off and write into the plan / push back / discard*. Silence is not sign-off. |
| Reached from an earlier playbook step, or by **Auto**, with `--checkpoint` | **Yes**, per sketch, same question. |
| Reached from an earlier playbook step, or by **Auto**, no `--checkpoint` | **No.** Print `cross-repo: chosen {A\|B\|merge} — {stance}` / `todo {id}: chosen … — {stance}` and record `Approved: auto`. |

Answers:

- **Sign off** → § 4.
- **Cosmetic tweak** (rename, field order, package name) → patch in place, show only the change, ask again.
- **Pushback** (wrong shape, wrong layer, missed constraint, a disagreement with a pick, "no") → **Reground**.
- **Discard** → write nothing; stop. Implement does not start without a sketch unless the playbook skips architect.

### Reground

Pushback means the grounding was wrong or incomplete. Do not patch the
sketch; redo the design.

1. Restate the pushback as constraints in one or two lines; confirm only when ambiguous.
2. Ground again: re-read the code the pushback points at, check the claim against code and plan. Add `Feedback round N: {constraints}` and the **rejected sketch** (with fingerprint and why) to the brief. A contradiction with code or plan → say so with evidence, and still redesign under the user's constraint unless they withdraw it.
3. **Fresh** perspective subagents (not resumed ones). The gate applies anew, and no candidate may match the rejected fingerprint on the axis the pushback targets.
4. Synthesize, plus: how each feedback point is addressed and the fingerprint diff against the rejected sketch.
5. Sign-off again. A Cross-repo change → mark every dependent `#### Todo {id}` sketch `stale` and re-run it.

Pushback that changes plan scope (a new or changed Scenario, a new repo, a
new public surface, an out-of-scope item) → stop designing;
`/emporix-dev update {KEY}` and re-approve first. Three reground rounds
without sign-off → ask once whether the plan needs `update`.

## 4. Write into the plan

Insert `### Design sketch` inside **Approved plan**, right after
`### Seams` (multi-product: after `### Merge plan`), in the local plan file
(multi-product: the dev-plan, then the slices — `references/multi-repo.md`
§ Slices). Keep everything else. Write
the file with `**Status:** approved` untouched; this is not a re-approval and
nothing goes to Jira.

```markdown
### Design sketch

Approved: {ISO date | auto} · Perspectives: {models} · Candidates: A ({fingerprint}), B ({fingerprint}) · Chosen: {A | B | merge}

#### Cross-repo            ← multi-product only, Cross-repo format
…

#### Todo {id}             ← one per sketched todo (or a single `#### Change` for a small change), In-repo format
Approved: … · Repo: {id — multi-product only}
…

#### Deviations            ← written by build.md; omit until the first one
```

Sketch-driven todo changes (a todo split, a new foundation todo) are written
to **Todos** with a `(from design sketch)` note. A new Scenario, new repo,
or new public surface is scope: do not write it; go to `update`.

Resolved open questions fold into the sketch; open ones go to the plan's
**Open questions** (a blocking one stops implement).

## 5. Report → implement

```text
architect: {done | skipped — reason} | layers: {cross-repo, in-repo} | sketches: {n} | perspectives: {models} | sign-off: {user | auto | checkpoint}
```

Then the playbook's next step (implement with `references/build.md`), in
the same turn. This also applies when the playbook was started at this step,
after sign-off.

## Do not

- Sketch against an unapproved plan, or treat design sign-off as `approve` (or the reverse).
- Synthesize from fewer than two structurally distinct candidates without the user's OK, or count model votes or renames as candidates.
- Skip the Cross-repo layer on a multi-product plan, put class trees in it, or re-decide its ownership in an in-repo sketch.
- Let perspective subagents write files.
- Answer pushback by patching the rejected sketch.
- Invent behaviour beyond **Acceptance criteria** or **Out of scope**.
- Write product code, commit, push, open a PR, or post to Jira.
