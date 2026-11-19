import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FilterMatchMode,
  PaginatedSelector,
  type DataTablePaginationState,
} from '@emporix/component-library'
import { PaginationProps } from '../../hooks/usePagination'
import { StylableProps } from '../../helpers/props'
import { useCustomerManagementApi } from '../../hooks/api/customerManagement'
import { usePermissions } from '../../context/PermissionsProvider'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { LegalEntity } from '../../models/LegalEntity.model'
import { EmployeeDomains } from '../../configs/accessControls'

const COMPANY_FILTERS = [
  {
    name: { en: 'Name', de: 'Name' },
    code: 'name',
  },
  {
    name: { en: 'ID', de: 'ID' },
    code: 'id',
  },
]

type CompaniesSelectorProps = StylableProps & {
  readonly value?: string | string[]
  readonly onChange: (value: string | string[] | undefined) => void
  readonly singleSelection?: boolean
  readonly disabled?: boolean
  readonly canManage?: boolean
  readonly canView?: boolean
}

/**
 * Port of MD `components/shared/CompaniesSelector` onto CL
 * `PaginatedSelector`: same props, filters, requests and permission defaults
 * (edit with Companies Manager, view with Companies Viewer).
 */
const CompaniesSelector = ({
  value,
  onChange,
  singleSelection = true,
  disabled,
  canManage: canManageProp,
  canView: canViewProp,
  className,
}: CompaniesSelectorProps) => {
  const { t } = useTranslation()
  const { getLegalEntities, getAllLegalEntities } = useCustomerManagementApi()
  const { hasPermission } = usePermissions()
  const { getUiLangValue } = useLocalizedValue()

  const canManage =
    canManageProp ?? hasPermission(EmployeeDomains.COMPANIES_MANAGER)
  const canView = canViewProp ?? hasPermission(EmployeeDomains.COMPANIES_VIEWER)

  const resolveCompanies = useCallback(
    async (selected: string | string[]) => {
      const ids = Array.isArray(selected) ? selected : [selected]
      if (ids.length === 0) {
        return []
      }

      return getAllLegalEntities({
        currentPage: 1,
        rows: Math.min(ids.length, 100),
        filters: {
          id: {
            value: ids,
            matchMode: FilterMatchMode.EQUALS,
          },
        },
      } as Partial<PaginationProps>)
    },
    [getAllLegalEntities]
  )

  const searchCompanies = useCallback(
    async (params: DataTablePaginationState) => {
      const { values, totalRecords } = await getLegalEntities(
        params as Partial<PaginationProps>,
        false
      )
      return { values: values as LegalEntity[], totalRecords }
    },
    [getLegalEntities]
  )

  const itemTemplate = useCallback((item: LegalEntity) => {
    return item.name || item.id
  }, [])

  return (
    <PaginatedSelector<LegalEntity>
      className={className}
      value={value}
      onChange={onChange}
      searchFn={searchCompanies}
      resolveSelected={resolveCompanies}
      canManage={canManage}
      canView={canView}
      disabled={disabled}
      filters={COMPANY_FILTERS.map((filter) => ({
        code: filter.code,
        label: getUiLangValue(filter.name),
      }))}
      itemTemplate={itemTemplate}
      singleSelection={singleSelection}
      searchPlaceholder={(filterLabel) =>
        t('mixins.labels.search', { filter: filterLabel.toLowerCase() })
      }
      noDataMessage={t('global.noData')}
      noPermissionMessage={t('global.noPermissions')}
      removeItemAriaLabel={t('global.remove')}
      filterAriaLabel={t('global.toggleOptions')}
    />
  )
}

export default CompaniesSelector
