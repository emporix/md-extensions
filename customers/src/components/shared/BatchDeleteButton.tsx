import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'primereact/button'
import { StylableProps } from 'helpers/props'
import DeleteConfirmBox from './DeleteConfirmBox'

interface BatchDeleteButtonProps extends StylableProps {
  selected: unknown[]
  isDeleting: boolean
  onDelete: () => Promise<unknown> | void
  disabled: boolean
  pluralsPath: string
  actionText?: string
  singularName?: string
}

const BatchDeleteButton = (props: BatchDeleteButtonProps) => {
  const {
    className = '',
    selected,
    isDeleting,
    onDelete,
    pluralsPath,
    disabled,
    actionText,
    singularName,
  } = props
  const [isDeleteConfirmOpened, setIsDeleteConfirmOpened] = useState(false)
  const { i18n, t } = useTranslation()

  const batchDeleteLabel = useMemo(() => {
    let label = actionText || t('global.delete')
    if (selected.length > 0) {
      label += ` (${selected.length})`
    }
    return label
  }, [i18n.language, selected, actionText])

  return (
    <>
      <Button
        className={`p-button-secondary-small ${className}`}
        label={batchDeleteLabel}
        onClick={() => setIsDeleteConfirmOpened(true)}
        disabled={selected.length === 0 || disabled}
      />
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

BatchDeleteButton.defaultProps = {
  disabled: false,
}

export default BatchDeleteButton
