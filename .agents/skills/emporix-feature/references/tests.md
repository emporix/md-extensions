# Tests (mandatory)

A run without **written** tests and without **executing** the existing suite is a failed run. Do not skip, defer, or ship "and add tests later". The same gate runs after every review fix and before the PR.

## 1. Write tests

- Each **Scenario** and testable **Requirement** needs a black-box assertion with the same observables (API request and response, public event, UI state). The Scenario todo is not done without that test.
- Tests must not couple to private helpers, exact SQL, or internal call order unless the plan says that detail is the public contract.
- Prefer the project's black-box layer (API / integration / contract tests) for Scenario coverage. Match `AGENTS.md` location and pattern (`*.spec.ts`, `__tests__`, …).
- A legacy plan's **Tests** section is required work, same as its **Implementation steps**. **Extend** the files it names. **Add** files when it says add.
- If the plan states no behaviour change, still cover any contract the todos change.
- Match neighbouring tests (names, setup, assertions). Do not introduce a new runner or framework.
- Greenfield / no test harness in `AGENTS.md` → **stop** and say so. Do not invent a stack. "No tests in the plan" is not permission to skip.

A production-only change with no test diff is **not done**. Edits under `ai-project-knowledge/` and `PROJECT.md` are documentation; they need no test and do not count as the test diff.

## 2. Execute the existing suite

Writing tests is not enough. Run the suite that already lives in the repo.

1. Run every command in `validation.commands` (`ai-setup.json`) in order.
2. If that list has **no test command**, run the `AGENTS.md` **How to run** / test script. If both are missing, **stop**.
3. Prefer the full existing suite (the repo's `test` / `pytest` / `go test` script), not only the new file, unless `AGENTS.md` says a narrower command is the gate. For the PR gate, run every suite `AGENTS.md` **Tests** lists for a PR (unit **and** integration when both exist, e2e when PR CI runs it).
4. New or extended tests must be included in that run.

Any non-zero exit is a gate failure. Failures this change caused → fix in scope and re-run. Failures clearly outside scope → **stop**; do not rewrite unrelated tests to go green. Flaky or unrelated → ask the user once before skipping; do not guess away a red suite.

## 3. Report

Name the test files you added or extended, the exact commands you ran, and pass/fail for each. Knowledge, review, and the PR wait until both write + execute passed.
