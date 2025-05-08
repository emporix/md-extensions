import { useCallback, useEffect, useMemo, useState } from 'react'
import { Dropdown } from 'primereact/dropdown'
import {
  BsBoxArrowRight,
  BsCheckCircleFill,
  BsChevronDown,
  BsChevronRight,
  BsXCircle,
} from 'react-icons/bs'
import TierQuantityListWithPrices from '../products/TierQuantityListWithPrices'
import { Price, PriceTierValue } from '../../models/Price'
import { PriceModel } from '../../models/PriceModel'
import { MultiSelect } from 'primereact/multiselect'
import { Calendar } from 'primereact/calendar'
import InputField from '../shared/InputField'
import { useTranslation } from 'react-i18next'
import { Panel } from 'primereact/panel'
import { Button } from 'primereact/button'
import './ProductPricesPanelForm.scss'
import { usePricesApi } from '../../api/prices_v2'
import { useUIBlocker } from '../../context/UIBlcoker'
import { useToast } from '../../context/ToastProvider'
import ConfirmBox from '../shared/ConfirmBox'
import { useCountries } from '../../hooks/useCountries.tsx'
import { useLocalizedValue } from '../../hooks/useLocalizedValue.tsx'
import { Link } from 'react-router-dom'
import useForm from '../../hooks/useForm.tsx'
import { useCurrencies } from '../../hooks/useCurrencies'
import PriceInput from '../shared/PriceInput'
import PercentageInput from '../shared/PercentageInput'

interface DiscountOption {
  value: string
  label: string
}

interface ProductPricesPanelForm {
  price: Price
  priceIndex: number
  currenciesDropdownOptions: { label: string; value: string }[]
  sites: { label: string; value: string }[]
  priceModelsDropdownOptions: { label: string; value: string }[]
  priceModels: PriceModel[]
  defaultPriceModel: PriceModel | undefined
  removeLocalPrice: () => void
  removeExistingPrice: (priceId: string) => void
  updateLocalPrice: (price: Price) => void
  isPanelOpened: boolean
  taxCountriesDropdownOptions: { label: string; value: string }[]
  readOnly?: boolean
}

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
}: ProductPricesPanelForm) => {
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
    [i18n.language]
  )

  const { selectedCurrency } = useCurrencies()
  useEffect(() => {
    setFormData(price)
    setInitFormData(price)
    setTierValues(price.tierValues)
    const selectedPriceModel = priceModels.find(
      (priceModel) => priceModel.id === price.priceModelId
    )
    setSelectedPriceModel(selectedPriceModel || defaultPriceModel)
    setPanelCollapsed(!isPanelOpened)
    initiateDiscountType()
  }, [price, priceModels, defaultPriceModel])

  const updateTierValue = (tierIndex: number, value: string) => {
    if (value) {
      setTierValues((prevState) => {
        prevState[tierIndex].priceValue = value
        return [...prevState]
      })
    }
  }

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

  const savePrice = useCallback(async () => {
    try {
      blockPanel(true)
      const payload = {
        ...formData,
        tierValues,
      } as Price
      if (formData.id) {
        const successResponse = await editPrice(payload as Price)
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
        const newPriceId = await createPrice(payload as Price)
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
    } catch (e: any) {
      const errorTitle = e.response.data.message
      const errorDetails = e.response.data.details.join(', ')
      toast.showError(errorTitle, errorDetails)
    } finally {
      blockPanel(false)
    }
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
    } catch (e: any) {
      const errorTitle = e.response.data.message
      const errorDetails = e.response.data.details.join(', ')
      toast.showError(errorTitle, errorDetails)
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

  const pricePanelTemplate = (options: {
    collapsed: boolean
    onTogglerClick: React.MouseEventHandler<HTMLElement> | undefined
  }) => {
    return (
      <div
        className="price-panel flex justify-content-between align-items-center cursor-pointer"
        onClick={options.onTogglerClick}
      >
        <div className="flex align-items-center">
          <Button
            className="p-button-text p-button-icon-only justify-content-start"
            onClick={options.onTogglerClick}
          >
            {options.collapsed ? (
              <BsChevronRight size={16} />
            ) : (
              <BsChevronDown size={16} />
            )}
          </Button>
          <span className="price-panel-title">
            {`${t('products.edit.tab.prices.form.price')} ${priceIndex + 1}`}
          </span>
        </div>
        {!options.collapsed && (
          <div className="flex absolute right-0 bottom-0 mr-2 mb-1">
            <Button
              disabled={readOnly}
              type="button"
              className="p-button-text p-button-plain p-button-icon-only"
              onClick={(ev) => {
                ev.stopPropagation()
                formData.id ? setDialogVisible(true) : removeLocalPrice()
              }}
            >
              <BsXCircle size={25} />
            </Button>
            <Button
              disabled={readOnly}
              data-test-id="confirm-button"
              type="button"
              className="p-button-text p-button-plain p-button-icon-only"
              onClick={(ev) => {
                ev.stopPropagation()
                return savePrice()
              }}
            >
              <BsCheckCircleFill color={'#128AFB'} size={25} />
            </Button>
          </div>
        )}
      </div>
    )
  }

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
    [priceModels, price, formData]
  )

  return (
    <div>
      <Panel
        key={price.id}
        toggleable
        headerTemplate={pricePanelTemplate}
        collapsed={panelCollapsed}
        onToggle={(e) => setPanelCollapsed(e.value)}
      >
        <InputField
          label={t('priceModels.form.label.model')}
          className="mb-6"
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
                onPriceModelChange(ev.value)
              }}
            />
          )}

          {selectedPriceModel?.id && (
            <Link
              to={`/price-models/${selectedPriceModel.id}`}
              className={
                'text-xs highlight-text flex align-items-center cursor-pointer'
              }
            >
              <div>Go to model definition</div>
              <BsBoxArrowRight className={'pl-1'} size={20} />
            </Link>
          )}
        </InputField>
        <div className="flex">
          <InputField
            label={t('products.edit.tab.prices.form.country')}
            className="w-2 mr-4"
          >
            <Dropdown
              disabled={readOnly}
              emptyMessage={t(
                'products.edit.tab.prices.form.countryEmptyMessage'
              )}
              placeholder={t('products.edit.tab.prices.form.selectCountry')}
              options={
                taxCountriesDropdownOptions.length
                  ? [
                      ...taxCountriesDropdownOptions,
                      ...selectedCountryDropdownOption,
                    ]
                  : selectedCountryDropdownOption
              }
              value={formData.location?.countryCode}
              onChange={(ev) => {
                setFormField('location.countryCode', ev.target.value)
              }}
            />
          </InputField>
          <InputField
            label={t('products.edit.tab.prices.form.currency')}
            className="w-2 mr-4"
          >
            <Dropdown
              disabled={readOnly}
              filter
              options={currenciesDropdownOptions}
              value={formData.currency || selectedCurrency?.code}
              onChange={(ev) => {
                setFormField('currency', ev.target.value)
              }}
            />
          </InputField>
          <InputField
            label={t('products.edit.tab.prices.form.site')}
            className="w-4 mr-4"
          >
            <MultiSelect
              disabled={readOnly}
              options={sites}
              value={formData.restrictions?.siteCodes}
              onChange={(ev) => {
                setFormField('restrictions.siteCodes', ev.target.value)
              }}
            />
          </InputField>
          <InputField
            label={t('products.edit.tab.prices.form.validFrom')}
            className="w-2 mr-4"
          >
            <Calendar
              disabled={readOnly}
              selectionMode="single"
              showTime={true}
              showSeconds={true}
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
                  ev.target.value
                    ? (ev.target.value as Date).toISOString()
                    : undefined
                )
              }}
            />
          </InputField>
          <InputField
            label={t('products.edit.tab.prices.form.validTo')}
            className="w-2 mr-4"
          >
            <Calendar
              disabled={readOnly}
              selectionMode="single"
              showTime={true}
              showSeconds={true}
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
                  ev.target.value
                    ? (ev.target.value as Date).toISOString()
                    : undefined
                )
              }}
            />
          </InputField>

          <InputField
            className="w-2 mr-4"
            label={t('products.edit.tab.prices.form.discountType')}
          >
            <Dropdown
              disabled={readOnly}
              value={discountType}
              options={discountTypes}
              onChange={(event) => setDiscountType(event.value)}
            />
          </InputField>

          {discountType === 'PERCENT' && (
            <InputField
              className="w-2"
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
              className="w-2"
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
            className="mt-5"
          />
        )}
      </Panel>
      <ConfirmBox
        key="delete-confirm-box"
        visible={dialogVisible}
        title={t('products.edit.tab.prices.dialog.delete')}
        onReject={() => setDialogVisible(false)}
        onAccept={deletePrice}
      />
    </div>
  )
}

export default ProductPricesPanelForm
