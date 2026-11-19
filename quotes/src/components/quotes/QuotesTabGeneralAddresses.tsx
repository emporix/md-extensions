import { useTranslation } from 'react-i18next'
import { Control, Controller } from 'react-hook-form'
import { RadioButton } from '@emporix/component-library'
import { Location } from '../../models/LegalEntity.model'
import { formatAddress } from '../../helpers/utils'
import { QuoteGeneralForm } from '../../helpers/quoteGeneralForm.helpers'
import { StylableProps } from '../../helpers/props'
import styles from './QuotesTabGeneralAddresses.module.scss'

interface QuotesTabGeneralAddressesProps extends StylableProps {
  addresses: Location[]
  control: Control<QuoteGeneralForm>
  name: 'shippingAddressId' | 'billingAddressId'
  disabled?: boolean
}

/** A required pick of one of the addresses (shipping or billing). */
const QuotesTabGeneralAddresses = (props: QuotesTabGeneralAddressesProps) => {
  const { className = '', addresses, control, name, disabled = false } = props
  const { t } = useTranslation()

  return (
    <Controller
      name={name}
      control={control}
      rules={{ required: true }}
      render={({ field }) => (
        <div className={styles.locations}>
          {addresses.map((address) => {
            return (
              <div
                key={address.id}
                className={[styles.location, className]
                  .filter(Boolean)
                  .join(' ')}
              >
                <RadioButton
                  inputId={name + address.id}
                  // One group per list. MD gave both lists `name="category"`,
                  // which PrimeReact hid (it draws the state from `checked`);
                  // CL RadioButton draws the native input, so a shared group
                  // would clear the shipping pick once billing is shown.
                  name={name}
                  disabled={disabled}
                  value={address.id}
                  checked={(field.value as unknown) === address.id}
                  onChange={() => field.onChange(address.id)}
                  onBlur={field.onBlur}
                  className={styles.radio}
                  data-testid={`${name}-${address.id}`}
                />
                <label htmlFor={name + address.id} className={styles.label}>
                  <div className={styles.nameCol}>
                    <i className="pi pi-home" />
                    <div className={styles.name}>{address.name}</div>
                  </div>
                  <div className={styles.addressCol}>
                    <div className={styles.addressTitle}>
                      {t('quotes.tabs.general.address')}
                    </div>
                    <div className={styles.address}>
                      {formatAddress(address.contactDetails ?? {})}
                    </div>
                  </div>
                </label>
              </div>
            )
          })}
        </div>
      )}
    />
  )
}

export default QuotesTabGeneralAddresses
