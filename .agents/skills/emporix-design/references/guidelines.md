# Design guidelines

Rules have a **scope**. Read all layers at the start of every design:

1. **Global** (this file): hold for every product area and project, for
   example WCAG control, structure, reporting.
2. **Area**: hold for one product area only, for example the B2B Commerce
   Frontend's feedback component. Resolve the area first
   (`areas/README.md`: read-only fingerprint match in `areas/registry.json`) and read its rule file.
3. **Catalog** (`${DESIGNS_DIR}/decisions.json`): confirmed guidelines and
   decisions, each with an `area` (an area id or `global`) and, for
   issue-specific decisions, the design they belong to.

A rule never leaks across scopes: area rules do not apply in another area,
issue-specific decisions do not apply to other designs. An override names the
rule it replaces (`"overrides": "G-6"` or `"overrides": "BCF-1"`).

## Global rules

### G-1 Structure: sections, happy path first

A generated Figma page is organised in **Sections** (the canvas containers,
like the library's own `Company - Company Details` section). One section per
feature or area, named `{KEY} - {Feature}`.

| Section | Contains | Name |
|---|---|---|
| Happy path | the main flow in order: view, edit, success | `{KEY} - {Feature}` |
| Responsive | the happy-path screens at the other viewports (G-13) | `{KEY} - {Feature} - Responsive` |
| Error handling | validation failures, server/save errors, empty, permission denied | `{KEY} - {Feature} - Error Handling` |
| Side flow | optional or branching flows, each separate | `{KEY} - {Feature} - {Side flow}` |
| Proposals | local `proposal/` components (not in the library) | `{KEY} - Proposal components (not in the library)` |

- The happy path comes first (top), then the responsive section, then error
  handling, then side flows, then proposals, stacked vertically with at least 300px between sections.
- Frames inside a section run left to right in flow order, 160px apart, 100px
  padding. Keep the frame numbering (`01`, `02`, `04-2`).
- **Reuse a matching container.** Before creating a section, look in the
  target file (and its page) for a section or page for the same feature;
  put the new frames there instead of creating a duplicate. Never rename or
  move existing sections of someone else.
- The Notes frame stays outside the sections, at the left of the first one.
- Several features in one ticket: one happy-path section and one
  error-handling section per feature.

### G-3 Meaningful breadcrumb

Every page that has a breadcrumb gets a meaningful one; its last item is the
current page and not a link. Placeholders from prior art are replaced.

### G-4 No placeholder content

Replace placeholder text from prior art (`Link`, `Current page`,
`Company Name`, lorem ipsum, `Placeholder`) with real content. The same
context value is identical everywhere on a page.

### G-5 Error cases are designed

Every form with required or format-checked fields gets a validation screen;
every save/submit gets a failure screen; both live in the Error Handling
section. Use the library field's error state and error text.

### G-6 Accessibility (WCAG 2.1 AA)

WCAG 2.1 AA wins over prior art by default; deviations are `[DEVIATION]`,
user-chosen prior art is `[WCAG-REPORTED]` (see `accessibility.md`). This is
global: no area rule may relax it without the user choosing prior art for a
named pattern.

### G-7 Records and reports

Decisions go in `decisions.json`, library gaps in `gap-report.md`
(`decision-catalog.md`). Every report and message includes the Figma file URL
and `?node-id=` links to each section and screen. Committed files never
contain Figma links, file keys or node ids; use area aliases and hashes
(`areas/README.md`).

### G-8 Components come from documentation

Choose components by the library's documentation page and apply its
documented behavior (`build-in-figma.md`).

### G-9 Provenance: a separate design file explains where it came from

When you generate a separate Figma file (not a page inside the team's own
file), leave enough information **in the file** that a later session, human or
agent, can tell which prior art it is based on and resume the work. In the
Notes frame of every design page add a **Provenance** block, and in a file with
several tickets add an `About this file` page that lists them:

- **Area** (id and name) and how it was resolved
- **Prior art**: per source the file name, role (library, work-in-progress),
  the Figma link, the library name, and the date it was read
- **Guidance**: file and node, or "none" and why
- **Documentation pages used** (names) and the key components imported
- **Ticket(s)** and a one-line brief, the generating skills, and the date
- **Records**: the design slug and the `DEC-`/`GAP-` ids; where the
  `.ai/designs/<slug>/` folder lives
- **Facts to re-verify**: things observed that can change (unpublished
  components, spec behavior)

Format of the block: each of **Prior art**, **Guidance** and **Integration
target** is a header line that itself carries the hyperlink (a Figma hyperlink
on the whole header text, not on every mention and not a raw URL), with plain
text beneath. The Notes are written for a reader who has no access to the
local records: state decisions in plain words and **never cite `DEC-`, `GAP-`
or `WCAG-` ids** in the Figma file (those ids belong to `brief.md`,
`report.md` and the catalog).

**Integration target.** Say where the design should be merged back. If the
prior art is a **design** file, merge into that file. If it is a **release**
(the published library), merge into its **design equivalent** (the
registry's `integratesInto`, for the storefront the DESIGN file), on the
matching page and section, and say what must be replaced there (local
`proposal/` components, workarounds). Keep frames merge-ready: sections named
per G-1, library instances and bound variables only, local components
isolated in their own section.

Figma links and file keys belong in the Figma file only. Committed files keep
using aliases and fingerprints (G-7). The Figma MCP cannot rename an existing
file: name a new file with every ticket key it will hold plus
`Generated Designs` at creation, and when a ticket is added to an existing
file, tell the user the new name to apply by hand.

### G-10 WCAG references are hyperlinks (global)

Every WCAG criterion named in a Figma Notes frame is a hyperlink to the W3C
Understanding page, and the accessibility header links to the specification;
words that name a library rule being followed link to that documentation
(`wcag-links.md` has the map and the procedure). Applies to every product
area.

### G-11 Jira ticket keys are hyperlinks (global)

Whenever a Jira ticket key is quoted, hyperlink it to
`https://emporix.atlassian.net/browse/<KEY>` (site from `jira.site` in
`ai-setup.json`, `JIRA_SITE` from the loader, default `emporix.atlassian.net`): Figma Notes frames
(hyperlink on the key), chat reports and summaries (Markdown link), and
`report.md`. This covers `COP-` keys and any other key of that Jira site
(`CIO-` and so on). Section and frame names stay plain text.

### G-12 Tables show their pager (global)

Every design that shows a table or list also shows how its pager control
looks (page position, previous/next, disabled state on the first/last page),
even when the sample has few rows: use sample data that implies more than one
page. Use the product area's own pager (see the area file); if the pager
component is not importable, compose it locally and report the gap.

### G-13 Responsive part is always present (global)

Every design includes the responsive versions of its **main flows** (the happy
path screens) at the standard viewports of the product area's prior art. They
get their **own section** next to the happy-path section
(`{KEY} - {Feature} - Responsive`); Error Handling and the other sections follow
after it. Error and side-flow screens get responsive versions only when they
feature a component not already shown responsively (a Notification or a
validation error does not count). Layouts follow the prior art's responsive
behavior (header, menu, tables, footer); where a part has no responsive
variant, say so in the Notes.

## Area rules

Live in `areas/<area>.md` (registry: `areas/registry.json`):

| Area | Rules |
|---|---|
| B2B Commerce Frontend | `areas/b2b-commerce-frontend.md`: BCF-1 Notification for feedback, BCF-2 selected company in the header, BCF-3 submit enabled with errors on submit, BCF-4 heading levels, BCF-5 breadcrumb label (Account Details), BCF-6 German layer, BCF-7 My Account list structure, BCF-8 ten list items, BCF-9 icons on buttons, BCF-10 viewports, BCF-11 stacked mobile tabs |
| Management Dashboard | `areas/management-dashboard.md`: no rules yet |

Unknown area (no fingerprint match): apply global rules only, ask which
area this is, and offer to register it.

## Rule intake: scope, or ask

Users give design comments while a design is being made. For each comment
decide the **scope** and say it in one line with the reason:

| Scope | Signs | Action |
|---|---|---|
| **Global** | Quality or process that holds for every product: accessibility, structure, reporting, honesty about gaps | Add to this file or as a catalog `guideline` with `"area": "global"` |
| **Area** | Tied to one product's design system or behavior: a library component, a product pattern, its context (selected company, storefront header) | Add to the area file (next `<PREFIX>-n`) and a catalog `guideline` with that area |
| **Issue-specific** | Mentions this story's data, wording, fields, business rule, or "in our case" | Normal decision in the catalog scoped to this design |
| **Unsure** | Could sit in two scopes, or the area is unknown | **Ask** (one batched question with a recommendation) before saving. Until answered, treat it as issue-specific and say so |

When a comment mixes scopes, split it. Never widen a rule's scope silently
(issue → area → global), and never narrow a confirmed one silently. Moving a
rule between scopes needs the user's say-so
(`/emporix-design --action refine --decision <id> --area <area|global>`). A rule
overrides prior art unless the user says otherwise.

## Pending confirmation (scope not yet decided)

Keep this list current. Each item behaves as issue-specific until answered.

- (none)
