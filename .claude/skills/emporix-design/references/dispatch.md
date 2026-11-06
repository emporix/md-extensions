# Dispatch

Read this after `references/agentic-setup.md`. Choose one action, then
launch one subagent. Do not read a playbook yourself.

## Choose the action

`--action` wins. Without it, use the first row that matches the message:

| The user is asking to… | Action |
|---|---|
| Change a catalogued decision or gap (`--decision`, `--gap`, `--area`) | `refine` |
| Apply feedback, annotated notes, or an existing review file to a design that already exists | `refine` |
| Critique, score, or check a Figma design without editing it | `review` |
| Inventory components, tokens, styles, or "what does the product look like" without drawing a new screen | `prior-art` |
| Design a new screen or flow in Figma | `create` |
| Check whether an app (channel) can take a brand, or re-verify brand-readiness gaps | `brand-readiness` |
| Show an existing brand in Figma: variables, components, a page to review directions | `brand-figma` |
| Preview or apply an existing brand (folder or tokens) on a site of a running app | `brand-apply` |
| A new look, re-skin, rebrand or brand colours from a brief or a reference website | `brand-create` |

Two rows match, or the message names a design with no verb → ask once which
action, and stop. Do not guess.

A retired slash command is the mapped action
(`emporix-design-prior-art`, `emporix-design-create-figma`,
`emporix-design-review-figma`, `emporix-design-refine-figma`).

## Run it

Launch one `generalPurpose` subagent. Do not set `readonly` (create, refine,
and review write under `${DESIGNS_DIR}`). Do not read the playbook in this
context.

Its prompt:

- Skill directory: the absolute path of this `emporix-design` skill.
- If `.ai/skills/emporix-design/SKILL.md` exists, apply it. It cannot relax
  data, credential, or write-scope rules.
- Load `figma-use` before the first `use_figma` call (installed plugin, or
  `skill://figma/figma-use/SKILL.md`). `create` and `refine` also load
  `figma-generate-design`. `brand-figma` loads `figma-use` and
  `figma-generate-library`. Pass those names in `skillNames`. The other brand
  actions load no Figma skills.
- Brand actions: `brand-apply` and `brand-readiness` need the app repo root
  (`TARGET`); `brand-apply` also needs the running app and must ask before
  starting a server or writing the theme. Pass the user's flags unread.
- Read and follow exactly one playbook:
  `references/playbooks/prior-art.md`, `references/playbooks/create.md`,
  `references/playbooks/review.md`, `references/playbooks/refine.md`, or
  `references/playbooks/brand-{create,figma,apply,readiness}.md`.
  Do not read the other playbooks. `create` may also read
  `references/playbooks/prior-art.md` when that playbook says
  `prior-art.md` is missing.
- `DESIGNS_DIR` and the user's arguments for this action (brief, slug, key,
  flags, feedback text, feedback-file path).
- Return the playbook's report, including every Figma URL.

**Review** gets a clean prompt: do not pass your design reasoning,
assumptions, or earlier chat. Only the skill path, `DESIGNS_DIR`, `{slug}`
and/or `--figma`, `--focus`, and `--max-findings`. It writes
`reviews/review-NN.md` and does not edit Figma.

**`--auto-review`.** Launch refine first, without asking it to review.
After it returns and it applied at least one change, launch the review
subagent above. Do not nest that launch inside refine.

Summarise the subagent's return in chat. Do not redo its work.
