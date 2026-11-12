# Make operations idempotent

**Applies when:** designing anything that changes state and can run more than once or stop part-way: an event or Pub/Sub consumer, an HTTP call a client or gateway may retry, a scheduled job, a migration or import, a multi-step command, a startup or shutdown step.

**Rule.** An operation reaches the same correct end state however many times it runs and wherever the previous run stopped. Retries, redeliveries, crashes, and restarts are normal, not exceptional.

- **Ask the two questions.** For every state-changing step: what happens if it runs twice in a row, and what happens if the previous run died at any point inside it? "It depends on what the last run left behind" means the step needs a reconciliation.
- **Reconcile, do not replay.** Read the current state, compare it with the goal, and apply only the difference. A step written this way finds nothing to do on a repeat. Prefer "set to X" over "add one", and upsert by a natural or client-supplied key over blind insert.
- **Recognise duplicates by identity.** A redelivered event or a retried request carries something that identifies it: an event id, an idempotency key, the resource id in a `PUT`, a version. Use it to detect the repeat; do not rely on timing or on "this rarely happens".
- **Leftovers must look stale to the next run.** A lock, a claimed job, a temporary file, a half-written record: the next run must be able to tell it is abandoned, using evidence that holds wherever the previous run stopped (an expiry, an owner that no longer exists, content that can be compared). A marker only a human can judge turns every crash into manual cleanup.
- **Make the final step atomic.** Write to a temporary place and move it into position in one step; commit the state change and the record that it happened together (a single document update, a transaction, an outbox). Avoid windows where the effect happened but the record of it did not.
- **Side effects outside your store need the same care.** An email, a payment, a call to another service: record the intent first (an outbox entry), send it with an idempotency key the receiver honours, and mark it done only after the receiver confirms. A re-run resends what is still pending, and the key makes that resend harmless.
