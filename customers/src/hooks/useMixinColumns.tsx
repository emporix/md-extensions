import { useSchemaApi } from '../api/schema'
import { parseMixinColumns } from '../helpers/schema.ts'
import { DisplayMixin } from '../models/DisplayMixin'
import { SchemaType } from '../models/Schema'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export const useMixinColumns = (schemaType: SchemaType | string) => {
  const [mixinColumns, setMixinColumns] = useState<DisplayMixin[]>([])
  const { i18n } = useTranslation()
  const { getSchemas } = useSchemaApi()

  useEffect(() => {
    ;(async () => {
      const schemas = await getSchemas(schemaType)
      const mixinKeys = parseMixinColumns(schemas)
      setMixinColumns(mixinKeys)
    })()
  }, [schemaType, getSchemas, i18n.language])
  return {
    mixinColumns,
  }
}
