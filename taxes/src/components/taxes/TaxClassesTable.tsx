import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DataTable,
  useToast,
  type DataTableColumnProps,
} from '@emporix/component-library'

import { getApiErrorDetails } from '../../helpers/api'
import type { TaxClass, TaxRow } from '../../models/Tax.model'
import { useTaxesApi } from '../../hooks/api/taxes'
import { usePermissions } from '../../context/PermissionsProvider'
import { useUIBlocker } from '../../context/UIBlcoker'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import TableActions from '../shared/TableActions'
import { EmployeeDomains } from '../../configs/accessControls'
import { taxClassEditPath } from '../../constants/paths'
import styles from './TaxesTable.module.scss'

type TaxClassesTableProps = {
  readonly tax: TaxRow
  /** A class was removed (and perhaps the whole record): reload the list. */
  readonly onChanged: () => void
}

/** The tax classes of one country; sorted on the client, without filters. */
const TaxClassesTable = ({ tax, onChanged }: TaxClassesTableProps) => {
  const { t, i18n } = useTranslation()
  const { showSuccess, showError } = useToast()
  const { blockPanel } = useUIBlocker()
  const { getContentLangValue, contentLanguage } = useLocalizedValue()
  const { navigate } = useCustomNavigate()
  const { removeTaxClass } = useTaxesApi()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.TAXES_MANAGER)

  const deleteClass = async (taxClass: TaxClass) => {
    blockPanel(true)
    try {
      await removeTaxClass(tax.countryCode, taxClass.code)
      showSuccess(t('taxes.toast.successTaxClassDelete'))
      onChanged()
    } catch (e: unknown) {
      showError(
        t('taxes.toast.errorDelete', { code: taxClass.code }),
        getApiErrorDetails(e)
      )
    } finally {
      blockPanel(false)
    }
  }

  const columns: DataTableColumnProps[] = useMemo(
    () => [
      {
        columnKey: 'code',
        header: t('taxes.label.taxCode'),
        field: 'code',
        sortable: true,
      },
      {
        columnKey: 'name',
        header: t('taxes.label.taxName'),
        field: 'name',
        body: (taxClass: TaxClass) => getContentLangValue(taxClass.name),
        sortField: `name.${contentLanguage}`,
        sortable: true,
      },
      {
        columnKey: 'rate',
        header: t('taxes.label.taxRate'),
        field: 'rate',
        body: (taxClass: TaxClass) => `${taxClass.rate} %`,
        sortable: true,
        align: 'right',
        headerStyle: { width: '150px', paddingRight: '12px' },
        bodyStyle: { paddingRight: '12px' },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.language, contentLanguage, getContentLangValue, t]
  )

  return (
    <div className={styles.classes}>
      <DataTable
        dataKey="code"
        value={tax.taxClasses}
        columns={columns}
        paginator={false}
        showFilter={false}
        rowActions={(taxClass: TaxClass) => (
          <TableActions
            managerPermission={canManage}
            onEdit={() =>
              navigate(taxClassEditPath(tax.countryCode, taxClass.code))
            }
            onDelete={() => deleteClass(taxClass)}
            deleteConfirm={{ pluralsPath: 'taxes', entity: taxClass }}
          />
        )}
        emptyMessage={t('global.noDataFound')}
        data-testid={`tax-classes-${tax.countryCode}`}
      />
    </div>
  )
}

export default TaxClassesTable
