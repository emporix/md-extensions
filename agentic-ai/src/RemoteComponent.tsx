import { AgentsView } from './components/agent'
import AgentDetailPage from './components/agent/AgentDetailPage'
import { ToolsPage, ToolDetailPage } from './components/tool'
import { TokensPage, TokenDetailPage } from './components/token'
import { McpPage, McpDetailPage } from './components/mcp'
import LogsPage from './components/log/LogsPage'
import SessionFlowPage from './components/log/SessionFlowPage'
import LogDetailsPage from './components/log/LogDetailsPage'
import JobDetailsPage from './components/log/JobDetailsPage'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router'
import { AppState } from './types/common'
import { ToastProvider } from './contexts/ToastContext'
import { AppStateProvider } from './contexts/AppStateContext'
import './translations/i18n'
import './styles/agents.css'
import './styles/components/AddAgentDialog.css'
import './styles/components/ToolCard.css'
import './styles/components/InputSwitch.css'
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
    contentLanguage: 'en',
  },
}: RemoteComponentProps) => {
  const { i18n } = useTranslation()
  useEffect(() => {
    const validLanguages = ['en', 'de']
    const language = validLanguages.includes(appState.language)
      ? appState.language
      : 'en'
    i18n.changeLanguage(language)
  }, [appState.language, i18n])

  return (
    <AppStateProvider appState={appState}>
      <ToastProvider>
        <HashRouter>
          <Routes>
            <Route path="/agents" element={<AgentsView />} />
            <Route path="/agents/add" element={<AgentDetailPage />} />
            <Route path="/agents/:agentId/edit" element={<AgentDetailPage />} />
            <Route path="/tools" element={<ToolsPage />} />
            <Route path="/tools/add" element={<ToolDetailPage />} />
            <Route path="/tools/:toolId/edit" element={<ToolDetailPage />} />
            <Route path="/tokens" element={<TokensPage />} />
            <Route path="/tokens/add" element={<TokenDetailPage />} />
            <Route path="/tokens/:tokenId/edit" element={<TokenDetailPage />} />
            <Route path="/mcp" element={<McpPage />} />
            <Route path="/mcp/add" element={<McpDetailPage />} />
            <Route path="/mcp/:mcpServerId/edit" element={<McpDetailPage />} />
            <Route
              path="/logs"
              element={<Navigate to="/logs/requests" replace />}
            />
            <Route path="/logs/requests" element={<LogsPage />} />
            <Route path="/logs/jobs" element={<LogsPage />} />
            <Route path="/logs/sessions" element={<LogsPage />} />
            <Route path="/logs/requests/:logId" element={<LogDetailsPage />} />
            <Route path="/logs/jobs/:jobId" element={<JobDetailsPage />} />
            <Route
              path="/logs/sessions/:sessionId"
              element={<SessionFlowPage />}
            />
            <Route path="/" element={<Navigate to="/agents" replace />} />
          </Routes>
        </HashRouter>
      </ToastProvider>
    </AppStateProvider>
  )
}

export default RemoteComponent
