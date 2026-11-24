import { useId, useState } from 'react'
import { SecondaryButton } from '@emporix/component-library'
import { useTranslation } from 'react-i18next'
import { BsTrash } from 'react-icons/bs'
import { useConfiguration } from '../../context/ConfigurationProvider'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import MixinsLanguageTabs, {
  languagePanelId,
  languageTabId,
} from './MixinsLanguageTabs'
import MixinsLocalizedBadge from './MixinsLocalizedBadge'
import MixinsLocalizedObjectInput from './MixinsLocalizedObjectInput'
import MixinsSectionBox from './MixinsSectionBox'
import { MixinsFormItem } from './helpers'
import { type LocalizedValueMap } from './localizedMixin.helpers'
import {
  clearLocalizedObjectLanguage,
  getLanguagesMissingRequired,
  getLanguagesWithContent,
  getLanguagesWithEditableContent,
  orderLocalizedLanguages,
} from './localizedObjectLanguages.helpers'
import styles from './Mixins.module.scss'

interface MixinsLocalizedObjectFieldProps {
  readonly item: MixinsFormItem
  readonly value: unknown
  readonly onChange: (value: LocalizedValueMap) => void
  readonly disabled: boolean
  /** Site overlay: the default-context value, shown as hints. */
  readonly inheritedValue?: unknown
  /** Site overlay where omitted languages and fields inherit from the default context. */
  readonly siteOverlay?: boolean
  /** Name of the edited site, used in the overlay status. */
  readonly siteLabel?: string
  readonly error?: string
}

const formatLanguages = (languageIds: readonly string[]): string =>
  languageIds.map((id) => id.toUpperCase()).join(', ')

/** A localized OBJECT: language tabs above the fields of the selected language. */
const MixinsLocalizedObjectField = ({
  item,
  value,
  onChange,
  disabled,
  inheritedValue,
  siteOverlay = false,
  siteLabel,
  error,
}: MixinsLocalizedObjectFieldProps) => {
  const { t } = useTranslation()
  const { languages, contentLanguage } = useConfiguration()
  const { getUiLangValue } = useLocalizedValue()
  const idPrefix = useId()
  const [selectedLanguage, setSelectedLanguage] = useState<string>()

  const name = getUiLangValue(item.name)
  // A site also shows the default's languages, so clearing an override keeps its tab.
  const languageIds = orderLocalizedLanguages(
    (languages ?? []).map((language) => language.id),
    [value, inheritedValue],
    contentLanguage,
    selectedLanguage
  )
  const activeLanguage = selectedLanguage ?? languageIds[0]
  const activeLanguageLabel =
    languages?.find((language) => language.id === activeLanguage)?.label ||
    activeLanguage?.toUpperCase()
  const withContent = getLanguagesWithContent(value)
  const filledLanguages = languageIds.filter((id) => withContent.includes(id))
  const canClear =
    !disabled &&
    activeLanguage !== undefined &&
    getLanguagesWithEditableContent(value, item.items).includes(activeLanguage)

  const missingLanguages = error
    ? getLanguagesMissingRequired(item, value, siteOverlay)
    : []
  const errorMessage =
    missingLanguages.length > 0
      ? t('mixins.labels.requiredMissingInLanguages', {
          languages: formatLanguages(
            languageIds.filter((id) => missingLanguages.includes(id))
          ),
        })
      : error

  const site = siteLabel ?? t('mixins.labels.site')
  const inheritNote =
    filledLanguages.length === languageIds.length
      ? t('mixins.labels.siteEmptyFieldsInherit')
      : t('mixins.labels.siteOtherLanguagesInherit')
  const overlayStatus =
    filledLanguages.length === 0
      ? t('mixins.labels.siteNothingOverridden', { site })
      : `${t('mixins.labels.siteOverriddenLanguages', {
          site,
          languages: formatLanguages(filledLanguages),
        })} ${inheritNote}`

  const clearButton = (
    <SecondaryButton
      className={styles.clearLanguage}
      size="small"
      aria-label={t('mixins.labels.clearLanguageNamed', {
        language: activeLanguageLabel,
      })}
      disabled={!canClear}
      onClick={() => {
        if (activeLanguage !== undefined) {
          // A site drops its override so the language inherits again.
          onChange(
            clearLocalizedObjectLanguage(
              value,
              activeLanguage,
              !!item.isNullable && !siteOverlay,
              item.items
            )
          )
        }
      }}
    >
      <BsTrash size={14} />
      <span className={styles.buttonLabel}>
        {t('mixins.buttons.clearLanguage')}
      </span>
    </SecondaryButton>
  )

  return (
    <MixinsSectionBox
      className={styles.fullWidth}
      item={item}
      name={name}
      titleAddon={
        <MixinsLocalizedBadge label={t('mixins.labels.localizedObject')} />
      }
      actions={clearButton}
    >
      {activeLanguage !== undefined ? (
        <>
          <MixinsLanguageTabs
            idPrefix={idPrefix}
            languageIds={languageIds}
            activeLanguage={activeLanguage}
            onChange={setSelectedLanguage}
            ariaLabel={t('mixins.labels.languageTabs', { name })}
          />
          {siteOverlay ? (
            <p className={styles.localizedStatus}>{overlayStatus}</p>
          ) : null}
          <div
            role="tabpanel"
            id={languagePanelId(idPrefix)}
            aria-labelledby={languageTabId(idPrefix, activeLanguage)}
          >
            <MixinsLocalizedObjectInput
              key={activeLanguage}
              item={item}
              value={value}
              language={activeLanguage}
              onChange={onChange}
              disabled={disabled}
              inheritedValue={inheritedValue}
              clearableOverride={siteOverlay}
              siteOverlay={siteOverlay}
              referenceLanguage={siteOverlay ? undefined : languageIds[0]}
            />
          </div>
        </>
      ) : null}
      {errorMessage ? (
        <small className="p-error block mt-2">{errorMessage}</small>
      ) : null}
    </MixinsSectionBox>
  )
}

export default MixinsLocalizedObjectField
