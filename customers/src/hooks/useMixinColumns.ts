import { useEffect, useState } from 'react'
import { useSchemaApi } from './api/schema'
import { useDashboardContext } from '../context/Dashboard.context'
import { parseMixinColumns } from '../helpers/schema.helper'
import type { DisplayMixin } from '../models/DisplayMixin'
import type { SchemaType } from '../models/Schema.model'

/** Mixin keys available as table columns for a schema type. */
export const useMixinColumns = (schemaType: SchemaType | string) => {
  const [mixinColumns, setMixinColumns] = useState<DisplayMixin[]>([])
  const { getSchemas } = useSchemaApi()
  const { tenant } = useDashboardContext()

  useEffect(() => {
    // A tenant switch drops the previous tenant's schema columns at once, so
    // they cannot be offered or saved under the new tenant; responses of a
    // superseded load are ignored.
    setMixinColumns([])
    let cancelled = false
    void (async () => {
      try {
        const schemas = await getSchemas(schemaType)
        if (!cancelled) setMixinColumns(parseMixinColumns(schemas))
      } catch (error) {
        if (!cancelled) console.error(error)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [schemaType, getSchemas, tenant])

  return { mixinColumns }
}
