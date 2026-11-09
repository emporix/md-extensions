import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router'
import { ToastProvider } from '@emporix/component-library'
import '@emporix/component-library/styles'
import './index.css'
import { useTranslation } from 'react-i18next'
import { useApiCredentials } from './api/bootstrap'
import { AppState } from './models/AppState.model'
import { DashboardProvider } from './context/Dashboard.context'
import { PermissionsProvider } from './context/PermissionsProvider'
import FeatureTogglesProvider from './context/FeatureTogglesProvider'
import { ConfigurationProvider } from './context/ConfigurationProvider'
import { SitesProvider } from './context/SitesProvider'
import { UIBlockerProvider } from './context/UIBlocker'
import { NavigationConfirmProvider } from './context/NavigationConfirmProvider'
import CompaniesModule from './Companies.module'
import CompaniesListPage from './pages/CompaniesList.page'
import CompanyAddEditPage from './pages/CompanyAddEdit.page'
import LocationAddEditPage from './pages/LocationAddEdit.page'
import ContactAddEditPage from './pages/ContactAddEdit.page'
import CustomerAssignmentAddEditPage from './pages/CustomerAssignmentAddEdit.page'
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
                    <NavigationConfirmProvider>
                      {/* Mirrors MD's /apps/management/companies/... routes. */}
                      <Routes>
                        <Route element={<CompaniesModule />}>
                          <Route index element={<CompaniesListPage />} />
                          <Route path="add" element={<CompanyAddEditPage />} />
                          <Route
                            path=":companyId"
                            element={<CompanyAddEditPage />}
                          />
                          <Route
                            path=":companyId/locations/:locationId?"
                            element={<LocationAddEditPage />}
                          />
                          <Route
                            path=":companyId/assignments/contact/:contactAssignmentId?"
                            element={<ContactAddEditPage />}
                          />
                          <Route
                            path=":companyId/assignments/customer/:contactAssignmentId?"
                            element={<CustomerAssignmentAddEditPage />}
                          />
                          <Route
                            path="*"
                            element={<Navigate to="/" replace />}
                          />
                        </Route>
                      </Routes>
                    </NavigationConfirmProvider>
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
