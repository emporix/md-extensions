import { createContext, FC, useContext, useState } from 'react'
import { Props } from '../helpers/props'
import { ConfirmBox } from '@emporix/component-library'
import { useNavigate } from 'react-router'
import { NavigateOptions, To } from 'react-router'
import { useTranslation } from 'react-i18next'

interface NavigationData {
  to: To
  options?: NavigateOptions
}

const getDefaultNavigationData = () => {
  return { to: '' }
}

interface NavigationConfirmContextType {
  navigationBlocked: boolean
  setNavigationBlocked: (isBlocked: boolean) => void
  navigateWithConfirm: (navData: NavigationData) => void
}

const NavigationConfirmContext = createContext<NavigationConfirmContextType>({
  navigationBlocked: false,
  setNavigationBlocked: () => undefined,
  navigateWithConfirm: () => undefined,
})

// eslint-disable-next-line react-refresh/only-export-components -- hook co-located with its provider
export const useNavigationConfirm = () => useContext(NavigationConfirmContext)

export const NavigationConfirmProvider: FC<Props> = (props) => {
  const { t } = useTranslation()
  const [navigationBlocked, setNavigationBlocked] = useState<boolean>(false)
  const [navigationData, setNavigationData] = useState<NavigationData>(() =>
    getDefaultNavigationData()
  )
  const [isConfirmVisible, setIsConfirmVisible] = useState<boolean>(false)
  const navigate = useNavigate()

  const navigateWithConfirm = (navData: NavigationData) => {
    setNavigationData(navData)
    setIsConfirmVisible(true)
  }

  const onAcceptHandler = () => {
    closeConfirmHandler()
    setNavigationBlocked(false)
    navigate(navigationData.to, navigationData.options)
  }

  const closeConfirmHandler = () => {
    setIsConfirmVisible(false)
    setNavigationData(() => getDefaultNavigationData())
  }

  return (
    <NavigationConfirmContext.Provider
      value={{
        navigationBlocked,
        setNavigationBlocked,
        navigateWithConfirm,
      }}
    >
      {props.children}
      <ConfirmBox
        onAccept={onAcceptHandler}
        visible={isConfirmVisible}
        onReject={closeConfirmHandler}
        message={t('navigation.blockedAlert')}
        title={t('navigation.blockedTitle')}
      />
    </NavigationConfirmContext.Provider>
  )
}
