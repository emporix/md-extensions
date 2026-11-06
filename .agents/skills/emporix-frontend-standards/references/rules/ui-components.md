---
name: ui-components
description: React component, styling, performance, and accessibility patterns
paths: ["src/components/**", "src/pages/**"]
always: false
---

# UI Components

## Structure

- One component per folder or pair: `ComponentName.tsx` + `ComponentName.module.scss`
- Split presentational components (props in, events out) and container components (local dialog/loading UI state, injected async actions)
- Section components: `*Section.tsx` in `sections/` or feature subfolders
- Icons: dedicated files under `icons/` with configurable `width`, `height`, `color`
- Prefer project-specific shared components in `common/` over duplicating patterns

## Example: Container with local UI state + confirmation

Dialog state stays in the component; domain delete is injected via prop:

```typescript
// src/components/order-list/BulkDeleteButton.tsx
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { InputText, SecondaryButton } from '@emporix/component-library'
import ActionConfirmDialog from '../common/ActionConfirmDialog'
import styles from './BulkDeleteButton.module.scss'

type BulkDeleteButtonProps = {
  readonly selectedCount: number
  readonly onDelete: () => Promise<void>
}

const BulkDeleteButton = ({ selectedCount, onDelete }: BulkDeleteButtonProps) => {
  const { t } = useTranslation()
  const confirmationInputId = useId()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [confirmationInput, setConfirmationInput] = useState('')

  const confirmationPhrase = t('orderList.deleteConfirm.confirmationPhrase')
  const isConfirmationValid = confirmationInput.trim() === confirmationPhrase

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      await onDelete()
      setConfirmationInput('')
      setIsDialogOpen(false)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <SecondaryButton onClick={() => setIsDialogOpen(true)} disabled={selectedCount === 0}>
        {t('global.delete')}
      </SecondaryButton>
      <ActionConfirmDialog
        isOpen={isDialogOpen}
        title={t('orderList.deleteConfirm.title')}
        isLoading={isLoading}
        isAcceptDisabled={!isConfirmationValid}
        onAccept={handleDelete}
        onReject={() => {
          setConfirmationInput('')
          setIsDialogOpen(false)
        }}
      >
        <label className={styles.inputLabel} htmlFor={confirmationInputId}>
          {t('orderList.deleteConfirm.inputLabel', { phrase: confirmationPhrase })}
        </label>
        <InputText
          inputId={confirmationInputId}
          value={confirmationInput}
          onChange={(e) => setConfirmationInput(e.target.value)}
        />
      </ActionConfirmDialog>
    </>
  )
}

export default BulkDeleteButton
```

## Styling

- CSS Modules with descriptive, BEM-like class names
- Use design tokens / CSS variables when the project defines them
- Compose class names with template literals: `` `${styles.base} ${className ?? ''}` ``
- Interactive buttons: reset browser defaults, add `:focus-visible` outline

## Accessibility

- Associate every input with `<label htmlFor={id}>` and matching `inputId` (never placeholder-only inputs)
- Use `<button type="button">` for non-submit actions instead of clickable `<div>` elements
- Use semantic HTML (`nav`, `main`, `label`) and `aria-label` when there is no visible text

## Refs and Event Handling

- Prefer `forwardRef` over custom callback-based “ref” props when exposing a child API; avoid unnecessary `useImperativeHandle` when `forwardRef` is enough
- Use type guards when reading refs; avoid untyped `ref.current` access without checks
- Use `stopPropagation` when nested handlers must not trigger parents (menus, row actions)

## Performance

- Memoize expensive components with `React.memo` and use `useMemo` / `useCallback` only when there is a measured or clear benefit — not for static or trivial values
- Always provide complete dependency arrays for `useEffect`, `useMemo`, and `useCallback`
- Lazy-load heavy or route-level components with `React.lazy` and `Suspense`; do not lazy-load small leaf components
- Use stable entity `key` props on list items rather than array indices

## Storybook

When the project uses Storybook, new or changed components need `*.stories.tsx` covering default, loading, error, and edge-case states.
