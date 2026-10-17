/**
 * Doğal ses çalma katmanı.
 *
 * `public/voice/` içindeki önceden üretilmiş parçaları (bkz. scripts/voice/) cümleye göre
 * arka arkaya çalar. Parçaların başındaki/sonundaki sessizlik kırpıldığı ve parçalar Web Audio ile
 * saniyesi saniyesine zamanlandığı için cümle tek parça gibi akar.
 *
 * Bir parça eksikse hiç çalmaz, `false` döner; o cümleyi cihazın kendi sesi okur (src/lib/speech.ts).
 */
import { clipKey, splitForVoice } from './voiceText';

type Clip = { buffer: AudioBuffer; from: number; to: number };

let manifest: { ext: string; keys: Set<string> } | null = null;
let loading: Promise<void> | null = null;
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let playing: AudioBufferSourceNode[] = [];
/** Her yeni istek bunu artırır; parçalar yüklenirken yeni bir cümle gelirse eskisi iptal olur. */
let turn = 0;
const cache = new Map<string, Clip>();
const inflight = new Map<string, Promise<Clip | null>>();
/** Bellek sınırı: en eski parçalar atılır (hepsi ~2.500 tane, hepsini tutmaya gerek yok). */
const MAX_CACHE = 400;

const url = (file: string) => new URL(`voice/${file}`, document.baseURI).toString();

/** Manifestoyu bir kez yükler; dosya yoksa doğal ses kapalı kalır. */
export function loadVoices() {
  if (loading) return loading;
  loading = (async () => {
    try {
      // Manifesto sesler yeniden üretilince değişir → tarayıcı önbelleğine körü körüne güvenme.
      const r = await fetch(url('manifest.json'));
      if (!r.ok) throw new Error(String(r.status));
      const j = (await r.json()) as { ext: string; keys: string[] };
      manifest = { ext: j.ext || 'm4a', keys: new Set(j.keys) };
    } catch {
      manifest = null;
    }
  })();
  return loading;
}

/** Doğal ses dosyaları yüklü mü? (Ebeveyn bölümünde gösterilir.) */
export const naturalVoiceReady = () => !!manifest && manifest.keys.size > 0;

function audio() {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 1;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** iOS: ses ancak bir dokunuştan sonra çalabilir. */
export function unlockVoice() {
  try {
    audio();
  } catch {
    /* yok say */
  }
}

/** Parçanın başındaki ve sonundaki sessizliği bulur — parçalar bitişik çalsın diye. */
function trim(buffer: AudioBuffer): Clip {
  const d = buffer.getChannelData(0);
  const sr = buffer.sampleRate;
  const th = 0.004;
  let s = 0;
  let e = d.length - 1;
  while (s < d.length && Math.abs(d[s]) < th) s++;
  while (e > s && Math.abs(d[e]) < th) e--;
  if (s >= e) return { buffer, from: 0, to: buffer.duration };
  // Sesin ilk hecesi kesilmesin diye önden küçük, arkadan biraz daha geniş pay bırak.
  return { buffer, from: Math.max(0, (s - sr * 0.012) / sr), to: Math.min(buffer.duration, (e + sr * 0.03) / sr) };
}

async function clipFor(key: string): Promise<Clip | null> {
  const hit = cache.get(key);
  if (hit) return hit;
  const pending = inflight.get(key);
  if (pending) return pending;
  const job = (async () => {
    try {
      const r = await fetch(url(`${key}.${manifest!.ext}`), { cache: 'force-cache' });
      if (!r.ok) return null;
      const clip = trim(await audio().decodeAudioData(await r.arrayBuffer()));
      if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value!);
      cache.set(key, clip);
      return clip;
    } catch {
      return null;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, job);
  return job;
}

/** Bu cümlenin bütün parçaları elimizde var mı? */
export function hasNaturalVoice(text: string) {
  if (!naturalVoiceReady()) return false;
  const said = splitForVoice(text).filter((t): t is { say: string } => 'say' in t);
  const missing = said.filter((t) => !manifest!.keys.has(clipKey(t.say)));
  if (import.meta.env.DEV && missing.length)
    // Geliştirirken görün: bu parçalar üretilmemiş → cümle cihaz sesine düşüyor.
    console.warn('[ses] eksik parça:', missing.map((m) => m.say), '→ npm run ses:topla && npm run ses:uret');
  return said.length > 0 && missing.length === 0;
}

/** Çalmakta olan parçaları susturur. */
function stopSources() {
  for (const s of playing) {
    try {
      s.stop();
    } catch {
      /* zaten bitmiş */
    }
  }
  playing = [];
}

export function stopNatural() {
  turn++;
  stopSources();
}

/**
 * Cümleyi doğal sesle okur. Parçalar hazırlanamazsa `false` döner ve hiç ses çıkmaz —
 * çağıran taraf cihazın kendi sesine düşer.
 *
 * `rate` ebeveyn ayarındaki konuşma hızı (0.7-1.3). Kayıttan oynatma hızını doğrudan değiştirmek
 * sesin perdesini de bozar (ciyaklama / kalınlaşma); bu yüzden hızın bir kısmı oynatmaya,
 * kalanı parçalar arasındaki boşluklara yansıtılır.
 */
export async function speakNatural(text: string, rate = 1): Promise<boolean> {
  const speed = 1 + (rate - 1) * 0.55;
  const gap = 0.03 / rate;
  if (!hasNaturalVoice(text)) return false;
  const mine = ++turn;
  const tokens = splitForVoice(text);
  const keys = tokens.map((t) => ('say' in t ? clipKey(t.say) : null));
  const clips = await Promise.all(keys.map((k) => (k ? clipFor(k) : Promise.resolve(null))));
  // Parçalar yüklenirken başka bir cümle istendiyse bu cümleyi çalma.
  if (mine !== turn) return true;
  if (keys.some((k, i) => k && !clips[i])) return false;

  stopSources();
  const a = audio();
  let at = a.currentTime + 0.05;
  tokens.forEach((t, i) => {
    if ('pause' in t) {
      at += t.pause / 1000 / rate;
      return;
    }
    const clip = clips[i]!;
    const src = a.createBufferSource();
    src.buffer = clip.buffer;
    src.playbackRate.value = speed;
    src.connect(master!);
    src.start(at, clip.from, clip.to - clip.from);
    playing.push(src);
    // Parçalar arasında nefes payı: konuşma makine gibi yapışık olmasın.
    at += (clip.to - clip.from) / speed + gap;
  });
  return true;
}
