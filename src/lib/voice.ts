/**
 * Doğal ses çalma katmanı.
 *
 * Her cümlenin **tamamı** önceden tek parça seslendirilip `public/voice/` içine gömülür; burada
 * yapılan iş o dosyayı bulup çalmaktır. Parçalayıp birleştirmeyi denedik ve olmadı: her parça ayrı
 * bir konuşma olarak üretildiği için araya ne kadar es koyarsan koy cümle "cümle gibi" duyulmuyor
 * (bkz. docs/ses.md). Bu yüzden kapsanan cümleler tam, kapsanmayanlar cihazın kendi sesiyle okunur.
 */
import { clipKey } from './voiceText';

let manifest: { ext: string; keys: Set<string> } | null = null;
let loading: Promise<void> | null = null;
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let playing: AudioBufferSourceNode | null = null;
/** Her yeni istek bunu artırır; dosya yüklenirken yeni cümle gelirse eskisi iptal olur. */
let turn = 0;
const cache = new Map<string, AudioBuffer>();
const inflight = new Map<string, Promise<AudioBuffer | null>>();
/** Bellek sınırı: en eski cümleler atılır. */
const MAX_CACHE = 120;

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

async function bufferFor(key: string): Promise<AudioBuffer | null> {
  const hit = cache.get(key);
  if (hit) return hit;
  const pending = inflight.get(key);
  if (pending) return pending;
  const job = (async () => {
    try {
      const r = await fetch(url(`${key}.${manifest!.ext}`), { cache: 'force-cache' });
      if (!r.ok) return null;
      const buf = await audio().decodeAudioData(await r.arrayBuffer());
      if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value!);
      cache.set(key, buf);
      return buf;
    } catch {
      return null;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, job);
  return job;
}

/** Bu cümlenin doğal sesi var mı? */
export function hasNaturalVoice(text: string) {
  return naturalVoiceReady() && manifest!.keys.has(clipKey(text));
}

export function stopNatural() {
  turn++;
  if (playing) {
    try {
      playing.stop();
    } catch {
      /* zaten bitmiş */
    }
    playing = null;
  }
}

/**
 * Cümleyi doğal sesle okur. Kaydı yoksa `false` döner ve hiç ses çıkmaz —
 * çağıran taraf cihazın kendi sesine düşer.
 *
 * `rate` ebeveyn ayarındaki konuşma hızı (0.7-1.3). Kayıttan oynatma hızını doğrudan değiştirmek
 * sesin perdesini de bozduğu için hızın yalnızca bir kısmı yansıtılır.
 */
export async function speakNatural(text: string, rate = 1): Promise<boolean> {
  if (!hasNaturalVoice(text)) return false;
  const mine = ++turn;
  const buffer = await bufferFor(clipKey(text));
  if (mine !== turn) return true;
  if (!buffer) return false;

  stopNatural();
  turn = mine;
  const a = audio();
  const src = a.createBufferSource();
  src.buffer = buffer;
  src.playbackRate.value = 1 + (rate - 1) * 0.55;
  src.connect(master!);
  src.start();
  playing = src;
  return true;
}
