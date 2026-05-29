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
    <ToastProvider>
      <HashRouter>
        <Routes>
          <Route path="/agents" element={<AgentsView appState={appState} />} />
          <Route
            path="/agents/add"
            element={<AgentDetailPage appState={appState} />}
          />
          <Route
            path="/agents/:agentId/edit"
            element={<AgentDetailPage appState={appState} />}
          />
          <Route path="/tools" element={<ToolsPage appState={appState} />} />
          <Route
            path="/tools/add"
            element={<ToolDetailPage appState={appState} />}
          />
          <Route
            path="/tools/:toolId/edit"
            element={<ToolDetailPage appState={appState} />}
          />
          <Route path="/tokens" element={<TokensPage appState={appState} />} />
          <Route
            path="/tokens/add"
            element={<TokenDetailPage appState={appState} />}
          />
          <Route
            path="/tokens/:tokenId/edit"
            element={<TokenDetailPage appState={appState} />}
          />
          <Route path="/mcp" element={<McpPage appState={appState} />} />
          <Route
            path="/mcp/add"
            element={<McpDetailPage appState={appState} />}
          />
          <Route
            path="/mcp/:mcpServerId/edit"
            element={<McpDetailPage appState={appState} />}
          />
          <Route
            path="/logs"
            element={<Navigate to="/logs/requests" replace />}
          />
          <Route
            path="/logs/requests"
            element={<LogsPage appState={appState} />}
          />
          <Route path="/logs/jobs" element={<LogsPage appState={appState} />} />
          <Route
            path="/logs/sessions"
            element={<LogsPage appState={appState} />}
          />
          <Route
            path="/logs/requests/:logId"
            element={<LogDetailsPage appState={appState} />}
          />
          <Route
            path="/logs/jobs/:jobId"
            element={<JobDetailsPage appState={appState} />}
          />
          <Route
            path="/logs/sessions/:sessionId"
            element={<SessionFlowPage appState={appState} />}
          />
          <Route path="/" element={<Navigate to="/agents" replace />} />
        </Routes>
      </HashRouter>
    </ToastProvider>
  )
}

export default RemoteComponent
