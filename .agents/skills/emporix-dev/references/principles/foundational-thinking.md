# Foundational thinking

**Applies when:** designing types, interfaces, or module structure; deciding the order in which to build something; or deciding which state is shared.

**Rule.** Settle what the data looks like before writing what it does, and build the pieces everything else leans on before the features themselves.

- **Model first.** Write down the core types and how each important read and write walks through them. A plan to "add an index later" means the model does not fit the access pattern yet.
- **Spend design effort where change is expensive.** Boundaries, types, and ownership are hard to move later; function bodies are cheap to rewrite. Keep the bodies plain.
- **Share models, not lines.** Converge on one type per concept. Repeated short statements are fine; a helper extracted only to remove repetition is usually not.
- **Ask who else writes it.** Before two callers, processes, or services update the same data, decide what happens when both do; `separate-before-serializing.md` says how.
- **Foundations before features.** Shared types, test helpers, and configuration that later work depends on come first.
- **One concept per increment.** Each change adds or strengthens one abstraction instead of scattering a new capability across callers as special cases.
