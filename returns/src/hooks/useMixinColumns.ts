import { useEffect, useState } from 'react'
import { useSchemaApi } from './api/schema'
import { parseMixinColumns } from '../helpers/schema.helper'
import type { DisplayMixin } from '../models/DisplayMixin'
import type { SchemaType } from '../models/Schema.model'

/** Mixin keys available as table columns for a schema type. */
export const useMixinColumns = (schemaType: SchemaType | string) => {
  const [mixinColumns, setMixinColumns] = useState<DisplayMixin[]>([])
  const { getSchemas } = useSchemaApi()

  useEffect(() => {
    void (async () => {
      try {
        const schemas = await getSchemas(schemaType)
        setMixinColumns(parseMixinColumns(schemas))
      } catch (error) {
        console.error(error)
      }
    })()
  }, [schemaType, getSchemas])

  return { mixinColumns }
}
