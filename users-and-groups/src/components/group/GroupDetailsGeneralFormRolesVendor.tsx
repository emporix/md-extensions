import { useEffect, useState } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { AutoComplete } from '@emporix/component-library'
import { GroupFormFields } from '../../helpers/groups/groupForm.helpers'
import { usePermissions } from '../../context/PermissionsProvider'
import { EmployeeDomains } from '../../configs/accessControls'
import { useVendorsApi } from '../../hooks/api/vendors'
import { Vendor } from '../../models/Vendor.model'
import { useTranslation } from 'react-i18next'
import { useGroupData } from '../../context/Group.provider'

const GroupDetailsGeneralFormRolesVendor = () => {
  const { t } = useTranslation()
  const { control } = useFormContext<GroupFormFields>()
  const { getVendors } = useVendorsApi()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.USERS_AND_GROUPS_MANAGER)
  const canViewVendors = hasPermission(EmployeeDomains.VENDORS_VIEWER)
  const { group } = useGroupData()

  const [vendors, setVendors] = useState<Vendor[]>([])
  const [query, setQuery] = useState('')
  const vendorId = useWatch({ name: 'vendorId' })

  useEffect(() => {
    if (!canViewVendors) return
    void loadVendors()
  }, [canViewVendors])

  useEffect(() => {
    if (!vendorId) setQuery('')
  }, [vendorId])

  const loadVendors = async (searchQuery?: string) => {
    if (!canViewVendors) return
    try {
      const pagination = { currentPage: 1, rows: 100 }
      const params = searchQuery ? { name: `(~${searchQuery})` } : undefined
      const { values } = await getVendors(pagination, params)
      setVendors(values)
      if (!searchQuery && vendorId) {
        const vendorName =
          values.find((vendor) => vendor.id === vendorId)?.name ?? '--'
        setQuery(vendorName)
      }
    } catch (e: unknown) {
      console.error(e)
    }
  }

  return (
    <Controller
      name="vendorId"
      control={control}
      rules={{ required: true }}
      render={({ field }) => (
        <AutoComplete
          value={query}
          suggestions={vendors as unknown as Record<string, unknown>[]}
          completeMethod={(e) => {
            if (!canViewVendors) return
            void loadVendors(e.query)
          }}
          field="name"
          onChange={(e) => setQuery(String(e.value ?? ''))}
          onSelect={(e) => {
            const vendor = e.value as unknown as Vendor
            setQuery(vendor.name)
            field.onChange(vendor.id)
          }}
          disabled={
            !canManage ||
            !canViewVendors ||
            Boolean(group?.id) ||
            Boolean(group?.vendorId)
          }
          placeholder={!canViewVendors ? t('global.noPermissions') : ''}
        />
      )}
    />
  )
}

export default GroupDetailsGeneralFormRolesVendor
