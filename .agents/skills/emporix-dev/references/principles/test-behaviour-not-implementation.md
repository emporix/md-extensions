# Test behaviour, not implementation

**Applies when:** writing, changing, or keeping a test.

**Rule.** A test checks the contract a client relies on. It should break when that contract breaks, and survive any rewrite that keeps it.

- Assert outcomes from outside: responses, emitted events, stored data read back through the public interface, what the user sees. Leave private helpers, call sequences, and query text out of assertions, unless one of them is the contract.
- One test, one path. Error paths get their own tests.
- A new test that already passes before the change it is meant to cover proves nothing about that change. Rework it until it fails for the right reason.
- Before restructuring code, record its current behaviour in characterization tests and run them green on the untouched code.
- A behaviour change without a test change is not finished.
