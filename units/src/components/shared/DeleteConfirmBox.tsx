import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmBox } from '@emporix/component-library'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import type Localized from '../../models/Localized.model'

type DeleteConfirmBoxProps = {
  readonly visible: boolean
  readonly onAccept: () => void | Promise<void>
  readonly onReject: () => void
  readonly loading?: boolean
  readonly pluralsPath: string
  readonly entity?: unknown
  readonly entityLabel?: string
  readonly actionText?: string
  readonly count?: number
}

const DeleteConfirmBox = ({
  visible,
  onAccept,
  onReject,
  loading = false,
  pluralsPath,
  entity,
  entityLabel,
  actionText,
  count = 1,
}: DeleteConfirmBoxProps) => {
  const { t, i18n } = useTranslation()
  const { getContentLangValue } = useLocalizedValue()
  const isPlural = count > 1

  const upperFirst = (text?: string): string => {
    if (!text) return ''
    return text.charAt(0).toUpperCase() + text.slice(1)
  }

  const resolveEntityLabel = (item: unknown): string => {
    if (!item) return ''
    if (typeof item === 'string') return item
    if (typeof item === 'object') {
      if ('name' in item) {
        return getContentLangValue(item.name as Localized | string)
      }
      if ('localizedName' in item) {
        return getContentLangValue(item.localizedName as Localized)
      }
      if ('firstName' in item || 'lastName' in item) {
        const firstName =
          'firstName' in item ? String(item.firstName ?? '') : ''
        const lastName = 'lastName' in item ? String(item.lastName ?? '') : ''
        const fullName = `${firstName} ${lastName}`.trim()
        if (fullName) return fullName
      }
      if ('id' in item) return String(item.id)
    }
    return ''
  }

  const singularTitle = useMemo(() => {
    const action = actionText ?? t('global.delete')
    const entityName = t(`${pluralsPath}.singular`)
    return t('global.deleteConfirm.singular.title', {
      action:
        i18n.language === 'en' ? upperFirst(action) : action.toLowerCase(),
      entity:
        i18n.language === 'en'
          ? entityName.toLowerCase()
          : upperFirst(entityName),
    })
  }, [i18n.language, pluralsPath, actionText, t])

  const singularMessage = useMemo(() => {
    const label = entityLabel ?? resolveEntityLabel(entity)
    const entityText = t(`${pluralsPath}.singular`)
    return t('global.deleteConfirm.singular.description', {
      action: (actionText ?? t('global.delete')).toLowerCase(),
      entity:
        i18n.language === 'en'
          ? entityText.toLowerCase()
          : upperFirst(entityText),
      id: label,
    })
  }, [i18n.language, pluralsPath, entity, entityLabel, actionText, t])

  const pluralTitle = useMemo(() => {
    const action = actionText ?? t('global.delete')
    const entityName = t(`${pluralsPath}.plural`)
    return t('global.deleteConfirm.plural.title', {
      action:
        i18n.language === 'en' ? upperFirst(action) : action.toLowerCase(),
      entity:
        i18n.language === 'en'
          ? entityName.toLowerCase()
          : upperFirst(entityName),
      count,
    })
  }, [i18n.language, pluralsPath, count, actionText, t])

  const pluralMessage = useMemo(() => {
    return t('global.deleteConfirm.plural.description')
  }, [t])

  return (
    <ConfirmBox
      visible={visible}
      onAccept={onAccept}
      onReject={onReject}
      loading={loading}
      title={isPlural ? pluralTitle : singularTitle}
      message={isPlural ? pluralMessage : singularMessage}
      acceptLabel={t('global.yes')}
      rejectLabel={t('global.cancel')}
    />
  )
}

export default DeleteConfirmBox
