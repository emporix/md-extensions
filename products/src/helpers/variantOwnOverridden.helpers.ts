import { Product, ProductType } from '../models/Category.model'

/**
 * Puts a variant's own stored `metadata.overridden` (raw read) into the save
 * payload. The plain read returns `null` for that list when it has no
 * `metadata.*` path, and a PUT built from it drops the variant's earlier
 * overrides. Other product types keep their payload and make no read. A
 * failed read rejects, so the save stops before the PUT.
 */
export const withOwnOverriddenList = async <T extends Partial<Product>>(
  payload: T,
  readOwnOverridden: (productId: string) => Promise<string[]>
): Promise<T> => {
  if (payload.productType !== ProductType.variant || !payload.id) {
    return payload
  }
  const overridden = await readOwnOverridden(payload.id)
  return {
    ...payload,
    metadata: { ...payload.metadata, overridden },
  }
}
