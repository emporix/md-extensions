import { useContext, createContext, useState } from 'react'
import classnames from 'classnames'
import { ProgressSpinner } from '@emporix/component-library'
import { useTranslation } from 'react-i18next'
import { Props } from '../helpers/props'
import styles from './UIBlocker.module.scss'

const UIBlockerContext = createContext({
  blockPanel: (_isBlocked: boolean) => {
    void _isBlocked
    // NOOP
  },
})

export const useUIBlocker = () => useContext(UIBlockerContext)

export const UIBlockerProvider = (props: Props) => {
  const { t } = useTranslation()
  const [blockedPanel, setBlockedPanel] = useState(false)

  const blockPanel = (isBlocked: boolean) => {
    setBlockedPanel(isBlocked)
  }

  return (
    <UIBlockerContext.Provider value={{ blockPanel }}>
      <>
        {props.children}
        <div
          className={classnames({
            [styles.overlay]: true,
            [styles.overlayActive]: blockedPanel,
          })}
        ></div>
        {blockedPanel && (
          <div className={styles.loadingPanel}>
            <ProgressSpinner />
            <div className={styles.loadingLabel}>{t('global.loading')}</div>
          </div>
        )}
      </>
    </UIBlockerContext.Provider>
  )
}
