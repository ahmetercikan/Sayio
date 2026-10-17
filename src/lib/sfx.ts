/**
 * Ses efektleri — dosya yok, Web Audio ile sentezlenir (Çizio ile aynı ses dili).
 *
 * Zincir: sesler → ana kazanç → kompresör → hoparlör, ayrıca hafif bir yankı (üretilmiş dürtü yanıtlı
 * konvolüsyon). Tonlar FM sentezi: marimba (yumuşak, tahta) ve çan (parlak, uzun). Seçim sesleri
 * pentatonik gamda sırayla ilerler; art arda seçim yapmak kulağa bir melodi gibi gelir.
 */
import { haptics } from './native';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let reverb: GainNode | null = null;
let enabled = true;

export function setSfxEnabled(v: boolean) {
  enabled = v;
}

/** Dokunma titreşimi — ses efektleriyle aynı anahtara bağlı (kapalıysa cihaz da titremez). */
const buzz = {
  light: () => enabled && haptics.light(),
  success: () => enabled && haptics.success(),
  warning: () => enabled && haptics.warning(),
};

function ac(): AudioContext | null {
  if (!enabled) return null;
  try {
    if (!ctx) {
      ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.knee.value = 12;
      comp.ratio.value = 4;
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(comp).connect(ctx.destination);
      // Kısa, parlak bir oda yankısı
      const conv = ctx.createConvolver();
      const len = Math.floor(ctx.sampleRate * 1.1);
      const ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
      }
      conv.buffer = ir;
      reverb = ctx.createGain();
      reverb.gain.value = 0.18;
      reverb.connect(conv).connect(master);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Çıkış: kuru sinyal ana kanala, bir kısmı yankıya. */
function out(a: AudioContext, node: AudioNode, wet = 1) {
  node.connect(master!);
  if (wet > 0) {
    const s = a.createGain();
    s.gain.value = wet;
    node.connect(s).connect(reverb!);
  }
}

/** FM tonu. ratio: modülatör/taşıyıcı frekans oranı (4 → marimba, 3.5 → çan), index: parlaklık. */
function fm(freq: number, at: number, dur: number, gain: number, ratio: number, index: number, wet = 1) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + at;
  const car = a.createOscillator();
  const mod = a.createOscillator();
  const modGain = a.createGain();
  const amp = a.createGain();
  car.frequency.setValueAtTime(freq, t);
  mod.frequency.setValueAtTime(freq * ratio, t);
  modGain.gain.setValueAtTime(freq * index, t);
  modGain.gain.exponentialRampToValueAtTime(freq * 0.02, t + Math.min(dur, 0.12));
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(gain, t + 0.006);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  mod.connect(modGain).connect(car.frequency);
  car.connect(amp);
  out(a, amp, wet);
  car.start(t);
  mod.start(t);
  car.stop(t + dur + 0.05);
  mod.stop(t + dur + 0.05);
}

/** Filtrelenmiş gürültü: tık (kısa) ya da vuuş (süpürmeli). */
function noise(at: number, dur: number, gain: number, f0: number, f1 = f0, q = 1.2, wet = 0) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + at;
  const len = Math.max(1, Math.floor(a.sampleRate * dur));
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = buf;
  const bp = a.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = q;
  bp.frequency.setValueAtTime(f0, t);
  bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.02, dur / 3));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp).connect(g);
  out(a, g, wet);
  src.start(t);
  src.stop(t + dur + 0.02);
}

/** Tatlı bir su damlası "pop"u: perdesi hızla yükselen sinüs. */
function bubble(at: number, from: number, to: number, gain: number) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + at;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(from, t);
  o.frequency.exponentialRampToValueAtTime(to, t + 0.07);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
  o.connect(g);
  out(a, g, 0.6);
  o.start(t);
  o.stop(t + 0.16);
}

// C majör pentatonik (C6 D6 E6 G6 A6 C7): seçimler sırayla bu notalarda ilerler
const PENTA = [1046.5, 1174.7, 1318.5, 1568.0, 1760.0, 2093.0];
let step = 0;
let lastSelect = 0;
const nextNote = () => {
  const now = performance.now();
  // Uzun bir aradan sonra gamın başına dön
  if (now - lastSelect > 1500) step = 0;
  lastSelect = now;
  const f = PENTA[step % PENTA.length];
  step = (step + 1 + (step % 3 === 2 ? 1 : 0)) % PENTA.length;
  return f;
};

export const sfx = {
  /** Genel dokunuş / seçim: yumuşak marimba notası + tahta tık. */
  tap: () => {
    buzz.light();
    const f = nextNote();
    noise(0, 0.012, 0.05, 3200, 3200, 0.8);
    fm(f / 2, 0, 0.22, 0.16, 4, 1.4, 0.4);
  },
  /** Kabarcık "pop"u (buton, kart açma). */
  pop: () => {
    buzz.light();
    bubble(0, 380, 1100, 0.2);
    fm(1568, 0.05, 0.35, 0.06, 3.5, 1.5, 1);
  },
  /** Numpad tuşu: kısa tahta tık. */
  key: () => {
    buzz.light();
    noise(0, 0.01, 0.06, 2400, 2400, 1);
    fm(523.25, 0, 0.08, 0.08, 4, 0.9, 0.1);
  },
  /** Doğru adım: iki notalık parlak çan. */
  right: () => {
    buzz.success();
    const f = nextNote();
    fm(f, 0, 0.5, 0.11, 3.5, 2, 1);
    fm(f * 1.5, 0.08, 0.6, 0.08, 3.5, 2, 1);
  },
  /** Yanlış: yumuşak, cezalandırmayan iki alçak nota. */
  soft: () => {
    buzz.warning();
    [659.3, 523.25].forEach((f, i) => fm(f, i * 0.12, 0.35, 0.11, 4, 1.2, 0.5));
  },
  star: (i = 0) => fm(1318.5 * 2 ** (i / 6), 0, 0.7, 0.14, 3.5, 2.2, 1),
  success: () => [1046.5, 1318.5, 1568, 2093].forEach((f, i) => fm(f, i * 0.08, 0.7, 0.12, 3.5, 2, 1)),
  fanfare: () =>
    [523.25, 659.3, 784, 659.3, 784, 1046.5].forEach((f, i) => {
      fm(f, i * 0.11, i === 5 ? 1.2 : 0.35, 0.13, 4, 1.8, 0.8);
      fm(f * 2, i * 0.11 + 0.01, i === 5 ? 1 : 0.25, 0.05, 3.5, 1.5, 1);
    }),
  /** Kurşun kalemin kâğıtta çıkardığı hafif hışırtı (eskiz çizilirken). */
  scribble: (d = 0.4) => {
    const n = Math.max(2, Math.round(d / 0.11));
    for (let i = 0; i < n; i++) noise(i * 0.1 + Math.random() * 0.03, 0.07, 0.018, 3000 + Math.random() * 1500, 4200, 1.4, 0);
  },
  /** Sayı doğrusunda zıplama. */
  hop: (i = 0) => {
    bubble(0, 300 + i * 40, 900 + i * 60, 0.14);
  },
};
