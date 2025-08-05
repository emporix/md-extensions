import AgentsView from './components/AgentsView'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { AppState } from './types/common'
import { ToastProvider } from './contexts/ToastContext'
import './translations/i18n'
import './styles/agents.css'
import './styles/components/AddAgentDialog.css'
import '/node_modules/primeflex/primeflex.css'
import 'primeicons/primeicons.css'

interface RemoteComponentProps {
  appState?: AppState
}

const RemoteComponent = ({
  appState = {
    tenant: 'default',
    language: 'default',
    token: 'default',
  },
}: RemoteComponentProps) => {
  const { i18n } = useTranslation()
  useEffect(() => {
    const validLanguages = ['en', 'de']
    const language = validLanguages.includes(appState.language) ? appState.language : 'en'
    i18n.changeLanguage(language)
  }, [appState.language, i18n])

  return (
    <ToastProvider>
      <AgentsView appState={appState} />
    </ToastProvider>
  )
}

export default RemoteComponent
