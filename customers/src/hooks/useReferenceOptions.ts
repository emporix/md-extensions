import { useCallback, useEffect, useMemo, useState } from 'react'
import { useCustomEntitiesApi } from '../api/customEntities'
import { CustomEntity } from '../models/CustomEntity'
import { useTenant } from '../context/TenantProvider'

const PREDEFINED_REFERENCE_TYPES = [
  'PRODUCT',
  'ORDER',
  'CART',
  'CUSTOMER',
  'COMPANY',
  'MEDIA',
  'PRICE_LIST',
  'CUSTOMER_SEGMENT',
  'CATEGORY',
] as const

/** Per-tenant in-flight + short-lived cache so many mixin fields share one catalog request. */
const customEntitiesCache = new Map<string, CustomEntity[]>()
const customEntitiesInflight = new Map<string, Promise<CustomEntity[]>>()

export const useReferenceOptions = () => {
  const { tenant } = useTenant()
  const { getCustomEntities } = useCustomEntitiesApi()

  const [customEntities, setCustomEntities] = useState<CustomEntity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadReferenceOptions = useCallback(async () => {
    if (!tenant) return

    const cached = customEntitiesCache.get(tenant)
    if (cached) {
      setCustomEntities(cached)
      return
    }

    try {
      setLoading(true)
      setError(null)

      let request = customEntitiesInflight.get(tenant)
      if (!request) {
        request = getCustomEntities({}).then(({ customEntities: entities }) => {
          customEntitiesCache.set(tenant, entities)
          return entities
        })
        customEntitiesInflight.set(tenant, request)
        request.finally(() => {
          customEntitiesInflight.delete(tenant)
        })
      }

      const entities = await request
      setCustomEntities(entities)
    } catch (err) {
      console.error('Failed to fetch custom entities:', err)
    } finally {
      setLoading(false)
    }
  }, [tenant, getCustomEntities])

  useEffect(() => {
    void loadReferenceOptions()
  }, [loadReferenceOptions])

  const referenceOptions = useMemo(() => {
    const customEntityIds = customEntities.map((entity) => entity.id)
    return [...customEntityIds, ...PREDEFINED_REFERENCE_TYPES]
  }, [customEntities])

  const referenceDropdownOptions = useMemo(() => {
    const customEntityOptions = customEntities.map((entity) => ({
      label: entity.id,
      value: entity.id,
    }))

    const predefinedOptions = PREDEFINED_REFERENCE_TYPES.map((type) => ({
      label: type,
      value: type,
    }))

    return [...customEntityOptions, ...predefinedOptions]
  }, [customEntities])

  return {
    referenceOptions,
    referenceDropdownOptions,
    customEntities,
    loading,
    error,
    reload: loadReferenceOptions,
    predefinedTypes: PREDEFINED_REFERENCE_TYPES,
  }
}
