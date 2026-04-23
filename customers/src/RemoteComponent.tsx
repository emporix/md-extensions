import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppState } from './models/AppState.model'
import { DashboardProvider } from './context/Dashboard.context'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import './translations/i18n'
import '/node_modules/primeflex/primeflex.css'
import 'primeicons/primeicons.css'
import ApiProvider from './context/ApiProvider.tsx'
import { ConfigurationProvider } from './context/ConfigurationProvider.tsx'
import { SiteProvider } from './context/SitesProvider.tsx'
import { DateTimeProvider } from './context/DateTimeProvider.tsx'
import { TenantProvider } from './context/TenantProvider.tsx'
import { PermissionsProvider } from './context/PermissionsProvider.tsx'
import { RestrictionsProvider } from './context/RestrictionsProvider.tsx'
import { CurrencyProvider } from './context/CurrencyProvider.tsx'
import { ProductDataProvider } from './context/ProductDataProvider.tsx'
import { ToastProvider } from './context/ToastProvider.tsx'
import { UIBlockerProvider } from './context/UIBlcoker.tsx'
import { RefreshValuesProvider } from './context/RefreshValuesProvider.tsx'
import { FeatureTogglesProvider } from './components/featureToggles/FeatureTogglesProvider.tsx'
import CustomersModule from './modules/Customers.module.tsx'
import CustomersAddEdit from './modules/CustomersAddEdit.module.tsx'

interface RemoteComponentProps {
  appState?: AppState
}

/** Standalone dev defaults (match products/) so ApiProvider mounts the tree. Host replaces with real tenant/token. */
const defaultAppState: AppState = {
  tenant: 'default',
  language: 'en',
  token: 'default',
  currency: undefined,
  contentLanguage: 'en',
  permissions: {},
  user: {},
  onError: () => {},
}

const RemoteComponent = ({ appState = defaultAppState }: RemoteComponentProps) => {
  const { i18n, t } = useTranslation()

  useEffect(() => {
    const lng = appState.language?.trim()
    if (lng) {
      void i18n.changeLanguage(lng)
    }
  }, [appState.language, i18n])

  return (
    <DashboardProvider appState={appState}>
      <HashRouter>
        <ApiProvider>
          <TenantProvider>
            <PermissionsProvider>
              <RestrictionsProvider>
                <CurrencyProvider>
                  <ProductDataProvider>
                    <SiteProvider>
                      <ConfigurationProvider>
                        <RefreshValuesProvider>
                          <DateTimeProvider>
                            <ToastProvider>
                              <FeatureTogglesProvider>
                              <UIBlockerProvider>
                                <Routes>
                                  <Route
                                    path="/"
                                    element={<Navigate to="/customers" replace />}
                                  />
                                  <Route path="customers" element={<Outlet />}>
                                    <Route index element={<CustomersModule />} />
                                    <Route path="add" element={<CustomersAddEdit />} />
                                    <Route
                                      path=":customerId"
                                      element={<CustomersAddEdit />}
                                    />
                                    <Route
                                      path="*"
                                      element={
                                        <div className="p-4">
                                          {t('notFound.title')}
                                        </div>
                                      }
                                    />
                                  </Route>
                                </Routes>
                              </UIBlockerProvider>
                              </FeatureTogglesProvider>
                            </ToastProvider>
                          </DateTimeProvider>
                        </RefreshValuesProvider>
                      </ConfigurationProvider>
                    </SiteProvider>
                  </ProductDataProvider>
                </CurrencyProvider>
              </RestrictionsProvider>
            </PermissionsProvider>
          </TenantProvider>
        </ApiProvider>
      </HashRouter>
    </DashboardProvider>
  )
}

export default RemoteComponent
