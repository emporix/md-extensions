import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router'
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
import ProductsList from './pages/ProductsList.tsx'
import ProductAddEdit from './pages/ProductAddEdit.tsx'

interface RemoteComponentProps {
  appState?: AppState
}

const RemoteComponent = ({
  appState = {
    tenant: 'default',
    language: 'default',
    token: 'default',
    site: undefined,
    currency: undefined,
    contentLanguage: 'default',
    permissions: {},
    onError: () => {
      // NOOP
    },
    onSiteChange: () => {
      // NOOP
    },
  },
}: RemoteComponentProps) => {
  const { i18n } = useTranslation()

  useEffect(() => {
    i18n.changeLanguage(appState.language)
  }, [appState.language, i18n])

  return (
    <DashboardProvider appState={appState}>
      <HashRouter>
        <ApiProvider>
          <SiteProvider>
            <ConfigurationProvider>
              <DateTimeProvider>
                <Routes>
                  <Route path="/" element={<Navigate to="/products" />} />
                  <Route path="products" element={<Outlet />}>
                    <Route index element={<ProductsList />} />
                    <Route path=":id" element={<ProductAddEdit />} />
                    <Route path="add" element={<ProductAddEdit />} />
                    <Route path="*" element={<div>Not Found</div>} />
                  </Route>
                </Routes>
              </DateTimeProvider>
            </ConfigurationProvider>
          </SiteProvider>
        </ApiProvider>
      </HashRouter>
    </DashboardProvider>
  )
}

export default RemoteComponent
