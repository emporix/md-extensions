import { useMemo, useState } from 'react'
import { useSchemaApi } from '../../../api/schema'
import { useTranslation } from 'react-i18next'
import { useLocalizedValue } from '../../../hooks/useLocalizedValue'
import { useMixinsApi } from '../../../api/mixins'
import {
  Mixins,
  MixinsSchema,
  MixinsSchemaProperty,
} from '../../../models/Mixins'
import { Reference, Schema, SchemaAttribute } from '../../../models/Schema'
import {
  getReferenceIdAndVersion,
  getSchemaIdAndVersion,
  isReferenceUrl,
  isSchemaUrl,
  mapMixinsPropertyToItemArrayType,
  mapMixinsPropertyToItemType,
  mapMixinsUrlsToSchema,
  MixinsFormData,
  MixinsFormItem,
  MixinsFormMetadata,
  MixinsFormTemplate,
} from './helpers'
import MixinsForm from './MixinsForm'
import Localized from '../../../models/Localized'
import { sortById, textToTitleCase } from '../../../helpers/utils'

interface MixinsProps {
  type?: string
  onEdit: (data: Mixins, metadata: MixinsFormMetadata) => Promise<void> | void
  managerPermissions?: boolean
}

const useMixinsForm = (props: MixinsProps) => {
  const { i18n } = useTranslation()
  const { getUiLangValue } = useLocalizedValue()
  const { getSchemas, getSchema, getReferences, getReference } = useSchemaApi()
  const { getMixinsSchema } = useMixinsApi()
  const [mixins, setMixins] = useState<Mixins>({})
  const [forms, setForms] = useState<MixinsFormData[]>([])
  const [isMixinsLoading, setIsMixinsLoading] = useState(false)

  const mixinsForms: MixinsFormTemplate[] = useMemo(() => {
    return forms
      .map((s) => {
        return {
          id: s.id,
          name: textToTitleCase(getUiLangValue(s.name)),
          template: (
            <MixinsForm
              name={getUiLangValue(s.name)}
              items={s.items}
              mixins={mixins}
              metadata={s.metadata}
              onSave={props.onEdit}
              managerPermissions={props.managerPermissions}
            ></MixinsForm>
          ),
        }
      })
      .sort(sortById)
  }, [forms, i18n.language, mixins, props.onEdit])

  const resolveMixinNames = (
    attributes: SchemaAttribute[],
    names: Record<string, Localized>
  ): Record<string, Localized> => {
    let mergedNames: Record<string, Localized> = names || {}
    if (attributes === undefined) {
      return names
    }
    for (const item of attributes) {
      mergedNames[item.key] = item.name

      if (item.attributes !== undefined && item.attributes.length > 0) {
        mergedNames = {
          ...mergedNames,
          ...resolveMixinNames(item.attributes, mergedNames),
        }
      }
    }
    return mergedNames
  }

  const loadMixins = async (
    existingSchemaUrls: Record<string, string> = {},
    mixins: Mixins = {} as Mixins
  ) => {
    const forms: MixinsFormData[] = []
    setMixins(mixins)
    setIsMixinsLoading(true)
    try {
      const fetchedSchemas = props.type ? await getSchemas(props.type) : []
      const fetchedReferences = props.type
        ? await getReferences(props.type)
        : []
      const mergedSchemas = await mergeSchemasAndReferences(
        existingSchemaUrls,
        fetchedSchemas,
        fetchedReferences
      )
      for (const schema of mergedSchemas) {
        try {
          if (schema.metadata === undefined) {
            return
          }
          const mixinsSchema = await getMixinsSchema(schema.metadata.url)
          let mixinsNames: Record<string, Localized> = {}
          if (schema.attributes !== undefined) {
            mixinsNames = resolveMixinNames(schema.attributes, mixinsNames)
          }
          const mixinsFormItems = await getMixinsItemsFromSchema(
            mixinsSchema,
            mixinsNames
          )
          forms.push({
            id: schema.id,
            name: schema.name,
            items: mixinsFormItems,
            mixins: mixins[schema.id] || {},
            metadata: {
              key: schema.id,
              url: schema.metadata.url,
            } as MixinsFormMetadata,
          })
        } catch (error) {
          console.error(error)
        }
      }
      setForms(forms)
    } catch (error) {
      console.error(error)
    } finally {
      setIsMixinsLoading(false)
    }
  }

  const mergeSchemasAndReferences = async (
    existingSchemaUrls: Record<string, string> = {},
    fetchedSchemas: Schema[],
    fetchedReferences: Reference[]
  ) => {
    const existingSchemas: Schema[] = []
    const existingReferences: Reference[] = []
    const entries = Object.entries(existingSchemaUrls)
    const mixinsUrls: Record<string, string> = Object.fromEntries(
      entries.filter(
        ([, value]) => !isSchemaUrl(value) && !isReferenceUrl(value)
      )
    )
    const schemaUrls = entries.filter(
      ([, value]) => isSchemaUrl(value) && !isReferenceUrl(value)
    )
    const referenceUrls = entries.filter(
      ([, value]) => !isSchemaUrl(value) && isReferenceUrl(value)
    )
    const existingMixins = mapMixinsUrlsToSchema(mixinsUrls)
    for (const [key, value] of schemaUrls) {
      const idAndVersion = getSchemaIdAndVersion(value)
      const version = idAndVersion !== undefined ? idAndVersion[key] : 0
      const schema = await getSchema(key, version)
      existingSchemas.push(schema)
    }
    for (const [key, value] of referenceUrls) {
      const idAndVersion = getReferenceIdAndVersion(value)
      const version = idAndVersion !== undefined ? idAndVersion[key] : 0
      const reference = await getReference(key, version)
      existingReferences.push(reference)
    }
    return [
      ...existingMixins,
      ...existingSchemas,
      ...existingReferences,
      ...fetchedSchemas.filter(
        (s) => !existingSchemas.some((e) => e.id === s.id)
      ),
      ...fetchedReferences.filter(
        (s) => !existingReferences.some((e) => e.id === s.id)
      ),
    ]
  }

  const getMixinsItemsFromSchema = async (
    schema: MixinsSchema,
    names: Record<string, Localized>
  ) => {
    const getItemsFromProperties = async (
      properties: Record<string, MixinsSchemaProperty>,
      required: string[],
      rootKey = ''
    ): Promise<MixinsFormItem[] | undefined> => {
      if (properties === undefined) {
        return undefined
      }

      const items: MixinsFormItem[] = []

      let key: keyof typeof properties
      for (key in properties) {
        let childrenItems = undefined
        const property = properties[key]

        const pushItem = (children: any) => {
          items.push({
            name: key in names ? names[key] : key,
            key: rootKey ? `${rootKey}.${key}` : `${key}`,
            type: mapMixinsPropertyToItemType(property),
            isRequired: !!required?.includes(key),
            enum: property?.items?.enum ?? property.enum,
            isReadonly: property.readOnly,
            options: property.options,
            items: children,
            arrayType: mapMixinsPropertyToItemArrayType(property),
          })
        }

        if (property.$ref) {
          const refMixins = await getMixinsSchema(property.$ref)
          if (refMixins.properties) {
            childrenItems = await getItemsFromProperties(
              refMixins.properties,
              refMixins.required,
              key
            )
            if (childrenItems !== undefined) {
              pushItem(childrenItems)
            }
          }
        } else if (property.properties ?? property?.items?.properties) {
          childrenItems = await getItemsFromProperties(
            property.properties ?? property?.items?.properties ?? {},
            property?.required ?? property?.items?.required ?? [],
            property.type === 'object' ? key : ''
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
    return await getItemsFromProperties(schema.properties, schema.required)
  }

  return {
    mixinsForms,
    loadMixins,
    isMixinsLoading,
  }
}

export default useMixinsForm
