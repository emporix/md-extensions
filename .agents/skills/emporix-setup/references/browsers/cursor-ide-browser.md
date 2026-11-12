# Browser provider: cursor-ide-browser

Optional provider. `emporix-qa-ui` does not select this file. Use it only
when a human sets `browser.provider` to `cursor-ide-browser`.

Optional and **slow**. `emporix-qa-ui` does **not** use this provider.
Default QA is headless `agent-browser`. Keep this file only if a human
explicitly asks for a visible Cursor tab. Not Playwright. Not the
operator's Chrome profile.

Namespace: `cursor-ide-browser` (Cursor MCP). Call those tools directly.

## One path

1. **ensure-installed** — confirm the MCP tools exist
2. **doctor** — `browser_tabs` `list`
3. **open** — `browser_navigate` with `position: "active"` (visible), then `browser_lock` `lock`
4. **snapshot** — `browser_snapshot` `interactive: true`
5. **interact** / **assert** / **screenshot** — snapshot refs only
6. **close** — `browser_lock` `unlock`, then close only the tab this run opened

If a step fails, **close** (unlock) and stop. Do not switch to `agent-browser`
or another tool.

## Operations

### ensure-installed

No binary. Confirm `cursor-ide-browser` tools are listed (`browser_navigate`,
`browser_snapshot`, `browser_click`, `browser_fill`, `browser_take_screenshot`,
`browser_lock`, `browser_tabs`). Missing → stop: enable the Cursor browser MCP.

```text
BROWSER_PROVIDER=cursor-ide-browser
BROWSER_INSTALLED=1
BROWSER_COMMAND=cursor-ide-browser
BROWSER_VERSION=unknown
BROWSER_NOTES=visible Cursor IDE browser
```

### doctor

`browser_tabs` with `action: "list"`. Failure → not installed.

### open

Visible on purpose (the operator asked to watch QA):

1. `browser_tabs` `list` (remember existing tab ids)
2. `browser_navigate`: `url` = `$BASE_URL`, `newTab` = true, `position` = `"active"`
3. `browser_lock` `action` = `"lock"`

Keep the new tab's `viewId` for later calls.

Do not omit `position`. Omitting it hides the browser (background automation).

### snapshot

`browser_snapshot` with `interactive` = true (and `viewId` when you have one).
Use only refs from this snapshot.

### interact

Latest snapshot refs only:

- `browser_fill`: `ref`, `value`, `element` (short label)
- `browser_click`: `ref`, `element`
- `browser_select_option` / `browser_type` / `browser_press_key` when the snapshot needs them

Do not use CDP `Input.*`. Do not guess CSS selectors.

### assert

From the latest snapshot (visible text, control state) or the current URL in
`browser_tabs` / the snapshot. Record the observed value. Fail when it is not there.

### screenshot

`browser_take_screenshot`:

- `filename` = `{ARTIFACTS_DIR}/step-NN-<slug>.png` (absolute if the tool accepts a path; otherwise the basename and copy into `ARTIFACTS_DIR`)
- `fullPage` = false unless the viewport misses the assertion
- Do not screenshot a filled token field

Confirm the PNG exists and is non-empty under `ARTIFACTS_DIR`.

### close

Always, including on failure:

1. `browser_lock` `action` = `"unlock"`
2. `browser_tabs` `close` only if **this run** opened a new tab

Do not close unrelated tabs.

## Rules

- Stay on `BASE_URL`.
- On cockpits, do not **open** until tenant and token are collected
  (`emporix-qa-ui` `references/cockpit-auth.md`).
- Never put tokens in snapshots, screenshots, or logs.
- `agent-browser` is the headless fallback only when `browser.provider` is
  `agent-browser`. Do not use it on this provider.
