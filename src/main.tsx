import { StrictMode, Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      return (
        <div style={{ fontFamily: "monospace", padding: 24, background: "#faf4ec", color: "#2a1e16", minHeight: "100vh" }}>
          <h2 style={{ color: "#f87171" }}>⚠ App Error</h2>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, color: "#fca5a5" }}>{err.message}</pre>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 11, color: "#6b7280" }}>{err.stack}</pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: "8px 20px", background: "#c2410c", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

// Register the service worker for offline / installable PWA support.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => { /* best-effort */ });
  });
}
