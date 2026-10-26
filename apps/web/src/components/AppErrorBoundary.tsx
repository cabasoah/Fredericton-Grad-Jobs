import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

// Last line of defence for render errors outside the router's own
// errorElements (e.g. in providers). Plain markup only: it must work even
// if the router or other context is what broke.
class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled error", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main role="alert" className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-indigo-50">
        <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
        <p className="text-lg mb-6 text-gray-700">
          The page hit an unexpected error. Reloading usually fixes it.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md"
          >
            Reload page
          </button>
          <a href="/" className="text-indigo-700 underline py-2 px-4">Go to the home page</a>
        </div>
      </main>
    );
  }
}

export default AppErrorBoundary;
