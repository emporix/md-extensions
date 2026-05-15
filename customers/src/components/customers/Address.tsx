import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { InputText } from 'primereact/inputtext'
import { SelectButton } from 'primereact/selectbutton'
import { useTranslation } from 'react-i18next'
import {
  CustomerAddress,
  DEFAULT_ADDRESS,
} from '../../models/Customer'
import { TOGGLE } from '../../modules/CustomersAddEdit.module'
import InputField from '../InputField'
import { Chips, ChipsChangeParams } from 'primereact/chips'
import { Button } from 'primereact/button'
import { useCountries } from '../../hooks/useCountries'
import { Dropdown } from 'primereact/dropdown'
import { TabPanel, TabView } from 'primereact/tabview'
import { MixinsFormMetadata } from '../mixins/helpers'
import useMixinsForm from '../mixins/useMixinsForm'
import { SchemaType } from '../../models/Schema'
import { Mixins } from '../../models/Mixins'
import { useTabs } from '../../hooks/useTabs'
import { deepClone } from '../../helpers/utils'
import { usePermissions } from '../../context/PermissionsProvider'
import { customerMayManage } from '../../helpers/customerAccess'

/** RHF field row includes `customArrayKey`; omit from semantic comparison. */
type AddressFieldRow = CustomerAddress & { customArrayKey?: string }

function normalizeAddressSnapshot(raw: AddressFieldRow): CustomerAddress {
  const { customArrayKey: _ignore, ...addr } = raw
  const meta = addr.metadata ?? {}
  const metaMixins =
    (meta as { mixins?: Record<string, string> }).mixins ?? {}
  return {
    ...DEFAULT_ADDRESS,
    ...addr,
    tags: Array.isArray(addr.tags) ? addr.tags : [],
    streetAppendix: addr.streetAppendix ?? '',
    mixins: { ...(addr.mixins ?? {}) },
    metadata: {
      ...DEFAULT_ADDRESS.metadata,
      ...meta,
      mixins: { ...metaMixins },
    },
  }
}

interface AddressProps {
  idx: number
  address: CustomerAddress
  onUpdate: (
    idx: number,
    address: CustomerAddress,
    addressId: string | undefined
  ) => unknown
  onUpdateMixins: (
    idx: number,
    address: CustomerAddress,
    data: Mixins,
    mixinMetadata: MixinsFormMetadata
  ) => unknown
  onDelete: (idx: number, addressId: string) => unknown
  onAddressDirty?: (idx: number, dirty: boolean) => void
}

const TABS = ['general']

const Address = ({
  idx,
  address,
  onUpdate,
  onUpdateMixins,
  onDelete,
  onAddressDirty,
}: AddressProps) => {
  const { t } = useTranslation()
  const { activeCountriesDropdownOptions } = useCountries()
  const [editAddress, setEditAddress] = useState<AddressFieldRow>(() =>
    deepClone(address as AddressFieldRow)
  )
  const [addressId] = useState<string | undefined>(address?.id)
  const { activeIndex, onTabChange } = useTabs(TABS, false)
  const handleSave = useCallback(() => {
    onUpdate(idx, editAddress, addressId)
  }, [idx, editAddress, addressId, onUpdate])
  const { permissions } = usePermissions()
  const canBeManaged = customerMayManage(permissions)

  useEffect(() => {
    setEditAddress(deepClone(address as AddressFieldRow))
  }, [address])

  const baselineJson = useMemo(
    () => JSON.stringify(normalizeAddressSnapshot(address as AddressFieldRow)),
    [address]
  )
  const addressDirty =
    JSON.stringify(normalizeAddressSnapshot(editAddress)) !== baselineJson

  useEffect(() => {
    onAddressDirty?.(idx, addressDirty)
  }, [idx, addressDirty, onAddressDirty])

  const updateAddress = (key: string, value: string | boolean | string[]) => {
    setEditAddress((prev) => {
      return { ...prev, [key]: value }
    })
  }
  useEffect(() => {
    void loadMixins(
      (address.metadata?.mixins ?? {}) as Record<string, string>,
      address.mixins ?? {}
    )
  }, [])

  const saveMixin = async (data: Mixins, mixinMetadata: MixinsFormMetadata) => {
    await onUpdateMixins(idx, address, data, mixinMetadata)
  }

  const { loadMixins, mixinsTabs } = useMixinsForm({
    type: SchemaType.CUSTOMER_ADDRESS,
    onEdit: saveMixin,
    managerPermissions: canBeManaged,
  })

  return (
    <div className="grid col-12 bg-white">
      <TabView
        renderActiveOnly={false}
        activeIndex={activeIndex}
        onTabChange={onTabChange}
      >
        <TabPanel header="General" key="general">
          <div className="flex justify-content-end">
            <Button
              disabled={!canBeManaged}
              className="p-button-secondary"
              label={t('global.delete')}
              onClick={() => {
                if (!address.id) {
                  throw 'no address id'
                }
                onDelete(idx, address.id)
              }}
            />
            <Button
              disabled={
                !editAddress.country ||
                !editAddress.contactName ||
                !canBeManaged
              }
              className="ml-3"
              label={t('global.save')}
              onClick={handleSave}
            />
          </div>
          <div className="grid col-12">
            <InputField
              label={t('customers.address.id')}
              tooltip={t('customers.address.tooltip.id')}
              className="col-4"
            >
              <InputText
                value={editAddress.id}
                disabled={!canBeManaged || addressId !== undefined}
                onChange={(e) => updateAddress('id', e.target.value)}
              />
            </InputField>
            <InputField
              label={t('customers.address.contactName')}
              className="col-4"
              required={true}
            >
              <InputText
                disabled={!canBeManaged}
                value={editAddress.contactName || ''}
                onChange={(e) => updateAddress('contactName', e.target.value)}
              />
            </InputField>
            <InputField
              label={t('customers.address.companyName')}
              className="col-4"
            >
              <InputText
                disabled={!canBeManaged}
                value={editAddress.companyName || ''}
                onChange={(e) => updateAddress('companyName', e.target.value)}
              />
            </InputField>
            <InputField label={t('customers.address.street')} className="col-8">
              <InputText
                disabled={!canBeManaged}
                value={editAddress.street || ''}
                onChange={(e) => updateAddress('street', e.target.value)}
              />
            </InputField>
            <InputField
              label={t('customers.address.streetAppendix')}
              className="col-2"
            >
              <InputText
                disabled={!canBeManaged}
                value={editAddress.streetAppendix || ''}
                onChange={(e) =>
                  updateAddress('streetAppendix', e.target.value)
                }
              />
            </InputField>

            <InputField
              label={t('customers.address.streetNumber')}
              className="col-2"
            >
              <InputText
                disabled={!canBeManaged}
                value={editAddress.streetNumber || ''}
                onChange={(e) => updateAddress('streetNumber', e.target.value)}
              />
            </InputField>
            <InputField label={t('customers.address.city')} className="col-4">
              <InputText
                disabled={!canBeManaged}
                value={editAddress.city || ''}
                onChange={(e) => updateAddress('city', e.target.value)}
              />
            </InputField>
            <InputField
              label={t('customers.address.zipCode')}
              className="col-4"
            >
              <InputText
                disabled={!canBeManaged}
                value={editAddress.zipCode || ''}
                onChange={(e) => updateAddress('zipCode', e.target.value)}
              />
            </InputField>
            <InputField
              label={t('customers.address.country')}
              className="col-4"
              required={true}
            >
              <Dropdown
                appendTo="self"
                disabled={!canBeManaged}
                filter
                options={activeCountriesDropdownOptions}
                value={editAddress.country}
                onChange={(e) => updateAddress('country', e.value)}
              />
            </InputField>
            <InputField label={t('customers.address.tags')} className="col-4">
              <Chips
                disabled={!canBeManaged}
                value={editAddress.tags}
                onChange={(e: ChipsChangeParams) =>
                  updateAddress('tags', e.value)
                }
                separator=","
                addOnBlur
              />
            </InputField>
            <InputField
              label={t('customers.address.contactPhone')}
              className="col-4"
            >
              <InputText
                disabled={!canBeManaged}
                value={editAddress.contactPhone || ''}
                onChange={(e) => updateAddress('contactPhone', e.target.value)}
              />
            </InputField>
            <InputField
              label={t('customers.address.isDefault')}
              className="col-4"
            >
              <SelectButton
                disabled={!canBeManaged}
                optionLabel="name"
                value={editAddress.isDefault}
                options={TOGGLE}
                onChange={(e) => updateAddress('isDefault', e.value)}
              />
            </InputField>
          </div>
        </TabPanel>
        {address.contactName && mixinsTabs}
      </TabView>
    </div>
  )
}

export default Address
