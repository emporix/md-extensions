import { useTranslation } from 'react-i18next'
import { PriceModelTier } from '../../models/PriceModel.model'
import { PriceTierValue } from '../../models/Price.model'
import PriceInput from './PriceInput'
import styles from './TierQuantityList.module.scss'

type TierListProps = {
  readonly tiers: PriceModelTier[]
  readonly priceTierValues: PriceTierValue[]
  readonly currency: string | undefined
  readonly unitCode: string | undefined
  readonly unitQuantity: number | undefined
  readonly className: string
  readonly onTierValueUpdate: (tierIndex: number, value: string) => void
  readonly disabled?: boolean
}

type TierPriceValueProps = {
  readonly tier: PriceModelTier
  readonly priceTierValue: PriceTierValue
  readonly currency: string | undefined
  readonly index: number
  readonly onTierValueUpdate: (tierIndex: number, value: string) => void
  readonly disabled?: boolean
}

const TierPriceValue = ({
  tier,
  priceTierValue,
  currency,
  index,
  onTierValueUpdate,
  disabled,
}: TierPriceValueProps) => {
  const { t, i18n } = useTranslation()
  return (
    <div className={styles.tierRow}>
      <span className={`${styles.tierIndex} ${styles.tierRowIndex}`}>
        {t('priceModels.form.label.tier', { index: index + 1 })}
      </span>
      <div className={styles.tierInput}>
        <span className={`${styles.tierIndex} ${styles.tierQuantity}`}>
          {tier.minQuantity.quantity}
        </span>
        <span className={styles.tierUnit}>{tier.minQuantity.unitCode}</span>
      </div>
      <PriceInput
        className={styles.priceInput}
        disabled={disabled}
        locale={i18n.language}
        mode="currency"
        currency={currency}
        value={
          priceTierValue?.priceValue
            ? Number.parseFloat(priceTierValue.priceValue)
            : undefined
        }
        onChange={({ value }) => {
          if (value) {
            onTierValueUpdate(index, value.toString())
          }
        }}
      />
    </div>
  )
}

const TierQuantityListWithPrices = ({
  tiers,
  className,
  priceTierValues,
  currency,
  onTierValueUpdate,
  disabled,
}: TierListProps) => {
  const { t } = useTranslation()

  return (
    <div className={className}>
      <div className={styles.tierLabel}>
        {t('priceModels.form.label.minQuantity')}
      </div>
      {tiers?.map((tier, index) => (
        <TierPriceValue
          disabled={disabled}
          key={index}
          currency={currency}
          tier={tier}
          priceTierValue={priceTierValues[index]}
          index={index}
          onTierValueUpdate={onTierValueUpdate}
        />
      ))}
    </div>
  )
}

export default TierQuantityListWithPrices
