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
import { ConfigurationProvider } from './context/ConfigurationProvider'
import { SitesProvider } from './context/SitesProvider'
import { UIBlockerProvider } from './context/UIBlcoker'
import UsersAndGroupsModule from './UsersAndGroups.module'
import GroupPage from './pages/Group.page'
import UserPage from './pages/User.page'
import UsersAndGroupsPage from './pages/UsersAndGroups.page'
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
                    <Route element={<UsersAndGroupsModule />}>
                      <Route index element={<UsersAndGroupsPage />} />
                      <Route path="users/add" element={<UserPage />} />
                      <Route path="users/:userId" element={<UserPage />} />
                      <Route
                        path="groups/add"
                        element={
                          <GroupDataProvider>
                            <GroupPage />
                          </GroupDataProvider>
                        }
                      />
                      <Route
                        path="groups/:groupId"
                        element={
                          <GroupDataProvider>
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
        </PermissionsProvider>
      </DashboardProvider>
    </ToastProvider>
  )
}

export default RemoteComponent
