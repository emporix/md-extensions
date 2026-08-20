import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Controller, type Control, type FieldErrors } from 'react-hook-form'
import { BsPersonFill } from 'react-icons/bs'
import {
  Calendar,
  DataTable,
  Dropdown,
  InputSwitch,
  InputText,
  SecondaryButton,
  SectionBox,
  type DataTableColumnProps,
} from '@emporix/component-library'

import InputField from '../shared/InputField'
import FormGrid from '../shared/FormGrid'
import FormGridRow from '../shared/FormGridRow'
import EmptyContent from '../shared/EmptyContent'
import ReturnEditDetailsExpansion from './ReturnEditDetailsExpansion'
import TotalMoneyValue from './TotalMoneyValue'
import { usePermissions } from '../../context/PermissionsProvider'
import { getArrayFromEnum } from '../../helpers/utils'
import {
  ReturnDetails,
  ReturnOrder,
  ReturnStatus,
} from '../../models/Returns.model'
import { EmployeeDomains, VendorDomains } from '../../configs/accessControls'
import { HOST_ORDER_PATH } from '../../constants/paths'
import { toCalendarDate } from '../../helpers/date'
import styles from './ReturnEditDetails.module.scss'

interface ReturnEditDetailsProps {
  readonly returnDetails?: ReturnDetails
  readonly control: Control<ReturnDetails>
  readonly errors: FieldErrors<ReturnDetails>
}

const ReturnEditDetails = ({
  returnDetails,
  control,
  errors,
}: ReturnEditDetailsProps) => {
  const { t } = useTranslation()
  const [expandedRows, setExpandedRows] = useState<ReturnOrder[]>()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.RETURNS_MANAGER)
  const canViewOrders =
    hasPermission(EmployeeDomains.ORDERS_VIEWER) ||
    hasPermission(VendorDomains.VENDOR_ORDERS_VIEWER)

  const columns: DataTableColumnProps[] = useMemo(
    () => [
      { columnKey: 'expander', expander: true, style: { width: '3em' } },
      { columnKey: 'id', field: 'id' },
    ],
    []
  )

  const total =
    returnDetails?.calculatedPrice?.finalPrice?.grossValue ??
    returnDetails?.total?.value

  return (
    <>
      <SectionBox
        name={t('returns.details.sectionTitle')}
        className={styles.section}
      >
        <FormGrid>
          <FormGridRow>
            <InputField
              className={styles.thirdField}
              label={t('returns.details.createdDate')}
            >
              <Calendar
                value={toCalendarDate(returnDetails?.metadata.createdAt)}
                dateFormat={t('global.dateFormat')}
                disabled
              />
            </InputField>
            <InputField
              className={styles.thirdField}
              label={t('returns.details.expiryDate')}
            >
              <Calendar
                value={toCalendarDate(returnDetails?.expiryDate)}
                dateFormat={t('global.dateFormat')}
                disabled
              />
            </InputField>
            <Controller
              control={control}
              name="approvalStatus"
              render={({ field }) => (
                <InputField
                  className={styles.halfField}
                  label={t('returns.details.status')}
                >
                  <Dropdown
                    disabled={!canManage}
                    value={field.value}
                    placeholder=""
                    options={getArrayFromEnum(ReturnStatus).map((status) => ({
                      label: status,
                      value: status,
                    }))}
                    onChange={(e) => field.onChange(e.value)}
                  />
                </InputField>
              )}
            />
          </FormGridRow>
          <FormGridRow>
            <Controller
              control={control}
              name="reason.code"
              render={({ field }) => (
                <InputField
                  label={t('returns.details.returnCode')}
                  className={styles.codeField}
                  error={errors.reason?.code?.message}
                >
                  <InputText
                    readOnly={!canManage}
                    data-testid="code-input"
                    value={field.value || ''}
                    onChange={field.onChange}
                  />
                </InputField>
              )}
            />
            <Controller
              control={control}
              name="reason.details"
              render={({ field }) => (
                <InputField
                  label={t('returns.details.returnReason')}
                  className={styles.detailsField}
                  error={errors.reason?.details?.message}
                >
                  <InputText
                    readOnly={!canManage}
                    data-testid="details-input"
                    value={field.value || ''}
                    onChange={field.onChange}
                  />
                </InputField>
              )}
            />
          </FormGridRow>
          <FormGridRow>
            <Controller
              control={control}
              name="received"
              render={({ field }) => (
                <InputField
                  label={t('returns.details.received')}
                  className={styles.switchField}
                  error={errors.received?.message}
                >
                  <InputSwitch
                    disabled={!canManage}
                    checked={field.value}
                    onChange={(e) => field.onChange(e.value)}
                  />
                </InputField>
              )}
            />
            <Controller
              control={control}
              name="submitter"
              render={({ field }) => (
                <InputField
                  label={t('returns.details.submittedBy')}
                  className={styles.submitterField}
                >
                  <div className={styles.submitter}>
                    <BsPersonFill size={20} color="var(--grey-5)" aria-hidden />
                    <div>
                      {field.value?.firstName && field.value?.lastName
                        ? `${field.value.firstName} ${field.value.lastName}`
                        : '-'}
                    </div>
                  </div>
                </InputField>
              )}
            />
          </FormGridRow>
        </FormGrid>
      </SectionBox>

      <DataTable
        dataKey="id"
        className={styles.table}
        value={returnDetails?.orders ?? []}
        columns={columns}
        expandedRows={expandedRows}
        onRowToggle={(rows) => setExpandedRows(rows as ReturnOrder[])}
        rowExpansionTemplate={(returnOrder) => (
          <ReturnEditDetailsExpansion
            returnOrder={returnOrder as ReturnOrder}
          />
        )}
        sortField="created"
        sortOrder={-1}
        paginator={false}
        showHeaders={false}
        pagination={{ totalRecords: returnDetails?.orders?.length ?? 0 }}
        emptyTemplate={<EmptyContent text={t('global.noDataFound')} />}
        rowActions={(returnOrder: ReturnOrder) => (
          <SecondaryButton
            disabled={!canViewOrders}
            className={styles.viewOrderButton}
            onClick={() =>
              // Order details live in the host, not in this remote.
              window.location.assign(HOST_ORDER_PATH(returnOrder.id))
            }
          >
            {t('returns.details.viewOrder')}
          </SecondaryButton>
        )}
      />

      {total !== undefined && (
        <TotalMoneyValue
          value={total}
          currency={returnDetails?.total?.currency ?? ''}
          label={t('returns.details.total')}
        />
      )}
    </>
  )
}

export default ReturnEditDetails
