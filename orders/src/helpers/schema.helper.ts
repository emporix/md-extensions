import type { DisplayMixin } from '../models/DisplayMixin'
import type { Schema, SchemaAttribute } from '../models/Schema.model'

type FlattenResult = DisplayMixin | DisplayMixin[]

/** Flattens a schema attribute tree into dot-delimited mixin column keys. */
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

export const parseMixinColumns = (schemas: Schema[]): DisplayMixin[] =>
  schemas
    .map(
      (schema) =>
        schema.attributes
          ?.map((attribute) => flatten(schema.id, attribute))
          .flat() ?? []
    )
    .flat()
