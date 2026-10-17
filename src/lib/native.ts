/**
 * Telefon/tablet uygulaması (iOS + Android) için kabuk işleri.
 *
 * Web'de her şey sessizce boş geçer; tek bir `isNative` kontrolüyle aynı kod hem tarayıcıda
 * hem mağaza uygulamasında çalışır. Burada yapılanlar: durum çubuğu rengi, açılış görselini
 * kapatma, Android donanım geri tuşu, klavye yüksekliği ve dokunma titreşimi.
 */
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Keyboard } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

export const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';
export const isNative = Capacitor.isNativePlatform();
export const isIOS = platform === 'ios';
export const isAndroid = platform === 'android';

/** Hata yutucu: eklenti yoksa ya da cihaz desteklemiyorsa uygulama akışı bozulmasın. */
const quiet = (p: unknown) => void Promise.resolve(p).catch(() => undefined);

/** Kısa dokunma titreşimi. Çocuk, doğru/yanlışı elinde de hisseder. */
export const haptics = {
  light: () => isNative && quiet(Haptics.impact({ style: ImpactStyle.Light })),
  medium: () => isNative && quiet(Haptics.impact({ style: ImpactStyle.Medium })),
  success: () => isNative && quiet(Haptics.notification({ type: NotificationType.Success })),
  warning: () => isNative && quiet(Haptics.notification({ type: NotificationType.Warning })),
};

let started = false;

/** Uygulama açılışında bir kez çağrılır (src/main.tsx). */
export function initNative() {
  // CSS'in platforma göre ince ayar yapabilmesi için: html[data-platform="ios"]
  document.documentElement.dataset.platform = platform;
  if (!isNative || started) return;
  started = true;

  // Durum çubuğu: açık nane zemin → koyu saat/simgeler (Capacitor'da Style.Light bu demek).
  // Android'de bu işi capacitor.config.ts'teki SystemBars ayarı yapar; buradan karışmıyoruz
  // (Android 15+ uçtan uca çizimi zorunlu kıldığı için eski StatusBar çağrıları etkisiz).
  if (isIOS) quiet(StatusBar.setStyle({ style: Style.Light }));

  // Klavye yüksekliği CSS değişkenine yazılır; isim yazarken altta kalan alan telafi edilebilir.
  const setKb = (h: number) => {
    document.documentElement.style.setProperty('--kb-h', `${Math.round(h)}px`);
    document.documentElement.classList.toggle('kb-open', h > 0);
  };
  quiet(Keyboard.addListener('keyboardWillShow', (info) => setKb(info.keyboardHeight)));
  quiet(Keyboard.addListener('keyboardWillHide', () => setKb(0)));

  // Android donanım geri tuşu: sayfa geçmişi varsa geri git, kök ekranda uygulamayı arka plana al
  // (çocuk kazara kapatmasın diye tamamen kapatılmaz).
  quiet(
    CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack && window.location.hash && window.location.hash !== '#/') window.history.back();
      else quiet(CapApp.minimizeApp());
    }),
  );

  // Arayüz boyandıktan sonra açılış görselini kapat (beyaz parlama olmasın).
  const hide = () => quiet(SplashScreen.hide({ fadeOutDuration: 250 }));
  requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(hide, 120)));
}
