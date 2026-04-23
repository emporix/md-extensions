import React, {
  forwardRef,
  ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react'
import SectionBox from '../SectionBox'
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
import { BsChevronRight } from 'react-icons/bs'
import BadgeTemplate from 'modules/classifications/components/VersionBadge'

export interface ClassificationsFormHandle {
  getProcessedData: () => { mixins: Mixins; metadata: MixinsFormMetadata }
  reset: () => void
  isDirty: () => boolean
  isValid: () => boolean
}

interface ClassificationsFormProps {
  name: ReactNode
  mixins: Mixins
  metadata: MixinsFormMetadata
  items: MixinsFormItem[] | undefined
  managerPermissions?: boolean
  onDirtyChange?: (isDirty: boolean) => void
  newVersion?: number
}

const ClassificationsForm = forwardRef<
  ClassificationsFormHandle,
  ClassificationsFormProps
>((props, ref) => {
  const {
    name,
    mixins,
    metadata,
    items,
    managerPermissions = true,
    onDirtyChange,
    newVersion,
  } = props
  const methods = useForm()
  const { control, reset, formState, getValues } = methods
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    resetForm()
  }, [mixins, items])

  useEffect(() => {
    onDirtyChange?.(formState.isDirty)
  }, [formState.isDirty, onDirtyChange])

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

  const getProcessedData = useCallback(() => {
    const data = getValues()
    const filteredData = filterOutDeletedMixins(data, items || [])
    const result = applyDefaultsOnEmptyFields(filteredData, items || [])
    return { mixins: convertFromIdValuePair(result), metadata }
  }, [metadata, getValues, items])

  useImperativeHandle(
    ref,
    () => ({
      getProcessedData,
      reset: resetForm,
      isDirty: () => formState.isDirty,
      isValid: () => formState.isValid,
    }),
    [formState.isDirty, formState.isValid, metadata]
  )

  return (
    <SectionBox>
      <FormProvider {...methods}>
        <div className="flex align-items-center">
          <div
            className="flex align-items-center cursor-pointer gap-2"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <BsChevronRight
              size={16}
              style={{ transform: isExpanded ? 'rotate(90deg)' : '' }}
            />
            <div className="font-bold text-lg">{name}</div>
            {newVersion && <BadgeTemplate version={newVersion} />}
          </div>
        </div>
        <div
          className="flex flex-wrap gap-3"
          style={{
            marginTop: isExpanded ? '1rem' : 0,
            height: isExpanded ? 'auto' : 0,
            overflow: 'hidden',
            visibility: isExpanded ? 'visible' : 'hidden',
          }}
        >
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
  )
})

ClassificationsForm.displayName = 'ClassificationsForm'

export default ClassificationsForm
