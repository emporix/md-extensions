import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
} from 'react'
import {
  PrimaryButton,
  SecondaryButton,
  SectionBox,
} from '@emporix/component-library'

import { useTranslation } from 'react-i18next'
import { FieldValues, FormProvider, useForm } from 'react-hook-form'
import {
  applyDefaultsOnEmptyFields,
  convertFromIdValuePair,
  convertToIdValuePair,
  createForm,
  filterOutChangedMixins,
  filterOutDeletedMixins,
  hasMissingRequiredMixinValues,
  hasMissingRequiredSiteOverlayValues,
  isAttributeOfArraySingleReference,
  mixinStorageKey,
  MixinsFormItem,
  MixinsFormMetadata,
  sortTree,
} from './helpers'
import { serializeLocalizedFields } from './localizedMixin.helpers'
import { normalizeSiteOverlay } from './siteAwareMixin.helpers'
import { Mixins } from '../../models/Mixins.model'
import MixinsFormItemTemplate from './MixinsFormItemTemplate'
import { deepMerge } from './mixins.utils'
import styles from './Mixins.module.scss'

export type MixinsFormHandle = {
  flush: () => Mixins
  isDirty: () => boolean
  validate: () => Promise<boolean>
}

interface MixinFormProps {
  name: string
  mixins: Mixins
  metadata: MixinsFormMetadata
  newerMetadata?: MixinsFormMetadata
  onSave: (data: Mixins, metadata: MixinsFormMetadata) => Promise<void> | void
  items: MixinsFormItem[] | undefined
  managerPermissions?: boolean
  /** Default-context field values used as ghost placeholders when editing a site. */
  inheritedValues?: Mixins
  /** Replaces default Discard/Save (e.g. site-aware batch actions in the header). */
  headerActions?: React.ReactNode
  onDirtyChange?: (isDirty: boolean) => void
  /** Emits current payload so parents can compare against received/baseline state. */
  onPayloadChange?: (payload: Mixins) => void
  /** Optional left panel rendered inside the SectionBox (e.g. site context). */
  sidePanel?: React.ReactNode
  /** When true, form controls stay non-editable (e.g. while a batch save is in flight). */
  readOnly?: boolean
}

const MixinsForm = forwardRef<MixinsFormHandle, MixinFormProps>(
  (props, ref) => {
    const {
      name,
      mixins,
      metadata,
      onSave,
      items,
      managerPermissions = true,
      inheritedValues,
      headerActions,
      onDirtyChange,
      onPayloadChange,
      sidePanel,
      readOnly = false,
    } = props
    const { t } = useTranslation()
    const isSiteContext = !!metadata.siteCode
    // Site-aware batch editing compares live payloads to API baselines; synthesizing
    // schema defaults would mark untouched fields dirty in the default context too.
    const useSparseDefaults = isSiteContext || !!onPayloadChange
    const fieldsDisabled = readOnly || !managerPermissions

    const prepareData = () => {
      const schemaData = createForm(sortTree(items) ?? [], {
        sparse: useSparseDefaults,
      })
      const mixinsData =
        mixins[mixinStorageKey(metadata.key, metadata.siteCode)]
      // Site-aware batch drafts are migrated once in MixinsFormBox; stripping
      // toChange here on every remount would wipe replacements the user entered.
      const filteredMixinsData = onPayloadChange
        ? mixinsData
        : filterOutChangedMixins(mixinsData, items || [])
      const convertedSchemaData = convertToIdValuePair(schemaData)
      const convertedMixinsData = convertToIdValuePair(filteredMixinsData)
      return deepMerge(convertedSchemaData, convertedMixinsData)
    }

    // Seed defaultValues so children (e.g. MixinsFormArray override detect) see
    // the draft on first render, not only after the reset effect.
    const methods = useForm<FieldValues>({ defaultValues: prepareData() })
    const {
      control,
      reset,
      handleSubmit,
      formState,
      getValues,
      watch,
      trigger,
    } = methods

    const resetForm = () => {
      reset(prepareData())
    }

    useEffect(() => {
      resetForm()
      // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
    }, [mixins, items, metadata.siteCode, metadata.key])

    useEffect(() => {
      onDirtyChange?.(formState.isDirty)
    }, [formState.isDirty, onDirtyChange])

    const toPayload = useCallback(
      (data: Mixins): Mixins => {
        const filteredData = filterOutDeletedMixins(data, items || [])
        const withDefaults = useSparseDefaults
          ? filteredData
          : applyDefaultsOnEmptyFields(filteredData, items || [])
        return serializeLocalizedFields(
          convertFromIdValuePair(withDefaults),
          items || []
        ) as Mixins
      },
      [items, useSparseDefaults]
    )

    useEffect(() => {
      if (!onPayloadChange) {
        return
      }
      const emit = (values: Mixins) => {
        onPayloadChange(toPayload(values))
      }
      emit(getValues() as Mixins)
      const subscription = watch((values) => {
        emit(values as Mixins)
      })
      return () => subscription.unsubscribe()
    }, [
      getValues,
      onPayloadChange,
      toPayload,
      watch,
      metadata.siteCode,
      metadata.key,
    ])

    useImperativeHandle(
      ref,
      () => ({
        flush: () => toPayload(getValues() as Mixins),
        isDirty: () => formState.isDirty,
        validate: async () => {
          const payload = toPayload(getValues() as Mixins)
          if (isSiteContext) {
            return !hasMissingRequiredSiteOverlayValues(
              normalizeSiteOverlay(payload),
              items || []
            )
          }
          const ok = await trigger()
          if (!ok) {
            return false
          }
          return !hasMissingRequiredMixinValues(payload, items || [])
        },
      }),
      [formState.isDirty, getValues, isSiteContext, items, toPayload, trigger]
    )

    const onSubmit = useCallback(
      async (data: Mixins) => {
        await onSave(toPayload(data), metadata)
      },
      [onSave, metadata, toPayload]
    )

    const formFields = (
      <div className={styles.fieldsWrap}>
        {(items || []).map((i) => (
          <MixinsFormItemTemplate
            key={i.key}
            item={isSiteContext ? { ...i, isRequired: false } : i}
            control={control}
            managerPermissions={!fieldsDisabled}
            isSingleReferenceArray={isAttributeOfArraySingleReference(i)}
            inheritedValue={
              isSiteContext ? inheritedValues?.[i.key] : undefined
            }
            clearableOverride={isSiteContext}
          ></MixinsFormItemTemplate>
        ))}
      </div>
    )

    return (
      <>
        <SectionBox
          name={name}
          sectionClassName={sidePanel ? styles.sectionWithSidePanel : ''}
          actions={
            headerActions ?? (
              <div className={styles.actions}>
                <SecondaryButton
                  onClick={() => resetForm()}
                  disabled={
                    !formState.isDirty || !managerPermissions || readOnly
                  }
                >
                  {t('global.discard')}
                </SecondaryButton>
                <PrimaryButton
                  disabled={
                    !formState.isValid || !managerPermissions || readOnly
                  }
                  onClick={handleSubmit((data) => onSubmit(data as Mixins))}
                >
                  {t('global.save')}
                </PrimaryButton>
              </div>
            )
          }
        >
          <FormProvider {...methods}>
            {sidePanel ? (
              <div className={styles.siteAwareLayout}>
                {sidePanel}
                <div className={styles.siteAwareForm}>{formFields}</div>
              </div>
            ) : (
              formFields
            )}
          </FormProvider>
        </SectionBox>
      </>
    )
  }
)

MixinsForm.displayName = 'MixinsForm'

export default MixinsForm
