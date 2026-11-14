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
import { UIBlockerProvider } from './context/UIBlcoker'
import { ReferenceOptionsProvider } from './context/ReferenceOptionsProvider'
import CategoriesModule from './Categories.module'
import CategoriesListPage from './pages/CategoriesList.page'
import CategoryAddEditRoute from './pages/CategoryAddEdit.route'
import './translations/i18n'

type RemoteComponentProps = {
  // The host and the standalone shell always pass the real tenant and token;
  // there is no placeholder to fall back to.
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
                <ReferenceOptionsProvider>
                  <UIBlockerProvider>
                    <HashRouter>
                      <Routes>
                        <Route element={<CategoriesModule />}>
                          <Route index element={<CategoriesListPage />} />
                          <Route
                            path="add"
                            caseSensitive
                            element={<CategoryAddEditRoute />}
                          />
                          <Route
                            path=":categoryId"
                            element={<CategoryAddEditRoute />}
                          />
                          <Route
                            path="*"
                            element={<Navigate to="/" replace />}
                          />
                        </Route>
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </HashRouter>
                  </UIBlockerProvider>
                </ReferenceOptionsProvider>
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
