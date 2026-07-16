import styles from './LoadingLayout.module.scss'

const LoadingLayout = () => {
  return (
    <div className={styles.wrapper} data-testid="loading-layout">
      <div className={styles.spinner} />
    </div>
  )
}

export default LoadingLayout
