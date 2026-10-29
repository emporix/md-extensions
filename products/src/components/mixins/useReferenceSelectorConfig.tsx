import { useTranslation } from 'react-i18next'
import { usePermissions } from '../../context/PermissionsProvider'
import { EmployeeDomains } from '../../configs/accessControls'
import { ReactNode, useMemo } from 'react'
import { FilterMatchMode } from '@emporix/component-library'
import { useProductsApi } from '../../hooks/api/products'
import { PaginationProps } from '../../hooks/usePagination'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { OrderSummary, useOrdersApi } from '../../hooks/api/orders'
import { useCartsApi } from '../../hooks/api/carts'
import { useCustomerApi } from '../../hooks/api/customers'
import { useCustomerManagementApi } from '../../hooks/api/customerManagement'
import { useMediaAssets } from '../../hooks/api/mediaAssets'
import { useSegmentsApi } from '../../hooks/api/segments'
import { useCategoriesApi } from '../../hooks/api/categories'
import { Customer } from '../../models/Customer.model'
import { Cart } from '../../models/Cart.model'
import { Category, CategoryType, Product } from '../../models/Category.model'
import { fetchPriceListCall, searchPriceListsCall } from '@emporix/api-calls'
import { fetchAllRecords } from '../../helpers/paginationUtils'
import { toApiPagination } from '../../helpers/apiPagination'
import { useDashboardContext } from '../../context/Dashboard.context'
import { Segment } from '../../models/Segment.model'
import Localized from '../../models/Localized.model'
import { useCustomInstancesApi } from '../../hooks/api/customInstances'
import { PriceList } from '../../models/PriceList.model'
import { CustomInstance } from '../../models/CustomInstance.model'
import {
  HOST_CART_PATH,
  HOST_CATEGORY_PATH,
  HOST_COMPANY_PATH,
  HOST_CUSTOM_INSTANCE_PATH,
  HOST_CUSTOMER_PATH,
  HOST_MEDIA_ASSET_PATH,
  HOST_PRICE_LIST_PATH,
  HOST_SEGMENT_PATH,
  orderDetailUrl,
} from '../../helpers/hostUrls'
import { productDetailPath } from '../../constants/paths'

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

/**
 * Reference configs handle heterogeneous entities (products, orders, carts,
 * customers, …) exactly as MD did with `any`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReferenceEntity = any

export interface ReferenceConfig {
  availableFilters: AvailableFilter[]
  loadItems: (
    params: LoadFnParams
  ) => Promise<{ items: ReferenceEntity[]; totalCount: number }>
  loadItem: (id: string) => Promise<ReferenceEntity>
  resolveItems?: (ids: string[]) => Promise<ReferenceEntity[]>
  label: (item: ReferenceEntity) => ReactNode | string
  permissions: { canView: boolean; canManage: boolean }
  navigationPath: (id: string) => string
  /**
   * True when `navigationPath` is a host-owned route (leaves the remote via
   * `assignHostLocation`); false for in-remote hash routes (products).
   */
  isHostRoute: boolean
  goToLabel: (item?: ReferenceEntity) => string
  referenceLabel?: (item?: ReferenceEntity) => string
}

interface Props {
  type: string
}

const useReferenceSelectorConfig = (props: Props) => {
  const { type } = props
  const { t } = useTranslation()
  const { hasPermission } = usePermissions()
  const { getContentLangValue, getUiLangValue } = useLocalizedValue()
  const { tenant } = useDashboardContext()

  const { syncPaginatedProducts, getProduct, getAllProducts } = useProductsApi()
  const { syncOrders, syncOrder, getAllOrders } = useOrdersApi()
  const { searchCarts, getCartById, getAllCarts } = useCartsApi()
  const { syncCustomers, syncCustomer, getAllCustomers } = useCustomerApi()
  const { getLegalEntities, getLegalEntity, getAllLegalEntities } =
    useCustomerManagementApi()
  const { getAllAssetsForId, getAsset } = useMediaAssets()
  const { getSegments, getSegmentById, getAllSegments } = useSegmentsApi()
  const { getCategoriesPaginated, getCategory, getAllCategories } =
    useCategoriesApi()
  const { getCustomInstances, getCustomInstanceById, getAllCustomInstances } =
    useCustomInstancesApi()

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

  // Pagination params using an id filter with multiple values so a whole
  // selection can be resolved via the getAll* helpers in a batched/paginated
  // query instead of one request per id.
  const idPagination = (ids: string[]): Partial<PaginationProps> => ({
    currentPage: 1,
    rows: Math.min(ids.length, 100),
    filters: {
      id: {
        value: ids,
        matchMode: FilterMatchMode.EQUALS,
      },
    } as Partial<PaginationProps>['filters'],
  })

  const config: ReferenceConfig = useMemo(() => {
    switch (type) {
      // Product Reference
      case 'PRODUCT':
        return {
          availableFilters: [
            { name: { en: 'Name', de: 'Name' }, code: 'name' },
            { name: { en: 'ID', de: 'ID' }, code: 'id' },
          ],
          loadItems: async (params: LoadFnParams) => {
            const { query, filterCode, paginationParams } = params
            const { data, totalCount } = await syncPaginatedProducts({
              ...paginationParams,
              filters: getFilters(filterCode, query),
            })
            return { items: data, totalCount }
          },
          loadItem: async (id: string) => await getProduct(id),
          resolveItems: (ids: string[]) => getAllProducts(idPagination(ids)),
          label: (item: Product) => getContentLangValue(item.name) || item.id,
          permissions: {
            canView: hasPermission(EmployeeDomains.PRODUCTS_VIEWER),
            canManage: hasPermission(EmployeeDomains.PRODUCTS_MANAGER),
          },
          navigationPath: productDetailPath,
          isHostRoute: false,
          goToLabel: () => t('mixins.labels.goToProduct'),
          referenceLabel: () => t('mixins.labels.productReference'),
        }

      // Order Reference
      case 'ORDER':
        return {
          availableFilters: [{ name: { en: 'ID', de: 'ID' }, code: 'id' }],
          loadItems: async (params: LoadFnParams) => {
            const { query, filterCode, paginationParams } = params
            const { values, totalRecords } = await syncOrders({
              ...paginationParams,
              filters: getFilters(filterCode, query),
            })
            return { items: values, totalCount: totalRecords }
          },
          loadItem: async (id: string) => await syncOrder(id),
          resolveItems: (ids: string[]) => getAllOrders(idPagination(ids)),
          label: (item: OrderSummary) => item.id,
          permissions: {
            canView: hasPermission(EmployeeDomains.ORDERS_VIEWER),
            canManage: hasPermission(EmployeeDomains.ORDERS_MANAGER),
          },
          navigationPath: orderDetailUrl,
          isHostRoute: true,
          goToLabel: () => t('mixins.labels.goToOrder'),
          referenceLabel: () => t('mixins.labels.orderReference'),
        }

      // Cart Reference
      case 'CART':
        return {
          availableFilters: [{ name: { en: 'ID', de: 'ID' }, code: 'id' }],
          loadItems: async (params: LoadFnParams) => {
            const { query, filterCode, paginationParams } = params
            const { carts, totalRecords } = await searchCarts({
              ...paginationParams,
              filters: getFilters(filterCode, query),
            })
            return { items: carts, totalCount: totalRecords }
          },
          loadItem: async (id: string) => await getCartById(id),
          resolveItems: (ids: string[]) => getAllCarts(idPagination(ids)),
          label: (item: Cart) => item.id,
          permissions: {
            canView: hasPermission(EmployeeDomains.CARTS_VIEWER),
            canManage: hasPermission(EmployeeDomains.CARTS_MANAGER),
          },
          navigationPath: HOST_CART_PATH,
          isHostRoute: true,
          goToLabel: () => t('mixins.labels.goToCart'),
          referenceLabel: () => t('mixins.labels.cartReference'),
        }

      // Customer Reference
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
          resolveItems: (ids: string[]) => getAllCustomers(idPagination(ids)),
          label: (item: Customer) => {
            const first = item?.firstName?.trim?.() || ''
            const last = item?.lastName?.trim?.() || ''
            return `${first} ${last}`.trim()
          },
          permissions: {
            canView: hasPermission(EmployeeDomains.CUSTOMERS_VIEWER),
            canManage: hasPermission(EmployeeDomains.CUSTOMERS_MANAGER),
          },
          navigationPath: HOST_CUSTOMER_PATH,
          isHostRoute: true,
          goToLabel: () => t('mixins.labels.goToCustomer'),
          referenceLabel: () => t('mixins.labels.customerReference'),
        }

      // Company Reference
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
          resolveItems: (ids: string[]) =>
            getAllLegalEntities(idPagination(ids)),
          label: (item: ReferenceEntity) =>
            getContentLangValue(item.name) || item.id || '--',
          permissions: {
            canView: hasPermission(EmployeeDomains.COMPANIES_VIEWER),
            canManage: hasPermission(EmployeeDomains.COMPANIES_MANAGER),
          },
          navigationPath: HOST_COMPANY_PATH,
          isHostRoute: true,
          goToLabel: () => t('mixins.labels.goToCompany'),
          referenceLabel: () => t('mixins.labels.companyReference'),
        }

      // Media Reference
      case 'MEDIA':
        return {
          availableFilters: [
            { name: { en: 'Name', de: 'Name' }, code: 'name' },
          ],
          loadItems: async (params) => {
            const { query, contextId } = params
            if (!contextId) {
              return { items: [], totalCount: 0 }
            }
            const allAssets = await getAllAssetsForId(contextId)
            const filteredAssets = allAssets.filter(
              (asset: ReferenceEntity) => {
                if (!query) return true
                const lowerQuery = query.toLowerCase()
                // MD omitted this `return`, so any non-empty query matched nothing.
                return (
                  asset.id?.toLowerCase().includes(lowerQuery) ||
                  asset.details?.filename?.toLowerCase().includes(lowerQuery)
                )
              }
            )
            const mappedAssets = filteredAssets.map(
              (asset: ReferenceEntity) => ({
                id: asset.id,
                name: asset.details?.filename || asset.id,
                code: asset.id,
              })
            )
            return { items: mappedAssets, totalCount: mappedAssets.length }
          },
          loadItem: async (id: string) => await getAsset(id),
          label: (item: ReferenceEntity) =>
            getContentLangValue(item.name) || item.id || '--',
          permissions: {
            canView: hasPermission(EmployeeDomains.CUSTOM_INSTANCES_VIEWER),
            canManage: hasPermission(EmployeeDomains.CUSTOM_INSTANCES_MANAGER),
          },
          navigationPath: HOST_MEDIA_ASSET_PATH,
          isHostRoute: true,
          goToLabel: () => t('mixins.labels.goToMedia'),
          referenceLabel: () => t('mixins.labels.mediaReference'),
        }

      // Price List Reference
      case 'PRICE_LIST':
        return {
          availableFilters: [
            { name: { en: 'Name', de: 'Name' }, code: 'name' },
            { name: { en: 'ID', de: 'ID' }, code: 'id' },
          ],
          loadItems: async (params: LoadFnParams) => {
            const { query, filterCode, paginationParams } = params
            const { data, totalRecords } = await searchPriceListsCall(tenant, {
              ...paginationParams,
              filters: getFilters(filterCode, query),
            })
            return { items: data, totalCount: totalRecords }
          },
          loadItem: async (id: string) => await fetchPriceListCall(tenant, id),
          resolveItems: (ids: string[]) =>
            fetchAllRecords(
              async (pagination) => {
                const { data, totalRecords } = await searchPriceListsCall(
                  tenant,
                  toApiPagination({
                    ...pagination,
                    ...idPagination(ids),
                  })
                )
                return { values: data, totalRecords }
              },
              { currentPage: 1, rows: 100, ...idPagination(ids) }
            ),
          label: (item: PriceList) =>
            getContentLangValue(item.name) || item.id || '--',
          permissions: {
            canView: hasPermission(EmployeeDomains.PRICE_LISTS_VIEWER),
            canManage: hasPermission(EmployeeDomains.PRICE_LISTS_MANAGER),
          },
          navigationPath: HOST_PRICE_LIST_PATH,
          isHostRoute: true,
          goToLabel: () => t('mixins.labels.goToPriceList'),
          referenceLabel: () => t('mixins.labels.priceListReference'),
        }

      // Customer Segment Reference
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
          resolveItems: (ids: string[]) => getAllSegments(idPagination(ids)),
          label: (item: Segment) => getContentLangValue(item.name) || item.id,
          permissions: {
            canView: hasPermission(EmployeeDomains.SEGMENTS_VIEWER),
            canManage: hasPermission(EmployeeDomains.SEGMENTS_MANAGER),
          },
          navigationPath: HOST_SEGMENT_PATH,
          isHostRoute: true,
          goToLabel: () => t('mixins.labels.goToSegment'),
          referenceLabel: () => t('mixins.labels.customerSegmentReference'),
        }

      // Category Reference
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
          resolveItems: (ids: string[]) =>
            getAllCategories(idPagination(ids), CategoryType.STANDARD),
          label: (item: Category) =>
            getContentLangValue(item.localizedName) || item.code || item.id,
          permissions: {
            canView: hasPermission(EmployeeDomains.CATEGORIES_VIEWER),
            canManage: hasPermission(EmployeeDomains.CATEGORIES_MANAGER),
          },
          navigationPath: HOST_CATEGORY_PATH,
          isHostRoute: true,
          goToLabel: () => t('mixins.labels.goToCategory'),
          referenceLabel: () => t('mixins.labels.categoryReference'),
        }
      default:
        return {
          availableFilters: [
            { name: { en: 'Name', de: 'Name' }, code: 'name' },
            { name: { en: 'ID', de: 'ID' }, code: 'id' },
          ],
          loadItems: async (params: LoadFnParams) => {
            const { query, filterCode, paginationParams } = params
            const { customInstances, totalRecords } = await getCustomInstances(
              type,
              {
                ...paginationParams,
                filters: getFilters(filterCode, query),
              }
            )
            return { items: customInstances, totalCount: totalRecords }
          },
          loadItem: async (id: string) => await getCustomInstanceById(type, id),
          resolveItems: (ids: string[]) =>
            getAllCustomInstances(type, idPagination(ids)),
          label: (item: CustomInstance) =>
            getContentLangValue(item.name) || item.id || '--',
          permissions: {
            canView: hasPermission(EmployeeDomains.CUSTOM_INSTANCES_VIEWER),
            canManage: hasPermission(EmployeeDomains.CUSTOM_INSTANCES_MANAGER),
          },
          navigationPath: (id: string) => HOST_CUSTOM_INSTANCE_PATH(type, id),
          isHostRoute: true,
          goToLabel: (item: CustomInstance) =>
            t('mixins.labels.goTo', {
              referenceType: getUiLangValue(item?.name) || '',
            }),
          referenceLabel: (item: CustomInstance) =>
            t('mixins.labels.reference', {
              type: getUiLangValue(item?.name) || '',
            }),
        }
    }
    // MD parity: the api hooks return fresh callbacks each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, t, hasPermission, tenant])

  return { config }
}

export default useReferenceSelectorConfig
