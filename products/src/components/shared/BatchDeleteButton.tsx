import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ConfirmBox from '../shared/ConfirmBox'
import { Button } from 'primereact/button'

interface BatchDeleteButtonProps {
  selected: unknown[]
  isDeleting: boolean
  onDelete: () => Promise<unknown> | void
  disabled: boolean
  entityKey: string
  className?: string
  actionText?: string
}

const BatchDeleteButton = (props: BatchDeleteButtonProps) => {
  const { selected, isDeleting, onDelete, entityKey, disabled, actionText } =
    props
  const [isDeleteConfirmOpened, setIsDeleteConfirmOpened] = useState(false)
  const { i18n, t } = useTranslation()
  const singularTitle = useMemo(() => {
    return t('global.batchDelete.singular.title')
      .replace('{action}', actionText || t('global.delete'))
      .replace('{entity}', t(`${entityKey}.singular`))
      .replace('{count}', selected.length.toString())
  }, [entityKey, selected.length])

  const pluralTitle = useMemo(() => {
    return t('global.batchDelete.plural.title')
      .replace('{action}', actionText || t('global.delete'))
      .replace('{entity}', t(`${entityKey}.plural`))
      .replace('{count}', selected.length.toString())
  }, [entityKey, selected.length])

  const batchDeleteLabel = useMemo(() => {
    let label = actionText || t('global.delete')
    if (selected.length > 0) {
      label += ` (${selected.length})`
    }
    return label
  }, [i18n.language, selected])

  return (
    <>
      <Button
        className={
          `p-button p-button-secondary` +
          (props.className ? ' ' + props.className : '')
        }
        label={batchDeleteLabel}
        onClick={() => setIsDeleteConfirmOpened(true)}
        disabled={selected.length === 0 || disabled}
      />
      <ConfirmBox
        visible={isDeleteConfirmOpened}
        onAccept={async () => {
          await onDelete()
          setIsDeleteConfirmOpened(false)
        }}
        onReject={() => {
          setIsDeleteConfirmOpened(false)
        }}
        loading={isDeleting}
        title={selected.length > 1 ? pluralTitle : singularTitle}
        message={t(
          selected.length > 0
            ? 'global.batchDelete.plural.description'
            : 'global.batchDelete.singular.description'
        )}
      />
    </>
  )
}

BatchDeleteButton.defaultProps = {
  disabled: false,
}

export default BatchDeleteButton
