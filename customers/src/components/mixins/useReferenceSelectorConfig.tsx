import { useTranslation } from 'react-i18next'
import { usePermissions } from '../../context/PermissionsProvider'
import { ReactNode, useMemo } from 'react'
import { FilterMatchMode } from 'primereact/api'
import { PaginationProps } from '../../hooks/usePagination'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { useCustomerApi } from '../../api/customers'
import { useSegmentsApi } from '../../api/segments'
import { useCategoriesApi } from '../../api/categories'
import { useCustomerManagementApi } from '../../api/customerManagement'
import { Customer } from '../../models/Customer'
import { Category, CategoryType } from '../../models/Category'
import { Segment } from '../../models/Segment'
import Localized from '../../models/Localized'

export const getReferenceTranslationKey = (type?: string) => {
  switch (type) {
    case 'PRODUCT':
      return 'mixins.labels.referenceProduct'
    case 'ORDER':
      return 'mixins.labels.referenceOrder'
    case 'CART':
      return 'mixins.labels.referenceCart'
    case 'CUSTOMER':
      return 'mixins.labels.referenceCustomer'
    case 'COMPANY':
      return 'mixins.labels.referenceCompany'
    case 'MEDIA':
      return 'mixins.labels.referenceMedia'
    case 'PRICE_LIST':
      return 'mixins.labels.referencePriceList'
    case 'CUSTOMER_SEGMENT':
      return 'mixins.labels.referenceCustomerSegment'
    case 'CATEGORY':
      return 'mixins.labels.referenceCategory'
    default:
      return 'mixins.labels.reference'
  }
}

export interface LoadFnParams {
  query?: string
  filterCode?: string
  paginationParams: Partial<PaginationProps>
  contextId?: string
}

export interface AvailableFilter {
  name: Localized
  code: string
}

export interface ReferenceConfig {
  availableFilters: AvailableFilter[]
  loadItems: (
    params: LoadFnParams
  ) => Promise<{ items: unknown[]; totalCount: number }>
  loadItem: (id: string) => Promise<unknown>
  label: (item: unknown) => ReactNode | string
  permissions: { canView: boolean; canManage: boolean }
  navigationPath: (id: string) => string
  goToLabel: (item?: unknown) => string
  referenceLabel?: (item?: unknown) => string
}

interface Props {
  type: string
}

const useReferenceSelectorConfig = (props: Props) => {
  const { type } = props
  const { t } = useTranslation()
  const { permissions } = usePermissions()
  const { getContentLangValue } = useLocalizedValue()

  const { syncCustomers, syncCustomer } = useCustomerApi()
  const { getSegments, getSegmentById } = useSegmentsApi()
  const { getCategoriesPaginated, getCategory } = useCategoriesApi()
  const { getLegalEntities, getLegalEntity } = useCustomerManagementApi()

  const getFilters = (filter?: string, query?: string) => {
    return filter && query
      ? {
          [filter]: {
            value: query,
            matchMode: FilterMatchMode.CONTAINS,
          },
        }
      : undefined
  }

  const unsupported = useMemo(
    (): ReferenceConfig => ({
      availableFilters: [],
      loadItems: async () => ({ items: [], totalCount: 0 }),
      loadItem: async () => null,
      label: () => '--',
      permissions: { canView: false, canManage: false },
      navigationPath: () => '',
      goToLabel: () => t('mixins.labels.reference'),
    }),
    [t]
  )

  const config: ReferenceConfig = useMemo(() => {
    switch (type) {
      case 'CUSTOMER':
        return {
          availableFilters: [
            { name: { en: 'First Name', de: 'Vorname' }, code: 'firstName' },
            { name: { en: 'Last Name', de: 'Nachname' }, code: 'lastName' },
            { name: { en: 'ID', de: 'ID' }, code: 'id' },
          ],
          loadItems: async (params: LoadFnParams) => {
            const { query, filterCode, paginationParams } = params
            const { values, totalRecords } = await syncCustomers({
              ...paginationParams,
              filters: getFilters(filterCode, query),
            })
            return { items: values, totalCount: totalRecords }
          },
          loadItem: async (id: string) => await syncCustomer(id),
          label: (item: unknown) => {
            const c = item as Customer
            const first = c?.firstName?.trim?.() || ''
            const last = c?.lastName?.trim?.() || ''
            return `${first} ${last}`.trim()
          },
          permissions: {
            canView: !!permissions?.customers?.viewer,
            canManage: !!permissions?.customers?.manager,
          },
          navigationPath: (id: string) => `/customers/${id}`,
          goToLabel: () => t('mixins.labels.goToCustomer'),
          referenceLabel: () => t('mixins.labels.customerReference'),
        }

      case 'COMPANY':
        return {
          availableFilters: [
            { name: { en: 'Name', de: 'Name' }, code: 'name' },
            { name: { en: 'ID', de: 'ID' }, code: 'id' },
          ],
          loadItems: async (params: LoadFnParams) => {
            const { query, filterCode, paginationParams } = params
            const { values, totalRecords } = await getLegalEntities({
              ...paginationParams,
              filters: getFilters(filterCode, query),
            })
            return { items: values, totalCount: totalRecords }
          },
          loadItem: async (id: string) => await getLegalEntity(id),
          label: (item: unknown) =>
            getContentLangValue((item as { name?: Localized }).name) ||
            (item as { id?: string }).id ||
            '--',
          permissions: {
            canView: !!permissions?.companies?.viewer,
            canManage: !!permissions?.companies?.manager,
          },
          navigationPath: (id: string) => `/apps/management/companies/${id}`,
          goToLabel: () => t('mixins.labels.goToCompany'),
          referenceLabel: () => t('mixins.labels.companyReference'),
        }

      case 'CUSTOMER_SEGMENT':
        return {
          availableFilters: [
            { name: { en: 'Name', de: 'Name' }, code: 'name' },
            { name: { en: 'ID', de: 'ID' }, code: 'id' },
          ],
          loadItems: async (params: LoadFnParams) => {
            const { query, filterCode, paginationParams } = params
            const { segments, totalRecords } = await getSegments({
              ...paginationParams,
              filters: getFilters(filterCode, query),
            })
            return { items: segments, totalCount: totalRecords }
          },
          loadItem: async (id: string) => await getSegmentById(id),
          label: (item: unknown) =>
            getContentLangValue((item as Segment).name) ||
            (item as Segment).id,
          permissions: {
            canView: !!permissions?.segments?.viewer,
            canManage: !!permissions?.segments?.manager,
          },
          navigationPath: (id: string) =>
            `/customer-management/segments/${id}`,
          goToLabel: () => t('mixins.labels.goToSegment'),
          referenceLabel: () => t('mixins.labels.customerSegmentReference'),
        }

      case 'CATEGORY':
        return {
          availableFilters: [
            { name: { en: 'Name', de: 'Name' }, code: 'name' },
            { name: { en: 'Code', de: 'Code' }, code: 'code' },
          ],
          loadItems: async (params: LoadFnParams) => {
            const { query, filterCode, paginationParams } = params
            const { values, totalRecords } = await getCategoriesPaginated(
              {
                ...paginationParams,
                filters: getFilters(filterCode, query),
              },
              CategoryType.STANDARD
            )
            return { items: values, totalCount: totalRecords }
          },
          loadItem: async (id: string) => await getCategory(id),
          label: (item: unknown) => {
            const c = item as Category
            return (
              getContentLangValue(c.localizedName) || c.code || c.id
            )
          },
          permissions: {
            canView: !!permissions?.categories?.viewer,
            canManage: !!permissions?.categories?.manager,
          },
          navigationPath: (id: string) => `/apps/management/categories/${id}`,
          goToLabel: () => t('mixins.labels.goToCategory'),
          referenceLabel: () => t('mixins.labels.categoryReference'),
        }

      default:
        return unsupported
    }
  }, [
    type,
    t,
    permissions,
    getContentLangValue,
    syncCustomers,
    syncCustomer,
    getSegments,
    getSegmentById,
    getCategoriesPaginated,
    getCategory,
    getLegalEntities,
    getLegalEntity,
    unsupported,
  ])

  return { config }
}

export default useReferenceSelectorConfig
