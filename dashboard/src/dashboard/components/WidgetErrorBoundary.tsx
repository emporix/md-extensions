import { Component, type ReactNode, type ErrorInfo } from 'react'
import styles from './WidgetErrorBoundary.module.scss'

type WidgetErrorBoundaryProps = {
  widgetId: string
  children: ReactNode
}

type WidgetErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

export class WidgetErrorBoundary extends Component<
  WidgetErrorBoundaryProps,
  WidgetErrorBoundaryState
> {
  constructor(props: WidgetErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(
    error: Error
  ): Partial<WidgetErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error(`Widget "${this.props.widgetId}" crashed:`, error, info)
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className={styles.root} role="alert">
          <i className={`pi pi-exclamation-triangle ${styles.icon}`} />
          <p className={styles.message}>This widget encountered an error.</p>
          <button
            type="button"
            className={styles.retryBtn}
            onClick={this.handleRetry}
          >
            <i className="pi pi-refresh" /> Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
