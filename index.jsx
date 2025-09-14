
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

const rootElement = document.getElementById('root');

try {
  if (!rootElement) {
    throw new Error("Root-Element konnte nicht gefunden werden.");
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("Fehler beim Initialisieren der App:", error);
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="text-align: center; padding: 20px; font-family: sans-serif; color: #f87171; margin: auto;">
        <h1 style="font-size: 1.5rem; margin-bottom: 1rem;">Ein Fehler ist aufgetreten</h1>
        <p>Die App konnte nicht geladen werden. Bitte versuchen Sie es später erneut oder verwenden Sie einen anderen Browser.</p>
        <p style="font-size: 0.8em; color: #94a3b8; margin-top: 20px; word-break: break-all;">
          Details: ${error instanceof Error ? error.message : String(error)}
        </p>
      </div>
    `;
  }
}