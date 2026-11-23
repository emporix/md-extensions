import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SecondaryButton } from '@emporix/component-library'
import { StylableProps } from '../../helpers/props'
import DeleteConfirmBox from './DeleteConfirmBox'

type BatchDeleteButtonProps = StylableProps & {
  readonly selected: unknown[]
  readonly isDeleting: boolean
  readonly onDelete: () => Promise<unknown> | void
  readonly disabled: boolean
  readonly pluralsPath: string
  readonly actionText?: string
  readonly singularName?: string
}

const BatchDeleteButton = ({
  className = '',
  selected,
  isDeleting,
  onDelete,
  pluralsPath,
  disabled = false,
  actionText,
  singularName,
}: BatchDeleteButtonProps) => {
  const [isDeleteConfirmOpened, setIsDeleteConfirmOpened] = useState(false)
  const { i18n, t } = useTranslation()

  const batchDeleteLabel = useMemo(() => {
    let label = actionText ?? t('global.delete')
    if (selected.length > 0) {
      label += ` (${selected.length})`
    }
    return label
  }, [i18n.language, selected.length, actionText, t])

  return (
    <>
      <SecondaryButton
        className={className}
        onClick={() => setIsDeleteConfirmOpened(true)}
        disabled={selected.length === 0 || disabled}
      >
        {batchDeleteLabel}
      </SecondaryButton>
      <DeleteConfirmBox
        visible={isDeleteConfirmOpened}
        onAccept={async () => {
          await onDelete()
          setIsDeleteConfirmOpened(false)
        }}
        onReject={() => setIsDeleteConfirmOpened(false)}
        loading={isDeleting}
        pluralsPath={pluralsPath}
        entity={selected[0]}
        entityLabel={singularName}
        actionText={actionText}
        count={selected.length}
      />
    </>
  )
}

export default BatchDeleteButton
