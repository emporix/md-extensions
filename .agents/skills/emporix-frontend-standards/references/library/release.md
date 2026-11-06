# Release (step 6)

Both libraries ship the version bump inside the change's own pull request:
one `{KEY} Release {version}` commit with `package.json`, `package-lock.json`,
and `CHANGELOG.md` on top of the change (component-library:
`version-bump-for-features` and `changelog-on-version-bump`; api-calls: the
same commit shape throughout its history). The tag then goes on the merge
commit. Never push a release commit to the default branch and never open a
separate release PR. The library's own rules win on the bump type, the
changelog format, and the checks.

Steps 1–2 also run when the user declined to release but asked for a PR;
then stop after step 2. Steps 3–6 run only after the user said yes to
releasing right away. cwd = the library worktree throughout.

1. **Version.** Propose the semver bump (new method or component → minor;
   fix → patch; breaking → major) and confirm the number with the user as
   `VERSION`. Set `version` in `package.json`, sync the lockfile
   (`npm install --package-lock-only`), and add the `CHANGELOG.md` entry the
   library's changelog rule or skill describes. Rerun the playbook checks.
2. **Pull request.** Commit the change with `sh "$COMMIT" "{KEY} {summary}"`,
   then the release metadata with `sh "$COMMIT" "{KEY} Release $VERSION"`.
   Push the branch and open a PR into `$LIB_BASE`; record the URL that
   `gh pr create` prints as `LIB_PR`. Merge it yourself only when the user
   says so; otherwise wait until the user says it is merged.
3. **Merge commit.** Take the commit the merge produced (a merge, squash, or
   rebase merge all report it) and check it carries the version and is not
   tagged yet:

   ```bash
   git fetch origin --tags
   SHA=$(gh pr view "$LIB_PR" --repo "$LIB_REPO" --json mergeCommit -q .mergeCommit.oid)
   [ -n "$SHA" ] || { echo "$LIB_PR is not merged" >&2; exit 1; }
   [ "$(git show "$SHA:package.json" | jq -r .version)" = "$VERSION" ] || { echo "$SHA does not carry version $VERSION" >&2; exit 1; }
   [ -z "$(git ls-remote --tags origin "refs/tags/v$VERSION")" ] || { echo "v$VERSION already exists" >&2; exit 1; }
   ```

   A failed check → stop and ask the user; do not bump again on your own.
4. **Wait for CI on the merge commit.** Do not tag before every CI run for
   `$SHA` on the default branch has passed. Prefer the library's own wait
   script when it has one (component-library:
   `bash scripts/wait-for-ci.sh "$SHA"`); otherwise:

   ```bash
   gh run list --repo "$LIB_REPO" --branch "$LIB_BASE" --commit "$SHA" \
     --json databaseId,workflowName,status,conclusion
   gh run watch <databaseId> --repo "$LIB_REPO" --exit-status   # once per run listed
   ```

   A run that fails → stop and report it. No run appears for `$SHA` within a
   few minutes → ask the user whether CI runs on the default branch before
   tagging.
5. **Tag.** Only after step 4 passed: create and push `v{version}` on the
   merge commit (`git tag "v$VERSION" "$SHA" && git push origin "v$VERSION"`).
   It must equal `package.json` `version` at `$SHA` exactly; the publish
   workflow rejects a mismatch.
6. **Verify the publish.** Find the run the tag started by the tagged commit
   (`$SHA`) — not by `--branch`, which filters by branch and may miss a
   tag-triggered run — then watch it and confirm the version is on npm:

   ```bash
   gh run list --repo "$LIB_REPO" --workflow publish.yml --commit "$SHA" \
     --event push --limit 1 --json databaseId,headBranch,status,conclusion
   gh run watch <databaseId> --repo "$LIB_REPO" --exit-status
   npm view "$PKG@$VERSION" version
   ```

   The run may take a few seconds to appear after the tag push; list again
   before concluding there is none. Its `headBranch` should read `v$VERSION`.

   Failure → report the error with the failing step. Do not retag, delete the
   tag, or republish without the user.

Then continue with `consumer.md`.
