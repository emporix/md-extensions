import { useContext, createContext, useState } from 'react'
import classnames from 'classnames'
import { Props } from '../helpers/props'
import { ProgressSpinner } from 'primereact/progressspinner'

import './UIBlcoker.scss'

const UIBlockerContext = createContext({
  blockPanel: (_isBlocked: boolean) => {
    //NOOP
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
            'ui-blocker': true,
            'ui-blocker--active': blockedPanel,
          })}
        ></div>
        {blockedPanel && (
          <div className="progress flex flex-column justify-content-center align-items-center bg-white z-5 fixed p-4">
            <ProgressSpinner />
            <div className="mt-2">Loading</div>
          </div>
        )}
      </>
    </UIBlockerContext.Provider>
  )
}
