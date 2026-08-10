import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router'
import { ToastProvider } from '@emporix/component-library'
import '@emporix/component-library/styles'
import './index.css'
import { useTranslation } from 'react-i18next'
import { useApiCredentials } from './api/bootstrap'
import { AppState } from './models/AppState.model'
import { DashboardProvider } from './context/Dashboard.context'
import { GroupDataProvider } from './context/Group.provider'
import { PermissionsProvider } from './context/PermissionsProvider'
import FeatureTogglesProvider from './context/FeatureTogglesProvider'
import { ConfigurationProvider } from './context/ConfigurationProvider'
import { SitesProvider } from './context/SitesProvider'
import { UIBlockerProvider } from './context/UIBlcoker'
import CustomerGroupsModule from './CustomerGroups.module'
import GroupPage from './pages/Group.page'
import CustomerGroupsPage from './pages/CustomerGroups.page'
import { GroupUserTypes } from './models/Groups.model'
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
          <FeatureTogglesProvider>
            <ConfigurationProvider>
              <SitesProvider>
                <UIBlockerProvider>
                  <HashRouter>
                    <Routes>
                      <Route element={<CustomerGroupsModule />}>
                        <Route index element={<CustomerGroupsPage />} />
                        <Route
                          path="groups/add"
                          element={
                            <GroupDataProvider
                              groupType={GroupUserTypes.CUSTOMER}
                            >
                              <GroupPage />
                            </GroupDataProvider>
                          }
                        />
                        <Route
                          path="groups/:groupId"
                          element={
                            <GroupDataProvider
                              groupType={GroupUserTypes.CUSTOMER}
                            >
                              <GroupPage />
                            </GroupDataProvider>
                          }
                        />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Route>
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </HashRouter>
                </UIBlockerProvider>
              </SitesProvider>
            </ConfigurationProvider>
          </FeatureTogglesProvider>
        </PermissionsProvider>
      </DashboardProvider>
    </ToastProvider>
  )
}

// Named + default so Vite federation keeps `{ default: Component }` (host
// loadRemoteModule uses module.default). Default-only exposes unwrap to a bare fn.
export { RemoteComponent }
export default RemoteComponent
