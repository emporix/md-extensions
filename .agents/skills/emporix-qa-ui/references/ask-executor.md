# Ask the executor (do not guess)

Headless QA cannot see the page the way a human can. When the next click, fill, or assertion is **not clear**, stop and ask the person running this skill. Do not guess. Do not switch to the Cursor IDE browser.

## When to ask

Ask if any of these is true:

- The snapshot has no ref that matches the intended control (or several that could)
- The page is not the one the scenario expected (empty, error, login, overlay, wrong module)
- An assertion is ambiguous (text/state could be read two ways)
- A click just ran and the UI did not change in a way you can explain
- You would be inventing a selector, route, or label

Do **not** ask for routine next steps that the snapshot already makes obvious.

## How

1. **screenshot** the current viewport to `{ARTIFACTS_DIR}/ask-NN-<slug>.png` (absolute path). Never include a filled token field.
2. Show that PNG in this chat (read the image file so the executor can see it).
3. Ask one concrete question. Offer the snapshot refs or labels you *do* see.
4. **Hard stop.** End the turn. Leave the headless session open unless it is unsafe to do so.
5. After the executor answers, follow that instruction and continue the scenario. If they say skip, mark the step `not exercised` (not PASS).

Example:

```text
Need a decision before I click.

Screenshot: .ai/qa/artifacts_{RUN_ID}/ask-01-which-save.png
I see: [Save], [Cancel], [Add matching field].
Which control should I use for this step? Or should I mark it not exercised?
```

## Do not

- Do not click a “best guess” ref.
- Do not open Cursor IDE browser / Playwright / the user’s Chrome to “just look”.
- Do not invent CSS selectors.
- Do not mark the step PASS while you are waiting.
