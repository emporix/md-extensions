import { useEffect, useState } from 'react'
import { useSites } from '../../context/SitesProvider'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { useRefresh } from '../../context/RefreshValuesProvider'
import { useTranslation } from 'react-i18next'
import { usePriceApi } from '../../api/prices'
import { ProductPrice } from '../../models/Price'
import { PriceActions } from './PriceActions'
import MoneyValue from '../shared/MoneyValue'

interface ProductAvailabilityProps {
  productId: string
}

/**
 *
 * DEMO PURPOSES ONLY
 */
export const ProductPricesV1 = ({ productId }: ProductAvailabilityProps) => {
  const { currentSite, sites } = useSites()
  const [prices, setPrices] = useState<ProductPrice[]>([])
  const { refresh, setRefreshValue } = useRefresh()
  const { t } = useTranslation()
  const { syncProductPriceForSiteCode } = usePriceApi()
  useEffect(() => {
    ;(async () => {
      if (sites) {
        const fetchedPrices: ProductPrice[] = []
        for (const site of sites) {
          const data = await syncProductPriceForSiteCode(
            productId,
            site.code as string
          )
          if (data.length === 0) {
            fetchedPrices.push({
              siteCode: site.code,
            } as ProductPrice)
          }
          fetchedPrices.push(...data)
        }
        setPrices(fetchedPrices)
        setRefreshValue()
      }
    })()
  }, [currentSite, productId, sites, refresh])

  return (
    <>
      <DataTable value={prices} size="small" className="col-12">
        <Column
          key="site"
          field="siteCode"
          header={t('products.edit.tab.prices.columns.site')}
          body={(rowData: ProductPrice) => {
            if (sites) {
              const foundSite = sites?.find(
                (site) => site.code === rowData.siteCode
              )
              return `${foundSite?.name} - ${foundSite?.code}`
            } else {
              return '-'
            }
          }}
        ></Column>
        <Column
          key="effectiveAmount"
          field="effectiveAmount"
          header={t('products.edit.tab.prices.columns.price')}
          body={(rowData: ProductPrice) => (
            <MoneyValue
              currency={rowData.currency}
              value={rowData.effectiveAmount}
            />
          )}
        ></Column>
        <Column
          key="actions"
          body={(rowData) => {
            return (
              <PriceActions
                existingPrice={
                  prices.filter(
                    (price) => price.effectiveAmount !== undefined
                  )[0]
                }
                siteCode={rowData.siteCode}
                productId={productId}
                price={rowData}
              ></PriceActions>
            )
          }}
        ></Column>
      </DataTable>
    </>
  )
}
