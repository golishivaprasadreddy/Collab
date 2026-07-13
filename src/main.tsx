import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Register push notification service worker
if ("serviceWorker" in navigator) {
  const isInIframe = (() => {
    try { return window.self !== window.top; } catch { return true; }
  })();
  const isPreviewHost =
    window.location.hostname.includes("id-preview--");

  if (!isPreviewHost && !isInIframe) {
    navigator.serviceWorker.register("/push-sw.js").catch((err) => {
      console.log("Push SW registration failed:", err);
    });
  }
}

// Global error logging — surface anything the React tree misses
window.addEventListener("error", (e) => {
  console.error("[GlobalError]", e.message, e.error?.stack);
});
window.addEventListener("unhandledrejection", (e) => {
  console.error("[UnhandledRejection]", e.reason);
});

// Render with error boundary so we never get a white screen
const root = createRoot(document.getElementById("root")!);
try {
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
} catch (err) {
  console.error("[FatalRenderError]", err);
  document.getElementById("root")!.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:Inter,system-ui,sans-serif;background:#0F172A;color:#fff;text-align:center;">
      <div>
        <h1 style="font-size:24px;font-weight:700;margin-bottom:12px;">App failed to start</h1>
        <p style="opacity:.8;margin-bottom:16px;">${(err as Error)?.message ?? "Unknown error"}</p>
        <button onclick="caches&&caches.keys().then(k=>k.forEach(x=>caches.delete(x))).finally(()=>location.reload())" style="background:#6C7BFF;color:#fff;border:0;padding:10px 16px;border-radius:8px;font-weight:600;cursor:pointer;">Clear cache & reload</button>
      </div>
    </div>`;
}
