import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useCustomEntitiesApi } from '../hooks/api/customEntities'
import { CustomEntity } from '../models/CustomEntity.model'
import { Props } from '../helpers/props'
import { createRequestTracker, loadLatest } from '../helpers/api'
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

  // Only the latest request (current tenant) may update the list.
  const trackRequest = useMemo(() => createRequestTracker(), [])

  const loadReferenceOptions = useCallback(async () => {
    // A tenant switch drops the previous tenant's entities at once, so the
    // selector never offers ids that belong to another tenant.
    setCustomEntities([])
    if (!tenant) return

    setLoading(true)
    setError(null)
    await loadLatest(
      trackRequest,
      () => getAllCustomEntities(),
      (entities) => {
        setCustomEntities(entities)
        setLoading(false)
      },
      (err) => {
        console.error('Failed to fetch custom entities:', err)
        setError('Failed to fetch custom entities')
        setLoading(false)
      }
    )
  }, [tenant, getAllCustomEntities, trackRequest])

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
