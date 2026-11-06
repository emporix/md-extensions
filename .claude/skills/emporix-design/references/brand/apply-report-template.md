# Report template

Keep it short; link files, do not paste them.

```markdown
## Brand apply — {direction name} on {target} / site `{site}`

**Mode:** preview | write · **Run:** `{run}/index.html`
**Brand:** `{brand folder}` (tokens sha256:{hash})

### Result
| Page | Viewport | Theme | Vars changed | Fonts (heading / body) | A11y tree |
|---|---|---|---|---|---|
| home | desktop | intercepted | 67/84 | Barlow Condensed / Inter | identical |

**Fonts:** self-hosted ({n} files, {kb} KB, {family@version licence, …}) | loaded from {host} — third-party request, list it in the privacy notice

### Reviewability (write mode)
- Files changed: {n} — `git diff --stat` output
- Re-run: no change (idempotent) ✓
- Outside the theme file: {none | registry line | font files in `{fonts.dir}`}

### Text contrast regressions
| Page | Text | Ratio | Needs | Colour on background |
|---|---|---|---|---|

### Closest alternatives
| Source | What | Wanted | Used | Why |
|---|---|---|---|---|
| brand | … | … | … | … |
| app (approx) | … | — | … | … |

### Not expressible in this app (gaps)
| Brand token | Value | Where | Fix upstream |
|---|---|---|---|

### Unmapped / drift
- …

### Tests pinning the current look (knownConflicts)
- `{file}` — {why}

### Next
- …
```
