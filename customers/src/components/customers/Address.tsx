import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Chips,
  Dropdown,
  FieldLabel,
  InputText,
  PrimaryButton,
  SecondaryButton,
  SelectButton,
  Tabs,
  type TabItem,
} from '@emporix/component-library'
import useMixinsForm from '../mixins/useMixinsForm'
import type { MixinsFormMetadata } from '../mixins/helpers'
import { useCountries } from '../../hooks/useCountries'
import { usePermissions } from '../../context/PermissionsProvider'
import { EmployeeDomains } from '../../configs/accessControls'
import type { CustomerAddress } from '../../models/Customer.model'
import type { Mixins } from '../../models/Mixins.model'
import { SchemaType } from '../../models/Schema.model'
import styles from './Address.module.scss'

const GENERAL_TAB = 'general'

type AddressProps = {
  readonly idx: number
  readonly address: CustomerAddress
  readonly onUpdate: (
    idx: number,
    address: CustomerAddress,
    addressId: string | undefined
  ) => unknown
  readonly onUpdateMixins: (
    idx: number,
    address: CustomerAddress,
    data: Mixins,
    mixinMetadata: MixinsFormMetadata
  ) => Promise<unknown> | unknown
  readonly onDelete: (idx: number, addressId: string | undefined) => unknown
}

/**
 * Port of MD `components/customers/Address`: one address with its own Save
 * and Delete, and the customer-address mixins as further tabs once the
 * address has a contact name.
 */
const Address = ({
  idx,
  address,
  onUpdate,
  onUpdateMixins,
  onDelete,
}: AddressProps) => {
  const { t } = useTranslation()
  const { activeCountriesDropdownOptions } = useCountries()
  const [editAddress, setEditAddress] = useState<CustomerAddress>(address)
  const [activeTabId, setActiveTabId] = useState(GENERAL_TAB)
  // The id the address had when the card opened: a saved address keeps it.
  const [addressId] = useState<string | undefined>(address?.id)
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.CUSTOMERS_MANAGER)
  const fieldId = (name: string) => `address-${idx}-${name}`

  const updateAddress = (
    key: keyof CustomerAddress,
    value: string | boolean | string[] | undefined
  ) => setEditAddress((prev) => ({ ...prev, [key]: value }))

  const onUpdateMixinsRef = useRef(onUpdateMixins)
  onUpdateMixinsRef.current = onUpdateMixins
  const { loadMixins, mixinsTabs } = useMixinsForm({
    type: SchemaType.CUSTOMER_ADDRESS,
    onEdit: async (data: Mixins, mixinMetadata: MixinsFormMetadata) => {
      await onUpdateMixinsRef.current(idx, address, data, mixinMetadata)
    },
    managerPermissions: canManage,
  })

  useEffect(() => {
    void loadMixins(
      (address.metadata?.mixins as Record<string, string>) ?? {},
      address.mixins ?? {}
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD loads once per card
  }, [])

  const booleanOptions = [
    { label: t('global.yes'), value: 'true' },
    { label: t('global.no'), value: 'false' },
  ]

  const generalTab = (
    <>
      <div className={styles.actions}>
        <SecondaryButton
          disabled={!canManage}
          onClick={() => onDelete(idx, address.id)}
        >
          {t('global.delete')}
        </SecondaryButton>
        <PrimaryButton
          disabled={
            !editAddress.country || !editAddress.contactName || !canManage
          }
          onClick={() => onUpdate(idx, editAddress, addressId)}
        >
          {t('global.save')}
        </PrimaryButton>
      </div>
      <div className={styles.grid}>
        <InputText
          className={styles.span4}
          inputId={fieldId('id')}
          label={t('customers.address.id')}
          tooltip={t('customers.address.tooltip.id')}
          disabled={!canManage || addressId !== undefined}
          value={editAddress.id ?? ''}
          onChange={(e) => updateAddress('id', e.target.value)}
        />
        <InputText
          className={styles.span4}
          inputId={fieldId('contactName')}
          label={t('customers.address.contactName')}
          required
          readOnly={!canManage}
          value={editAddress.contactName || ''}
          onChange={(e) => updateAddress('contactName', e.target.value)}
        />
        <InputText
          className={styles.span4}
          inputId={fieldId('companyName')}
          label={t('customers.address.companyName')}
          readOnly={!canManage}
          value={editAddress.companyName || ''}
          onChange={(e) => updateAddress('companyName', e.target.value)}
        />
        <InputText
          className={styles.span8}
          inputId={fieldId('street')}
          label={t('customers.address.street')}
          readOnly={!canManage}
          value={editAddress.street || ''}
          onChange={(e) => updateAddress('street', e.target.value)}
        />
        <InputText
          className={styles.span2}
          inputId={fieldId('streetAppendix')}
          label={t('customers.address.streetAppendix')}
          readOnly={!canManage}
          value={editAddress.streetAppendix || ''}
          onChange={(e) => updateAddress('streetAppendix', e.target.value)}
        />
        <InputText
          className={styles.span2}
          inputId={fieldId('streetNumber')}
          label={t('customers.address.streetNumber')}
          readOnly={!canManage}
          value={editAddress.streetNumber || ''}
          onChange={(e) => updateAddress('streetNumber', e.target.value)}
        />
        <InputText
          className={styles.span4}
          inputId={fieldId('city')}
          label={t('customers.address.city')}
          readOnly={!canManage}
          value={editAddress.city || ''}
          onChange={(e) => updateAddress('city', e.target.value)}
        />
        <InputText
          className={styles.span4}
          inputId={fieldId('zipCode')}
          label={t('customers.address.zipCode')}
          readOnly={!canManage}
          value={editAddress.zipCode || ''}
          onChange={(e) => updateAddress('zipCode', e.target.value)}
        />
        <Dropdown
          className={styles.span4}
          inputId={fieldId('country')}
          data-testid={fieldId('country')}
          label={t('customers.address.country')}
          required
          filter
          disabled={!canManage}
          options={activeCountriesDropdownOptions}
          value={editAddress.country || ''}
          onChange={(e) => updateAddress('country', e.value as string)}
        />
        <Chips
          className={styles.span4}
          inputId={fieldId('tags')}
          label={t('customers.address.tags')}
          disabled={!canManage}
          value={editAddress.tags ?? []}
          onChange={(e) => updateAddress('tags', e.value ?? [])}
          separator=","
          addOnBlur
        />
        <InputText
          className={styles.span4}
          inputId={fieldId('contactPhone')}
          label={t('customers.address.contactPhone')}
          readOnly={!canManage}
          value={editAddress.contactPhone || ''}
          onChange={(e) => updateAddress('contactPhone', e.target.value)}
        />
        <div className={styles.span4}>
          <FieldLabel>{t('customers.address.isDefault')}</FieldLabel>
          <SelectButton
            data-testid={fieldId('isDefault')}
            disabled={!canManage}
            options={booleanOptions}
            value={String(Boolean(editAddress.isDefault))}
            onChange={(e) => updateAddress('isDefault', e.value === 'true')}
          />
        </div>
      </div>
    </>
  )

  const tabs: TabItem[] = [
    {
      id: GENERAL_TAB,
      label: t('customers.address.general'),
      content: generalTab,
    },
    ...(address.contactName ? mixinsTabs : []),
  ]

  return (
    <div className={styles.card} data-testid={`customer-address-${idx}`}>
      <Tabs
        tabs={tabs}
        activeTabId={
          tabs.some((tab) => tab.id === activeTabId) ? activeTabId : GENERAL_TAB
        }
        onTabChange={setActiveTabId}
      />
    </div>
  )
}

export default Address
