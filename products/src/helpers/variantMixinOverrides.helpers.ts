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
 * Override paths for the values of `next` that differ from `previous`, in
 * Product Service's grammar: objects are walked, arrays and other values are
 * leaves. Blank values get no path; the variant inherits them from its parent.
 */
export const changedMixinPaths = (
  previous: unknown,
  next: unknown,
  path: string
): string[] => {
  if (isNullable(next) || isEmptyObject(next)) {
    return []
  }
  if (isObject(next)) {
    const previousObject = isObject(previous) ? previous : {}
    return Object.entries(next).flatMap(([key, value]) =>
      changedMixinPaths(previousObject[key], value, `${path}.${key}`)
    )
  }
  return isSameValue(previous, next) ? [] : [path]
}

/**
 * A variant stores only the mixin paths listed in `metadata.overridden`; any
 * other mixin value is taken from its parent. Marks the fields this save
 * changed (compared with the loaded, parent-merged `loadedMixins`) plus the
 * schema binding, and drops blank fields so they inherit again.
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
  saved.forEach(([storageKey, value]) => {
    if (value == null) {
      return
    }
    const cleaned = withoutBlankFields(value)
    mixins[storageKey] = cleaned
    paths.push(
      ...changedMixinPaths(
        loadedMixins?.[storageKey],
        cleaned,
        `mixins.${storageKey}`
      )
    )
  })
  const overridden = [
    ...new Set([
      ...(payload.metadata?.overridden ?? []),
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
