# Separate before serializing shared state

**Applies when:** two or more writers can change the same data at the same time: parallel requests, service replicas, event consumers, scheduled jobs, other services, or agents and scripts writing the same file, branch, or key.

**Rule.** First remove the sharing: give each writer its own state and combine on read. Only when one shared value is a real invariant, serialize the writes with a mechanism the system enforces, not with a convention.

- **Find the shared write targets.** List every document, row, key, file, or branch that more than one actor writes. Something one actor writes and others only read is not the problem.
- **Ask whether they need one object.** Often each writer is recording its own fact (its status, its last run, its count). Give each its own document, key, or field set owned by that writer alone, and merge at read or report time. Two writers updating different fields of the same document with a read-modify-write of the whole document still share it.
- **Serialize only a real invariant.** When the rule is genuinely about one value (stock that must not go below zero, one active cart per customer, a unique code), enforce it where the data lives: an atomic conditional update (`$inc` with a filter, compare-and-swap), optimistic locking with a version or ETag, a unique index, a single-writer consumer per key, or sequential phases.
- **Read-modify-write is a race.** Reading a value, changing it in code, and writing it back loses updates under concurrency. Use the store's atomic operations, or check a version on write and retry on conflict.
- **Conventions are not concurrency control.** "Only one instance runs this job", a comment, or a code-review rule does not stop two replicas from running at once. If one writer is required, make it structural: a lease with an expiry, a partitioned consumer, a lock the store enforces.
- **A lock is a design question.** "We need a lock" first means "why do these two write the same thing?". Reach for the lock only after separating has been ruled out, and say what holds it, for how long, and what happens when the holder dies.
