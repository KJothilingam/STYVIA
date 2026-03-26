import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * Catches render errors so a single bad component does not leave a blank white screen.
 */
export class RootErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App render error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-6 text-center">
          <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            The app hit a runtime error. Try a hard refresh. If you were signed in, clearing site data for this origin
            can fix a bad saved session.
          </p>
          <pre className="max-w-full overflow-auto rounded-lg border bg-muted p-3 text-left text-xs text-destructive">
            {this.state.error.message}
          </pre>
          <button
            type="button"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
