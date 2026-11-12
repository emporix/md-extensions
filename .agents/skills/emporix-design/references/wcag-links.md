# WCAG 2.1 links for the Notes frame

In the Figma Notes frame, every WCAG criterion number in an accessibility
entry is a **hyperlink** (Figma hyperlink on the number) to the W3C
"Understanding" page. The accessibility header links to the specification
(`https://www.w3.org/TR/WCAG21/`). Where an entry follows a rule from the
library (for example the Notification's documented behavior), the words that
name it link to that documentation page in the prior-art file. These W3C links
are public and may appear in committed files; Figma file links may not
(`guidelines.md` G-7).

Base: `https://www.w3.org/WAI/WCAG21/Understanding/<slug>.html`

| Criterion | Level | Slug |
|---|---|---|
| 1.1.1 Non-text Content | A | `non-text-content` |
| 1.3.1 Info and Relationships | A | `info-and-relationships` |
| 1.3.2 Meaningful Sequence | A | `meaningful-sequence` |
| 1.4.1 Use of Color | A | `use-of-color` |
| 1.4.3 Contrast (Minimum) | AA | `contrast-minimum` |
| 1.4.4 Resize Text | AA | `resize-text` |
| 1.4.10 Reflow | AA | `reflow` |
| 1.4.11 Non-text Contrast | AA | `non-text-contrast` |
| 1.4.12 Text Spacing | AA | `text-spacing` |
| 2.2.1 Timing Adjustable | A | `timing-adjustable` |
| 2.4.1 Bypass Blocks | A | `bypass-blocks` |
| 2.4.4 Link Purpose (In Context) | A | `link-purpose-in-context` |
| 2.4.5 Multiple Ways | AA | `multiple-ways` |
| 2.4.6 Headings and Labels | AA | `headings-and-labels` |
| 2.4.7 Focus Visible | AA | `focus-visible` |
| 3.2.3 Consistent Navigation | AA | `consistent-navigation` |
| 3.2.4 Consistent Identification | AA | `consistent-identification` |
| 3.3.1 Error Identification | A | `error-identification` |
| 3.3.2 Labels or Instructions | A | `labels-or-instructions` |
| 3.3.3 Error Suggestion | AA | `error-suggestion` |
| 4.1.2 Name, Role, Value | A | `name-role-value` |
| 4.1.3 Status Messages | AA | `status-messages` |

Applying: for each `\b[1-4]\.[1-4]\.\d{1,2}\b` in the entry text, call
`setRangeHyperlink(start, end, {type: "URL", value: base + slug + ".html"})`,
then underline and colour the range with the library link colour variable.
Do not guess a slug; add a missing criterion to this table first.
