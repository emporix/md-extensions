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
import { ReferenceOptionsProvider } from './context/ReferenceOptionsProvider'
import { UIBlockerProvider } from './context/UIBlcoker'
import CouponsModule from './Coupons.module'
import CouponsPage from './pages/Coupons.page'
import CouponRoute from './pages/CouponRoute'
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
                <ReferenceOptionsProvider>
                  <UIBlockerProvider>
                    <HashRouter>
                      <Routes>
                        <Route element={<CouponsModule />}>
                          <Route index element={<CouponsPage />} />
                          <Route
                            path="add"
                            caseSensitive
                            element={<CouponRoute />}
                          />
                          <Route path=":code" element={<CouponRoute />} />
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
