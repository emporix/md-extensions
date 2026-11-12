# Fix root causes

**Applies when:** debugging, a failing test, a defect report, or code that keeps needing workarounds.

**Rule.** Follow the wrong behaviour upstream until you reach the assumption that broke, and change the code there, not where the error surfaced.

- Name both places: where the problem is seen, and where it starts. The fix goes to the second one.
- A check added where the symptom appears is only correct when the state it catches can legitimately happen. Otherwise it hides the defect.
- When two causes fit the evidence, do not pick one. Say what observation would separate them, and get it.
- Do not ship speculative changes "just in case". Keep only what the evidence shows is needed; undo the rest.
- If two attempted fixes failed and both relied on the same belief about the system, check that belief directly before trying a third.
- When the design keeps fighting the code, question the design instead of adding exceptions to it.
