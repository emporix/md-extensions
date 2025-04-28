import { useTranslation } from 'react-i18next'
import './TierQuantityList.scss'
import { PriceModelTier } from '../../models/PriceModel'
import { PriceTierValue } from '../../models/Price'
import PriceInput from '../../components/shared/PriceInput'

interface TierListProps {
  tiers: PriceModelTier[]
  priceTierValues: PriceTierValue[]
  currency: string | undefined
  unitCode: string | undefined
  unitQuantity: number | undefined
  className: string
  onTierValueUpdate: (tierIndex: number, value: string) => void
  disabled?: boolean
}

function TierPriceValue(props: {
  tier: PriceModelTier
  priceTierValue: PriceTierValue
  currency: string | undefined
  index: number
  onTierValueUpdate: (tierIndex: number, value: string) => void
  disabled?: boolean
}) {
  const { t, i18n } = useTranslation()
  return (
    <div className="flex align-items-center mb-2">
      <span className="tier-index mr-3">
        {t('priceModels.form.label.tier', { index: props.index + 1 })}
      </span>
      <div className="p-inputgroup tier-input">
        <span className="tier-index pl-2 pr-1 text-right">
          {props.tier.minQuantity.quantity}
        </span>
        <span className={'tier-unit'}>{props.tier.minQuantity.unitCode}</span>
      </div>
      <PriceInput
        disabled={props.disabled}
        locale={i18n.language}
        mode="currency"
        currency={props.currency}
        value={
          props.priceTierValue?.priceValue
            ? Number.parseFloat(props.priceTierValue.priceValue)
            : undefined
        }
        onChange={({ value }) => {
          const { index } = props
          if (value) {
            props.onTierValueUpdate(index, value.toString())
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
      <div className="tier-label text-sm font-bold mb-2">
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
