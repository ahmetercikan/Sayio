import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json';

// base: './' → GitHub Pages alt yolu ve ileride Capacitor ile aynı build çalışır (Çizio ile aynı düzen).
export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Sayio — Matematiği Kolay Yoldan Öğren',
        short_name: 'Sayio',
        description: '4-14 yaş için dört işlemin kolay yolları, çubuk modeliyle problem çözme',
        lang: 'tr',
        theme_color: '#ff6b4a',
        background_color: '#cfeee6',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        scope: './',
        icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
    }),
  ],
  test: { environment: 'node', exclude: ['**/node_modules/**', '**/dist/**'] },
});
