/**
 * Sayio'nun sesi: tarayıcının Türkçe konuşma sentezi (Web Speech API).
 * Okuma bilmeyen minikler için yönergeler sesli okunur. Doğal sesler (Edge "Natural", Google, Apple Yelda…) önce.
 */
let voices: SpeechSynthesisVoice[] = [];
const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
const PREFERRED = [/natural/i, /google/i, /yelda/i, /emel/i, /filiz/i, /seda/i];

function load() {
  if (!supported) return;
  voices = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith('tr'));
}
if (supported) {
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
  if (!supported || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(readable(text));
  u.lang = 'tr-TR';
  const v = pickVoice();
  if (v) u.voice = v;
  u.rate = (opts.rate ?? 1) * 0.95;
  u.pitch = 1.1;
  speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (supported) speechSynthesis.cancel();
}

/** iOS: konuşma ancak bir dokunuştan sonra başlayabilir; ilk dokunuşta boş bir cümleyle kilidi aç. */
export function unlockAudio() {
  if (!supported) return;
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    speechSynthesis.speak(u);
  } catch {
    /* yok say */
  }
}
