# Test gate — local full suite

The definition is `emporix-feature` `references/tests.md` § Execute, **PR shape**. This file only says when `apply` runs it. Hard requirement in `apply`: before the plan-conformance gate and Bugbot count toward ship, and again before ship when product / test files changed after the last green run (Bugbot fixes, format). CI green alone is **not** enough; never push hoping remote checks catch regressions.

## What "full suite" means

Run **locally** every suite the project uses for a PR:

| Layer | Include when |
|---|---|
| Unit | Always, when the repo has a unit test task |
| Integration (`integrationTest` / `intTest` / IT / e2e used in PR CI) | Always, when the repo has a separate task |
| `validation.commands` (`ai-setup.json`) | Always, in order, after the suites |

Touched-file-only, a single `--tests` class, or unit-only when integration exists → **not** a completed gate.

## Resolve commands

`AGENTS.md` **Commands** / **Tests** first; then `validation.commands`; then build files (`build.gradle`, `pom.xml`, `package.json`) for `test`, `integrationTest`, `intTest`, `check`, `verify`. Both missing → **stop**; do not guess.

Illustrative only (use the repo's real tasks):

```bash
./gradlew test && ./gradlew integrationTest      # Gradle services
npm test                                           # frontend, plus any PR e2e script
```

## Pass / fail

1. Every layer present must exit 0. New and extended tests are part of the run.
2. Red because of this apply → fix regressions **inside the plan surface**, re-run the **full** suite (not only the failing test).
3. Red for a reason outside the plan (unrelated / flaky) → **stop**; report; do not expand scope; do not rewrite unrelated tests to go green; do not ship.
4. Do not start the conformance gate or Bugbot while red.
5. After format or any later product / test edit → re-run the full suite before the ship gate.

Record the exact commands and results; the `pr` stage reuses a green run on an unchanged tree.
