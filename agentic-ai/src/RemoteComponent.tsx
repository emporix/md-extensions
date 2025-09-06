import { AgentsView, ToolsPage, TokensPage, McpPage } from './components'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router'
import { AppState } from './types/common'
import { ToastProvider } from './contexts/ToastContext'
import './translations/i18n'
import './styles/agents.css'
import './styles/components/AddAgentDialog.css'
import './styles/components/ToolCard.css'
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
      <HashRouter>
        <Routes>
          <Route path="/agents" element={<AgentsView appState={appState} />} />
          <Route path="/tools" element={<ToolsPage appState={appState} />} />
          <Route path="/tokens" element={<TokensPage appState={appState} />} />
          <Route path="/mcp" element={<McpPage appState={appState} />} />
          <Route path="/" element={<Navigate to="/agents" replace />} />
        </Routes>
      </HashRouter>
    </ToastProvider>
  )
}

export default RemoteComponent
