import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useCustomEntitiesApi } from '../hooks/api/customEntities'
import { CustomEntity } from '../models/CustomEntity.model'
import { Props } from '../helpers/props'
import { useDashboardContext } from './Dashboard.context'

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

interface ReferenceOptionsContextType {
  referenceOptions: string[]
  referenceDropdownOptions: { label: string; value: string }[]
  customEntities: CustomEntity[]
  loading: boolean
  error: string | null
  reload: () => void
  predefinedTypes: typeof PREDEFINED_REFERENCE_TYPES
}

const ReferenceOptionsContext = createContext<ReferenceOptionsContextType>({
  referenceOptions: [...PREDEFINED_REFERENCE_TYPES],
  referenceDropdownOptions: PREDEFINED_REFERENCE_TYPES.map((type) => ({
    label: type,
    value: type,
  })),
  customEntities: [],
  loading: false,
  error: null,
  reload: () => undefined,
  predefinedTypes: PREDEFINED_REFERENCE_TYPES,
})

// eslint-disable-next-line react-refresh/only-export-components -- hook co-located with its provider
export const useReferenceOptions = () => useContext(ReferenceOptionsContext)

export const ReferenceOptionsProvider = ({ children }: Props) => {
  const { tenant } = useDashboardContext()
  const { getAllCustomEntities } = useCustomEntitiesApi()

  const [customEntities, setCustomEntities] = useState<CustomEntity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // A response for a previous tenant must not leak its custom entities into
  // the current tenant's reference options.
  const tenantRef = useRef(tenant)
  tenantRef.current = tenant

  const loadReferenceOptions = useCallback(async () => {
    const requestTenant = tenant
    setCustomEntities([])
    if (!requestTenant) return

    try {
      setLoading(true)
      setError(null)
      const entities = await getAllCustomEntities()
      if (requestTenant !== tenantRef.current) return
      setCustomEntities(entities)
    } catch (err) {
      if (requestTenant !== tenantRef.current) return
      console.error('Failed to fetch custom entities:', err)
      setError('Failed to fetch custom entities')
    } finally {
      if (requestTenant === tenantRef.current) setLoading(false)
    }
  }, [tenant, getAllCustomEntities])

  useEffect(() => {
    loadReferenceOptions()
  }, [loadReferenceOptions])

  const referenceOptions = useMemo(
    () => [
      ...customEntities.map((entity) => entity.id),
      ...PREDEFINED_REFERENCE_TYPES,
    ],
    [customEntities]
  )

  const referenceDropdownOptions = useMemo(
    () => [
      ...customEntities.map((entity) => ({
        label: entity.id,
        value: entity.id,
      })),
      ...PREDEFINED_REFERENCE_TYPES.map((type) => ({
        label: type,
        value: type,
      })),
    ],
    [customEntities]
  )

  const value = useMemo<ReferenceOptionsContextType>(
    () => ({
      referenceOptions,
      referenceDropdownOptions,
      customEntities,
      loading,
      error,
      reload: loadReferenceOptions,
      predefinedTypes: PREDEFINED_REFERENCE_TYPES,
    }),
    [
      referenceOptions,
      referenceDropdownOptions,
      customEntities,
      loading,
      error,
      loadReferenceOptions,
    ]
  )

  return (
    <ReferenceOptionsContext.Provider value={value}>
      {children}
    </ReferenceOptionsContext.Provider>
  )
}
