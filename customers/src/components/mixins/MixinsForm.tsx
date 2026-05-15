import React, { useCallback, useEffect } from 'react'
import { Button } from 'primereact/button'
import SectionBox from '../SectionBox'

import { useTranslation } from 'react-i18next'
import { FormProvider, useForm } from 'react-hook-form'
import {
  applyDefaultsOnEmptyFields,
  convertFromIdValuePair,
  convertToIdValuePair,
  createForm,
  filterOutChangedMixins,
  filterOutDeletedMixins,
  isAttributeOfArraySingleReference,
  MixinsFormItem,
  MixinsFormMetadata,
  sortTree,
} from './helpers'
import { Mixins } from 'models/Mixins'
import MixinsFormItemTemplate from './MixinsFormItemTemplate'
import { deepMerge } from 'helpers/utils'
import { useCustomerBulkMixinRegistry } from '../../context/CustomerBulkSaveContext'

interface MixinFormProps {
  name: string
  mixins: Mixins
  metadata: MixinsFormMetadata
  newerMetadata?: MixinsFormMetadata
  onSave: (data: Mixins, metadata: MixinsFormMetadata) => Promise<void> | void
  items: MixinsFormItem[] | undefined
  managerPermissions?: boolean
  onDirtyChange?: (dirty: boolean) => void
  /** When set with bulk registry context, registers this form for shared Save / hides inline actions */
  bulkRegistrationId?: string
  participateInBulkSave?: boolean
}

const MixinsForm = (props: MixinFormProps) => {
  const {
    name,
    mixins,
    metadata,
    onSave,
    items,
    managerPermissions = true,
    onDirtyChange,
    bulkRegistrationId,
    participateInBulkSave = false,
  } = props
  const { t } = useTranslation()
  const methods = useForm()
  const { control, reset, handleSubmit, formState, getValues, trigger } =
    methods
  const bulkRegistry = useCustomerBulkMixinRegistry()

  useEffect(() => {
    onDirtyChange?.(formState.isDirty)
  }, [formState.isDirty, onDirtyChange])

  const resetForm = useCallback(() => {
    const schemaData = createForm(sortTree(items) ?? [])
    const mixinsData = mixins[metadata.key]
    const filteredMixinsData = filterOutChangedMixins(mixinsData, items || [])
    const convertedSchemaData = convertToIdValuePair(schemaData)
    const convertedMixinsData = convertToIdValuePair(filteredMixinsData)
    reset(deepMerge(convertedSchemaData, convertedMixinsData))
  }, [items, metadata.key, mixins, reset])

  useEffect(() => {
    resetForm()
  }, [mixins, items, resetForm])

  const collectForBulk = useCallback(async () => {
    if (!methods.formState.isDirty) return null
    const data = getValues()
    const filteredData = filterOutDeletedMixins(data, items || [])
    const result = applyDefaultsOnEmptyFields(filteredData, items || [])
    return {
      key: metadata.key,
      url: metadata.url,
      data: convertFromIdValuePair(result),
    }
  }, [getValues, items, metadata.key, metadata.url, methods])

  const validateForBulk = useCallback(() => trigger(), [trigger])

  useEffect(() => {
    if (
      !bulkRegistry ||
      bulkRegistrationId === undefined ||
      !participateInBulkSave
    ) {
      return
    }
    bulkRegistry.register(bulkRegistrationId, {
      validate: validateForBulk,
      collect: collectForBulk,
      discard: resetForm,
    })
    return () => bulkRegistry.unregister(bulkRegistrationId)
  }, [
    bulkRegistry,
    bulkRegistrationId,
    participateInBulkSave,
    collectForBulk,
    validateForBulk,
    resetForm,
  ])

  const onSubmit = useCallback(
    async (data: Mixins) => {
      const filteredData = filterOutDeletedMixins(data, items || [])
      const result = applyDefaultsOnEmptyFields(filteredData, items || [])
      await onSave(convertFromIdValuePair(result), metadata)
    },
    [onSave, metadata, items]
  )

  const showInlineActions =
    !bulkRegistry || bulkRegistrationId === undefined

  return (
    <>
      <SectionBox
        name={name}
        actions={
          showInlineActions ? (
            <>
              <Button
                className="p-button-secondary"
                label={t('global.discard')}
                onClick={() => resetForm()}
                disabled={!formState.isDirty || !managerPermissions}
              />
              <Button
                className="ml-2"
                disabled={
                  !formState.isDirty ||
                  !formState.isValid ||
                  !managerPermissions
                }
                label={t('global.save')}
                onClick={handleSubmit((data) => onSubmit(data))}
              />
            </>
          ) : undefined
        }
      >
        <FormProvider {...methods}>
          <div className="flex flex-wrap gap-3">
            {(items || []).map((i) => (
              <MixinsFormItemTemplate
                key={i.key}
                item={i}
                control={control}
                managerPermissions={managerPermissions}
                isSingleReferenceArray={isAttributeOfArraySingleReference(i)}
              />
            ))}
          </div>
        </FormProvider>
      </SectionBox>
    </>
  )
}

export default MixinsForm
