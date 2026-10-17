/**
 * Sayio'nun sesi: okuma bilmeyen minikler için yönergeler sesli okunur.
 *
 * Üç kademe var, dışarıya tek bir `speak()` olarak çıkar:
 *  1. **Doğal ses (asıl yol):** `public/voice/` içindeki önceden üretilmiş insan benzeri kayıtlar
 *     parça parça birleştirilerek çalınır (src/lib/voice.ts). Çocuğun duyduğu ses budur.
 *  2. **Uygulama yedeği:** parça eksikse cihazın kendi konuşma motoru (Capacitor TextToSpeech).
 *     Android WebView'de `speechSynthesis` hiç yoktur; bu yüzden native motor şart.
 *  3. **Tarayıcı yedeği:** Web Speech API (Edge "Natural", Google, Apple Yelda… doğal sesler önce).
 */
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { isNative } from './native';
import { loadVoices, naturalVoiceReady, speakNatural, stopNatural, unlockVoice } from './voice';

let voices: SpeechSynthesisVoice[] = [];
const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
const PREFERRED = [/natural/i, /google/i, /yelda/i, /emel/i, /filiz/i, /seda/i];

function load() {
  if (!supported) return;
  voices = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith('tr'));
}
if (supported && !isNative) {
  load();
  speechSynthesis.addEventListener?.('voiceschanged', load);
}

function pickVoice() {
  if (!voices.length) load();
  for (const re of PREFERRED) {
    const v = voices.find((x) => re.test(x.name));
    if (v) return v;
  }
  return voices[0];
}

/* ---------------------------------------------------------------- native */

/** Cihazda Türkçe ses var mı? (Android'de Türkçe ses verisi kurulu olmayabilir.) */
let trLang: string | null = null;
let nativeChecked = false;

const quiet = <T>(p: Promise<T>) => p.catch(() => undefined);

async function nativeInit() {
  if (nativeChecked) return trLang;
  nativeChecked = true;
  try {
    const { languages } = await TextToSpeech.getSupportedLanguages();
    trLang = languages.find((l) => l.toLowerCase().replace('_', '-').startsWith('tr')) ?? null;
  } catch {
    trLang = null;
  }
  return trLang;
}

/** Türkçe konuşma bu cihazda çalışıyor mu? Ebeveyn bölümünde uyarı göstermek için. */
export async function narrationAvailable() {
  if (naturalVoiceReady()) return true;
  if (isNative) return (await nativeInit()) !== null;
  if (!voices.length) load();
  return supported && voices.length > 0;
}

/** Android: eksik Türkçe ses verisini kurmak için sistem ekranını açar. */
export async function openVoiceInstall() {
  if (!isNative) return false;
  try {
    await TextToSpeech.openInstall();
    nativeChecked = false; // kurulumdan sonra yeniden bak
    return true;
  } catch {
    return false;
  }
}

/* ---------------------------------------------------------------- ortak */

/** Matematik işaretlerini okunur hale getirir: "8 + 5 = ?" → "8 artı 5 eşittir kaç". */
export function readable(t: string) {
  return t
    .replace(/\s*\+\s*/g, ' artı ')
    .replace(/\s*[−-]\s*(?=\d|\()/g, ' eksi ')
    .replace(/\s*×\s*/g, ' çarpı ')
    .replace(/\s*÷\s*/g, ' bölü ')
    .replace(/\s*=\s*\?/g, ' eşittir kaç')
    .replace(/\s*=\s*/g, ' eşittir ')
    .replace(/%(\d+)/g, 'yüzde $1')
    .replace(/(\d+)\/(\d+)/g, '$2 de $1')
    .replace(/\?/g, ' kaç ');
}

export function speak(text: string, opts: { rate?: number } = {}) {
  if (!text) return;
  const said = readable(text);
  // Kayıtlar zaten doğru tempoda; makine sesi biraz yavaşlatılınca daha anlaşılır oluyor.
  const wanted = Math.min(1.5, Math.max(0.6, opts.rate ?? 1));

  // 1) Doğal ses: parçaları varsa cümleyi o okur.
  if (naturalVoiceReady()) {
    stopSpeaking();
    void speakNatural(said, wanted).then((ok) => ok || fallbackSpeak(said, wanted * 0.95));
    return;
  }
  fallbackSpeak(said, wanted * 0.95);
}

/** Doğal ses yoksa: cihazın / tarayıcının kendi konuşma motoru. */
function fallbackSpeak(said: string, rate: number) {
  if (isNative) {
    void (async () => {
      const lang = await nativeInit();
      if (!lang) return;
      await quiet(TextToSpeech.stop());
      await quiet(
        TextToSpeech.speak({
          text: said,
          lang,
          rate,
          pitch: 1.1,
          volume: 1,
          // Sessize alınmış cihazda da duyulsun: anlatım uygulamanın özü.
          category: 'playback',
        }),
      );
    })();
    return;
  }
  if (!supported) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(said);
  u.lang = 'tr-TR';
  const v = pickVoice();
  if (v) u.voice = v;
  u.rate = rate;
  u.pitch = 1.1;
  speechSynthesis.speak(u);
}

export function stopSpeaking() {
  stopNatural();
  if (isNative) void quiet(TextToSpeech.stop());
  else if (supported) speechSynthesis.cancel();
}

/** iOS tarayıcıda konuşma ancak bir dokunuştan sonra başlayabilir; ilk dokunuşta kilidi aç. */
export function unlockAudio() {
  unlockVoice();
  void loadVoices();
  if (isNative) {
    void nativeInit();
    return;
  }
  if (!supported) return;
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    speechSynthesis.speak(u);
  } catch {
    /* yok say */
  }
}
