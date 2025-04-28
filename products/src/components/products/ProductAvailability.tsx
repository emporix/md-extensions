import { useEffect, useState } from 'react'
import { useSites } from '../../context/SitesProvider'
import { Availability, useAvailabilityApi } from '../../api/availability'
import { Column } from 'primereact/column'
import { AvailabilityActions } from './AvailabilityActions'
import { useRefresh } from '../../context/RefreshValuesProvider'
import { useTranslation } from 'react-i18next'
import MdDataTable from '../shared/MdDataTable'

interface ProductAvailabilityProps {
  productId: string
}

export const ProductAvailability = ({
  productId,
}: ProductAvailabilityProps) => {
  const { currentSite, sites } = useSites()
  const [availability, setAvailability] = useState<Availability[]>([])
  const { refresh } = useRefresh()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const { fetchAvailabilityForProductPerSite } = useAvailabilityApi()

  useEffect(() => {
    ;(async () => {
      if (sites) {
        setLoading(true)
        const availabilities: Availability[] = []
        for (const site of sites) {
          try {
            const data = await fetchAvailabilityForProductPerSite(
              productId,
              site.code as string
            )
            availabilities.push(data)
          } catch (error) {
            console.error(error)
            availabilities.push({
              site: site.code,
              stockLevel: 0,
              popularity: 0,
            } as Availability)
          }
        }
        setLoading(false)
        setAvailability(availabilities)
      }
    })()
  }, [currentSite, productId, sites, refresh])

  return (
    <>
      <div className="grid grid-nogutter">
        <div className="col-6 module-subtitle mb-5 mt-3">
          {t('products.edit.tab.availability.title')}
        </div>
      </div>
      <MdDataTable value={availability} className="col-12" isLoading={loading}>
        <Column
          key="id"
          field="site"
          header={t('products.edit.tab.availability.columns.site')}
          body={(rowData: Availability) => {
            if (sites) {
              const foundSite = sites?.find(
                (site) => site.code === rowData.site
              )
              return `${foundSite?.name} - ${foundSite?.code}`
            } else {
              return '-'
            }
          }}
        ></Column>
        <Column
          key="stockLevel"
          field="stockLevel"
          header={t('products.edit.tab.availability.columns.stockLevel')}
        ></Column>
        <Column
          key="distributionChannel"
          field="distributionChannel"
          body={(rowData: Availability) => rowData.distributionChannel || '-'}
          header={t(
            'products.edit.tab.availability.columns.distributionChannel'
          )}
        ></Column>
        <Column
          key="actions"
          body={(rowData) => (
            <AvailabilityActions
              productId={productId}
              availability={rowData}
            ></AvailabilityActions>
          )}
        ></Column>
      </MdDataTable>
    </>
  )
}
