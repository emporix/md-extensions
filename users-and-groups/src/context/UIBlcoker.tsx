import { useContext, createContext, useState } from 'react'
import classnames from 'classnames'
import { Props } from '../helpers/props'
import { ProgressSpinner } from 'primereact/progressspinner'
import styles from './UIBlcoker.module.scss'

const UIBlockerContext = createContext({
  blockPanel: (_isBlocked: boolean) => {
    void _isBlocked
    // NOOP
  },
})

export const useUIBlocker = () => useContext(UIBlockerContext)

export const UIBlockerProvider = (props: Props) => {
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
            <div className={styles.loadingLabel}>Loading</div>
          </div>
        )}
      </>
    </UIBlockerContext.Provider>
  )
}
