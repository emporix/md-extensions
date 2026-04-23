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

interface MixinFormProps {
  name: string
  mixins: Mixins
  metadata: MixinsFormMetadata
  newerMetadata?: MixinsFormMetadata
  onSave: (data: Mixins, metadata: MixinsFormMetadata) => Promise<void> | void
  items: MixinsFormItem[] | undefined
  managerPermissions?: boolean
}

const MixinsForm = (props: MixinFormProps) => {
  const {
    name,
    mixins,
    metadata,
    onSave,
    items,
    managerPermissions = true,
  } = props
  const { t } = useTranslation()
  const methods = useForm()
  const { control, reset, handleSubmit, formState } = methods

  useEffect(() => {
    ;(async () => {
      resetForm()
    })()
  }, [mixins, items])

  const resetForm = () => {
    const defaultFormValues = prepareData()
    reset(defaultFormValues)
  }

  const prepareData = () => {
    const schemaData = createForm(sortTree(items) ?? [])
    const mixinsData = mixins[metadata.key]
    const filteredMixinsData = filterOutChangedMixins(mixinsData, items || [])
    const convertedSchemaData = convertToIdValuePair(schemaData)
    const convertedMixinsData = convertToIdValuePair(filteredMixinsData)
    return deepMerge(convertedSchemaData, convertedMixinsData)
  }

  const onSubmit = useCallback(
    async (data: Mixins) => {
      const filteredData = filterOutDeletedMixins(data, items || [])
      const result = applyDefaultsOnEmptyFields(filteredData, items || [])
      await onSave(convertFromIdValuePair(result), metadata)
    },
    [onSave, metadata, items]
  )

  return (
    <>
      <SectionBox
        name={name}
        actions={
          <>
            <Button
              className="p-button-secondary"
              label={t('global.discard')}
              onClick={() => resetForm()}
              disabled={!formState.isDirty || !managerPermissions}
            />
            <Button
              className="ml-2"
              disabled={!formState.isValid || !managerPermissions}
              label={t('global.save')}
              onClick={handleSubmit((data) => onSubmit(data))}
            />
          </>
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
