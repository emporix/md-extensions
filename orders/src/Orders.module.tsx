import { Outlet } from 'react-router'
import { RefreshValuesProvider } from './context/RefreshValuesProvider'
import styles from './Orders.module.scss'

const OrdersModule = () => (
  <div className={styles.module}>
    <RefreshValuesProvider>
      <Outlet />
    </RefreshValuesProvider>
  </div>
)

export default OrdersModule
