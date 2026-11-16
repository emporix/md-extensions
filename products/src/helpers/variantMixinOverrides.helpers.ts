import { Product, ProductType } from '../models/Category.model'
import { Mixins } from '../models/Mixins.model'
import {
  MixinsFormMetadata,
  mixinStorageKey,
} from '../components/mixins/helpers'
import { areMixinsEqual } from '../components/mixins/siteAwareMixin.helpers'
import { isEmptyObject, isNullable, isObject } from './utils'

/** Product Service answers HTTP 400 for any override path under this mixin. */
const PRODUCT_VARIANT_ATTRIBUTES = 'productVariantAttributes'

const isSameValue = (left: unknown, right: unknown) =>
  areMixinsEqual({ value: left }, { value: right })

/** Drops '' fields, and objects that only held them, so they inherit again. */
const withoutBlankFields = (value: unknown): unknown => {
  if (!isObject(value)) {
    return value
  }
  return Object.entries(value).reduce<Record<string, unknown>>(
    (acc, [key, field]) => {
      const cleaned = withoutBlankFields(field)
      const hadFields = isObject(field) && !isEmptyObject(field)
      if (cleaned === '' || (hadFields && isEmptyObject(cleaned))) {
        return acc
      }
      acc[key] = cleaned
      return acc
    },
    {}
  )
}

/**
 * The form fills an empty boolean with `false`. Where the loaded value has
 * nothing (the parent has no value, e.g. a field added in a newer schema
 * version), that `false` is a form default, not a value the user set.
 */
const isUntouchedBooleanDefault = (previous: unknown, next: unknown) =>
  next === false && (previous === null || previous === undefined)

/**
 * Walks `next` in Product Service's override grammar: objects are walked,
 * arrays and other values are leaves. Blank values and untouched boolean
 * defaults get no path; `includeLeaf` decides for every other leaf.
 */
const leafPaths = (
  previous: unknown,
  next: unknown,
  path: string,
  includeLeaf: (previous: unknown, next: unknown) => boolean
): string[] => {
  if (isNullable(next) || isEmptyObject(next)) {
    return []
  }
  if (isObject(next)) {
    const previousObject = isObject(previous) ? previous : {}
    return Object.entries(next).flatMap(([key, value]) =>
      leafPaths(previousObject[key], value, `${path}.${key}`, includeLeaf)
    )
  }
  if (isUntouchedBooleanDefault(previous, next)) {
    return []
  }
  return includeLeaf(previous, next) ? [path] : []
}

/**
 * Override paths for the values of `next` that differ from `previous`. Blank
 * values get no path; the variant inherits them from its parent.
 */
export const changedMixinPaths = (
  previous: unknown,
  next: unknown,
  path: string
): string[] =>
  leafPaths(previous, next, path, (left, right) => !isSameValue(left, right))

/**
 * Override paths for every value of `next`, changed or not. Replaces a path
 * that covers a whole mixin, so stored values stay the variant's own field by
 * field and a cleared field inherits again.
 */
const ownMixinPaths = (previous: unknown, next: unknown, path: string) =>
  leafPaths(previous, next, path, () => true)

/**
 * A variant stores only the mixin paths listed in `metadata.overridden`; any
 * other mixin value is taken from its parent. `payload.metadata.overridden`
 * must be the variant's own stored list (raw read). Marks the fields this save
 * changed (compared with the loaded, parent-merged `loadedMixins`) plus the
 * schema binding, and drops blank fields so they inherit again. A path that
 * covers a saved mixin as a whole (`mixins.<storageKey>`, set through the API)
 * is replaced by paths for each of its non-blank fields.
 */
export const withVariantMixinOverrides = (
  payload: Partial<Product>,
  loadedMixins: Mixins | undefined,
  data: Mixins,
  mixinMetadata: MixinsFormMetadata
): Partial<Product> => {
  if (
    payload.productType !== ProductType.variant ||
    mixinMetadata.key.startsWith(PRODUCT_VARIANT_ATTRIBUTES)
  ) {
    return payload
  }
  const saved: [string, unknown][] = mixinMetadata.siteAwareBatch
    ? Object.entries(data)
    : [[mixinStorageKey(mixinMetadata.key, mixinMetadata.siteCode), data]]
  const mixins: Mixins = { ...payload.mixins }
  const paths: string[] = []
  const wholeMixinPaths = new Set<string>()
  saved.forEach(([storageKey, value]) => {
    if (value == null) {
      return
    }
    const cleaned = withoutBlankFields(value)
    const mixinPath = `mixins.${storageKey}`
    mixins[storageKey] = cleaned
    paths.push(
      ...changedMixinPaths(loadedMixins?.[storageKey], cleaned, mixinPath)
    )
    if (payload.metadata?.overridden?.includes(mixinPath)) {
      wholeMixinPaths.add(mixinPath)
      paths.push(
        ...ownMixinPaths(loadedMixins?.[storageKey], cleaned, mixinPath)
      )
    }
  })
  const overridden = [
    ...new Set([
      ...(payload.metadata?.overridden ?? []).filter(
        (path) => !wholeMixinPaths.has(path)
      ),
      ...paths,
      `metadata.mixins.${mixinMetadata.key}`,
    ]),
  ]
  return {
    ...payload,
    mixins,
    metadata: { ...payload.metadata, overridden },
  }
}
