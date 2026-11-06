# Refining and re-applying decisions

Decisions and gaps live in `${DESIGNS_DIR}/decisions.json` and
`${DESIGNS_DIR}/${SLUG}/gap-report.md` (shapes:
`references/decision-catalog.md`). This playbook changes their status and
applies the change to every design that uses them.

## Invocation

```
/emporix-design --action refine --decision DEC-001 --status accepted
/emporix-design --action refine --decision DEC-001 --use B          # switch to alternative B
/emporix-design --action refine --decision DEC-006 --status superseded --reapply
/emporix-design --action refine COP-4827-company-management --gap GAP-1 --status resolved
```

## Steps

1. **Load** the decision (or gap) and its `appliedIn` designs. Show a one-line
   summary of each affected design with its Figma URL.
2. **Decide the change**:
   - `--status accepted|rejected|provisional`: metadata only unless the
     decision is `rejected`, which means undo it (step 3).
   - `--use <alternative>`: the chosen alternative becomes the decision;
     rewrite `decision`, `reapply`, and add a `history` entry. If the
     alternative is itself a new idea, create a new `DEC-` id and mark the old
     one `superseded` with `supersededBy`.
   - `--gap GAP-n --status resolved|in-library`: a library fix landed. Find the
     decisions that list that gap as an alternative, and offer to replace the
     workaround with the real component.
3. **Re-apply** only when the change alters the design: for each design in
   `appliedIn`, follow the decision's `reapply` text with targeted edits by node
   id (same rules as the main refine workflow: sync with live file, preserve
   human edits, checkpoint into an Archive section, validate, re-export).
   When the library is the source of truth (a published Button or header),
   import it by key and `swapComponent` instead of rebuilding.
4. **Verify** per design: the same audits as the main refine workflow, plus
   the decision's own check (for example, heading styles match the choice).
5. **Record** in each design's `changelog.md` (`Decision DEC-n → status`,
   nodes touched) and in the catalog `history`. Update `appliedIn` and each
   design's `design.json`.
6. **Report** with the Figma URL of every touched design and per-screen deep
   links, the old and new decision text, and anything that could not be
   applied (for example, a design file you cannot open).

## Safety

- Never re-apply a `rejected` or `superseded` decision.
- Designs not accessible to the current user are listed, not skipped
  silently.
- A re-apply that would break WCAG 2.1 AA needs an `ask` first.
- A status change never deletes history. Append to it.
