import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BsBoxArrowRight,
  BsCheckCircleFill,
  BsChevronDown,
  BsChevronRight,
  BsXCircle,
} from 'react-icons/bs'
import {
  Calendar,
  ConfirmBox,
  Dropdown,
  SectionBox,
  useToast,
} from '@emporix/component-library'
import TierQuantityListWithPrices from '../shared/TierQuantityListWithPrices'
import { Price, PriceTierValue } from '../../models/Price.model'
import { PriceModel } from '../../models/PriceModel.model'
import InputField from '../shared/InputField'
import { useTranslation } from 'react-i18next'
import { usePricesApi } from '../../hooks/api/prices_v2'
import { useUIBlocker } from '../../context/UIBlocker'
import { useCountries } from '../../hooks/useCountries'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import useForm from '../../hooks/useForm'
import { useCurrencies } from '../../hooks/useCurrencies'
import PriceInput from '../shared/PriceInput'
import PercentageInput from '../shared/PercentageInput'
import {
  assignHostLocation,
  HOST_PRICE_MODEL_PATH,
} from '../../helpers/hostUrls'
import styles from './ProductPricesPanelForm.module.scss'

type DiscountOption = {
  value: string
  label: string
}

type ApiError = {
  response: { data: { message: string; details: string[] } }
}

type ProductPricesPanelFormProps = {
  readonly price: Price
  readonly priceIndex: number
  readonly currenciesDropdownOptions: { label: string; value: string }[]
  readonly sites: { label: string; value: string }[]
  readonly priceModelsDropdownOptions: { label: string; value: string }[]
  readonly priceModels: PriceModel[]
  readonly defaultPriceModel: PriceModel | undefined
  readonly removeLocalPrice: () => void
  readonly removeExistingPrice: (priceId: string) => void
  readonly updateLocalPrice: (price: Price) => void
  readonly isPanelOpened: boolean
  readonly taxCountriesDropdownOptions: { label: string; value: string }[]
  readonly readOnly?: boolean
}

const toIsoDate = (value: unknown): string | undefined =>
  value instanceof Date ? value.toISOString() : undefined

const ProductPricesPanelForm = ({
  price,
  priceIndex,
  currenciesDropdownOptions,
  sites,
  priceModelsDropdownOptions,
  priceModels,
  defaultPriceModel,
  removeLocalPrice,
  removeExistingPrice,
  updateLocalPrice,
  isPanelOpened,
  taxCountriesDropdownOptions,
  readOnly,
}: ProductPricesPanelFormProps) => {
  const { t, i18n } = useTranslation()
  const { getCountryLocalizedName } = useCountries()
  const { getContentLangValue } = useLocalizedValue()
  const toast = useToast()
  const { blockPanel } = useUIBlocker()
  const { editPrice, getPrice, createPrice, removePrice } = usePricesApi()
  const { formData, setFormData, setFormField, setInitFormData } =
    useForm<Price>()
  const [panelCollapsed, setPanelCollapsed] = useState(true)
  const [tierValues, setTierValues] = useState<PriceTierValue[]>([])
  const [dialogVisible, setDialogVisible] = useState(false)
  const [selectedPriceModel, setSelectedPriceModel] = useState<PriceModel>()
  const [discountType, setDiscountType] = useState('')

  const discountTypes: DiscountOption[] = useMemo(
    () => [
      { value: 'PERCENT', label: t('coupons.type.percent') },
      { value: 'ABSOLUTE', label: t('coupons.type.absolute') },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
    [i18n.language]
  )

  const { selectedCurrency } = useCurrencies()

  const initiateDiscountType = () => {
    const isDiscountAmountSet =
      price.salePrice?.discountAmount && price.salePrice?.discountAmount > 0
    const isDiscountPercentageSet =
      price.salePrice?.discountRate && price.salePrice?.discountRate > 0
    if (isDiscountAmountSet) {
      setDiscountType('ABSOLUTE')
      return
    }
    if (isDiscountPercentageSet) {
      setDiscountType('PERCENT')
      return
    }

    setDiscountType('ABSOLUTE')
  }

  useEffect(() => {
    setFormData(price)
    setInitFormData(price)
    setTierValues(price.tierValues)
    const selectedPriceModel = priceModels.find(
      (priceModel) => priceModel.id === price.priceModelId
    )
    setSelectedPriceModel(selectedPriceModel ?? defaultPriceModel)
    setPanelCollapsed(!isPanelOpened)
    initiateDiscountType()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [price, priceModels, defaultPriceModel])

  const updateTierValue = (tierIndex: number, value: string) => {
    if (value) {
      setTierValues((prevState) => {
        prevState[tierIndex].priceValue = value
        return [...prevState]
      })
    }
  }

  const showApiError = (e: unknown) => {
    const { response } = e as ApiError
    const errorTitle = response.data.message
    const errorDetails = response.data.details.join(', ')
    toast.showError(errorTitle, errorDetails)
  }

  const savePrice = useCallback(async () => {
    try {
      blockPanel(true)
      const payload = {
        ...formData,
        tierValues,
      } as Price
      if (formData.id) {
        const successResponse = await editPrice(payload)
        if (successResponse) {
          const { metadata } = await getPrice(formData.id)
          setFormField('metadata', metadata)

          toast.showToast(
            t('products.edit.tab.prices.toast.editSuccess'),
            '',
            'success'
          )
        }
      } else {
        const newPriceId = await createPrice(payload)
        if (newPriceId.id) {
          const newPrice = await getPrice(newPriceId.id)
          updateLocalPrice(newPrice)
          toast.showToast(
            t('products.edit.tab.prices.toast.addSuccess'),
            '',
            'success'
          )
        }
      }
    } catch (e) {
      showApiError(e)
    } finally {
      blockPanel(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [formData, tierValues])

  const deletePrice = async () => {
    try {
      blockPanel(true)
      if (formData.id) {
        const successResponse = await removePrice(formData.id)
        if (successResponse) {
          removeExistingPrice(formData.id)
          toast.showToast(
            t('products.edit.tab.prices.toast.deleteSuccess'),
            '',
            'success'
          )
        }
      }
    } catch (e) {
      showApiError(e)
    } finally {
      blockPanel(false)
      setDialogVisible(false)
    }
  }

  const selectedCountryDropdownOption = useMemo(() => {
    if (price.location.countryCode) {
      return [
        {
          label: `${price.location.countryCode} - ${getContentLangValue(
            getCountryLocalizedName(price.location.countryCode)
          )}`,
          value: price.location.countryCode,
        },
      ]
    }
    return []
  }, [price, getCountryLocalizedName, getContentLangValue])

  const countryOptions = taxCountriesDropdownOptions.length
    ? [...taxCountriesDropdownOptions, ...selectedCountryDropdownOption]
    : selectedCountryDropdownOption

  const onPriceModelChange = useCallback(
    (priceModelId: string) => {
      const dropdownSelection = priceModels.find(
        (priceModel) => priceModel.id === priceModelId
      )
      if (dropdownSelection) {
        const newTierValues = dropdownSelection?.tierDefinition.tiers.map(
          (tier) => {
            return {
              id: tier.id,
              priceValue: '',
            }
          }
        )
        setTierValues(newTierValues)
        setSelectedPriceModel(dropdownSelection)
      }
    },
    [priceModels]
  )

  const togglePanel = () => setPanelCollapsed((prev) => !prev)

  // Prime `Panel` with a custom header template → CL SectionBox (decision D2).
  const pricePanelHeader = (
    <div
      className={[
        styles.pricePanel,
        panelCollapsed ? styles.pricePanelCollapsed : '',
      ].join(' ')}
      onClick={togglePanel}
    >
      <div className={styles.pricePanelHeading}>
        <button
          type="button"
          className={`${styles.iconButton} ${styles.togglerButton}`}
        >
          {panelCollapsed ? (
            <BsChevronRight size={16} />
          ) : (
            <BsChevronDown size={16} />
          )}
        </button>
        <span className={styles.pricePanelTitle}>
          {`${t('products.edit.tab.prices.form.price')} ${priceIndex + 1}`}
        </span>
      </div>
      {!panelCollapsed && (
        <div className={styles.pricePanelActions}>
          <button
            disabled={readOnly}
            type="button"
            className={styles.iconButton}
            onClick={(ev) => {
              ev.stopPropagation()
              if (formData.id) {
                setDialogVisible(true)
              } else {
                removeLocalPrice()
              }
            }}
          >
            <BsXCircle size={25} />
          </button>
          <button
            disabled={readOnly}
            data-test-id="confirm-button"
            type="button"
            className={`${styles.iconButton} ${styles.confirmIcon}`}
            onClick={(ev) => {
              ev.stopPropagation()
              return savePrice()
            }}
          >
            <BsCheckCircleFill size={25} />
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div>
      <SectionBox key={price.id} sectionClassName={styles.panelBox}>
        {pricePanelHeader}
        {!panelCollapsed && (
          <div className={styles.panelContent}>
            <InputField
              label={t('priceModels.form.label.model')}
              className={styles.modelField}
              name="tierDefinition.tierType"
            >
              {price.priceModelId ? (
                <div>{getContentLangValue(selectedPriceModel?.name)}</div>
              ) : (
                <Dropdown
                  options={priceModelsDropdownOptions}
                  value={selectedPriceModel?.id}
                  onChange={(ev) => {
                    setFormField('priceModelId', ev.value)
                    onPriceModelChange(ev.value as string)
                  }}
                />
              )}

              {selectedPriceModel?.id && (
                // Price models are a host-owned route: leave the remote.
                <a
                  href={HOST_PRICE_MODEL_PATH(selectedPriceModel.id)}
                  className={styles.modelLink}
                  onClick={(ev) => {
                    ev.preventDefault()
                    if (selectedPriceModel.id) {
                      assignHostLocation(
                        HOST_PRICE_MODEL_PATH(selectedPriceModel.id)
                      )
                    }
                  }}
                >
                  <div>Go to model definition</div>
                  <BsBoxArrowRight className={styles.modelLinkIcon} size={20} />
                </a>
              )}
            </InputField>
            <div className={styles.fieldsRow}>
              <InputField
                label={t('products.edit.tab.prices.form.country')}
                className={styles.fieldNarrow}
              >
                <Dropdown
                  className={styles.fieldControl}
                  disabled={readOnly}
                  placeholder={
                    countryOptions.length
                      ? t('products.edit.tab.prices.form.selectCountry')
                      : t('products.edit.tab.prices.form.countryEmptyMessage')
                  }
                  options={countryOptions}
                  value={formData.location?.countryCode}
                  onChange={(ev) => {
                    setFormField('location.countryCode', ev.value)
                  }}
                />
              </InputField>
              <InputField
                label={t('products.edit.tab.prices.form.currency')}
                className={styles.fieldNarrow}
              >
                <Dropdown
                  className={styles.fieldControl}
                  disabled={readOnly}
                  filter
                  options={currenciesDropdownOptions}
                  value={formData.currency || selectedCurrency?.code}
                  onChange={(ev) => {
                    setFormField('currency', ev.value)
                  }}
                />
              </InputField>
              <InputField
                label={t('products.edit.tab.prices.form.site')}
                className={styles.fieldWide}
              >
                <Dropdown
                  className={styles.fieldControl}
                  multiple
                  display="chip"
                  disabled={readOnly}
                  options={sites}
                  value={formData.restrictions?.siteCodes}
                  onChange={(ev) => {
                    setFormField('restrictions.siteCodes', ev.value)
                  }}
                />
              </InputField>
              <InputField
                label={t('products.edit.tab.prices.form.validFrom')}
                className={styles.fieldNarrow}
              >
                <Calendar
                  className={styles.fieldControl}
                  disabled={readOnly}
                  selectionMode="single"
                  showTime
                  showButtonBar
                  maxDate={
                    formData.restrictions?.validity?.to
                      ? new Date(formData.restrictions?.validity?.to)
                      : undefined
                  }
                  value={
                    formData.restrictions?.validity?.from
                      ? new Date(formData.restrictions?.validity?.from)
                      : undefined
                  }
                  onChange={(ev) => {
                    setFormField(
                      'restrictions.validity.from',
                      toIsoDate(ev.value)
                    )
                  }}
                />
              </InputField>
              <InputField
                label={t('products.edit.tab.prices.form.validTo')}
                className={styles.fieldNarrow}
              >
                <Calendar
                  className={styles.fieldControl}
                  disabled={readOnly}
                  selectionMode="single"
                  showTime
                  showButtonBar
                  minDate={
                    formData.restrictions?.validity?.from
                      ? new Date(formData.restrictions?.validity?.from)
                      : undefined
                  }
                  value={
                    formData.restrictions?.validity?.to
                      ? new Date(formData.restrictions?.validity?.to)
                      : undefined
                  }
                  onChange={(ev) => {
                    setFormField(
                      'restrictions.validity.to',
                      toIsoDate(ev.value)
                    )
                  }}
                />
              </InputField>

              <InputField
                className={styles.fieldNarrow}
                label={t('products.edit.tab.prices.form.discountType')}
              >
                <Dropdown
                  className={styles.fieldControl}
                  disabled={readOnly}
                  value={discountType}
                  options={discountTypes}
                  onChange={(event) => setDiscountType(event.value as string)}
                />
              </InputField>

              {discountType === 'PERCENT' && (
                <InputField
                  className={styles.fieldNarrowLast}
                  label={t('products.edit.tab.prices.form.discountPercentage')}
                >
                  <PercentageInput
                    disabled={readOnly}
                    onChange={(event) => {
                      setFormField('salePrice.discountRate', event.value)
                      setFormField('salePrice.discountAmount', undefined)
                    }}
                    value={formData.salePrice?.discountRate || 0}
                  />
                </InputField>
              )}

              {discountType === 'ABSOLUTE' && (
                <InputField
                  label={t('products.edit.tab.prices.form.discountAbsolute')}
                  className={styles.fieldNarrowLast}
                >
                  <PriceInput
                    disabled={readOnly}
                    locale={i18n.language}
                    mode="currency"
                    currency={formData.currency}
                    onChange={(event) => {
                      setFormField('salePrice.discountAmount', event.value)
                      setFormField('salePrice.discountRate', undefined)
                    }}
                    value={formData.salePrice?.discountAmount || 0}
                  />
                </InputField>
              )}
            </div>

            {selectedPriceModel && (
              <TierQuantityListWithPrices
                disabled={readOnly}
                onTierValueUpdate={updateTierValue}
                currency={formData.currency}
                priceTierValues={tierValues}
                tiers={selectedPriceModel.tierDefinition.tiers}
                unitCode={selectedPriceModel.measurementUnit.unitCode}
                unitQuantity={selectedPriceModel.measurementUnit.quantity}
                className={styles.tiers}
              />
            )}
          </div>
        )}
      </SectionBox>
      <ConfirmBox
        key="delete-confirm-box"
        visible={dialogVisible}
        title={t('products.edit.tab.prices.dialog.delete')}
        message={t('global.deleteConfirm.plural.description')}
        acceptLabel={t('global.yes')}
        rejectLabel={t('global.cancel')}
        onReject={() => setDialogVisible(false)}
        onAccept={deletePrice}
      />
    </div>
  )
}

export default ProductPricesPanelForm
