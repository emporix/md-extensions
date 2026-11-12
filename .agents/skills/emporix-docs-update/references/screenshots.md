# Screenshots (portal flavors)

Author supplies **original PNG files**; the **parent** frames them, then
**verifies** the file matches the published docs form. Do not use the Cursor
browser to capture. Only `user-guides` use shots.

## Required form

Same look as published GitBook shots (style-guide `screenshot_example.png`):

| Property | Value |
|---|---|
| Border color | `#DDE6EE` |
| Stroke | 2 (PhotoScape 2/3; 2 is the default) |
| Rounding | PhotoScape **Roundness: 10** — **not 10px**. About 4.5% of the shorter side (≈23px on a 512px-tall shot) |
| Corners | Transparent (rounded clip). Opaque dark corners mean the file is a screenshot of an already-framed PNG |

Do not pick a radius or color by hand. The script applies this form.

## Intake

Do **not** ask the author to paste screenshots into chat. Cursor chat
attachments are stored at about **1024px** on the long edge, which makes soft
docs figures. Prefer a full-resolution filesystem PNG.

Ask for each shot from the plan's shot list, in this order:

1. **Path or drop** — Desktop `Screenshot*.png` / `Screen Shot*.png`, a path the
   author `@`-attaches, or a file dropped into the workspace.
2. Copy/`cp` that file to `.cursor/emporix-docs-inbox/<shot-id>-raw.png`. Prefer
   the original PNG over a screenshot of a screenshot.
3. Chat paste only if the author insists — treat it as degraded and run the
   resolution gate below before framing.

The author may reply **Skip** for a shot or **Stop screenshots**.

## Resolution gate (required before frame)

After each raw lands in the inbox, print size, then decide:

```bash
{python} {polish_script} .cursor/emporix-docs-inbox/<shot-id>-raw.png --info
```

- Longer side **> 1024** → OK to frame.
- Longer side **≤ 1024** → likely a chat preview. Do **not** frame or embed.
  Ask again for the Desktop / original path (or confirm it is an intentional
  small crop). Re-copy the original into the inbox, then re-check `--info`.

Show the author `raw WxH` from `--info` and `wrote … (WxH)` after framing.

## Frame, then check (required)

Resolve the script and interpreter:

- Script: `POLISH=$(skill_script emporix-docs-update polish_screenshot.py)`
- Interpreter: a local venv `.ai/venv/bin/python` (gitignored with the rest of `.ai/`)

Create the venv once if missing:

```bash
python3 -m venv .ai/venv
.ai/venv/bin/pip install -r "$SKILLS_ROOT/emporix-docs-update/scripts/requirements.txt"
```

Once per environment, confirm the script itself:

```bash
{python} {polish_script} --self-test
```

Then **one frame command per shot**, then **`--check` on the output**. Do not
ship a figure whose check is `fail`.

```bash
{python} {polish_script} \
  .cursor/emporix-docs-inbox/<shot-id>-raw.png \
  {docsRoot}/content/<space>/.gitbook/assets/<name>.png \
  --frame

{python} {polish_script} \
  {docsRoot}/content/<space>/.gitbook/assets/<name>.png \
  --check
```

Default is **no downscale** (`--max-width 0`). Pass `--max-width N` only when
the author asks to shrink a huge dump. Do not pass `1600` by habit.

`--check` must print `check: pass` and exit 0. Typical pass line:

```text
check: pass
size: 1010x512
border: #DDE6EE
stroke: 2
radius: 23 (want ~23, PhotoScape roundness 10)
corners: transparent
```

Rules:

- Frame is on by default. The script skips a second wrap when the input already
  has this form (`already has docs frame; not wrapping again`).
- `--check` is the verifier. Read its report. Do not guess from a thumbnail.
- `check: fail` → do not embed the file. Re-run polish, or persist a better raw
  PNG. A 10px radius (old script) is a fail.
- `warning: corners are opaque` → already framed, then flattened on a dark
  background. Do **not** wrap again. Prefer the original transparent PNG if the
  author still has it.
- Blur and highlight stay off unless the author asks. `--info` prints
  `WIDTHxHEIGHT`. `--no-frame` is only for a raw that must stay unframed
  (then do not run `--check` expecting a pass).
- Show the framed paths, raw→out sizes, and the check report. Accept
  **Looks good**, a tweak, **Skip**, or **Stop screenshots**.

## Crop, blur, and highlights

The supervisor runs every polish operation itself with one command per shot — no
separate agent. Add flags to the same command when the author asks. **Always**
use this script for blur and highlight — do not hand-roll Pillow / PhotoScape
one-offs in chat.

- Tighter crop: `--crop 'x,y,w,h'` (percents allowed).
- Soft-brush lens blur: `--blur 'x,y,w,h'` — only when the author asks, or when
  a shot clearly shows a live secret (emails, phone, live customer data).
  Defaults match the style guide (Strength 30 / Brush 15 / Hardness 25). The
  script maps Strength to an optical radius; **do not** treat 30 as a Pillow
  pixel radius.
- Highlight: `--highlight 'x,y,w,h'` where the box is the **control fill**
  (button/field), plus `--highlight-pad N` (default 9) for even padding on all
  sides. Color `#E86C07`, rounded rect, stroke 3 / radius 8 (script defaults).
- Arrow: `--arrow` — only when the author asks.

### Blur acceptance (visual)

Target: mid-gray letter-shaped density — you can tell content is present, but
cannot read it.

| Avoid | Why |
|---|---|
| Milky / near-white wash | Strength used as raw Gaussian radius; thin dark text averages into white |
| Solid charcoal / black pill | Over-thickened ink or global midtone crush; looks like a sticker, not lens blur |

After blur, write a tight crop with `--blur-preview` and `Read` that PNG before
embedding. Adjust only via script flags (`--blur-strength` / brush / hardness),
not ad-hoc pixel edits.

### Highlight acceptance (visual)

Orange frame must sit **evenly** around the control. Measure the button/field
fill → pass that as `--highlight` → let `--highlight-pad` expand equally. Do
not freehand a larger box that hugs one side tighter than another.

### Example (blur email + highlight Send)

```bash
{python} {polish_script} \
  .cursor/emporix-docs-inbox/contact-raw.png \
  {docsRoot}/content/<space>/.gitbook/assets/contact.png \
  --frame \
  --blur '48,438,367,24' \
  --blur-preview .cursor/emporix-docs-inbox/contact-blur-preview.png \
  --highlight '720,830,140,36' \
  --highlight-pad 9

{python} {polish_script} \
  {docsRoot}/content/<space>/.gitbook/assets/contact.png \
  --check
```

Do not add orange boxes or blur by default. Keep raw files in
`.cursor/emporix-docs-inbox/` (gitignored).
