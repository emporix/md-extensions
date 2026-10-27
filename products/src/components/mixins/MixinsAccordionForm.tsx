import {
  forwardRef,
  ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react'
import { SectionBox } from '@emporix/component-library'
import { FieldValues, FormProvider, useForm } from 'react-hook-form'
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
import { serializeLocalizedFields } from './localizedMixin.helpers'
import { Mixins } from '../../models/Mixins.model'
import MixinsFormItemTemplate from './MixinsFormItemTemplate'
import { deepMerge } from './mixins.utils'
import { BsChevronRight } from 'react-icons/bs'
import BadgeTemplate from './VersionBadge'
import styles from './Mixins.module.scss'

export interface MixinsAccordionFormHandle {
  getProcessedData: () => { mixins: Mixins; metadata: MixinsFormMetadata }
  reset: () => void
  isDirty: () => boolean
  isValid: () => boolean
}

interface MixinsAccordionFormProps {
  readonly name: ReactNode
  readonly mixins: Mixins
  readonly metadata: MixinsFormMetadata
  readonly items: MixinsFormItem[] | undefined
  readonly managerPermissions?: boolean
  readonly onDirtyChange?: (isDirty: boolean) => void
  readonly newVersion?: number
}

const MixinsAccordionForm = forwardRef<
  MixinsAccordionFormHandle,
  MixinsAccordionFormProps
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
  const methods = useForm<FieldValues>()
  const { control, reset, formState, getValues } = methods
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    resetForm()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
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
    return {
      mixins: serializeLocalizedFields(
        convertFromIdValuePair(result),
        items || []
      ) as Mixins,
      metadata,
    }
  }, [metadata, getValues, items])

  useImperativeHandle(
    ref,
    () => ({
      getProcessedData,
      reset: resetForm,
      isDirty: () => formState.isDirty,
      isValid: () => formState.isValid,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
    [formState.isDirty, formState.isValid, metadata]
  )

  return (
    <SectionBox>
      <FormProvider {...methods}>
        <div className={styles.rowTight}>
          <div
            className={styles.accordionHeader}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <BsChevronRight
              size={16}
              className={isExpanded ? styles.accordionChevronOpen : undefined}
            />
            <div className={styles.accordionTitle}>{name}</div>
            {newVersion && <BadgeTemplate version={newVersion} />}
          </div>
        </div>
        <div
          className={`${styles.accordionBody} ${
            isExpanded ? '' : styles.accordionBodyCollapsed
          }`}
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

MixinsAccordionForm.displayName = 'MixinsAccordionForm'

export default MixinsAccordionForm
