import { useTranslation } from 'react-i18next'
import { SectionBox } from '@emporix/component-library'
import LabeledValue from '../../shared/LabeledValue'
import type { OrderAddress } from '../../../models/Order.model'
import styles from './Legacy.module.scss'

type OrderAddressSectionProps = {
  readonly title: string
  readonly address?: OrderAddress
}

const OrderAddressSection = ({ title, address }: OrderAddressSectionProps) => {
  const { t } = useTranslation()
  const attributes = address?.mixins?.customAttributes
  const extraLines = [
    address?.extraLine1,
    address?.extraLine2,
    address?.extraLine3,
    address?.extraLine4,
  ].filter(Boolean)

  return (
    <SectionBox className={styles.section} name={title}>
      <div className={styles.fieldsWrap}>
        <div className={styles.fieldColumn}>
          <LabeledValue label={t('orders.data.label.type')}>
            <span className={styles.uppercase}>
              {address?.companyName
                ? t('orders.data.type.customer')
                : t('orders.data.type.private')}
            </span>
          </LabeledValue>
          <LabeledValue label={t('orders.data.label.companyName')}>
            {address?.companyName || '---'}
          </LabeledValue>
          <LabeledValue label={t('orders.data.label.vatNumber')}>
            {attributes?.vatId || '---'}
          </LabeledValue>
        </div>
        <div className={styles.fieldColumn}>
          <LabeledValue label={t('orders.data.label.contactName')}>
            {address?.contactName}
          </LabeledValue>
          <LabeledValue label={t('orders.data.label.contactPhone')}>
            {address?.contactPhone || '---'}
          </LabeledValue>
        </div>
        <LabeledValue label={t('orders.data.label.address')}>
          <div className={styles.addressLines}>
            <div className={styles.inlineGap}>
              <div>{address?.street}</div>
              <div>{address?.streetNumber}</div>
            </div>
            {extraLines.map((line) => (
              <div key={line}>{line}</div>
            ))}
            <div className={styles.inlineGap}>
              <div>{address?.city}</div>
              <div>{address?.zipCode}</div>
            </div>
          </div>
        </LabeledValue>
      </div>
    </SectionBox>
  )
}

export default OrderAddressSection
