import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import HeaderSection from '../components/shared/HeaderSection'
import SitesSelect from '../components/shared/SitesSelect'
import OrdersTable from '../components/orders/OrdersTable'
import styles from './OrdersPage.module.scss'

const OrdersListPage = () => {
  const { t } = useTranslation()
  // MD starts on "all sites"; picking a site scopes the list to it.
  const [activeSite, setActiveSite] = useState(false)

  return (
    <>
      <HeaderSection title={t('orders.plural')}>
        <SitesSelect activeSite={activeSite} setActiveSite={setActiveSite} />
      </HeaderSection>
      <OrdersTable
        className={styles.table}
        showTableOptions
        defaultSiteActive={activeSite}
      />
    </>
  )
}

export default OrdersListPage
