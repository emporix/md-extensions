/**
 * Basic fields Product Service accepts in a variant's `metadata.overridden`.
 * Any other basic field in the list makes the update fail with HTTP 400.
 */
export const VARIANT_OVERRIDABLE_FIELDS: readonly string[] = [
  'name',
  'description',
  'published',
  'sellable',
  'media',
  'taxClasses',
  'relatedItems',
  'brandId',
  'labelIds',
]

/**
 * `metadata.overridden` for a general-tab save of a variant: the variant's own
 * stored list (raw read), plus the edited fields Product Service accepts as
 * overrides, each once.
 */
export const withVariantBasicOverrides = (
  ownOverridden: readonly string[],
  dirtyFieldNames: readonly string[]
): string[] => [
  ...new Set([
    ...ownOverridden,
    ...dirtyFieldNames.filter((field) =>
      VARIANT_OVERRIDABLE_FIELDS.includes(field)
    ),
  ]),
]
