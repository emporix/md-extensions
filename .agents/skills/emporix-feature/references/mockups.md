# Load mockups for this ticket (implement step 2)

After the plan is loaded, look for design mockups for `{KEY}`. They are a
**visual spec** for UI in the plan’s change surface. They do not replace the
plan and they do not add features the plan forbids.

Missing mockups is fine. Do not stop. Do not invent a mockup.

## Find local folders

`MOCKUPS_DIR` is `.ai/mockups` (exported by the shared loader). Search **this** checkout, then the **primary** worktree
(`git worktree list`, first path) — mockups are often untracked.

Take every directory that matches any of:

1. `{MOCKUPS_DIR}/{KEY}-*` (preferred when a folder already exists)
2. `{MOCKUPS_DIR}/*` whose `brief.md` or `report.md` contains `Ticket: {KEY}`
   or the key as a whole word
3. An `Assets:` / `Mockup:` path from this conversation for the same key

Newest folder wins when several match. Open:

- every `mockup-*.png` (layout and flow)
- `brief.md` (assumptions, hierarchy, states)
- `report.md` if present

Do not treat `references/` current-state shots as the proposal. Do not open
HTML unless you need to check a detail the PNG does not show.

## Jira fallback

If no local folder: **get-issue** comments. An older `🤖 emporix-mockup-create`
comment means PNGs were published before that skill was removed. Use its
screen list and any PNG attachments you can see. Still prefer a local folder
when both exist. Do not run a mockup skill. New UI proposals are
`/emporix-design`.

## How to use them

- `ui` / `fullstack`: match the mockup’s layout, density, chrome, primary
  action, and named states for screens the **plan** already includes.
- The plan owns scope (what to build, paths, contracts). The mockup owns
  how those screens look and flow.
- Conflict on **behavior** or extra fields/routes the plan does not list →
  **stop** and ask. Do not silently widen the plan.
- Conflict on **spacing / hierarchy / copy placement** → follow the mockup.
- Backend-only change with no UI step → note `Mockups: ignored` and continue.

Record `Mockups: {folder or none}` in the implement report.
