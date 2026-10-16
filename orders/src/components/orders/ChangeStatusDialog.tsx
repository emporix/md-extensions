import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  Dialog,
  Dropdown,
  PrimaryButton,
  Skeleton,
} from '@emporix/component-library'
import type { PossibleStatusesResponse } from '@emporix/api-calls'
import { useOrdersApi } from '../../hooks/api/orders'
import type { OrderStatus } from '../../models/Order.model'
import styles from './ChangeStatusDialog.module.scss'

type ChangeStatusDialogProps = {
  readonly orderId: string
  readonly visible: boolean
  readonly isProcessing: boolean
  readonly onClose: () => void
  readonly onSubmit: (id: string, status?: OrderStatus) => void
}

export const ChangeStatusDialog = ({
  orderId,
  visible,
  isProcessing,
  onClose,
  onSubmit,
}: ChangeStatusDialogProps) => {
  const { t } = useTranslation()
  const { getStatusChanges } = useOrdersApi()
  const [isLoading, setIsLoading] = useState(true)
  const [newStatus, setNewStatus] = useState<OrderStatus>()
  const [possibleStatuses, setPossibleStatuses] = useState<
    PossibleStatusesResponse[]
  >([])

  useEffect(() => {
    if (!visible) return
    void (async () => {
      try {
        setIsLoading(true)
        setPossibleStatuses((await getStatusChanges(orderId)) ?? [])
      } catch (e) {
        console.error(e)
        setPossibleStatuses([])
      } finally {
        setIsLoading(false)
      }
    })()
  }, [orderId, visible, getStatusChanges])

  return (
    <Dialog
      header={t('orders.actions.changeStatus.dialog.title', { id: orderId })}
      visible={visible}
      style={{ width: '500px' }}
      onHide={onClose}
      footer={
        <PrimaryButton
          disabled={!newStatus || possibleStatuses.length === 0 || isProcessing}
          onClick={() => onSubmit(orderId, newStatus)}
        >
          {t('global.submit')}
        </PrimaryButton>
      }
    >
      {isLoading ? (
        <div className={styles.loading}>
          <Skeleton width="5rem" />
          <Skeleton width="10rem" />
        </div>
      ) : possibleStatuses.length > 0 ? (
        <Dropdown
          label={`${t('orders.actions.changeStatus.dialog.subtitle')}:`}
          options={possibleStatuses.map((s) => ({
            label: String(s.status),
            value: String(s.status),
          }))}
          value={newStatus ?? null}
          onChange={(e) => setNewStatus(e.value as OrderStatus)}
        />
      ) : (
        <Trans
          i18nKey="orders.actions.changeStatus.dialog.noStatuses"
          values={{ id: orderId }}
          components={{ strong: <strong /> }}
        />
      )}
    </Dialog>
  )
}

export default ChangeStatusDialog
