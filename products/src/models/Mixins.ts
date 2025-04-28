export interface Mixins {
  [key: string]: any
}

export enum MixinsPropertyType {
  string = 'string',
  number = 'number',
  boolean = 'boolean',
  array = 'array',
  object = 'object',
  null = 'null',
  integer = 'integer',
}

export enum MixinsSchemaFormat {
  time = 'time',
  date = 'date',
  dateTime = 'date-time',
}

export interface MixinsSchema {
  $id: string
  $schema: string
  description: string
  properties: Record<string, MixinsSchemaProperty>
  required: string[]
}

export interface MixinsSchemaProperty {
  type: MixinsPropertyType | MixinsPropertyType[]
  description: string
  format?: MixinsSchemaFormat
  enum?: string[]
  $ref?: string
  items: MixinsSchemaProperty
  properties?: Record<string, MixinsSchemaProperty>
  required?: string[]
  readOnly?: boolean
  pattern?: string
  multipleOf?: number
  options: MixinsSchemaOptions
}

export interface MixinsSchemaOptions {
  editor?: string
}
