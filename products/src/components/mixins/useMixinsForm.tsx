import { useMemo, useRef, useState, Fragment } from 'react'
import { useSchemaApi } from '../../hooks/api/schema'
import { useTranslation } from 'react-i18next'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { useMixinsApi } from '../../hooks/api/mixins'
import {
  ClassificationMixin,
  Mixins,
  MixinsPropertyType,
  MixinsSchemaProperty,
} from '../../models/Mixins.model'
import { Reference, Schema } from '../../models/Schema.model'
import { isSchemaSiteAware } from './schema.helpers'
import {
  diffAddRemove,
  getReferenceIdAndVersion,
  getSchemaIdAndVersion,
  isEmporixReferenceUrl,
  isEmporixSchemaUrl,
  mapMixinsPropertyToItemArrayType,
  mapMixinsPropertyToItemType,
  mapMixinsUrlsToSchema,
  MixinsFormData,
  MixinsFormItem,
  MixinsFormItemType,
  MixinsFormMetadata,
  MixinsFormTemplate,
  resolveMixinNames,
} from './helpers'
import {
  getLocalizedArrayItemVersion,
  getLocalizedSchemaVersion,
  isLocalizedLanguageValueRef,
  isLocalizedNullableRef,
} from './localizedMixin.helpers'
import Localized from '../../models/Localized.model'
import { sortById, textToTitleCase } from '../../helpers/utils'
import MixinsFormBox from './MixinsFormBox'
import { FilterMatchMode, TabItem } from '@emporix/component-library'
import MixinsAccordionForms from './MixinsAccordionForms'
import { Metadata } from '../../models/Metadata.model'
import { useCategoriesApi } from '../../hooks/api/categories'
import { CategoryType } from '../../models/Category.model'

/** Placeholder tab id rendered (disabled) while schemas load. */
export const MIXINS_LOADING_TAB_ID = 'mixins-loading'
export const CLASSIFICATIONS_TAB_ID = 'classifications'

/**
 * CL `TabItem.label` is a string: MD's orange "vN" corner badge for a newer
 * schema version is expressed textually as a "(vN)" suffix.
 */
const withVersionSuffix = (label: string, version?: number) =>
  version ? `${label} (v${version})` : label

interface MixinsProps {
  type?: string
  onEdit: (data: Mixins, metadata: MixinsFormMetadata) => Promise<void> | void
  onEditClassifications?: (
    mixins: Mixins,
    metadata: Metadata
  ) => Promise<void> | void
  onEditAccordion?: (mixins: Mixins, metadata: Metadata) => Promise<void> | void
  onAccordionDirtyChange?: (isDirty: boolean) => void
  managerPermissions?: boolean
  siteAware?: boolean
}

const useMixinsForm = (props: MixinsProps) => {
  const { i18n, t } = useTranslation()
  const { getUiLangValue } = useLocalizedValue()
  const { getSchemas, getSchema, getReference, getReferences } = useSchemaApi()
  const { getMixinsSchema } = useMixinsApi()
  const [mixins, setMixins] = useState<Mixins>({})
  const [forms, setForms] = useState<Map<string, MixinsFormData[]>>()
  const [classificationForms, setClassificationForms] =
    useState<Map<string, MixinsFormData[]>>()
  /** Schema ids from entity metadata.mixins — used to avoid __ overlay collisions. */
  const [knownSchemaIds, setKnownSchemaIds] = useState<string[]>([])
  const [isMixinsLoading, setIsMixinsLoading] = useState(false)
  const { getAllCategories } = useCategoriesApi()
  // Guards against out-of-order resolution when loadMixins is triggered again
  // (e.g. switching products) before a previous, slower call has finished —
  // a stale response must not overwrite the current product's forms.
  const loadRequestRef = useRef(0)

  const mixinsForms: MixinsFormTemplate[] = useMemo(() => {
    if (!forms) return []
    const schemas = []
    for (const f of forms.values()) {
      const present = f[0]
      const newer = f[1]
      if (!present?.id) continue
      const item = {
        id: present?.id,
        name: textToTitleCase(getUiLangValue(present?.name)),
        newerVersion: newer?.metadata?.version,
        template: (
          <MixinsFormBox
            forms={f}
            mixins={mixins}
            knownSchemaIds={knownSchemaIds}
            onSave={props.onEdit}
            managerPermissions={props.managerPermissions}
            presentSchemaUrl={present?.metadata?.url}
            newerSchemaUrl={newer?.metadata?.url}
          />
        ),
      }
      schemas.push(item)
    }
    return schemas.sort(sortById)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [forms, i18n.language, knownSchemaIds, mixins, props.onEdit])

  const loadMixins = async (
    existingSchemaUrls: Record<string, string> = {},
    mixins: Mixins = {} as Mixins,
    classificationMixins?: ClassificationMixin[]
  ) => {
    const requestId = ++loadRequestRef.current
    setMixins(mixins)
    setIsMixinsLoading(true)
    try {
      const fetchedSchemas = props.type ? await getSchemas(props.type) : []
      const fetchedReferences = props.type
        ? await getReferences(props.type)
        : []

      // filter out classification entries where key starts with 'class_'
      const filteredExistingSchemaUrls = Object.fromEntries(
        Object.entries(existingSchemaUrls).filter(
          ([key]) => !key.startsWith('class_')
        )
      )

      const schemasAndReferences = await getSchemasAndReferences(
        filteredExistingSchemaUrls,
        fetchedSchemas,
        fetchedReferences
      )

      // Classification schemas - process separately
      const classificationSchemasAndReferences: (Schema & {
        sourceCategoryName: Localized
      })[] = []
      if (classificationMixins && classificationMixins.length > 0) {
        const sourceIds = classificationMixins?.map((m) => m.sourceCategoryId)
        const sourceCategories = await getAllCategories(
          {
            currentPage: 1,
            rows: 100,
            filters: {
              id: {
                value: sourceIds,
                matchMode: FilterMatchMode.EQUALS,
              },
            },
          },
          CategoryType.CLASSIFICATION,
          false,
          true
        )
        const versionsSchemas = classificationMixins
          .filter((m) => m.obsoleteSchemaUrlUsed)
          .map((m) => ({ ...m, usedSchemaUrl: m.schemaUrl }))
        const extraSchemas = await Promise.all(
          [...classificationMixins, ...versionsSchemas].map(async (m) => {
            const url = m.usedSchemaUrl || m.schemaUrl
            try {
              const isEmporixSchema = isEmporixSchemaUrl(url)
              if (!isEmporixSchema) return null
              const { id, version } = getSchemaIdAndVersion(url)
              if (!id || !version) return null
              const schema = await getSchema(id, version)
              // override id with mixinPath to group correctly under path
              // override name with classification name (key)
              return {
                ...schema,
                id: m.mixinPath,
                name: m.name,
                sourceCategoryName: sourceCategories.find(
                  (sc) => sc.id === m.sourceCategoryId
                )?.localizedName,
              } as Schema & { sourceCategoryName: Localized }
            } catch (e) {
              console.error(e)
              return null
            }
          })
        )
        for (const s of extraSchemas) {
          if (s) classificationSchemasAndReferences.push(s)
        }
      }

      // Process regular forms
      const groupedForms = new Map<string, MixinsFormData[]>()
      for (const item of schemasAndReferences) {
        try {
          if (!item.metadata) continue
          const mixinsSchema = await getMixinsSchema(item.metadata.url)
          const mixinsNames = resolveMixinNames(item.attributes)
          const mixinsFormItems = await getMixinsItems(
            mixinsSchema.properties,
            mixinsSchema.required,
            mixinsNames
          )
          const form: MixinsFormData = {
            id: item.id,
            name: item.name,
            items: mixinsFormItems,
            mixins: mixins[item.id] || {},
            siteAware: props.siteAware ? isSchemaSiteAware(item) : false,
            metadata: {
              key: item.id,
              url: item.metadata.url,
              version: item.metadata.version || 0,
            },
          }
          const group = groupedForms.get(item.id)
          if (group) {
            group.push(form)
          } else {
            groupedForms.set(form.id, [form])
          }
        } catch (error) {
          console.error(error)
        }
      }

      // Process classification forms separately
      const groupedClassificationForms = new Map<string, MixinsFormData[]>()
      for (const item of classificationSchemasAndReferences) {
        try {
          if (!item.metadata) continue
          const mixinsSchema = await getMixinsSchema(item.metadata.url)
          const mixinsNames = resolveMixinNames(item.attributes)
          const mixinsFormItems = await getMixinsItems(
            mixinsSchema.properties,
            mixinsSchema.required,
            mixinsNames
          )
          const form: MixinsFormData = {
            id: item.id,
            sourceCategoryName: item.sourceCategoryName,
            name: item.name,
            items: mixinsFormItems,
            mixins: mixins[item.id] || {},
            metadata: {
              key: item.id,
              url: item.metadata.url,
              version: item.metadata.version || 0,
            },
          }
          const group = groupedClassificationForms.get(item.id)
          if (group) {
            group.push(form)
          } else {
            groupedClassificationForms.set(form.id, [form])
          }
        } catch (error) {
          console.error(error)
        }
      }

      // Merge forms if more versions (regular forms)
      for (const [key, forms] of groupedForms) {
        if (forms.length > 1) {
          forms.sort(
            (a, b) => (a.metadata.version || 0) - (b.metadata.version || 0)
          )
          const filteredForms = []
          const presentForm = forms[0]
          const newerForm = forms[forms.length - 1]

          const newerWithChanges = setChangesOnNewer(
            presentForm as MixinsFormData,
            newerForm as MixinsFormData
          )

          if (presentForm) filteredForms.push(presentForm)
          if (
            newerWithChanges &&
            newerWithChanges.metadata.version !== presentForm?.metadata.version
          )
            filteredForms.push(newerWithChanges)
          groupedForms.set(key, filteredForms)
        }
      }

      // Merge forms if more versions (classification forms)
      for (const [key, forms] of groupedClassificationForms) {
        if (forms.length > 1) {
          forms.sort(
            (a, b) => (a.metadata.version || 0) - (b.metadata.version || 0)
          )
          const filteredForms = []
          const presentForm = forms[0]
          const newerForm = forms[forms.length - 1]

          const newerWithChanges = setChangesOnNewer(
            presentForm as MixinsFormData,
            newerForm as MixinsFormData
          )

          if (presentForm) filteredForms.push(presentForm)
          if (
            newerWithChanges &&
            newerWithChanges.metadata.version !== presentForm?.metadata.version
          )
            filteredForms.push(newerWithChanges)
          groupedClassificationForms.set(key, filteredForms)
        }
      }

      if (requestId !== loadRequestRef.current) return

      setKnownSchemaIds(Object.keys(filteredExistingSchemaUrls))
      setForms(groupedForms)
      setClassificationForms(groupedClassificationForms)
    } catch (error) {
      console.error(error)
      // A failed reload must not leave the previous product's tabs behind.
      if (requestId === loadRequestRef.current) {
        setForms(new Map())
        setClassificationForms(new Map())
        setKnownSchemaIds([])
      }
    } finally {
      if (requestId === loadRequestRef.current) {
        setIsMixinsLoading(false)
      }
    }
  }

  const getSchemasAndReferences = async (
    existingSchemaUrls: Record<string, string> = {},
    fetchedSchemas: Schema[],
    fetchedReferences: Reference[]
  ) => {
    const entries = Object.entries(existingSchemaUrls)
    // Get existing mixins
    const mixinsUrls = Object.fromEntries(
      entries.filter(
        ([, value]) =>
          !isEmporixSchemaUrl(value) && !isEmporixReferenceUrl(value)
      )
    )
    const existingMixins = mapMixinsUrlsToSchema(mixinsUrls)
    // Get existing schemas
    const existingSchemas: Schema[] = []
    const schemaUrls = entries.filter(
      ([, value]) => isEmporixSchemaUrl(value) && !isEmporixReferenceUrl(value)
    )
    for (const [, value] of schemaUrls) {
      const { id, version } = getSchemaIdAndVersion(value)
      if (id && version) {
        const schema = await getSchema(id, version)
        existingSchemas.push(schema)
      }
    }
    // Get existing references
    const existingReferences: Reference[] = []
    const referenceUrls = entries.filter(
      ([, value]) => !isEmporixSchemaUrl(value) && isEmporixReferenceUrl(value)
    )
    for (const [, value] of referenceUrls) {
      const { id, version } = getReferenceIdAndVersion(value)
      if (id && version) {
        const reference = await getReference(id, version)
        existingReferences.push(reference)
      }
    }
    return [
      ...existingMixins,
      ...existingSchemas,
      ...existingReferences,
      ...fetchedSchemas,
      ...fetchedReferences,
    ]
  }

  const setChangesOnNewer = (
    presentForm: MixinsFormData,
    newerForm: MixinsFormData
  ): MixinsFormData => {
    const mergedItems = diffAddRemove(
      presentForm.items ?? [],
      newerForm.items ?? []
    )
    return {
      ...newerForm,
      items: mergedItems,
    }
  }

  const getMixinsItems = async (
    properties: Record<string, MixinsSchemaProperty>,
    required: string[],
    names: Record<string, Localized> = {},
    rootKey = '',
    namePath = ''
  ): Promise<MixinsFormItem[] | undefined> => {
    if (!properties) return undefined
    const items: MixinsFormItem[] = []

    let key: keyof typeof properties
    for (key in properties) {
      let childrenItems = undefined
      const property = properties[key]
      // Full dotted schema path, used to look up the label from the
      // path-keyed names map so nested attributes get their own name.
      const path = namePath ? `${namePath}.${key}` : `${key}`

      const pushItem = (children: MixinsFormItem[] | undefined) => {
        const itemType = mapMixinsPropertyToItemType(property)
        const arrayType = mapMixinsPropertyToItemArrayType(property)

        let referenceTypeEnum: (string | null)[] | undefined
        let referenceType: string | undefined

        const isTypeReference =
          itemType === MixinsFormItemType.reference &&
          property.properties?.emporixReferenceType != null
        if (isTypeReference) {
          referenceTypeEnum = property.properties?.emporixReferenceType.enum
          referenceType = referenceTypeEnum?.length
            ? (referenceTypeEnum[0] as string)
            : undefined
        }

        const isArrayTypeReference =
          arrayType === MixinsFormItemType.reference &&
          property.items?.properties?.emporixReferenceType != null
        if (isArrayTypeReference) {
          referenceTypeEnum =
            property.items?.properties?.emporixReferenceType.enum
          referenceType = referenceTypeEnum?.length
            ? (referenceTypeEnum[0] as string)
            : undefined
        }

        const isNullable = () => {
          if (
            isLocalizedNullableRef(property.$ref) ||
            isLocalizedNullableRef(property.items?.$ref)
          ) {
            return true
          }
          // Check for a null in types array
          if (Array.isArray(property.type)) {
            return property.type.includes(MixinsPropertyType.null)
          }
          // Fallback to enum check because if enum is nullable,
          // then values are contained null instead of a type array
          else if (itemType === 'enum') {
            const enumValues = property?.items?.enum ?? property.enum
            return enumValues?.includes(null)
          }
          return false
        }

        items.push({
          name: path in names ? names[path] : key,
          key: rootKey ? `${rootKey}.${key}` : `${key}`,
          type: itemType,
          enum: property.enum ?? property.items?.enum,
          options: property.options,
          items: children,
          arrayType: arrayType,
          isReadonly: !!property.readOnly,
          isRequired: !!required?.includes(key),
          isNullable: isNullable(),
          referenceType,
          referenceTypeEnum,
          multipleOf: property.multipleOf ?? property.items?.multipleOf,
          localizedVersion:
            getLocalizedSchemaVersion(property) ??
            getLocalizedArrayItemVersion(property),
        })
      }

      if (isLocalizedLanguageValueRef(property.$ref)) {
        pushItem(undefined)
      } else if (property.$ref) {
        const refMixins = await getMixinsSchema(property.$ref)
        if (refMixins.properties) {
          childrenItems = await getMixinsItems(
            refMixins.properties,
            refMixins.required,
            names,
            key,
            path
          )
          if (childrenItems !== undefined) {
            pushItem(childrenItems)
          }
        }
      } else if (property.properties ?? property?.items?.properties) {
        childrenItems = await getMixinsItems(
          property.properties ?? property?.items?.properties ?? {},
          property?.required ?? property?.items?.required ?? [],
          names,
          property.properties ? key : '',
          path
        )
        if (childrenItems !== undefined) {
          pushItem(childrenItems)
        }
      } else {
        pushItem(undefined)
      }
    }
    return items
  }

  const classificationsTab = useMemo((): TabItem | null => {
    if (isMixinsLoading) {
      // MD: disabled TabPanel with a skeleton header (TabsLoader).
      return {
        id: CLASSIFICATIONS_TAB_ID,
        label: t('global.loading'),
        content: null,
        disabled: true,
      }
    }
    if (!classificationForms || classificationForms.size === 0) return null
    if (!props.onEditClassifications) return null
    const hasNewerVersion = Array.from(classificationForms.values()).some(
      (f) => f.length > 1
    )
    const label = t('mixins.labels.classifications')
    return {
      id: CLASSIFICATIONS_TAB_ID,
      // MD showed a "!" corner badge when any classification has a newer version.
      label: hasNewerVersion ? `${label} (!)` : label,
      content: (
        <MixinsAccordionForms
          forms={classificationForms}
          mixins={mixins}
          onSave={props.onEditClassifications}
          managerPermissions={props.managerPermissions}
        />
      ),
    }
  }, [
    classificationForms,
    isMixinsLoading,
    props.onEditClassifications,
    props.managerPermissions,
    mixins,
    t,
  ])

  const mixinsAccordion = useMemo(() => {
    if (isMixinsLoading) return null
    if (!forms || forms.size === 0) return null
    if (!props.onEditAccordion) return null
    return (
      <MixinsAccordionForms
        forms={forms}
        mixins={mixins}
        onSave={props.onEditAccordion}
        onDirtyChange={props.onAccordionDirtyChange}
        managerPermissions={props.managerPermissions}
      />
    )
  }, [
    forms,
    isMixinsLoading,
    props.onEditAccordion,
    props.onAccordionDirtyChange,
    props.managerPermissions,
    mixins,
  ])

  const mixinsTabs = useMemo((): TabItem[] => {
    if (isMixinsLoading) {
      return [
        {
          id: MIXINS_LOADING_TAB_ID,
          label: t('global.loading'),
          content: null,
          disabled: true,
        },
      ]
    }
    return mixinsForms.map((f) => ({
      id: f.id,
      label: withVersionSuffix(f.name ?? f.id, f.newerVersion),
      // Keyed so switching between two mixin tabs remounts the form state.
      content: <Fragment key={f.id}>{f.template}</Fragment>,
    }))
  }, [isMixinsLoading, mixinsForms, t])

  return {
    mixinsForms,
    loadMixins,
    isMixinsLoading,
    mixinsTabs,
    classificationsTab,
    mixinsAccordion,
  }
}

export default useMixinsForm
