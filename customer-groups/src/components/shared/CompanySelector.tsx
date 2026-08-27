import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { PaginatedSelector } from '@emporix/component-library'
import { useCustomerManagementApi } from '../../hooks/api/customerManagement'
import { usePermissions } from '../../context/PermissionsProvider'
import { EmployeeDomains } from '../../configs/accessControls'
import type { PaginationProps } from '../../hooks/usePagination'
import type { StylableProps } from '../../helpers/props'
import type { LegalEntity } from '../../models/LegalEntity.model'

interface CompanySelectorProps extends StylableProps {
  readonly value?: string
  readonly onChange: (value: string | string[] | undefined) => void
  readonly disabled?: boolean
  readonly canManage?: boolean
  readonly canView?: boolean
}

const CompanySelector = ({
  value,
  onChange,
  disabled,
  canManage: canManageProp,
  canView: canViewProp,
  className,
}: CompanySelectorProps) => {
  const { t } = useTranslation()
  const { getLegalEntities, getLegalEntity } = useCustomerManagementApi()
  const { hasPermission } = usePermissions()

  const canManage =
    canManageProp ?? hasPermission(EmployeeDomains.COMPANIES_MANAGER)
  const canView = canViewProp ?? hasPermission(EmployeeDomains.COMPANIES_VIEWER)

  const searchCompanies = useCallback(
    (params: Partial<PaginationProps>) => getLegalEntities(params, false),
    [getLegalEntities]
  )

  const resolveCompanies = useCallback(
    async (selected: string | string[]) => {
      const id = Array.isArray(selected) ? selected[0] : selected
      if (!id) return []
      const entity = await getLegalEntity(id)
      return entity ? [entity] : []
    },
    [getLegalEntity]
  )

  const itemTemplate = useCallback(
    (item: LegalEntity) => item.name || item.id,
    []
  )

  return (
    <PaginatedSelector<LegalEntity>
      className={className}
      singleSelection
      value={value}
      onChange={onChange}
      searchFn={searchCompanies}
      resolveSelected={resolveCompanies}
      canManage={canManage}
      canView={canView}
      disabled={disabled}
      filters={[
        { code: 'name', label: t('usersAndGroups.groups.forms.group.company') },
      ]}
      itemTemplate={itemTemplate}
      searchPlaceholder={t(
        'usersAndGroups.groups.forms.group.placeholder.company'
      )}
      noDataMessage={t('global.noData')}
      noPermissionMessage={t('global.noPermissions')}
    />
  )
}

export default CompanySelector
