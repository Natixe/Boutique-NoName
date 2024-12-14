import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ShopContextProvider from './Context/ShopContext';
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.REACT_APP_SENTRY_DSN, // Ajoutez votre DSN Sentry dans les variables d'environnement
  integrations: [
    // If you use a bundle with tracing enabled, add the BrowserTracing integration
    Sentry.browserTracingIntegration(),
    // If you use a bundle with session replay enabled, add the Replay integration
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0, // Ajustez selon vos besoins
  tracePropagationTargets: ["localhost", /^http:\/\/freepbyh\.com\/api/],
});

// Polyfill pour la génération de UUID
if (!crypto.randomUUID) {
  crypto.randomUUID = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<p>Une erreur est survenue.</p>}>
      <ShopContextProvider>
        <App />
      </ShopContextProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>
)
