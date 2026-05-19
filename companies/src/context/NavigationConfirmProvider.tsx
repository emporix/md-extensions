import React, { createContext, FC, useContext, useState } from 'react'
import { Props } from '../helpers/props'
import ConfirmBox from '../components/ConfirmBox'
import { useNavigate } from "react-router-dom";
import { NavigateOptions, To } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface NavigationData {
  to: To
  options?: NavigateOptions
}

const getDefaultNavigationData = () => {
  return { to: '' }
}

const NavigationConfirmContext = createContext({
  navigationBlocked: false,
  setNavigationBlocked: (_isBlocked: boolean) => {
    return
  },
  navigateWithConfirm: (_navData: NavigationData) => {
    return
  },
})

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
