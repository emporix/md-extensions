import { useTranslation } from 'react-i18next'
import { SectionBox } from '@emporix/component-library'
import LabeledValue from '../shared/LabeledValue'
import DateValue from '../shared/DateValue'
import type { Customer } from '../../models/Customer.model'
import styles from './MarketingInformation.module.scss'

type MarketingInformationProps = {
  readonly customer: Customer
  readonly referralCouponCode: string
}

type MixinValues = Record<string, string | number | undefined> | undefined

/** MD "Marketing information" section (read-only mixin values). */
const MarketingInformation = ({
  customer,
  referralCouponCode,
}: MarketingInformationProps) => {
  const { t } = useTranslation()
  const marketing = customer.mixins?.marketing as MixinValues
  const newsletter = customer.mixins?.customerNewsletter as MixinValues
  const general = customer.mixins?.generalAttributes as MixinValues
  const date = (value: string | number | undefined) =>
    value === undefined ? undefined : String(value)

  return (
    <SectionBox name={t('customers.marketing.subtitle')}>
      <div className={styles.grid} data-testid="customer-marketing">
        <LabeledValue label={t('customers.details.bonusPoints')}>
          {marketing?.bonusPoints || 0}
        </LabeledValue>
        <LabeledValue label={t('customers.details.referralCouponCode')}>
          {referralCouponCode || '--'}
        </LabeledValue>
        <LabeledValue label={t('customers.details.registered')}>
          <DateValue date={date(newsletter?.signOnDate)} />
        </LabeledValue>
        <LabeledValue label={t('customers.details.unregistered')}>
          <DateValue date={date(newsletter?.signOffDate)} />
        </LabeledValue>
        <LabeledValue label={t('customers.details.lastDeliveryDate')}>
          <DateValue date={date(general?.lastDeliveryDate)} />
        </LabeledValue>
        <LabeledValue label={t('customers.details.lastOrderDate')}>
          <DateValue date={date(general?.lastOrderDate)} />
        </LabeledValue>
      </div>
    </SectionBox>
  )
}

export default MarketingInformation
