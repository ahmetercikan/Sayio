import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';
import { Style as StatusBarStyle } from '@capacitor/status-bar';

/**
 * Sayio'nun telefon ve tablet uygulaması (iOS + Android) Capacitor ile paketlenir.
 * Web sürümüyle aynı `dist/` çıktısı kullanılır; `npm run build` sonrası `npx cap sync`.
 *
 * appId mağazadaki kimliktir; ilk yayından sonra DEĞİŞTİRİLEMEZ.
 */
const config: CapacitorConfig = {
  appId: 'com.ahmetercikan.sayio',
  appName: 'Sayio',
  webDir: 'dist',
  // Uygulama kabuğu kendi kaydırmasını yönetir; tarayıcı yakınlaştırması kapalı (çocuk dostu).
  zoomEnabled: false,
  backgroundColor: '#cfeee6',
  ios: {
    // Sayfanın tamamı sabit; kaydırma `.app__main` içinde olur → WebView'in kendi "zıplaması" kapalı.
    scrollEnabled: false,
    contentInset: 'never',
    // Tablette de telefon düzeni (tek kolon, büyük dokunma alanları) korunur.
    preferredContentMode: 'mobile',
    limitsNavigationsToAppBoundDomains: true,
    backgroundColor: '#cfeee6',
  },
  android: {
    backgroundColor: '#cfeee6',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      // Açılış görseli, uygulama hazır olduğunda koddan kapatılır (bkz. src/lib/native.ts).
      launchAutoHide: false,
      backgroundColor: '#cfeee6',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: false,
      splashImmersive: false,
    },
    Keyboard: {
      // iOS: klavye açılınca gövde küçülür → 100dvh düzen bozulmaz, isim alanı görünür kalır.
      // (Android'de aynı işi AndroidManifest'teki windowSoftInputMode=adjustResize yapar.)
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true,
    },
    StatusBar: {
      // iOS: zemin açık nane yeşili → saat ve simgeler koyu olmalı
      // (Capacitor'da Style.Light "açık zemin için koyu yazı" demek).
      style: StatusBarStyle.Light,
    },
    // Android: sistem çubukları Capacitor 8'in yerleşik SystemBars eklentisiyle yönetilir.
    // `insetsHandling: 'css'` güvenli alanları `--safe-area-inset-*` değişkenlerine yazar
    // (src/styles/theme.css bunları okur); `style: 'LIGHT'` saat ve simgeleri koyu yapar.
    SystemBars: {
      style: 'LIGHT',
      insetsHandling: 'css',
      initialViewportFitValueHint: 'cover',
    },
  },
};

export default config;
