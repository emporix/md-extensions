# Check skills

Find skills that are available but not installed, add the ones the user
picks, then update everything. Run from the product repo root.

## 1. Scope

Shared skills: use the scope they are installed in. `npx skills ls -g` lists
global, `npx skills ls` project. A skill from `emporix/emporix-ai-sdlc-skills`
in global → `-g`, else project. Repo-specific skills are always project scope.

## 2. Find new skills

- **Shared:** `npx skills add emporix/emporix-ai-sdlc-skills --list` minus
  the names in the installed list from step 1.
- **Repo-specific:** skipped when `repoSkills.enabled` is `false` (report
  `Repo skills: disabled`). Otherwise the folder listing from `repo-skills.md` (**Resolve**)
  minus the names in `repoSkills.skills` and in `npx skills ls`.

A failure in either (no network, no `gh`, no access) is reported as
`{group}: skipped — {reason}`; the other group still runs.

## 3. Ask

Nothing new → say "No new skills." and go to step 4.

Otherwise one question (AskUserQuestion, `multiSelect: true` when available)
listing every new skill as `name — first sentence of its description`,
grouped `Shared` / `{repo} only`. Options: each skill, plus **None — only
update**. Nothing selected means none.

## 4. Add, then update

1. Each picked shared skill:
   `npx skills add emporix/emporix-ai-sdlc-skills --skill <name> [-g] -y`
2. Each picked repo skill: the **Install** command in `repo-skills.md`, then
   add it to `repoSkills.skills` (sorted, show the diff).
3. `npx skills update -g` when shared skills are global, then
   `npx skills update -p`.

## 5. Report

```
Added:   {names or "none"}
Updated: {count from the update output}
Skipped: {group — reason, or omit}
```

End with: start a new session so the agent loads the new skill versions.
