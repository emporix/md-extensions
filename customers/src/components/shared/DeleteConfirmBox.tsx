import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import ConfirmBox from '../ConfirmBox'
import { useLocalizedValue } from 'hooks/useLocalizedValue'
import Localized from 'models/Localized'

interface DeleteConfirmBoxProps {
  visible: boolean
  onAccept: () => void | Promise<void>
  onReject: () => void
  loading?: boolean
  pluralsPath: string
  entity?: unknown
  entityLabel?: string
  actionText?: string
  count?: number
}

const DeleteConfirmBox = (props: DeleteConfirmBoxProps) => {
  const {
    visible,
    onAccept,
    onReject,
    loading = false,
    pluralsPath,
    entity,
    entityLabel,
    actionText,
    count = 1,
  } = props
  const { t, i18n } = useTranslation()
  const { getContentLangValue } = useLocalizedValue()
  const isPlural = count > 1

  const upperFirst = (text?: string): string => {
    if (!text) return ''
    return text?.charAt(0).toUpperCase() + text?.slice(1)
  }

  const resolveEntityLabel = (item: unknown): string => {
    if (!item) return ''
    if (typeof item === 'string') return item
    if (typeof item === 'object') {
      if ('name' in item)
        return getContentLangValue(item.name as Localized | string)
      if ('localizedName' in item)
        return getContentLangValue(item.localizedName as Localized)
      if ('id' in item) return String(item.id)
    }
    return ''
  }

  const singularTitle = useMemo(() => {
    const action = actionText || t('global.delete')
    const entity = t(`${pluralsPath}.singular`)
    return t('global.deleteConfirm.singular.title', {
      action:
        i18n.language === 'en' ? upperFirst(action) : action?.toLowerCase(),
      entity:
        i18n.language === 'en' ? entity.toLowerCase() : upperFirst(entity),
    })
  }, [i18n.language, pluralsPath, actionText])

  const singularMessage = useMemo(() => {
    const label = entityLabel || resolveEntityLabel(entity)
    const entityText = t(`${pluralsPath}.singular`)
    return t('global.deleteConfirm.singular.description', {
      action: actionText || t('global.delete').toLowerCase(),
      entity:
        i18n.language === 'en'
          ? entityText.toLowerCase()
          : upperFirst(entityText),
      id: label,
    })
  }, [i18n.language, pluralsPath, entity, entityLabel, actionText])

  const pluralTitle = useMemo(() => {
    const action = actionText || t('global.delete')
    const entity = t(`${pluralsPath}.plural`)
    return t('global.deleteConfirm.plural.title', {
      action:
        i18n.language === 'en' ? upperFirst(action) : action?.toLowerCase(),
      entity:
        i18n.language === 'en' ? entity.toLowerCase() : upperFirst(entity),
      count,
    })
  }, [i18n.language, pluralsPath, count, actionText])

  const pluralMessage = useMemo(() => {
    return t('global.deleteConfirm.plural.description')
  }, [i18n.language])

  return (
    <ConfirmBox
      visible={visible}
      onAccept={onAccept}
      onReject={onReject}
      loading={loading}
      title={isPlural ? pluralTitle : singularTitle}
      message={isPlural ? pluralMessage : singularMessage}
    />
  )
}

export default DeleteConfirmBox
