# Test behaviour, not implementation

**Applies when:** writing, changing, or keeping a test.

**Rule.** A test checks the contract a client relies on. It should break when that contract breaks, and survive any rewrite that keeps it.

- Assert outcomes from outside: responses, emitted events, stored data read back through the public interface, what the user sees. Leave private helpers, call sequences, and query text out of assertions, unless one of them is the contract.
- One test, one path. Error paths get their own tests.
- Name a test, and any comment on it, after the behaviour it checks, so it reads without the ticket: `disallowedApiUrl_isRejectedWith400_nothingStored`, not `scenario2_…`. Plan numbers and ticket keys (`scenario3_`, `requirement12_`, `cop7151_`, `// COP-7151:`, `(Scenario 8)`) mean nothing once the ticket is closed, and the next ticket's Scenario 3 collides with them. Do not copy that numbering from neighbouring tests either.
- A new test that already passes before the change it is meant to cover proves nothing about that change. Rework it until it fails for the right reason.
- Before restructuring code, record its current behaviour in characterization tests and run them green on the untouched code.
- A behaviour change without a test change is not finished.
