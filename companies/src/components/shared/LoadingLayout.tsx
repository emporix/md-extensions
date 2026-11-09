import { ProgressSpinner } from '@emporix/component-library'
import styles from './LoadingLayout.module.scss'

const LoadingLayout = () => {
  return (
    <div className={styles.wrapper} data-testid="loading-layout">
      <ProgressSpinner />
    </div>
  )
}

export default LoadingLayout
