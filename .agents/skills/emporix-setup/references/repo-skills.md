# Repository-specific skills

Some skills belong to one product repo only. They live in the skills source
repo under `skills-repository-specific/{repository-name}/{skill}/` (rules:
`skills-repository-specific/README.md` there). Setup installs the ones for **this** repo.

## Resolve

1. `REPO` = `repoSkills.repository` from `ai-setup.json`, else the `name`
   part of `git remote get-url origin` (`git@github.com:emporix/emporix-showcase.git`
   → `emporix-showcase`). No origin → skip and report `Repo skills: skipped — no origin`.
2. `SOURCE` = `repoSkills.source`, default `emporix/emporix-ai-sdlc-skills`.
3. List the folder:

   ```bash
   gh api "repos/$SOURCE/contents/skills-repository-specific/$REPO" --jq '.[] | select(.type=="dir") | .name'
   ```

   404 → this repo has none; omit `repoSkills.skills` and report `Repo skills: none`.
   Any other failure (no `gh`, no access) → soft failure, report
   `Repo skills: skipped — {reason}`. Nothing else in the run depends on it.

## Install

For each listed skill, project scope, same agent flags the user used for the
shared skills:

```bash
npx skills add "https://github.com/$SOURCE/tree/master/skills-repository-specific/$REPO/<skill>"
```

Write the installed names to `repoSkills.skills` (sorted). A name in
`repoSkills.skills` that is no longer in the source folder is reported as
`removed upstream — delete .claude/skills/<skill> or .agents/skills/<skill>`;
setup never deletes it.

`repoSkills.enabled=false` skips this whole step.

## Update

`npx skills update -p` refreshes installed repo skills like any other.
New skills added upstream: `/emporix-setup` → **Check for new skills and updates** (or `--check-skills`), see `check-skills.md`.
