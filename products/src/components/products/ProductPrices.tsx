import { useCallback, useEffect, useMemo, useState } from 'react'
import SectionBox from '../shared/SectionBox'
import { usePriceModelsApi } from '../../api/priceModels'
import usePagination from '../../hooks/usePagination'
import { PriceModel } from '../../models/PriceModel'
import { Price, PriceTierValue } from '../../models/Price'
import { usePricesApi } from '../../api/prices_v2'
import { Button } from 'primereact/button'
import ProductPricesPanelForm from './ProductPricesPanelForm'
import { useSites } from '../../context/SitesProvider'
import TaxConfiguration from './TaxConfiguration'
import { useCountries } from '../../hooks/useCountries.tsx'
import { useLocalizedValue } from '../../hooks/useLocalizedValue.tsx'
import { useCurrencies } from '../../hooks/useCurrencies'
import { useProductData } from '../../context/ProductDataProvider'
import { useTranslation } from 'react-i18next'
import { InputText } from 'primereact/inputtext'
import { useDashboardContext } from '../../context/Dashboard.context.tsx'

const createEmptyPrice = (
  itemId: string,
  currency: string,
  site: string,
  tierValues: PriceTierValue[]
): Price => {
  return {
    itemId: {
      id: itemId,
      itemType: 'PRODUCT',
    },
    currency,
    location: { countryCode: '' },
    restrictions: {
      siteCodes: [site],
    },
    mixins: undefined,
    tierValues,
  }
}

export const ProductPrices = () => {
  const { product } = useProductData()
  const { countriesDropdownOptions } = useCountries()
  const [priceModelsDropdownOptions, setPriceModelsDropdownOptions] = useState<
    { label: string; value: string }[]
  >([])
  const [priceModels, setPriceModels] = useState<PriceModel[]>([])
  const [defaultPriceModel, setDefaultPriceModel] = useState<PriceModel>()
  const { getPriceModelsPaginated } = usePriceModelsApi()
  const { getAllPricesForProduct } = usePricesApi()
  const { paginationParams } = usePagination({ rows: 10000 })
  const { currency } = useDashboardContext()
  const { currenciesDropdownOptions } = useCurrencies()
  const { sites, currentSite } = useSites()
  const [prices, setPrices] = useState<Price[]>([])
  const [openPanel, setOpenPanel] = useState(false)
  const { getContentLangValue } = useLocalizedValue()
  const { t } = useTranslation()
  const { permissions } = useDashboardContext()
  const canBeManaged = permissions?.products?.manager
  const canViewPriceModels = permissions?.priceModels?.viewer

  const mapToOptions = useCallback(
    (
      priceModel: PriceModel
    ): {
      value: string
      label: string
    } => ({
      label: getContentLangValue(priceModel.name),
      value: priceModel.id as string,
    }),
    [getContentLangValue]
  )

  const sitesDropdownItems = useMemo(() => {
    return (
      sites?.map((site) => ({
        label: `${site.name} - ${site.code}`,
        value: site.code,
      })) || []
    )
  }, [sites])

  useEffect(() => {
    if (canViewPriceModels) {
      ;(async () => {
        const { values } = await getPriceModelsPaginated(paginationParams)
        setPriceModels(values)
        setPriceModelsDropdownOptions([...values.map(mapToOptions)])
        const defaultPriceModel =
          values.find((priceModel) => priceModel.default) || values[0]
        setDefaultPriceModel(defaultPriceModel)
      })()
    }
  }, [product.id])

  useEffect(() => {
    ;(async () => {
      if (product.id) {
        const productPrices = await getAllPricesForProduct(product.id)
        if (productPrices.length > 0) {
          setPrices(productPrices)
        }
      }
    })()
    setOpenPanel(false)
  }, [product.id])

  const addNewLocalPrice = useCallback(() => {
    const newTierValues = defaultPriceModel?.tierDefinition.tiers.map(
      (tier) => {
        return {
          id: tier.id,
          priceValue: '',
        }
      }
    )
    const newPrice = createEmptyPrice(
      product.id || '',
      currency ? currency.id : 'EUR',
      currentSite ? currentSite.code : 'main',
      newTierValues || []
    )
    setPrices((prevState) => {
      return [...prevState, { ...newPrice, priceModelId: '' }]
    })
    setOpenPanel(true)
  }, [defaultPriceModel])

  const handleUpdateLocalPrice = (price: Price) => {
    const lastPriceIndex = prices.length - 1
    setPrices((prevState) => {
      prevState[lastPriceIndex] = price
      return [...prevState]
    })
  }

  const handleRemoveLocalPrice = () => {
    const lastPriceIndex = prices.length - 1
    setPrices((prevState) => {
      prevState.splice(lastPriceIndex, 1)
      return [...prevState]
    })
  }

  const handleRemoveExistingPrice = (priceId: string) => {
    const priceIndex = prices.findIndex((p) => p.id === priceId)
    setPrices((prevState) => {
      prevState.splice(priceIndex, 1)
      return [...prevState]
    })
  }

  const isNewPriceAdded = useCallback(() => {
    return prices.some((p) => !p.id)
  }, [prices])

  const taxCountriesDropdownOptions = useMemo(() => {
    if (product.taxClasses) {
      const taxCountryCodes = Object.keys(product.taxClasses).map(
        (countryCode) => countryCode
      )
      return countriesDropdownOptions?.filter((countryItem) =>
        taxCountryCodes?.includes(countryItem.value)
      )
    }
    return []
  }, [product.taxClasses, countriesDropdownOptions])

  return (
    <>
      <TaxConfiguration productTaxClasses={product.taxClasses} />
      <SectionBox className="mt-6">
        <>
          {canViewPriceModels ? (
            <>
              {prices?.map((price, priceIndex) => (
                <div key={priceIndex} className="relative">
                  <ProductPricesPanelForm
                    price={price}
                    currenciesDropdownOptions={currenciesDropdownOptions}
                    sites={sitesDropdownItems}
                    priceIndex={priceIndex}
                    priceModels={priceModels}
                    defaultPriceModel={defaultPriceModel}
                    priceModelsDropdownOptions={priceModelsDropdownOptions}
                    removeLocalPrice={handleRemoveLocalPrice}
                    removeExistingPrice={handleRemoveExistingPrice}
                    updateLocalPrice={handleUpdateLocalPrice}
                    isPanelOpened={priceIndex === 0 || openPanel}
                    taxCountriesDropdownOptions={taxCountriesDropdownOptions}
                    readOnly={!canBeManaged}
                  />
                </div>
              ))}
              <Button
                disabled={
                  isNewPriceAdded() || !product.taxClasses || !canBeManaged
                }
                type="button"
                icon="pi pi-plus"
                className={prices?.length ? 'mt-4' : ''}
                onClick={isNewPriceAdded() ? undefined : addNewLocalPrice}
              />
            </>
          ) : (
            <InputText disabled value={t('global.noPermissions')} />
          )}
        </>
      </SectionBox>
    </>
  )
}
