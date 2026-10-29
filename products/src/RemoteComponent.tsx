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
import ProductsModule from './Products.module'
import ProductsListPage from './pages/ProductsList.page'
import ProductAddEdit from './components/products/ProductAddEdit'
import './translations/i18n'

type RemoteComponentProps = {
  readonly appState: AppState
}

const RemoteComponent = ({ appState }: RemoteComponentProps) => {
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
                      <Routes>
                        <Route element={<ProductsModule />}>
                          <Route index element={<ProductsListPage />} />
                          <Route path="add" element={<ProductAddEdit />} />
                          <Route path=":id" element={<ProductAddEdit />} />
                          <Route
                            path="*"
                            element={<Navigate to="/" replace />}
                          />
                        </Route>
                        <Route path="*" element={<Navigate to="/" replace />} />
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
