# Playbook: @emporix/component-library

Repository `emporix/component-library`, default branch from `origin/HEAD`.
Shared React UI for the Management Dashboard (MD), its extension remotes, and
other Emporix frontends.

## When this runs

When migrating a module from MD, use library components by default. This
playbook runs for each component the module needs that the library does not
export, and for any reusable primitive other work needs. Components tied to
routing, permissions, or domain data are app composites: they stay local and
need no interview.

## Interview (step 2)

1. Should the component be added to `@emporix/component-library`
   (recommended), or migrated as it is into this project?
   - **As it is:** copy it into the consuming project with CSS Modules styles,
     and replace any `primereact` imports with library equivalents. Stop.
2. Library checkout location (`workflow.md` step 2).
3. Scope and build pattern. Follow the library's own
   `migrate-to-component-library` skill: it asks whether to build a custom
   component or wrap a PrimeReact widget — ask that question as it is written
   there. Also confirm the props, which consumers will switch to it, and that
   app dependencies (`react-i18next`, router, permissions) stay out — labels
   and callbacks become props.

## Implement (step 5)

Follow the library's `CLAUDE.md` and its `migrate-to-component-library`
skill, with the conventions summary from step 3. Where that skill names a
consumer module as its pilot, read it for behaviour only
(`conventions.md`). The library usually expects:

- The component in its own folder under `src/components/` with a colocated
  `*.module.scss` that uses CSS variables.
- Tests and a Storybook story.
- An export from the package entry.

Checks, as in the library's CI (`.github/workflows/ci-cd.yml`); use the
library's own list when its instructions differ. `build:lib` is a
Vite build that does not fail on type errors, so `type-check` runs on its
own:

```bash
npm run format:check && npm run lint && npm run type-check \
  && npm run test -- --run && npm run build:lib && npm run build-storybook
```

## Release notes

The version bump and changelog go in the change's own PR, as the library's
`version-bump-for-features` and `changelog-on-version-bump` rules require. Its
`release-and-publish` rule governs the rest — CI green
(`scripts/wait-for-ci.sh`), then the `v{version}` tag — with the tag on the
PR's merge commit instead of a release commit pushed to the default branch. A
new component is a minor version bump. Never tag before CI is green.
