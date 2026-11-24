import { ReactNode, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useConfiguration } from '../../context/ConfigurationProvider'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import InputField from '../shared/InputField'
import MixinsFormInput from './MixinsFormInput'
import MixinsSectionBox from './MixinsSectionBox'
import {
  hasLocalizedObjectInput,
  isNestedObjectMixinItem,
  MixinsFormItem,
  MixinsFormItemType,
} from './helpers'
import {
  getLocalizedObjectValue,
  type LocalizedValueMap,
} from './localizedMixin.helpers'
import { editLocalizedObjectField } from './localizedObjectLanguages.helpers'
import styles from './Mixins.module.scss'

interface MixinsLocalizedObjectInputProps {
  readonly item: MixinsFormItem
  readonly value: unknown
  /** Language whose fields are shown and edited. */
  readonly language: string
  readonly onChange: (value: LocalizedValueMap) => void
  readonly disabled?: boolean
  /** Site context: the default-context value, shown as hints. */
  readonly inheritedValue?: unknown
  readonly clearableOverride?: boolean
  /** Site overlay: omitted fields inherit, so none is required and an emptied language is dropped, never `null`. */
  readonly siteOverlay?: boolean
  /** Language whose values are shown as placeholders in the other languages. */
  readonly referenceLanguage?: string
}

const leafKey = (key: string): string => key.split('.').pop() ?? key

/** Fields of a localized OBJECT for one language. */
const MixinsLocalizedObjectInput = ({
  item,
  value,
  language,
  onChange,
  disabled = false,
  inheritedValue,
  clearableOverride = false,
  siteOverlay = false,
  referenceLanguage,
}: MixinsLocalizedObjectInputProps) => {
  const { t } = useTranslation()
  const { languages } = useConfiguration()
  const { getUiLangValue } = useLocalizedValue()
  // Keep latest map for leaf onChange so concurrent field edits do not
  // overwrite each other via a stale render closure.
  const valueRef = useRef(value)
  valueRef.current = value

  const referenceLabel =
    languages?.find((entry) => entry.id === referenceLanguage)?.label ||
    referenceLanguage?.toUpperCase()

  const getPlaceholder = (path: string[]): string | undefined => {
    if (!referenceLanguage || referenceLanguage === language) {
      return undefined
    }
    const reference = getLocalizedObjectValue(value, referenceLanguage, path)
    const isShown =
      (typeof reference === 'string' && reference.trim() !== '') ||
      typeof reference === 'number'
    return isShown
      ? t('mixins.labels.languageValueHint', {
          language: referenceLabel,
          value: String(reference),
        })
      : undefined
  }

  // `locked`: a parent object is read-only or marked for deletion, so its
  // fields are too.
  const renderFields = (
    children: MixinsFormItem[] | undefined,
    parentPath: string[],
    locked = false
  ): ReactNode =>
    children?.map((child) => {
      const path = [...parentPath, leafKey(child.key)]
      const childLocked = locked || !!child.isReadonly || !!child.toDelete
      if (isNestedObjectMixinItem(child)) {
        return (
          <MixinsSectionBox
            key={child.key}
            className={styles.fullWidth}
            name={getUiLangValue(child.name)}
          >
            <div className={styles.fieldsWrap}>
              {renderFields(child.items, path, childLocked)}
            </div>
          </MixinsSectionBox>
        )
      }
      // Schemas from the API can nest these; the MD schema editor cannot.
      const unsupportedMessage =
        child.type === MixinsFormItemType.array
          ? t('mixins.labels.localizedObjectArrayUnsupported')
          : child.localizedObject
            ? t('mixins.labels.nestedLocalizedObjectUnsupported')
            : undefined
      return (
        <div
          key={child.key}
          className={styles.pushDown}
          data-test-id="localized-object-field"
        >
          <InputField
            required={
              child.isRequired && !siteOverlay && hasLocalizedObjectInput(child)
            }
            label={getUiLangValue(child.name)}
          >
            {unsupportedMessage ? (
              <i>{unsupportedMessage}</i>
            ) : (
              <MixinsFormInput
                disabled={disabled || childLocked}
                item={child}
                value={getLocalizedObjectValue(value, language, path) as never}
                inheritedValue={
                  inheritedValue !== undefined && inheritedValue !== null
                    ? getLocalizedObjectValue(inheritedValue, language, path)
                    : undefined
                }
                placeholder={getPlaceholder(path)}
                clearableOverride={clearableOverride}
                onInputChange={(_, next) => {
                  const updated = editLocalizedObjectField(
                    valueRef.current,
                    language,
                    path,
                    next,
                    !siteOverlay && !!item.isNullable
                  )
                  if (updated === undefined) {
                    return
                  }
                  valueRef.current = updated
                  onChange(updated)
                }}
              />
            )}
          </InputField>
        </div>
      )
    })

  return (
    <div className={`${styles.fieldsWrap} ${styles.fullWidth}`}>
      {renderFields(item.items, [])}
    </div>
  )
}

export default MixinsLocalizedObjectInput
