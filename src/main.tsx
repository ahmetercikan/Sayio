import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { initNative, isNative } from './lib/native';
import { loadVoices } from './lib/voice';
import './styles/theme.css';
import './styles/shell.css';
import './styles/app.css';
import './styles/tablet.css';

// Telefon/tablet uygulamasında kabuk ayarları (durum çubuğu, açılış görseli, geri tuşu…).
initNative();

// Doğal ses parçalarının listesi (ilk cümleden önce hazır olsun).
void loadVoices();

// Çevrimdışı çalışma ve "Ana ekrana ekle" için servis çalışanı; yeni sürüm gelince kendini günceller.
// Mağaza uygulamasında dosyalar zaten cihazda olduğu için servis çalışanı gerekmez.
if (!isNative) registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
