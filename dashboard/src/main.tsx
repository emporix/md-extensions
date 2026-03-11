import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.scss'
import App from './App.tsx'
import { ErrorBoundary } from './shared/components/errors/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="dashboard-app">
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </div>
  </StrictMode>
)
