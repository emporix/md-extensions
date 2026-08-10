import { Outlet } from 'react-router'
import { RefreshValuesProvider } from './context/RefreshValuesProvider'
import styles from './Returns.module.scss'

const ReturnsModule = () => (
  <div className={styles.module}>
    <RefreshValuesProvider>
      <Outlet />
    </RefreshValuesProvider>
  </div>
)

export default ReturnsModule
