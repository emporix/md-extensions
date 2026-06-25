import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router'
import { ToastProvider } from '@emporix/component-library'
import '@emporix/component-library/styles'
import { useTranslation } from 'react-i18next'
import { useApiCredentials } from './api/bootstrap'
import { AppState } from './models/AppState.model'
import { DashboardProvider } from './context/Dashboard.context'
import { PermissionsProvider } from './context/PermissionsProvider'
import { ConfigurationProvider } from './context/ConfigurationProvider'
import { SitesProvider } from './context/SitesProvider'
import { UIBlockerProvider } from './context/UIBlcoker'
import UsersAndGroupsRoutes from './UsersAndGroups.routes'
import './translations/i18n'

type RemoteComponentProps = {
  readonly appState?: AppState
}

const defaultAppState: AppState = {
  tenant: 'default',
  language: 'en',
  token: 'default',
  contentLanguage: 'en',
  currency: undefined,
  user: undefined,
  onError: () => {
    // NOOP
  },
}

const RemoteComponent = ({
  appState = defaultAppState,
}: RemoteComponentProps) => {
  useApiCredentials(appState.tenant, appState.token)

  const { i18n } = useTranslation()
  useEffect(() => {
    i18n.changeLanguage(appState.language)
  }, [appState.language, i18n])

  return (
    <ToastProvider>
      <DashboardProvider appState={appState}>
        <PermissionsProvider>
          <ConfigurationProvider>
            <SitesProvider>
              <UIBlockerProvider>
                <HashRouter>
                  <Routes>
                    <Route path="/*" element={<UsersAndGroupsRoutes />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </HashRouter>
              </UIBlockerProvider>
            </SitesProvider>
          </ConfigurationProvider>
        </PermissionsProvider>
      </DashboardProvider>
    </ToastProvider>
  )
}

export default RemoteComponent
