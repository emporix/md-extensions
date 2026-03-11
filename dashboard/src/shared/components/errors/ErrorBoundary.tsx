import { Component, type ReactNode, type ErrorInfo } from 'react'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { getT } from '../../i18n/i18n'
import styles from './ErrorBoundary.module.scss'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  onGoHome?: () => void
  language?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error, errorInfo)
    }
    this.setState({ errorInfo })
    this.props.onError?.(error, errorInfo)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      const { error, errorInfo } = this.state
      const t = getT(this.props.language ?? 'en')
      return (
        <div className={styles.root}>
          <Card className={styles.card}>
            <div className={styles.icon}>
              <i className="pi pi-exclamation-triangle" />
            </div>
            <h2 className={styles.title}>{t('errorBoundary.title')}</h2>
            <p className={styles.message}>
              {error?.message ?? t('errorBoundary.unexpected')}
            </p>
            {import.meta.env.DEV && errorInfo && (
              <details className={styles.details}>
                <summary>{t('errorBoundary.details')}</summary>
                <pre className={styles.stack}>
                  {error?.stack}
                  {`\n\n${t('errorBoundary.componentStack')}`}
                  {errorInfo.componentStack}
                </pre>
              </details>
            )}
            <div className={styles.actions}>
              <Button
                label={t('errorBoundary.tryAgain')}
                icon="pi pi-refresh"
                onClick={this.handleReset}
                className="p-button-primary"
              />
              {this.props.onGoHome && (
                <Button
                  label={t('errorBoundary.goHome')}
                  icon="pi pi-home"
                  onClick={this.props.onGoHome}
                  className="p-button-secondary"
                />
              )}
            </div>
          </Card>
        </div>
      )
    }
    return this.props.children
  }
}
