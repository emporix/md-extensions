---
name: core
description: Core conventions for all Emporix frontend work
always: true
---

# Core Conventions

## Technology Stack

Emporix frontend apps typically use:

- **React 18** with functional components and hooks
- **TypeScript** (strict mode)
- **Vite** for bundling and dev server
- **SCSS Modules** for component styles
- **Vitest** + Testing Library for unit tests
- **PrimeReact** for complex UI widgets (where applicable)
- **react-i18next** for translations
- **@emporix/component-library** for shared UI primitives

Read the project's `package.json` and existing code before introducing new dependencies.

## File Naming

| Kind | Pattern | Typical location |
|------|---------|------------------|
| Components | `ComponentName.tsx` + `.module.scss` | `src/components/{feature}/` |
| Pages | `PageName.tsx` + `.module.scss` | `src/pages/` |
| Models / types | `Name.model.ts` or `name.types.ts` | `src/models/` or `src/types/` |
| Helpers | `name.helpers.ts` | `src/helpers/` or `src/helpers/{domain}/` |
| Tests | `*.test.ts` / `*.test.tsx` next to source | same directory |
| Stories | `*.stories.tsx` | next to component or `src/stories/` |

## Imports (order)

1. React
2. Third-party
3. Internal components
4. Helpers / utilities
5. Types
6. Styles (`import styles from './X.module.scss'`)

## Code Style

- Functional components with hooks; default export for components, named export for utilities/types.
- **No `class` / `extends` in application code** — not for React components, services, helpers, or errors. Prefer functions, plain objects, and modules. For failures, throw `Error` (optionally with extra fields via `Object.assign`) or return a typed result; do not subclass `Error`.
- **Prefer arrow functions** for callbacks, handlers, helpers, and utilities (`const fn = () => {}`). Use `function` only when hoisting is required.
- **Destructure props** at the top of components; avoid `props.xxx` in the component body.
- Avoid `React.FC<Props>` — type props on the function parameter directly.
- TypeScript strict; avoid `any`.
- Props interfaces: mark all fields `readonly`.
- Use `??` for null/undefined; use `||` only when falsy values matter.
- No `console.log` (use `console.error` / `warn` / `info`).
- Never log tokens, credentials, or other sensitive values.
- No non-null assertion (`!`) — use optional chaining and guards.
- No inline styles; use CSS Modules.
- Avoid barrel `index.ts` exports for components — prefer direct imports unless the project already uses barrels.
- Follow ESLint and Prettier (or project equivalents).

## Comments

- Do not add redundant comments that restate what the code already shows.
- Comment only when intent, algorithm, or business rules would not be clear at first read.
- Prefer clearer naming and small functions over long comments.

## State Management

- Use local state (`useState`) for component UI state.
- Prefer `useState` over `useReducer` for simple state.
- Use context or global state for shared data — keep scope minimal.
- Move static data that does not depend on props/state outside the component.

## Error Handling

- Use try/catch for async operations (API calls, file uploads, mutations).
- Do not swallow errors — log with `console.error` and surface user-facing feedback (e.g. toasts).
- Handle HTTP error status (4xx, 5xx) and network failures in the API layer — see **`api-data`** rule.
- Use React error boundaries for unexpected render failures where the project supports them.

## Business Logic

- Domain / model manipulation belongs in `src/helpers/` (or equivalent), not React components.
- Components handle UI state, call helpers, and pass results to update functions or mutations.
- All helpers must be pure and immutable — return new objects, never mutate inputs.

## Example: Pure Helper (immutable model update)

```typescript
// src/models/Order.model.ts
export type OrderItem = {
  id: string
  name: string
  quantity: number
}

export type Order = {
  id: string
  items: OrderItem[]
}

// src/helpers/order.helpers.ts
export const updateOrderItemName = (
  order: Order,
  itemId: string,
  name: string
): Order => {
  const itemIndex = order.items.findIndex((item) => item.id === itemId)
  if (itemIndex < 0) {
    return order
  }

  const updatedItems = [...order.items]
  updatedItems[itemIndex] = { ...updatedItems[itemIndex], name }

  return { ...order, items: updatedItems }
}

export type SelectOption = { key: string; label: string }

export const optionsToMap = (
  options: SelectOption[] | undefined
): Record<string, string> | null => {
  if (!options) {
    return null
  }
  return options.reduce<Record<string, string>>((acc, option) => {
    acc[option.key] = option.label
    return acc
  }, {})
}
```

## Example: Component calls helper, does not mutate model

```typescript
// src/components/order-edit/OrderItemEditor.tsx
import { useTranslation } from 'react-i18next'
import { InputText } from '@emporix/component-library'
import { updateOrderItemName } from '../../helpers/order.helpers'
import type { Order } from '../../models/Order.model'
import styles from './OrderItemEditor.module.scss'

type OrderItemEditorProps = {
  readonly order: Order
  readonly itemId: string
  readonly onOrderChange: (order: Order) => void
}

const OrderItemEditor = ({ order, itemId, onOrderChange }: OrderItemEditorProps) => {
  const { t } = useTranslation()
  const item = order.items.find((entry) => entry.id === itemId)

  const handleNameChange = (name: string) => {
    onOrderChange(updateOrderItemName(order, itemId, name))
  }

  if (!item) {
    return null
  }

  return (
    <section className={styles.section}>
      <label className={styles.label} htmlFor={`item-name-${itemId}`}>
        {t('orderEdit.item.nameLabel')}
      </label>
      <InputText
        inputId={`item-name-${itemId}`}
        value={item.name}
        onChange={(e) => handleNameChange(e.target.value)}
      />
    </section>
  )
}

export default OrderItemEditor
```
