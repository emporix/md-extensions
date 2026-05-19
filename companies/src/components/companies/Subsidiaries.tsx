import React, { useEffect, useMemo, useState } from 'react'
import { LegalEntity } from '../../models/LegalEntity'
import { useCustomerManagementApi } from '../../api/customerManagement'
import { useTranslation } from 'react-i18next'
import { useCountries } from '../../hooks/useCountries'
import { Dropdown } from 'primereact/dropdown'
import { formatCustomerName } from '../../helpers/utils'
import { LegalEntityActions } from './LegalEntityActions'
import { Column, ColumnProps } from 'primereact/column'
import MdDataTable from '../../components/MdDataTable'
import { useToast } from '../../context/ToastProvider'

const TABLE_NAME = 'companies'
export const Subsidiaries = (props: { legalEntity: Partial<LegalEntity> }) => {
  const { getSubsidiaries } = useCustomerManagementApi()
  const { legalEntity } = props
  const { t, i18n } = useTranslation()
  const [subsidiaries, setSubsidiaries] = useState<LegalEntity[]>([])
  const { activeCountriesDropdownOptions } = useCountries()
  const { showError } = useToast()

  useEffect(() => {
    ;(async () => {
      if (legalEntity?.id) {
        try {
          const { values } = await getSubsidiaries(legalEntity.id, true)
          setSubsidiaries(values)
        } catch (e: any) {
          showError(
            t('companies.toasts.errorLoad'),
            e.response.data.details || e.response.data.message
          )
          console.error('Error loading subsidiaries:', e)
        }
      }
    })()
  }, [i18n.language, legalEntity])

  const columns = useMemo(() => {
    return [
      {
        header: t(`${TABLE_NAME}.name`),
        field: 'name',
        sortable: true,
        filter: true,
        showFilterMenu: false,
      },
      {
        key: 'legalInfo.countryOfRegistration',
        field: 'legalInfo.countryOfRegistration',
        header: t(`${TABLE_NAME}.countryOfRegistration`),
        sortable: true,
        filter: true,
        filterElement: (options: any) => (
          <Dropdown
            appendTo="self"
            filter
            value={options.value}
            options={activeCountriesDropdownOptions}
            onChange={(ev: { value: string }) =>
              options.filterApplyCallback(ev.value)
            }
            itemTemplate={(option) => <span>{option.label}</span>}
            className="p-column-filter"
          />
        ),
      },
      {
        key: 'legalInfo.taxRegistrationNumber',
        field: 'legalInfo.taxRegistrationNumber',
        header: t(`${TABLE_NAME}.taxRegistrationNumber`),
        sortable: true,
        filter: true,
      },
      {
        key: 'contact',
        header: t(`${TABLE_NAME}.primaryContact`),
        body: (rowData: LegalEntity) => {
          if (!rowData.contacts || rowData.contacts.length === 0) {
            return '-'
          } else {
            const primaryContact = rowData.contacts?.filter(
              (contact) => contact.primary
            )[0]
            return primaryContact
              ? formatCustomerName(primaryContact.customer)
              : formatCustomerName(rowData.contacts[0].customer)
          }
        },
      },
      {
        key: 'actions',
        body: (rowData: LegalEntity) => {
          return <LegalEntityActions legalEntity={rowData} />
        },
      },
    ]
  }, [TABLE_NAME, i18n.language, activeCountriesDropdownOptions])

  return (
    <MdDataTable isLoading={false} value={subsidiaries} showFilter={true}>
      {columns.map((column: ColumnProps) => {
        return <Column key={column.field} {...column} />
      })}
    </MdDataTable>
  )
}
