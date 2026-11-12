# Model the domain

**Applies when:** choosing the structure behind stateful logic, a lifecycle, or a growing set of cases; or when code branches a lot, or several files repeat the same assumption about a shape.

**Rule.** Let one data structure carry the domain's rules, so invalid states cannot be built and the branches that guarded them disappear. Decide this while designing; afterwards it becomes a refactor that keeps getting postponed.

- **Start from the constraints.** Before picking types, write down what the code must never allow and how the data will be read. Pick the structure that encodes exactly that.
- **States, not flags.** A lifecycle with phases is an explicit state machine (an enum of states and the allowed transitions), not booleans or status checks spread across callers.
- **Cases in one place.** A set of variants is a discriminated union, a registry, or a lookup table, not an `if`/`switch` chain repeated in several files.
- **Changes as commands or events.** When many places mutate the same state, route them through one reducer or command handler instead of ad hoc updates.
- **Modules by domain knowledge, not by phase.** A module owns one concept with its rules and invariants. Modules named after steps (load, validate, transform, save) copy the same rules into every step; execution order is not ownership.
- **Fit the access pattern.** Use the queue, index, cache, tree, graph, or normalized collection that matches how the data is read and written.
- **Do not force it.** If the current shape is already clear, local, and unlikely to grow, keep the plain code. An abstraction that adds indirection without removing branches, duplicated rules, invalid states, or lifecycle risk is a cost, not a model.
- **Signs it was skipped:** a new feature adds one more branch to an existing chain; a second boolean must stay in sync with the first; modules named after phases each repeat the same domain checks.
