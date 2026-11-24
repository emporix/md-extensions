import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { SecondaryButton } from '@emporix/component-library'
import MixinsSectionBox from './MixinsSectionBox'
import { useTranslation } from 'react-i18next'
import {
  Control,
  Controller,
  FieldValues,
  useFieldArray,
  useFormContext,
  useWatch,
} from 'react-hook-form'
import {
  defaultValueForMixinItem,
  isAttributeOfArraySingleReference,
  MixinsFormItem,
  MixinsFormItemType,
} from './helpers'
import {
  formatInheritedDisplayValue,
  SITE_ARRAY_OVERRIDE_FLAGS_KEY,
} from './siteAwareMixin.helpers'
import InputField from '../shared/InputField'
import MixinsFormInput from './MixinsFormInput'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { v4 as uuidv4 } from 'uuid'
import { HiMinus } from 'react-icons/hi'
import MixinsFormItemTemplate from './MixinsFormItemTemplate'
import MixinsLocalizedObjectArray from './MixinsLocalizedObjectArray'
import { ReferenceItem, ReferenceSelector } from './ReferenceSelector'
import { textToTitleCase } from '../../helpers/utils'
import { getReferenceTranslationKey } from './useReferenceSelectorConfig'
import styles from './Mixins.module.scss'

interface Props {
  readonly item: MixinsFormItem
  readonly control: Control<FieldValues>
  readonly managerPermissions: boolean
  readonly parentKey?: string
  readonly inheritedValue?: unknown
  readonly clearableOverride?: boolean
  /** Bumped by MixinsForm on reset — clears in-session "use default" latch. */
  readonly formResetGeneration?: number
}

type ArrayEntry = { id?: string; value?: { id?: string } | unknown }

const MixinsFormArray = (props: Props) => {
  const {
    item,
    control,
    managerPermissions,
    parentKey,
    inheritedValue,
    clearableOverride = false,
    formResetGeneration = 0,
  } = props
  const { getUiLangValue } = useLocalizedValue()
  const { t } = useTranslation()
  const { setValue, getValues } = useFormContext()
  const inheritedArrayHint = formatInheritedDisplayValue(inheritedValue)

  let prefix = ''
  if (parentKey !== undefined) {
    prefix = parentKey + '.'
  }
  const newParentKey = prefix + item.key

  // Capture override presence before useFieldArray materializes undefined → [].
  // Form defaultValues are seeded in MixinsForm so the first read sees saved arrays.
  const initialIsOverrideRef = useRef<boolean | null>(null)
  const clearedToInheritRef = useRef(false)
  if (initialIsOverrideRef.current === null) {
    initialIsOverrideRef.current = Array.isArray(getValues(newParentKey))
  }
  const [isArrayOverride, setIsArrayOverride] = useState(
    () => initialIsOverrideRef.current === true
  )

  const { fields, append, remove, replace } = useFieldArray({
    name: newParentKey,
    control,
  })

  // Parent form reset (new mixins / site / key) — drop the in-session "use default"
  // latch so a loaded non-empty site array can become an override again. Do not
  // infer override from `[]` here: useFieldArray materializes missing keys as []
  // (inherit), which is indistinguishable from an explicit empty override.
  useEffect(() => {
    clearedToInheritRef.current = false
  }, [formResetGeneration])

  // Parent reset() can load a non-empty saved site array after mount; re-sync.
  // Ignore materialized `[]` so "Use default" / inherit is not flipped to override.
  useEffect(() => {
    if (!clearableOverride || isArrayOverride || clearedToInheritRef.current) {
      return
    }
    const current = getValues(newParentKey)
    if (Array.isArray(current) && current.length > 0) {
      setIsArrayOverride(true)
      initialIsOverrideRef.current = true
    }
  }, [
    clearableOverride,
    getValues,
    isArrayOverride,
    newParentKey,
    fields.length,
    formResetGeneration,
  ])

  useEffect(() => {
    if (!clearableOverride) {
      return
    }
    const current =
      (getValues(SITE_ARRAY_OVERRIDE_FLAGS_KEY) as
        | Record<string, boolean>
        | undefined) ?? {}
    if (current[newParentKey] === isArrayOverride) {
      return
    }
    setValue(
      SITE_ARRAY_OVERRIDE_FLAGS_KEY,
      { ...current, [newParentKey]: isArrayOverride },
      { shouldDirty: false, shouldTouch: false, shouldValidate: false }
    )
  }, [clearableOverride, getValues, isArrayOverride, newParentKey, setValue])

  /**
   * First site edit marks a full array override. Do not seed/copy tenant defaults
   * then append — site arrays replace the default, they do not merge with it.
   */
  const markArrayOverride = useCallback(() => {
    if (!clearableOverride) {
      return
    }
    if (isArrayOverride) {
      return
    }
    clearedToInheritRef.current = false
    setIsArrayOverride(true)
  }, [clearableOverride, isArrayOverride])

  const appendOverride = useCallback(
    (...args: Parameters<typeof append>) => {
      markArrayOverride()
      return append(...args)
    },
    [append, markArrayOverride]
  )

  const removeOverride = useCallback(
    (...args: Parameters<typeof remove>) => {
      markArrayOverride()
      return remove(...args)
    },
    [markArrayOverride, remove]
  )

  const replaceOverride = useCallback(
    (...args: Parameters<typeof replace>) => {
      markArrayOverride()
      return replace(...args)
    },
    [markArrayOverride, replace]
  )

  const isReferenceArray = isAttributeOfArraySingleReference(item)
  let referenceType = ''
  let referenceTypeEnum: (string | null)[] | undefined

  if (isReferenceArray) {
    referenceTypeEnum = item.referenceTypeEnum
    referenceType =
      referenceTypeEnum && referenceTypeEnum.length === 1
        ? (referenceTypeEnum[0] as string)
        : ''
  }

  const handleMultiSelectorChange = (selectedIds: string[]) => {
    const newEntries = selectedIds.map((id) => ({
      id: uuidv4(),
      value: {
        emporixReferenceType: referenceType,
        id: id,
      },
    }))
    replaceOverride(newEntries)
  }

  // Read the live array values, not the useFieldArray `fields` snapshot whose
  // `value` is the registered default and goes stale after edits/removals. This
  // keeps the batched selector in sync with the per-item list on remove.
  const watchedEntries = useWatch({ control, name: newParentKey }) as
    | Array<{ value?: { id?: string } }>
    | null
    | undefined
  const hasArrayOverride = clearableOverride
    ? isArrayOverride
    : Array.isArray(watchedEntries)
  const clearArrayOverride = () => {
    clearedToInheritRef.current = true
    setIsArrayOverride(false)
    replace([])
  }
  // A read-only array or one marked for deletion cannot change at all: no
  // adding, removing or editing items, and no dropping the site override.
  const editable = managerPermissions && !item.isReadonly && !item.toDelete
  // It also shows that the site overrides the array, so it stays visible,
  // disabled, when the array cannot change.
  const useDefaultButton =
    clearableOverride && hasArrayOverride ? (
      <button
        type="button"
        className={styles.clearOverride}
        disabled={!editable}
        onClick={clearArrayOverride}
      >
        {t('mixins.labels.useDefaultValue')}
      </button>
    ) : null

  const getCurrentSelectedIds = (): string[] => {
    return ((watchedEntries ?? fields) as ArrayEntry[])
      .map((entry) => {
        const entryValue = entry?.value as { id?: string } | undefined
        if (entryValue && typeof entryValue === 'object' && entryValue.id) {
          return entryValue.id
        }
        return ''
      })
      .filter((id) => id !== '')
  }

  // References resolved once by the top batched selector, reused by the per-item
  // selectors below so they don't each fire their own resolve call.
  const [resolvedRefs, setResolvedRefs] = useState<ReferenceItem[]>([])
  const handleResolved = useCallback((items: ReferenceItem[]) => {
    setResolvedRefs((prev) => {
      const byId = new Map(prev.map((it) => [it.id, it]))
      for (const it of items) {
        if (it?.id) {
          byId.set(it.id, it)
        }
      }
      return Array.from(byId.values())
    })
  }, [])

  // Rows of a site array replace the default array as a whole, so nothing in
  // them inherits: rows get no default hints or "use default" controls.
  const renderItemArray = (items: MixinsFormItem[], index: number) => {
    const list = (
      <div className={styles.fieldsWrap}>
        {items.map((i) => (
          <MixinsFormItemTemplate
            key={i.key}
            item={i}
            control={control}
            managerPermissions={editable}
            arrayKey={newParentKey}
            index={index}
            isSingleReferenceArray={isReferenceArray}
            formResetGeneration={formResetGeneration}
          />
        ))}
      </div>
    )
    return (
      <>
        {item.name ? (
          <MixinsSectionBox
            key={index}
            className={styles.fullWidth}
            name={index + 1 + ' '}
            remove={
              isReferenceArray || !editable
                ? undefined
                : () => removeOverride(index)
            }
          >
            {list}
          </MixinsSectionBox>
        ) : (
          list
        )}
      </>
    )
  }

  const renderColumns = () => {
    const columns = []
    let column: ReactNode[] = []
    // A localized value has its "Show languages" link below the input, so the
    // remove button lines up with the input instead of the whole block.
    const isLocalizedList = item.arrayType === MixinsFormItemType.localized

    if (fields.length === 0) {
      columns.push(
        <div key={item.key} className={styles.column}>
          <span className={styles.emptyArray}>
            {t('mixins.labels.emptyArray', { type: item.arrayType })}
          </span>
          {!hasArrayOverride && inheritedArrayHint ? (
            <span className={styles.inheritedHint}>
              {t('mixins.labels.defaultValueHint', {
                value: inheritedArrayHint,
              })}
            </span>
          ) : null}
          {useDefaultButton}
        </div>
      )
    }

    fields.forEach((field, index) => {
      column.push(
        item.arrayType === 'object' ? (
          renderItemArray(item.items !== undefined ? item.items : [], index)
        ) : (
          <div key={index} className={styles.arrayEntry}>
            <Controller
              key={field.id}
              name={`${prefix}${item.key}.${index}.value`}
              control={control}
              rules={
                item.arrayType === MixinsFormItemType.reference
                  ? {
                      validate: (v: { id?: unknown } | undefined) => {
                        if (!item.isRequired) return true
                        const id = v?.id
                        return (
                          (typeof id === 'string' && id.trim() !== '') ||
                          t('global.fieldRequired')
                        )
                      },
                    }
                  : {
                      required:
                        item.type !== MixinsFormItemType.unknown &&
                        item.isRequired,
                    }
              }
              render={({ field: controllerField, fieldState }) =>
                item.arrayType === MixinsFormItemType.reference ? (
                  <>
                    <label className={styles.referenceArrayLabel}>
                      <div>{index + 1}</div>
                      {textToTitleCase(
                        t(getReferenceTranslationKey(item.referenceType), {
                          type: item.referenceType,
                        })
                      )}
                    </label>
                    <div className={styles.rowTight}>
                      <MixinsFormInput
                        disabled={!editable}
                        hideFieldName={true}
                        disableReferenceSelector={isReferenceArray}
                        externalItems={resolvedRefs}
                        item={item}
                        value={controllerField.value}
                        onInputChange={(_, value) =>
                          controllerField.onChange(value)
                        }
                      />
                      <SecondaryButton
                        className={styles.referenceRemove}
                        size="small"
                        iconOnly
                        aria-label={t('global.remove')}
                        onClick={() => removeOverride(index)}
                        disabled={!editable}
                      >
                        <HiMinus size={16} />
                      </SecondaryButton>
                    </div>
                    {fieldState.error?.message ? (
                      <small className="p-error block mt-1">
                        {fieldState.error.message as string}
                      </small>
                    ) : null}
                  </>
                ) : (
                  <InputField
                    className={styles.field}
                    required={
                      item.type !== MixinsFormItemType.unknown &&
                      item.isRequired
                    }
                    label={index + 1 + ' '}
                    error={fieldState.error?.message as string | undefined}
                  >
                    <div
                      className={
                        isLocalizedList
                          ? `${styles.rowTight} ${styles.rowTop}`
                          : styles.rowTight
                      }
                    >
                      <MixinsFormInput
                        disabled={!editable}
                        hideFieldName={true}
                        item={item}
                        value={controllerField.value}
                        onInputChange={(_, value) =>
                          controllerField.onChange(value)
                        }
                      />
                      <SecondaryButton
                        className={
                          isLocalizedList
                            ? `${styles.arrayRemove} ${styles.arrayRemoveTop}`
                            : styles.arrayRemove
                        }
                        size="small"
                        iconOnly
                        aria-label={t('global.remove')}
                        onClick={() => removeOverride(index)}
                        disabled={!editable}
                      >
                        <HiMinus size={20} />
                      </SecondaryButton>
                    </div>
                  </InputField>
                )
              }
            />
          </div>
        )
      )

      if ((index + 1) % 5 === 0 || index === fields.length - 1) {
        columns.push(
          <div key={index} className={styles.column}>
            {column}
          </div>
        )
        column = []
      }
    })

    return columns
  }

  if (isReferenceArray) {
    return (
      <MixinsSectionBox
        className={styles.fullWidth}
        name={getUiLangValue(item.name)}
      >
        <div className={styles.referenceArrayBody}>
          {referenceType ? (
            <ReferenceSelector
              value={getCurrentSelectedIds()}
              onChange={handleMultiSelectorChange}
              referenceType={referenceType}
              disabled={!editable}
              onResolved={handleResolved}
              className={styles.fullWidth}
            />
          ) : (
            <div className={styles.row}>
              <span className={styles.unsupportedNote}>
                {t('mixins.labels.multiReferenceNotSupported')}
              </span>
              <SecondaryButton
                size="small"
                onClick={() => {
                  appendOverride({
                    id: uuidv4(),
                    value: defaultValueForMixinItem(item, true, referenceType),
                  })
                }}
                disabled={!editable}
              >
                {t('mixins.buttons.addNew')}
              </SecondaryButton>
            </div>
          )}
          {fields.length > 0 ? useDefaultButton : null}
          <div className={styles.arrayColumnsWide}>{renderColumns()}</div>
        </div>
      </MixinsSectionBox>
    )
  }

  if (item.localizedObject) {
    return (
      <MixinsLocalizedObjectArray
        key={item.key}
        item={item}
        fieldIds={fields.map((field) => field.id)}
        name={newParentKey}
        control={control}
        disabled={!editable}
        clearableOverride={clearableOverride}
        onAdd={
          editable
            ? () =>
                appendOverride({
                  id: uuidv4(),
                  value: defaultValueForMixinItem(item, true),
                })
            : undefined
        }
        onRemove={removeOverride}
        notice={useDefaultButton}
        emptyContent={fields.length === 0 ? renderColumns() : undefined}
      />
    )
  }

  return (
    <MixinsSectionBox
      key={item.key}
      item={item}
      append={
        editable
          ? () =>
              appendOverride({
                id: uuidv4(),
                value: defaultValueForMixinItem(
                  item,
                  true,
                  isReferenceArray ? referenceType : undefined
                ),
              })
          : undefined
      }
      className={styles.fullWidth}
      name={getUiLangValue(item.name)}
    >
      {fields.length > 0 ? useDefaultButton : null}
      <div className={styles.arrayColumns}>{renderColumns()}</div>
    </MixinsSectionBox>
  )
}

export default MixinsFormArray
