import { AppState } from './shared/models/AppState.model'
import { DashboardPage } from './dashboard'
import { ErrorBoundary } from './shared/components/errors/ErrorBoundary'
import '/node_modules/primeflex/primeflex.css'
import 'primeicons/primeicons.css'

interface RemoteComponentProps {
  appState?: AppState
}

const RemoteComponent = ({
  appState: incomingAppState,
}: RemoteComponentProps) => {
  const hasCriticalProps = incomingAppState?.tenant && incomingAppState?.token
  const appState: AppState = {
    tenant: incomingAppState?.tenant ?? '',
    language: incomingAppState?.language ?? 'en',
    token: incomingAppState?.token ?? '',
    currency: incomingAppState?.currency ?? {
      id: 'EUR',
      label: 'EUR',
      default: true,
      required: false,
    },
    contentLanguage: incomingAppState?.contentLanguage ?? 'en',
    user: incomingAppState?.user ?? {
      userId: '',
      termsAndConditions: true,
    },
    permissions: incomingAppState?.permissions,
  }

  if (!hasCriticalProps) {
    return (
      <div className="dashboard-app">
        <ErrorBoundary language={appState.language}>
          <p>Missing required configuration (tenant or token).</p>
        </ErrorBoundary>
      </div>
    )
  }

  return (
    <div className="dashboard-app">
      <ErrorBoundary language={appState.language}>
        <DashboardPage appState={appState} />
      </ErrorBoundary>
    </div>
  )
}

export default RemoteComponent
