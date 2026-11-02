# Algolia synonyms

Last scanned: da99643 (2026-11-02)
Sources: `algolia-synonyms/README.md`, `algolia-synonyms/index.html`, `algolia-synonyms/package.json`, `algolia-synonyms/vite.config.js`, `algolia-synonyms/src/main.jsx`, `algolia-synonyms/src/App.jsx`, `algolia-synonyms/src/lib/algolia-search.js`, `algolia-synonyms/src/lib/cssUtils.js`, `algolia-synonyms/src/components/Dialog.jsx`, `algolia-synonyms/src/components/SynonymView.jsx`, `algolia-synonyms/src/components/SynonymType.jsx`, `algolia-synonyms/src/components/SynonymExpansion.jsx`, `algolia-synonyms/src/components/SynonymDelete.jsx`, `algolia-synonyms/src/components/synonym-edit-types/SynonymEditDispatcher.jsx`, `algolia-synonyms/src/components/synonym-edit-types/SynonymEdit.jsx`, `algolia-synonyms/src/components/synonym-edit-types/OneWaySynonymEdit.jsx`, `algolia-synonyms/src/components/synonym-edit-types/PlaceholderEdit.jsx`, `algolia-synonyms/src/components/synonym-edit-types/AlternativeCorrectionEdit.jsx`

Dashboard screen for one Algolia index’s synonyms. `algolia-synonyms/README.md` and `algolia-synonyms/index.html` are the Vite template (title `Vite + React`) and state no synonym rules. `algolia-synonyms/src/main.jsx` mounts `App` only. `algolia-synonyms/src/lib/cssUtils.js` exports `cn` and is unused by the screens below. No role check and no test file exist in the files read.

## When the list is shown

Actor: the dashboard host, through `md-ext` (`algolia-synonyms/package.json`). This module does not define when the host calls the callback.

`App` calls `registerClient()` and `registerCallback('callbackId', …)` in the component body, so both run on every render (`algolia-synonyms/src/App.jsx`). Whether `md-ext` deduplicates that registration is unknown.

The callback reads `ctx.value.emporixApiUrl`, `ctx.value.tenant`, and `ctx.value.accessToken` only (`algolia-synonyms/src/App.jsx`). It GETs `{emporixApiUrl}/indexing/{tenant}/configurations/ALGOLIA` with headers `Authorization: Bearer {accessToken}`, `Emporix-tenant: {tenant}`, and `Content-Type: application/json`.

A response that stays in the `try` and whose status is not 404 stores `res.data` in React state and in `localStorage` under the key `algoliaConfig` (`algolia-synonyms/src/App.jsx`). A resolved status 404 sets `missingAlgoliaConfig` and does not store the body. Any thrown error sets the same flag and does not clear a config already in `localStorage`. `App.jsx` does not set axios `validateStatus`, so whether a 404 rejects is the axios default (`algolia-synonyms/package.json`).

The synonym list renders only when `algoliaConfig` state is set (`algolia-synonyms/src/App.jsx`). Otherwise the screen is the heading `Algolia Config not found`. `missingAlgoliaConfig` is never read for that heading, and state starts `null`, so the heading is also the loading state.

No `VITE_` name appears in `algolia-synonyms/src/App.jsx`, `algolia-synonyms/src/lib/algolia-search.js`, or `algolia-synonyms/vite.config.js`. Build scripts use Vite modes `dev`, `stage`, and `prod` (`algolia-synonyms/package.json`). Names inside `.env.dev`, `.env.stage`, and `.env.prod` were not read.

## Index and records

Algolia calls use `localStorage` key `algoliaConfig`, not the React state (`algolia-synonyms/src/lib/algolia-search.js`). The client is `algoliasearch(applicationId, writeKey)` and the index is `indexName`. No other config field is read. No key values are present in the module source. A missing `algoliaConfig` entry makes `JSON.parse` return null and the property read throw (`algolia-synonyms/src/lib/algolia-search.js`). The list mounts only after a successful store (`algolia-synonyms/src/App.jsx`), which writes that key first.

The list loads once on mount (`algolia-synonyms/src/components/SynonymView.jsx`). `browseSynonyms` is called with a `batch` callback that concatenates batches, and with no query, filter, or page size (`algolia-synonyms/src/lib/algolia-search.js`). Library defaults for page size are unknown. A failed browse is not caught in `SynonymView.jsx`; the table stays the initial empty array. There is no search, sort, pagination, or empty-state message. Columns are Type, Expansion, and per-row edit and delete (`data-test-id` `edit-button` and `delete-button`).

Identity for replace and delete in the table is `objectID` (`algolia-synonyms/src/components/SynonymView.jsx`). After the first load, the table follows local state. Saves and deletes do not browse again.

## Types

Five types can be created. The split button label is `Add new synonym`; its click and the first menu item both add `synonym` (`algolia-synonyms/src/components/SynonymView.jsx`). The menu labels are `Synonym`, `One-way Synonym`, `Placeholder`, `Alternative Correction (Typo=1)`, and `Alternative Correction (Typo=2)`.

`handleAdd` passes `setSynonymToEdit` a function that returns the new record (`algolia-synonyms/src/components/SynonymView.jsx`). The `react` dependency is `^18.3.1` (`algolia-synonyms/package.json`). That setter treats a function as an updater, so the stored value is the function’s return. The function ignores its argument. The switch has no default; an unknown type string returns `undefined`.

New ids are `syn-` plus `crypto.randomUUID()` (`algolia-synonyms/src/components/SynonymView.jsx`). Records loaded from Algolia keep the `objectID` they arrived with. Create does not call Algolia until Save.

| Menu type | `type` | New fields | Editor | Expansion |
|---|---|---|---|---|
| Synonym | `synonym` | `synonyms: []` | `SynonymEdit.jsx` | terms joined with ` ↔ ` |
| One-way Synonym | `onewaysynonym` | `input: ''`, `synonyms: []` | `OneWaySynonymEdit.jsx` | `{input} → (terms joined with OR)` |
| Placeholder | `placeholder` | `placeholder: ''`, `replacements: []` | `PlaceholderEdit.jsx` | `{placeholder} → (replacements joined with OR)` |
| Alternative Correction (Typo=1) | `altcorrection1` | `word: ''`, `corrections: []` | `AlternativeCorrectionEdit.jsx` | `{word} → (corrections joined with OR)` |
| Alternative Correction (Typo=2) | `altcorrection2` | `word: ''`, `corrections: []` | same editor | same expansion as Typo=1 |

Labels for those `type` strings are `Synonym`, `One-way Synonym`, `Placeholder`, and `Alternative Correction` plus a `Typo=1` or `Typo=2` badge (`algolia-synonyms/src/components/SynonymType.jsx`). `SynonymType.jsx`, `SynonymExpansion.jsx`, and `SynonymEditDispatcher.jsx` have no default branch, so any other `type` renders nothing. `altcorrection1` and `altcorrection2` share one editor and one expansion (`SynonymEditDispatcher.jsx`, `SynonymExpansion.jsx`). The typo value is only the stored `type` and the badge. Expansion calls `.map` on `synonyms`, `replacements`, or `corrections` with no guard (`algolia-synonyms/src/components/SynonymExpansion.jsx`).

## Edit

The dialog opens the editor for `synonym.type` (`algolia-synonyms/src/components/synonym-edit-types/SynonymEditDispatcher.jsx`). The heading is `Edit expansion: {objectID}`. Type is shown from the original `synonym.type` through `SynonymType` and is not an input, so Save keeps the type already on the form object.

Fields (`algolia-synonyms/src/components/synonym-edit-types/`):

- `synonym`: `synonyms`, label `Synonyms (comma separated)`.
- `onewaysynonym`: `input`, label `Search term`; `synonyms`, label `Alternatives (comma separated)`.
- `placeholder`: `placeholder`, label `Placeholder`, input hint `<identifier>`; `replacements`, label `Replacements (comma separated)`. The hint is the placeholder attribute only. No check that the value contains angle brackets (`PlaceholderEdit.jsx`).
- `altcorrection1` and `altcorrection2`: `word`, label `Search Term`; `corrections`, label `Corrections`. The label does not say comma-separated. The change handler still splits `corrections` on commas (`AlternativeCorrectionEdit.jsx`).

On change, names `synonyms`, `replacements`, and `corrections` become `target.value.split(',')` with no trim and no drop of empty tokens (`SynonymEdit.jsx`, `OneWaySynonymEdit.jsx`, `PlaceholderEdit.jsx`, `AlternativeCorrectionEdit.jsx`). Other names, including `input`, `word`, and `placeholder`, are stored as the raw string. An empty text field therefore becomes `[""]`. The same three-name check is copied into every editor. Inputs have no `required` attribute. No editor rejects blanks, duplicates, or a minimum count.

Each editor has a checkbox named `forwardToReplicas`, label `Copy this expansion to other indices`. The checkbox uses `value` and `onChange` reads `target.checked`. It is not given `checked`, so the DOM starts unchecked. Submit uses `forwardToReplicas ?? false`.

Save prevents the browser submit, removes `forwardToReplicas` from the object, calls `saveSynonym` with that object and the flag, then `onUpdate(synonym, false)` (`SynonymEdit.jsx` and the three other editors). Fields already on the record stay on the object. The flag is not written onto the synonym.

`saveSynonym` calls `index.saveSynonym(synonym, {forwardToReplicas})`, then `.wait()`, and does not return that promise (`algolia-synonyms/src/lib/algolia-search.js`). The `await` in the editor therefore finishes when the call is started. Success alerts `JSON.stringify(result)`. Failure alerts `error.message`. Both also log to the console.

`handleUpdate` with `isDelete` false replaces the row with the same `objectID`, or appends the row if none matches, then closes both dialogs (`algolia-synonyms/src/components/SynonymView.jsx`). That local update runs even when Algolia later alerts an error, because the alert is on the floating `.wait()` promise. If `getIndex()` throws before that call (the async function rejects), `onUpdate` is not reached, and the editors have no `catch`.

Closing the dialog (X or native cancel) only hides it (`algolia-synonyms/src/components/Dialog.jsx`, `algolia-synonyms/src/components/SynonymView.jsx`). It does not save.

## Delete

Delete opens a dialog titled by `Deleting synonym: {objectID}` (`algolia-synonyms/src/components/SynonymDelete.jsx`). The same checkbox label, `Copy this expansion to other indices`, starts from `useState(false)`. Confirm calls `deleteSynonym(synonym, forwardToReplicas ?? false)` with the whole record, then `onUpdate(synonym, true)`.

`deleteSynonym` forwards its first argument unchanged to `index.deleteSynonym(objectId, {forwardToReplicas})` (`algolia-synonyms/src/lib/algolia-search.js`). The parameter is named `objectId`. The caller passes the record, not `synonym.objectID` (`SynonymDelete.jsx`). Whether the Algolia client deletes that id is unknown from this module. The same unreturned `.wait()`, success alert, and `error.message` alert apply. Local removal does not wait for that result.

`handleUpdate` with `isDelete` true drops every row whose `objectID` equals the record, after the same replace-or-append step (`algolia-synonyms/src/components/SynonymView.jsx`). There is no other confirm step. Cancel and X do not delete.
