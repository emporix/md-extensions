# Minimize reader load

**Applies when:** shaping or reviewing code structure, adding a layer, wrapper, adapter, interface, or long-lived state, or when code is hard to trace.

**Rule.** Code is maintainable when a reader can understand it with little effort. Measure two things: the **layers to trace** between a question and its answer, and the **state to hold** in their head while reading. Line counts, complexity scores, and architecture diagrams are only proxies for these.

- **Both axes count.** A flat file full of shared mutable fields is as hard to follow as a six-layer stack of adapters. Fixing one by making the other worse is not progress.
- **Collapse layers that do not pay.** A wrapper with one caller, an interface with one implementation and no real seam behind it, an indirection added "in case we need it": inline them.
- **Each layer changes the abstraction.** A layer that takes the same arguments and calls the same methods as the one below it only adds a hop. A good layer hides a decision, so its interface is smaller than what it covers.
- **Shrink state scope.** Prefer return values over mutation, locals over fields, fields over shared module or static state, and static state over globals. Compute a value from its source instead of keeping a copy in sync.
- **State an invariant once, at the boundary** that enforces it, so readers learn it in one place instead of rediscovering it in every caller.
- **Make every addition pay its way.** Before adding a layer or a piece of state, check that it saves readers elsewhere at least as much as it costs here.
- **The test:** a new reader, human or agent, can answer "where does this value come from?" and "what can change it?" within half a minute. If not, cut layers or cut state.
