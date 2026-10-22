import { useTranslation } from 'react-i18next'
import OrderDetailsField from './OrderDetailsField'
import type { OrderAddress } from '../../../models/Order.model'
import styles from './OrderDetails.module.scss'

type OrderDetailsAddressProps = {
  readonly name: string
  readonly address?: OrderAddress
  readonly emptyText?: string
  readonly isLoading?: boolean
}

const OrderDetailsAddress = ({
  name,
  address,
  emptyText,
  isLoading = false,
}: OrderDetailsAddressProps) => {
  const { t } = useTranslation()

  if (!address && !isLoading) {
    return (
      <div className={styles.muted}>{emptyText || t('global.noDataFound')}</div>
    )
  }

  return (
    <OrderDetailsField
      name={name}
      isLoading={isLoading}
      value={
        <div className={styles.addressLines}>
          <div>
            {!address?.zipCode && !address?.city
              ? '--'
              : `${address?.zipCode || ''} ${address?.city || ''}`}
          </div>
          <div>
            {address?.street
              ? [
                  address.street,
                  address.streetNumber
                    ? `${address.streetNumber}${address.streetAppendix ? `/${address.streetAppendix}` : ''}`
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')
              : '--'}
          </div>
          <div>{address?.country || '--'}</div>
        </div>
      }
    />
  )
}

export default OrderDetailsAddress
