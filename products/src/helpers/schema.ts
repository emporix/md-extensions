import { DisplayMixin } from '../models/DisplayMixin'
import { Schema, SchemaAttribute } from '../models/Schema'

type FlattenResult = DisplayMixin[] | DisplayMixin

export const parseMixinColumns = (schemas: Schema[]): DisplayMixin[] => {
  const mixinKeys = schemas
    .map((schema) => {
      return (
        schema.attributes
          ?.map((attribute) => {
            return flatten(schema.id, attribute)
          })
          .flat() || []
      )
    })
    .flat()
  return mixinKeys
}

export const flatten = (path: string, attr: SchemaAttribute): FlattenResult => {
  const key = `${path}.${attr.key}`
  if (attr.arrayType?.attributes) {
    return attr.arrayType.attributes
      .map((attribute) => flatten(key, attribute))
      .flat()
  }
  if (attr.attributes) {
    return attr.attributes.map((attribute) => flatten(key, attribute)).flat()
  }
  return {
    key,
    label: attr.name,
    type: attr.type,
  }
}
