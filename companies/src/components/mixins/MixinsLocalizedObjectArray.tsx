import { ReactNode, useId, useRef, useState } from 'react'
import { SecondaryButton } from '@emporix/component-library'
import { Control, Controller, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BsTrash } from 'react-icons/bs'
import { HiChevronDown, HiChevronUp, HiMinus } from 'react-icons/hi'
import { useConfiguration } from '../../context/ConfigurationProvider'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import MixinsLanguageTabs, {
  languagePanelId,
  languageTabId,
} from './MixinsLanguageTabs'
import MixinsLocalizedBadge from './MixinsLocalizedBadge'
import MixinsLocalizedObjectInput from './MixinsLocalizedObjectInput'
import MixinsSectionBox from './MixinsSectionBox'
import { buildMixinFieldRules, MixinsFormItem } from './helpers'
import {
  clearLocalizedObjectLanguage,
  getLanguagesMissingRequired,
  getLanguagesWithEditableContent,
  getLocalizedObjectSummary,
  orderLocalizedLanguages,
} from './localizedObjectLanguages.helpers'
import styles from './Mixins.module.scss'

interface MixinsLocalizedObjectArrayProps {
  readonly item: MixinsFormItem
  /** `useFieldArray` ids, one per item. */
  readonly fieldIds: readonly string[]
  /** Form path of the array. */
  readonly name: string
  readonly control: Control
  readonly disabled: boolean
  readonly clearableOverride: boolean
  /** Adds an item; omitted when the array cannot be edited. */
  readonly onAdd?: () => void
  readonly onRemove: (index: number) => void
  /** Shown above the items, e.g. the site's "use default" action. */
  readonly notice?: ReactNode
  /** Shown instead of the tabs and items while the array is empty. */
  readonly emptyContent?: ReactNode
}

/** An array of localized OBJECTs: one language switcher for all of its items. */
const MixinsLocalizedObjectArray = ({
  item,
  fieldIds,
  name,
  control,
  disabled,
  clearableOverride,
  onAdd,
  onRemove,
  notice,
  emptyContent,
}: MixinsLocalizedObjectArrayProps) => {
  const { t } = useTranslation()
  const { languages, contentLanguage } = useConfiguration()
  const { getUiLangValue } = useLocalizedValue()
  const idPrefix = useId()
  const [selectedLanguage, setSelectedLanguage] = useState<string>()
  const [collapsedIds, setCollapsedIds] = useState<string[]>([])
  // Each item's Controller onChange, so clearing a language updates items the
  // same way typing does (no forced validation before the first save).
  const itemChangeHandlers = useRef<Array<(value: unknown) => void>>([])
  const rows = useWatch({ control, name }) as
    | Array<{ value?: unknown } | null>
    | undefined

  const languageIds = orderLocalizedLanguages(
    (languages ?? []).map((language) => language.id),
    (rows ?? []).map((row) => row?.value),
    contentLanguage,
    selectedLanguage
  )
  const activeLanguage = selectedLanguage ?? languageIds[0]
  const activeLanguageLabel =
    languages?.find((language) => language.id === activeLanguage)?.label ||
    activeLanguage?.toUpperCase()
  const hasEditableContent = (value: unknown, language: string): boolean =>
    getLanguagesWithEditableContent(value, item.items).includes(language)
  const canClear =
    !disabled &&
    activeLanguage !== undefined &&
    (rows ?? []).some((row) => hasEditableContent(row?.value, activeLanguage))

  // Items of a site array replace the default as a whole, so clearing works the
  // same as in the default context.
  const clearLanguage = (language: string) =>
    (rows ?? []).forEach((row, index) => {
      if (hasEditableContent(row?.value, language)) {
        itemChangeHandlers.current[index]?.(
          clearLocalizedObjectLanguage(
            row?.value,
            language,
            !!item.isNullable,
            item.items
          )
        )
      }
    })
  const rules = buildMixinFieldRules(
    item,
    t('global.fieldRequired') as string,
    { siteOverlay: clearableOverride }
  )

  const toggleRow = (fieldId: string) =>
    setCollapsedIds((current) =>
      current.includes(fieldId)
        ? current.filter((id) => id !== fieldId)
        : [...current, fieldId]
    )

  const clearButton =
    fieldIds.length > 0 ? (
      <SecondaryButton
        className={styles.clearLanguage}
        size="small"
        aria-label={t('mixins.labels.clearLanguageNamed', {
          language: activeLanguageLabel,
        })}
        disabled={!canClear}
        onClick={() => {
          if (activeLanguage !== undefined) {
            clearLanguage(activeLanguage)
          }
        }}
      >
        <BsTrash size={14} />
        <span className={styles.buttonLabel}>
          {t('mixins.buttons.clearLanguage')}
        </span>
      </SecondaryButton>
    ) : null

  const rowList = fieldIds.map((fieldId, index) => {
    const number = index + 1
    const isExpanded = !collapsedIds.includes(fieldId)
    return (
      <Controller
        key={fieldId}
        name={`${name}.${index}.value`}
        control={control}
        rules={rules}
        render={({ field, fieldState }) => {
          itemChangeHandlers.current[index] = field.onChange
          const missingLanguages = fieldState.error
            ? getLanguagesMissingRequired(item, field.value)
            : []
          const errorMessage =
            missingLanguages.length > 0
              ? t('mixins.labels.requiredMissingInLanguages', {
                  languages: languageIds
                    .filter((id) => missingLanguages.includes(id))
                    .map((id) => id.toUpperCase())
                    .join(', '),
                })
              : fieldState.error?.message
          return (
            <div
              className={styles.localizedArrayRow}
              data-test-id="localized-object-row"
            >
              <div className={styles.localizedArrayRowHeader}>
                <span className={styles.localizedArrayRowNumber}>{number}</span>
                <span className={styles.localizedArrayRowSummary}>
                  {getLocalizedObjectSummary(item, field.value, languageIds)}
                </span>
                <button
                  type="button"
                  className={styles.iconToggle}
                  aria-expanded={isExpanded}
                  aria-label={t(
                    isExpanded
                      ? 'mixins.labels.collapseItem'
                      : 'mixins.labels.expandItem',
                    { index: number }
                  )}
                  onClick={() => toggleRow(fieldId)}
                >
                  {isExpanded ? (
                    <HiChevronUp size={18} />
                  ) : (
                    <HiChevronDown size={18} />
                  )}
                </button>
                <SecondaryButton
                  size="small"
                  iconOnly
                  aria-label={t('mixins.labels.removeItem', { index: number })}
                  disabled={disabled}
                  onClick={() => onRemove(index)}
                >
                  <HiMinus size={16} />
                </SecondaryButton>
              </div>
              {isExpanded && activeLanguage !== undefined ? (
                <div className={styles.localizedArrayRowBody}>
                  <MixinsLocalizedObjectInput
                    key={activeLanguage}
                    item={item}
                    value={field.value}
                    language={activeLanguage}
                    onChange={field.onChange}
                    disabled={disabled || !!item.isReadonly}
                    referenceLanguage={languageIds[0]}
                  />
                </div>
              ) : null}
              {errorMessage ? (
                <small className="p-error block mt-2">{errorMessage}</small>
              ) : null}
            </div>
          )
        }}
      />
    )
  })

  return (
    <MixinsSectionBox
      className={styles.fullWidth}
      item={item}
      name={getUiLangValue(item.name)}
      append={onAdd}
      titleAddon={
        <MixinsLocalizedBadge label={t('mixins.labels.localizedObjectList')} />
      }
      actions={clearButton}
    >
      {fieldIds.length === 0 ? (
        emptyContent
      ) : (
        <>
          {notice}
          {activeLanguage === undefined ? (
            <div className={styles.localizedArrayRows}>{rowList}</div>
          ) : (
            <>
              <MixinsLanguageTabs
                idPrefix={idPrefix}
                languageIds={languageIds}
                activeLanguage={activeLanguage}
                onChange={setSelectedLanguage}
                ariaLabel={t('mixins.labels.languageTabs', {
                  name: getUiLangValue(item.name),
                })}
              />
              <div
                role="tabpanel"
                id={languagePanelId(idPrefix)}
                aria-labelledby={languageTabId(idPrefix, activeLanguage)}
                className={styles.localizedArrayRows}
              >
                {rowList}
              </div>
            </>
          )}
        </>
      )}
    </MixinsSectionBox>
  )
}

export default MixinsLocalizedObjectArray
