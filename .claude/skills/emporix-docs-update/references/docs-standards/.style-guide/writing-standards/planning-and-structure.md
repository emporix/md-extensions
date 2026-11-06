---
description: >-
  Plan new or updated documentation before writing: decide where the content
  fits, which form suits it, and how it connects to the existing documentation
  set.
icon: sitemap
---

# Planning and Structure

Plan the page before writing it. Decide what the reader wants to achieve, where the content belongs in the existing documentation set, and which form presents it best. Implementation details and requirements are the source material, not the outline of the page.

## Start from the reader's goal

* Identify who the reader is and what they want to achieve (for example, "approve an incoming order" or "connect a data source").
* Identify what triggers the task and what the reader has when it is done.
* Organize the page around that goal and the flow to reach it. Do not organize it around what was implemented or how a view was changed.
* Use implementation and requirements to confirm facts. Do not turn them into a list of screens, fields, or components.

For the writing rules that follow from this, see [Write from the user's goal](language-and-tone.md#write-from-the-users-goal).

## Decide where the content fits

Check the existing documentation set before creating anything.

1. Open the `SUMMARY.md` of the target space and find the section the topic belongs to.
2. Read the parent page and the sibling pages. Check what they already cover.
3. Decide between the following options:
   * update an existing page when the topic extends it
   * add a section to an existing page when the new content is short and depends on the surrounding context
   * create a new page when the topic has its own goal and the reader looks for it on its own
4. For a new page, choose its position in `SUMMARY.md` (group, order) and its file path in line with the neighbouring pages.
5. Do not duplicate information that already lives in another page. Link to it instead (see [Links](links.md)).
6. Information about API endpoints belongs in `api-references`. Portal pages link to it and do not document endpoints inline.

## Choose the form

Select the form that matches what the reader needs to do with the information.

| Form | Use it when | Typical shape |
| ---- | ----------- | ------------- |
| Concept | The reader needs to understand what something is and why it matters | Short overview, explanation, optional diagram |
| Procedure | The reader completes a task in a defined order | Prerequisites, then a stepper with one action per step, then the result |
| Reference | The reader looks up values, options, or fields | Table or list with the same pattern per item |
| Tutorial | The reader learns by completing an end-to-end scenario | Goal, prerequisites, steps, verification |
| Release note | The reader wants to know what changed in a release | Release notes template |
| Changelog entry | The reader wants to know what changed in an API | Changelog template |

* Use one main form per page. When a page mixes forms, keep each in its own section.
* Prefer a short page that answers one goal over a long page that describes everything on a screen.
* Use a diagram only when it explains a flow or relationship that text explains poorly. See [Diagrams](../visuals/diagrams.md).
* Use a screenshot only when it helps the reader find or recognize something. See [Images & Icons](../visuals/images-and-icons.md).

## Align with the documentation set

* Reuse the terminology of the neighbouring pages and the [Word Choice](word-choice.md) list. Do not introduce a second name for the same thing.
* Match the depth and length of comparable pages in the same space.
* Add links to related pages in the places where a reader needs them, and make sure the new page is reachable from at least one existing page and from the navigation.
* Check the pages that describe the same area. Update them when the change makes them outdated or contradictory.

## Plan checklist

Before writing, confirm the following points:

* The reader, their goal, and the outcome are named.
* The target space, section, and position in `SUMMARY.md` are chosen.
* The decision to update, extend, or create a page is made, with the reason.
* The form of the page and each of its sections is chosen.
* Links to and from other pages are listed, including whether each target is in the same space or in another space.
* Required diagrams and screenshots are listed, each with the reason the reader needs it.
* Open questions about product behavior are listed. Do not guess answers.
