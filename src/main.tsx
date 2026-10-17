import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './styles/theme.css';
import './styles/shell.css';
import './styles/app.css';

// Çevrimdışı çalışma ve "Ana ekrana ekle" için servis çalışanı; yeni sürüm gelince kendini günceller.
registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
