import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="app-shell flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div
              className="rounded-2xl p-6 text-center"
              style={{ backgroundColor: 'var(--app-secondary)' }}
            >
              <div className="mb-4 text-4xl">😵</div>
              <h2 className="mb-2 text-lg font-bold">Что-то пошло не так</h2>
              <p className="mb-6 text-sm opacity-70">
                Произошла неожиданная ошибка. Попробуйте перезагрузить приложение.
              </p>
              
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={this.handleReload}
                  className="w-full rounded-2xl py-3 text-sm font-semibold transition-opacity active:opacity-80"
                  style={{
                    backgroundColor: 'var(--app-accent)',
                    color: 'var(--app-accent-text)',
                  }}
                >
                  Перезагрузить приложение
                </button>
                
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="w-full rounded-2xl py-3 text-sm font-semibold transition-opacity active:opacity-80"
                  style={{
                    backgroundColor: 'var(--app-secondary)',
                    color: 'var(--app-text)',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  Попробовать снова
                </button>
              </div>

              {import.meta.env.DEV && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-xs opacity-50">
                    Детали ошибки (только в режиме разработки)
                  </summary>
                  <div className="mt-2 rounded bg-red-900/20 p-2 text-xs">
                    <div className="font-mono text-red-400">
                      {this.state.error.toString()}
                    </div>
                    {this.state.errorInfo?.componentStack && (
                      <div className="mt-2 font-mono text-red-300 opacity-70">
                        {this.state.errorInfo.componentStack}
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components
import { useState, useEffect } from 'react'
import type { ReactElement } from 'react'

interface ErrorBoundaryHookProps {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactElement
}

export function ErrorBoundaryHook({ children, fallback }: ErrorBoundaryHookProps) {
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setError(new Error(event.message))
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setError(new Error(event.reason))
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  const reset = () => setError(null)

  if (error) {
    if (fallback) {
      return fallback(error, reset)
    }

    return (
      <div className="app-shell flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div
            className="rounded-2xl p-6 text-center"
            style={{ backgroundColor: 'var(--app-secondary)' }}
          >
            <div className="mb-4 text-4xl">⚠️</div>
            <h2 className="mb-2 text-lg font-bold">Произошла ошибка</h2>
            <p className="mb-6 text-sm opacity-70">
              {error.message || 'Неизвестная ошибка'}
            </p>
            
            <button
              type="button"
              onClick={reset}
              className="w-full rounded-2xl py-3 text-sm font-semibold transition-opacity active:opacity-80"
              style={{
                backgroundColor: 'var(--app-accent)',
                color: 'var(--app-accent-text)',
              }}
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}