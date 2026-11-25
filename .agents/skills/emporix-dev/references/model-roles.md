# Model roles

Which model each kind of `emporix-dev` subagent runs on. The developer sets
them once per machine in `~/.emporix/settings.json` `models.*`
(`emporix-setup` `references/local-settings.md` § Model roles); `emporix-dev`
only reads them. To change one, point at
`/emporix-setup --set-local models.<role>=…`, never edit the file from here.

| Role | Used by | Stage rule |
|---|---|---|
| `analyst` | The requirements review at the start of explore (Feature, Bugfix) | `references/requirements-review.md` |
| `explorer` | Read-only codebase sweeps delegated in explore, draft, and Investigation, and the `explore` subagent `how` launches | § Explorer below |
| `architect` | Design perspectives | `references/architect.md` § Perspectives |
| `coder` | The coder subagent of every build phase | `references/build.md` § Who writes the code |
| `reviewer` | The review panel for Review, re-ship, and PR comments | `references/review-loop.md` § Reviewer model |

## Resolve once, in setup

The host name is `claude-code` on Claude Code and `cursor` on Cursor; on
another host drop `--host` (only roles set for every host apply). One shell
call, with the shared loader sourced in the same call (shell state does not
carry between calls):

```bash
for d in "${EMPORIX_SKILLS_ROOT:-}" .agents/skills .claude/skills .cursor/skills \
         "$HOME/.agents/skills" "$HOME/.claude/skills" "$HOME/.cursor/skills"; do
  [ -n "$d" ] && [ -f "$d/emporix-setup/scripts/load-config.sh" ] && { LOADER="$d/emporix-setup/scripts/load-config.sh"; break; }
done
. "$LOADER" \
  && LS=$(skill_script emporix-setup local-settings.sh) \
  && for r in analyst explorer architect coder reviewer; do
       out=$(sh "$LS" models "$r" --host <host>) || { echo "$r=ERROR"; continue; }
       echo "$r=$(printf '%s\n' "$out" | paste -sd, -)"
     done
```

**Shell denied (plan mode).** Setup runs inside plan mode for explore,
draft, and update, and plan mode may deny `Bash` (`emporix-feature`
`references/plan-mode.md` § Shell). Then resolve by hand for this part of
the run: open `{home}/.emporix/settings.json` with the Read tool, using the
absolute home path (`~` does not expand there; missing file → no settings),
and apply the precedence below
with the built-in defaults table in `emporix-setup`
`references/local-settings.md` § Model roles. Mark the line
`Models (read by hand): …`. `EMPORIX_SETTINGS_FILE` cannot be read without
a shell, so an override path takes effect only when the script runs. Run the
script once plan mode has ended (at approve, with the loader) and use its
result for architect, build, and review; a role that differs from the
hand-read one is said in one line.

`local-settings.sh models <role>` prints the ordered list, one slug per line: the developer's
`models.<role>.<host>`, else `models.<role>` set for every host, else the
built-in default for that host (Claude Code only). Empty output means "no
list": the stage uses its own heuristic (the host's default subagent model,
or the reviewer pick order). `{role}=ERROR` is a malformed setting (the
script's message is on stderr): show that message, use the heuristics for
that role in this run, and point at `/emporix-setup --set-local`. Never read
`ERROR` as an empty list without saying so.

Precedence, first match wins: a flag on this run (`--models`,
`--coder-model`, `--review-models` / `--review-model`; `analyst` and
`explorer` have none) → the resolved list → the stage heuristic.

Print one line before dispatch, the lists joined by `→` (one used, the rest
fallbacks) or `+` (panels), and `host default` / `pick order` for an empty
one, for example:

`Models: analyst=opus→sonnet · explorer=sonnet→haiku · architect=opus+sonnet · coder=sonnet→opus · reviewer=opus+sonnet+haiku`

## Fallback

- A slug the host does not offer as a subagent model → skip it, take the next, say so in one line (`{role}: {slug} not offered — using {next}`).
- A subagent that fails to start or errors on its model (model unavailable, quota, API error) → launch it again on the next slug in the list, once per slug, and say so in one line. A wrong or weak answer is not a fallback trigger: it is handled by the stage (a deviation, a finding, a question).
- No slug left → the stage heuristic, said in one line. The host cannot set a subagent model at all → each stage's own rule: architect and review run on `inherit` and record it as before; build has the parent write the phases (`parent` in `coders=`).

## Explorer

Explore and draft (Feature, Bugfix, Refactor) and **Investigation** delegate
broad read-only sweeps (locating code, tracing a flow across many files,
listing callers) to one read-only subagent on the first `explorer` slug
(Claude Code: subagent type `Explore`, `model` = that slug; another host: its
read-only subagent type). Explore runs in plan mode, so the type must be
read-only. Its
brief is self-contained: the goal, the absolute repo root, what to find,
"read-only, return paths with line numbers and a short excerpt per claim".
When `how` runs from a playbook and launches its `explore` subagent for a
large subsystem, that subagent gets the same model.

The parent still opens the key files itself before it cites a seam, answers,
or drafts: a sweep's result is a map, not proof. A narrow lookup (one file,
one symbol) is done inline, not delegated.
