import { useEffect, useState } from 'react'
import {
  createHashRouter,
  Navigate,
  Outlet,
  RouterProvider,
  type DataRouter,
  type RouteObject,
} from 'react-router'
import { ToastProvider } from '@emporix/component-library'
import '@emporix/component-library/styles'
import './index.css'
import { useTranslation } from 'react-i18next'
import { useApiCredentials } from './api/bootstrap'
import { AppState } from './models/AppState.model'
import { DEFAULT_APP_CURRENCY } from './constants/currency'
import { DashboardProvider } from './context/Dashboard.context'
import { PermissionsProvider } from './context/PermissionsProvider'
import FeatureTogglesProvider from './context/FeatureTogglesProvider'
import { ConfigurationProvider } from './context/ConfigurationProvider'
import { SitesProvider } from './context/SitesProvider'
import { UIBlockerProvider } from './context/UIBlocker'
import {
  NavigationBlocker,
  NavigationConfirmProvider,
} from './context/NavigationConfirmProvider'
import { ReferenceOptionsProvider } from './context/ReferenceOptionsProvider'
import RemountOnParams from './components/shared/RemountOnParams'
import CompaniesModule from './Companies.module'
import CompaniesListPage from './pages/CompaniesList.page'
import CompanyAddEditPage from './pages/CompanyAddEdit.page'
import LocationAddEditPage from './pages/LocationAddEdit.page'
import ContactAddEditPage from './pages/ContactAddEdit.page'
import CustomerAssignmentAddEditPage from './pages/CustomerAssignmentAddEdit.page'
import './translations/i18n'

/** Root of the remote's routes: the unsaved-changes confirm, then the page. */
const RemoteLayout = () => (
  <>
    <NavigationBlocker />
    <Outlet />
  </>
)

/**
 * Mirrors MD's /apps/management/companies/... routes. A data router (not
 * `<HashRouter>`) so `useBlocker` can stop leaving a form with unsaved changes.
 */
const routes: RouteObject[] = [
  {
    element: <RemoteLayout />,
    children: [
      {
        element: <CompaniesModule />,
        children: [
          { index: true, element: <CompaniesListPage /> },
          { path: 'add', element: <CompanyAddEditPage /> },
          { path: ':companyId', element: <CompanyAddEditPage /> },
          {
            path: ':companyId/locations/:locationId?',
            element: (
              <RemountOnParams>
                <LocationAddEditPage />
              </RemountOnParams>
            ),
          },
          {
            path: ':companyId/assignments/contact/:contactAssignmentId?',
            element: (
              <RemountOnParams>
                <ContactAddEditPage />
              </RemountOnParams>
            ),
          },
          {
            path: ':companyId/assignments/customer/:contactAssignmentId?',
            element: (
              <RemountOnParams>
                <CustomerAssignmentAddEditPage />
              </RemountOnParams>
            ),
          },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
]

/**
 * One router per mount, disposed on unmount so it stops listening to the
 * host's hash changes (and StrictMode's remount gets a fresh one).
 */
const useHashRouter = () => {
  const [router, setRouter] = useState<DataRouter | null>(null)
  useEffect(() => {
    const created = createHashRouter(routes)
    setRouter(created)
    return () => created.dispose()
  }, [])
  return router
}

type RemoteComponentProps = {
  readonly appState?: AppState
}

const defaultAppState: AppState = {
  tenant: 'default',
  language: 'en',
  token: 'default',
  contentLanguage: 'en',
  currency: DEFAULT_APP_CURRENCY,
  user: undefined,
  onError: () => {
    // NOOP
  },
}

const RemoteComponent = ({
  appState = defaultAppState,
}: RemoteComponentProps) => {
  useApiCredentials(appState.tenant, appState.token)
  const router = useHashRouter()

  const { i18n } = useTranslation()
  useEffect(() => {
    i18n.changeLanguage(appState.language)
  }, [appState.language, i18n])

  if (!router) return null

  return (
    <ToastProvider>
      <DashboardProvider appState={appState}>
        <PermissionsProvider>
          <FeatureTogglesProvider>
            <ConfigurationProvider>
              <SitesProvider>
                <ReferenceOptionsProvider>
                  <UIBlockerProvider>
                    <NavigationConfirmProvider>
                      <RouterProvider router={router} />
                    </NavigationConfirmProvider>
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
