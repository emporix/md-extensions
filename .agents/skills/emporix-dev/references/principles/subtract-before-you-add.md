# Subtract before you add

**Applies when:** restructuring code, replacing an existing design, or a change that keeps growing.

**Rule.** Clear out what the change makes obsolete first, then add only what the outcome needs.

- Removal is its own pass: unused code, wrappers with a single caller, checks that repeat a guarantee made elsewhere.
- A replacement design starts out leaner than what it replaces, and grows only as real needs appear.
- Leave unrelated code alone: no opportunistic refactors, version bumps, or reformatting.
- Replacing an API means moving all its callers and removing the old one together. Keep old and new side by side only for an explicit, time-boxed transition.
- Judge a restructure by whether the next reader has less to trace and hold (`minimize-reader-load.md`). If nothing got simpler to follow, revert it.
