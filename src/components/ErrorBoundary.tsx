import React from "react";

interface ErrorWindow extends Window {
  __lastAppError?: {
    message: string;
    stack?: string;
    componentStack?: string;
  };
}

interface State {
  error: Error | null;
  info?: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Production logging — visible in browser console & captured by any log forwarder
    console.error("[Collab.io ErrorBoundary]", error, info?.componentStack);
    this.setState({ error, info: info?.componentStack ?? undefined });
    try {
      // Best-effort: also stash for later inspection
      (window as ErrorWindow).__lastAppError = {
        message: error.message,
        stack: error.stack,
        componentStack: info?.componentStack,
      };
    } catch {
      // Ignore storage failures in the error boundary.
    }
  }

  handleReload = () => {
    try {
      // Clear caches that may be serving a stale broken bundle
      if ("caches" in window) {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      }
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((regs) =>
          regs.forEach((r) => r.unregister())
        );
      }
    } catch {
      // Ignore cleanup failures and continue with reload.
    }
    setTimeout(() => window.location.reload(), 200);
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
          background: "#0F172A",
          color: "#fff",
        }}
      >
        <div style={{ maxWidth: 560, width: "100%" }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
            Something went wrong
          </h1>
          <p style={{ opacity: 0.8, marginBottom: 16 }}>
            The app hit an unexpected error. The details below will help us fix it.
          </p>
          <pre
            style={{
              background: "rgba(255,255,255,0.06)",
              padding: 12,
              borderRadius: 8,
              fontSize: 12,
              maxHeight: 240,
              overflow: "auto",
              whiteSpace: "pre-wrap",
            }}
          >
            {this.state.error.message}
            {this.state.error.stack ? `\n\n${this.state.error.stack}` : ""}
            {this.state.info ? `\n\nComponent stack:${this.state.info}` : ""}
          </pre>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button
              onClick={this.handleReload}
              style={{
                background: "#6C7BFF",
                color: "#fff",
                border: 0,
                padding: "10px 16px",
                borderRadius: 8,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Clear cache & reload
            </button>
            <a
              href="/"
              style={{
                background: "transparent",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.2)",
                padding: "10px 16px",
                borderRadius: 8,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Go home
            </a>
          </div>
        </div>
      </div>
    );
  }
}
