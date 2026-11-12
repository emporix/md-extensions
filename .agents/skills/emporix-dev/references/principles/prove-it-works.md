# Prove it works

**Applies when:** before calling something done, fixed, or faster, and before reporting any claim about the system.

**Rule.** "Done" means you watched the change do its job where it matters, and you can show how.

- A successful compile or a green pipeline is a starting point, not the proof. The proof is a test or a run that exercises the behaviour from the outside.
- A defect counts as fixed when the original reproduction now behaves correctly, in the same place it failed, not when some nearby test passes.
- Report a measurement (latency, size, count) only with how it was taken and what bounds it.
- Back each statement with its source (a file, a test, a command and its output), or mark it as measured, inferred, or a guess.
- When a check could not settle the question, report that plainly instead of calling it a pass.
