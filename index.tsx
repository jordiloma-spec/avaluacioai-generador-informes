import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ToastProvider from './src/components/ToastProvider'; // Importa el ToastProvider

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ToastProvider /> {/* Afegeix el ToastProvider aquí */}
    <App />
  </React.StrictMode>
);