# Review rubric

Certification questions and answers were authored from public Emporix
documentation. Validate each item against the **current** sources below — not
against memory, prior reports, or the CSV itself.

## Purpose

For every question ask:

1. Is the **stem** still accurate?
2. Are the **marked correct option(s)** still the right answer(s)?
3. If not — has the **product or documentation changed**, or was the item
   already wrong / unanswerable?

If the item is no longer correct, **always explain the reason** in the report
(what the sources say now vs what the question asserts or marks as correct).

## Evidence sources (authoritative)

| Source | Use for |
|--------|---------|
| [developer.emporix.io](https://developer.emporix.io) via Docs MCP (`searchDocumentation`, `getPage`, `askQuestion`) | API behaviour, scopes, endpoints, architecture, service concepts, how-tos |
| [emporix.com](https://www.emporix.com) via page fetch | Product positioning, industries, named value streams, ACE / marketing claims |

Check both when the stem could be grounded in either. Prefer quoting a page URL
and a short fact from that page.

Do not treat training CSVs, prior `.ai` reports, or Jira as proof of
correctness — they are the subject under review.

## Verdicts

| Verdict | Use when |
|---------|----------|
| `ok` | Stem, options, and marked correct keys still match current docs/site. Distractors are clearly wrong or unsupported today. |
| `stale` | Was aligned with an older product/docs state; current pages use different names, components, flows, or behaviour. Explain what changed. |
| `wrong_answer` | Marked correct option(s) contradict current sources, or a clearly correct option is unmarked. Explain the contradiction. |
| `ambiguous` | Docs and site conflict, stem is underspecified, or evidence is insufficient — do not guess. Say what is unclear. |
| `docs_gap` | Question targets a claim that neither docs nor the website currently cover clearly (may need a docs update or a question rewrite). |

Actionable for authors: `stale` and `wrong_answer`. Needs human decision:
`ambiguous` and `docs_gap`.

## Checks per question

1. **Still valid?** — Would a partner using today’s developer.emporix.io and
   emporix.com pages reach the marked answer(s)?
2. **Product change?** — If naming, components, industries, APIs, or flows
   differ from the question, record that as the reason (`stale` or
   `wrong_answer` as appropriate).
3. **Correct keys** — Every letter in `correct_options` is supported now; for
   multi-select, the full set must match (no missing/extra letters).
4. **Distractors** — Wrong options should be false or out of scope on current
   sources, not alternate valid answers.
5. **Terminology** — ACE, VSM, ACI, and similar names match current wording.
   Harmless synonym drift with the same marked answer → note under `ok` or
   light `stale`.

## Reason (required when verdict ≠ `ok`)

Write 1–3 sentences that a certification author can act on:

- What the question / marked answer claims
- What developer.emporix.io and/or emporix.com say now (with links)
- Why that makes the item stale, wrong, ambiguous, or a docs gap

Do not use empty reasons like “outdated” without saying *what* changed.

## Suggested rewrite

When verdict ≠ `ok`, propose a rewrite only if evidence supports it:

- Updated stem (minimal change)
- Updated option text and/or correct key list
- Links that justify the change

If evidence is weak, set rewrite to “(needs author)” and keep `ambiguous` or
`docs_gap`.

## Do not

- Guess behind auth-only or tenant-specific behaviour.
- “Fix” ClassMarker via API.
- Fail a question solely because docs and marketing use different synonyms when
  both still support the same marked answer — note the drift under `ok` or
  `stale` and explain briefly.
