---
description: >-
  Follow the Emporix principles for language and tone in technical
  documentation.
icon: hands-asl-interpreting
---

# Language and Tone

* Use user-friendly and precise language.
* Prefer active voice; use passive voice only when the actor is unknown or irrelevant.
* Use present tense for product behavior and UI descriptions.
* Prefer direct instructions:
  * Use "Select **Save**."
  * Avoid "The user should now click on Save."
* Keep sentences short and focused on one idea.
* Avoid filler phrases such as "simply", "just", "obviously", "it is important to note that".
* Explain domain-specific terms on first use if they are not obvious to new users.

## Write from the user's goal

Documentation helps the reader complete a task. It does not describe the implementation or the screens one by one.

* Start from what the user wants to achieve and the flow to get there. Describe views, buttons, and options in the order and the context in which the user needs them.
* Do not report what changed in a view or how the feature was built. Describe what the user can do now and why it matters.
* Explain why someone would look for an option, button, icon, or dialog window before saying where it is. Where to find it is secondary information, useful when it is not obvious.
* Do not describe a view literally (every field, tab, and button in turn). Cover only the elements the user needs to complete the task or make a decision.
* Write the steps in the order the user performs them, with the result of the task stated at the end.

Example:

```
To check why an order was rejected, open the order and review its validation results.
```

Avoid:

```
The Orders view contains a table. The table has columns for ID, status, and date. In the top right corner there is a button.
```

### Describe what happens, do not quote the screen

* Do not copy notifications, hints, tooltips, empty states, or error messages shown in the UI. Explain what happens and what the user can do next.
* Quote text from the UI only when the user needs the exact wording: labels the user selects (see [UI Elements](format-and-structure.md#ui-elements)) and values the user types.
* API documentation can quote error messages and codes returned by the API, because integrators match them in code.

Example:

```
After you save the connection, the system checks the credentials and shows the result.
```

Avoid:

```
After you select Save, the message "Connection saved successfully. Your credentials were verified." appears.
```

### Skip the obvious

* Do not state what the user can see or infer from the UI, for example that a **Save** button saves, that a table lists records, or that a window can be closed.
* Do not add a step or a sentence only to name an element that is self-explanatory. Add information the user cannot get from the screen: the reason, the consequence, the prerequisite, or the effect elsewhere in the system.
* Do not document loading, empty, and confirmation states unless they affect what the user must do.

## Punctuation restraint

* Use colons, semicolons, and dashes only where they are necessary. Prefer two short sentences to one sentence held together by a semicolon or a dash.
* Use a colon after a lead-in sentence that introduces a list (see [Bullet lists](format-and-structure.md#bullet-lists)).
* In figure captions, avoid colons, semicolons, and dashes altogether when a short noun phrase works (see [Images & Icons](../visuals/images-and-icons.md)).

## Audience adaptation

* Business users - Focus on outcomes, constraints, and operational impact.
* Developers - Focus on behavior, inputs/outputs, edge cases, and examples.
* Mixed audiences - Provide a short concept summary first, then implementation details.

## Inclusive and neutral language

* Use neutral wording and avoid idioms that may be unclear to non-native speakers.
* Avoid gendered pronouns when referring to generic users.
