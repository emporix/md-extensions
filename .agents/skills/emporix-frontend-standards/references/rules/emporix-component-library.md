---
name: emporix-component-library
description: Shared Emporix component library usage conventions
paths: ["src/**/*.tsx"]
always: false
---

# @emporix/component-library

Prefer library primitives over duplicating UI in local `common/` folders when a match exists.

## Commonly Used

| Export | Use for |
|--------|---------|
| `PrimaryButton` / `SecondaryButton` | Actions, dialogs, forms |
| `ToastProvider` / `useToast` | Success/error feedback (`showSuccess`, `showError`) |
| Form inputs | Typed wrappers where the library provides them |

## Import Pattern

```typescript
import { PrimaryButton, SecondaryButton, useToast } from '@emporix/component-library'
```

Load library styles once at the app entry point:

```typescript
import '@emporix/component-library/styles'
```

## When to Use Local Components Instead

Use a local component only for app-specific composites, PrimeReact wrappers with project styling, or feature layout shells — after checking that the library does not already export a match. For a reusable component the library lacks, follow **Component missing from the library** below.

- When the library exports a component the project duplicates locally (e.g. `ConfirmBox`, `BackButton`, `DateValue`, `ProgressSpinner` in recent versions), import it directly and delete the local copy. Keep a thin wrapper only when it needs app dependencies (i18n, languages, configuration).
- Prefer the library input's built-in `label` and `error` props over local label/field wrapper components; use a separate label component only when the input has no label API.
- Do not add `primereact` to a project just to get a widget — check the library first.

## Toasts

```typescript
const { showSuccess, showError } = useToast()

showSuccess(t('key.successTitle'), t('key.successMessage'))
showError(t('key.errorTitle'), error.message)
```

Wrap the app (or federated entry) with `ToastProvider` once.

## Loading States

`PrimaryButton` supports a `loading` prop — use it instead of manual spinner + disabled logic where possible.

## Component missing from the library

When migrating a module from the Management Dashboard (MD), use library components by default. When a component the module needs has no library match — or other work needs a reusable primitive the library lacks — follow the library contribution workflow (`$RULES_ROOT/../library/workflow.md`) with `component-library` before writing a local component. It interviews the user (add the component to the library — recommended — or migrate it as it is), implements it in the library, offers to release right away, and moves this project onto the released version. App-specific composites (tied to routing, permissions, or domain data) stay local without the workflow.

Decide this while planning, not mid-implementation. When the work is planned first (for example with `emporix-feature`), ask the workflow's first question — add the component to the library (recommended) or migrate it as it is — during exploration, and plan a library change as its own seam with a todo that runs that workflow; the change in this project waits for the library release.
