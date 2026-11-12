# Boundary discipline

**Applies when:** designing a public interface, handling validation or errors, or crossing a module, service, or repository boundary.

**Rule.** Check and convert data once, where it enters; inside, rely on the types and keep the business logic free of transport concerns.

- Turn requests, events, and other systems' responses into domain types at the entry point. Code behind that point does not re-validate what the type already ensures.
- Internal interfaces take and return domain types, not wire formats.
- Choose the interface that asks less of its callers: few entry points, with the complexity handled behind them.
- Let the compiler reject bad states when the language can express it. Where it cannot, fail fast at runtime. Documentation alone is the weakest guard.
- Each business rule has one home. Consumers follow the contract instead of repeating the rule.
- Calls and events that cross a boundary get retried and redelivered; how to stay correct when they do is `make-operations-idempotent.md`.
