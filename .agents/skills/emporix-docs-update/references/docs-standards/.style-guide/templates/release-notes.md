---
description: Use these instructions when creating release notes for new product features.
icon: rocket-launch
---

# Release Notes

* For a new entry add a new `{% update %}…{% endupdate %}` block at the top of `release-notes/README.md`, just under the opening `{% updates format="full" %}`. Do not modify existing entries. Do not update `release-notes/SUMMARY.md`.
* Add the date placeholder `RELEASE_DATE` in the update block.

{% hint style="info" %}
The date placeholder `RELEASE_DATE` is transformed into an actual date of release upon the PR merge to `master`.
{% endhint %}

* Add relevant tag or tags for the type of introduced changes (aligned with the API changelog):
  * new feature: `new-feature`
  * improvement: `improvement`
  * major change: `major-change`
  * minor change: `minor-change`
  * deprecated: `deprecated`
* Add a product area tag:
  * Commerce Engine: `ce`
  * Value Stream Modeller: `vsm`
  * Agentic Commerce Intelligence: `aci`
  * B2B Commerce Frontend: `b2b-frontend`
  * Partner Library: `partner-library`
  * Other: `other`

Examples:

```
{% update date="RELEASE_DATE" tags="new-feature, vsm" %}
```

```
{% update date="RELEASE_DATE" tags="improvement, aci" %}
```

* Use title format inside the update block (date goes on the `{% update %}` tag, not in the title): `## {change/feature}` — omit product prefixes (CE, VSM, ACI, etc.); use the product area tag instead.
* Write the title that introduces the main change in title case: capitalize all the words except prepositions (and, as in page titles, articles and short conjunctions). The first and the last word are always capitalized.

Example:

```
## B2C Quotes
```

```
## Approval Workflow for Purchase Orders
```

Avoid:

```
## Approval workflow for purchase orders
```

* Use the following doc structure

```
#### Overview

...
#### New features

| Feature | Function | Benefit |
| ------- | -------- | ------- |
| **Feature one** | One or more sentences describing what the feature does or how it works. | One or more sentences describing its benefits. |
| **Feature two** | One or more sentences describing what the feature does or how it works. | One or more sentences describing its benefits. |
| ... | ... | ... |

#### Fixes and improvements

None as this is a new feature/improvement.

#### Known problems

No known problems at the time of release.

#### Documentation and links

User Guides:
*
* 
*

API Guides:
*
*
```

* The table in `New features` section
  * Feature: bold, sentence case
  * Function: one or more sentences describing what the feature does or how it works (capability/behavior, not user value).
  * Benefit: one or more sentences for description of its benefits.
* `Fixes and improvements` section – if there are any fixes to the existing features, state briefly what they are. If not applicable, state "None as this is a new feature."
* `Known problems` - if there are any known issues, state what they are. If there are no known issues, state "No known problems at the time of release."
* `Documentation and links` section – list all the relevant links to docs that have been created/updated in relation to the announcement. Introduce each group with the label `User Guides:` or `API Guides:`. Release notes are exempt from the full lead-in sentence rule (see [Lead-in sentence](../writing-standards/format-and-structure.md#lead-in-sentence)).
