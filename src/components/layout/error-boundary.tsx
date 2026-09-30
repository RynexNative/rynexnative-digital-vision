import { Component, type ErrorInfo, type ReactNode } from "react"
import { RefreshCw } from "lucide-react"

type Props = { children: ReactNode; compact?: boolean }
type State = { error: Error | null }

/** Shows a friendly message with a reload button instead of a blank page. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Page crashed:", error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className={this.props.compact ? "py-16 px-4" : "min-h-screen flex items-center justify-center bg-background px-4"}>
        <div className="glass rounded-3xl p-8 max-w-md w-full mx-auto text-center">
          <RefreshCw className="h-10 w-10 text-primary mx-auto mb-4" />
          <h1 className="text-xl font-bold font-poppins mb-2">Ukurasa haukupakia</h1>
          <p className="text-foreground/70 mb-6">
            Huenda kuna toleo jipya la website au internet imekatika. Pakia upya ukurasa kuendelea.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="h-11 px-6 rounded-xl bg-gradient-primary text-white font-semibold inline-flex items-center gap-2 hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" />
            Pakia upya
          </button>
        </div>
      </div>
    )
  }
}
