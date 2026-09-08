import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

async function clearAllLocalState(): Promise<void> {
  try {
    localStorage.clear();
    sessionStorage.clear();
    if (indexedDB.databases) {
      const dbs = await indexedDB.databases();
      await Promise.all(
        dbs
          .filter((d) => d.name)
          .map(
            (d) =>
              new Promise<void>((resolve) => {
                const req = indexedDB.deleteDatabase(d.name!);
                req.onsuccess = () => resolve();
                req.onerror = () => resolve();
                req.onblocked = () => resolve();
              }),
          ),
      );
    }
  } catch {
    // best effort — still reload even if clearing fails
  }
}

/**
 * Last-resort fallback for render-time crashes — e.g. corrupted local Firebase Auth
 * state from an interrupted sign-in leaving the app unable to render at all. Uses
 * inline styles deliberately so this doesn't depend on Tailwind/app CSS having
 * loaded correctly.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('Unhandled render error', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            textAlign: 'center',
            fontFamily: 'sans-serif',
            background: '#F0F6FF',
            color: '#0D1B2A',
          }}
        >
          <p style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Something went wrong</p>
          <p style={{ color: '#6B7C93', marginBottom: 20, maxWidth: 320 }}>
            This can happen after an interrupted sign-in leaves stale data in your browser.
            Clearing this site's local data usually fixes it.
          </p>
          <button
            onClick={async () => {
              await clearAllLocalState();
              window.location.reload();
            }}
            style={{
              background: '#1B3A6B',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              padding: '10px 20px',
              fontSize: 16,
              fontWeight: 500,
            }}
          >
            Clear data & reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
