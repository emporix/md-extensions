import type { ReactNode } from 'react'
import { Skeleton } from '@emporix/component-library'
import LabeledValue from '../../shared/LabeledValue'
import styles from './OrderDetails.module.scss'

type OrderDetailsFieldProps = {
  readonly name: string
  readonly value?: ReactNode
  readonly isLoading?: boolean
  readonly alignEnd?: boolean
}

const OrderDetailsField = ({
  name,
  value,
  isLoading = false,
  alignEnd = false,
}: OrderDetailsFieldProps) => {
  if (isLoading) {
    return (
      <div className={styles.skeleton}>
        <Skeleton width="5rem" />
        <Skeleton width="10rem" />
      </div>
    )
  }
  return (
    <LabeledValue
      className={alignEnd ? styles.fieldEnd : undefined}
      label={name}
      data-testid={`orders-details-customer-${name}`}
    >
      <div className={styles.fieldValue}>{value || '--'}</div>
    </LabeledValue>
  )
}

export default OrderDetailsField
