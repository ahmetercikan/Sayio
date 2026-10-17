/**
 * Doğal ses için metni parçalara ayırma.
 *
 * Uygulama 59 binden fazla farklı cümle söyleyebiliyor (sayılar her soruda değişiyor), bu yüzden
 * her cümleyi ayrı ayrı seslendirtmek mümkün değil. Bunun yerine cümle parçalara bölünür; her parça
 * bir kez seslendirilip uygulamaya gömülür, çalarken arka arkaya eklenir.
 *
 * **Bölme kuralının püf noktası:** parçalar tek başına anlamlı birer ÖBEK olmalı. Sayıyı tek başına
 * seslendirtirsen ("7", "artı", "5") her biri ayrı bir cümle gibi, düşen tonlamayla okunur; yan yana
 * koyunca konuşma kopuk kopuk duyulur. Onun yerine sayı, peşinden gelen işlem kelimesiyle birlikte
 * tek parça olur:
 *
 *     "Önce iki katını al: 4 artı 4 eşittir kaç"
 *      └─ "Önce iki katını al:" ─┘ └ "4 artı" ┘ └ "4 eşittir kaç" ┘
 *
 * "4 artı" yükselen, "4 eşittir kaç" alçalan tonla üretilir — birleşince gerçek bir cümle gibi akar.
 *
 * ÖNEMLİ: bu dosya hem uygulamada (çalma) hem de scripts/voice/* içinde (üretme) kullanılır.
 * İkisinin aynı bölmeyi yapması şart, yoksa dosya adları tutmaz.
 */

/** Sayı ve varsa Türkçe eki: "36", "10'a", "20'nin", "−5". */
const NUMBER = /^-?[−]?\d+(?:['’][a-zçğıiöşü]+)?$/iu;

/** İşlem kelimeleri: bunlar sayılarla aynı öbekte kalır. */
const MATH_WORDS = new Set(['artı', 'eksi', 'çarpı', 'bölü', 'eşittir', 'yüzde', 'kere', 'de']);

/** Yalnızca noktalama olan parçalar okunmaz, yerine kısa bir duraklama konur. */
const PAUSES: Record<string, number> = { ',': 230, ';': 280, ':': 300, '.': 420, '!': 420, '?': 420, '→': 320, '-': 160, '—': 260 };

/**
 * Parçaları birleştirme zamanlaması.
 *
 * Parçalar ayrı ayrı üretildiği için her birinin başında/sonunda sessizlik olur; bunlar kırpılıp
 * parçalar arka arkaya çalınır. Kırpma fazla olursa kelime sonları yutulur, boşluk az olursa
 * konuşma "kelimeleri üst üste bindiriyor" gibi duyulur — bu yüzden değerler burada, tek yerde.
 *
 * ÖNEMLİ: hem uygulama (src/lib/voice.ts) hem de üretim betikleri (scripts/voice/*) bunları kullanır.
 */
export const TIMING = {
  /**
   * Sessizlik eşiği, parçanın KENDİ en yüksek sesine oranla. Sabit bir eşik kullanmak
   * "beş", "üç", "dokuz" gibi rakamların sonundaki tıslamayı (ş, ç, z) sessizlik sanıp kesiyordu —
   * bu sesler tepe seviyenin %2-5'i kadar kısıktır.
   */
  silenceRatio: 0.012,
  /** Mutlak alt sınır: tamamen sessiz parçalarda oran anlamsız kalmasın. */
  silenceFloor: 0.0012,
  /** Parçanın başında bırakılan pay (saniye) — ilk hece kesilmesin. */
  padIn: 0.03,
  /** Parçanın sonunda bırakılan pay — kelime sonu yutulmasın. */
  padOut: 0.18,
  /** Parça başına/sonuna uygulanan kısa yumuşatma (saniye): birleşme yerinde "tık" olmasın. */
  fade: 0.008,
  /** İki parça arasındaki nefes payı. */
  gap: 0.1,
  /**
   * İki işlem öbeği arasındaki es (ms): "7 artı" ▸ es ▸ "5 eşittir kaç".
   * Normal nefes payından belirgin uzun, çünkü sayılar arka arkaya gelince
   * kulak onları ayıramıyor — rakamların birbirine binmesinin sebebi buydu.
   */
  mathGap: 240,
};

export type VoiceToken = { say: string } | { pause: number };

type Chunk = { say: string; math: boolean };

/** Kelimeyi sınıflandırmak için baştaki/sondaki noktalamayı at. */
const bare = (w: string) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}'’]+$/gu, '').toLowerCase();

/** Metni seslendirme parçalarına böler. */
export function splitForVoice(text: string): VoiceToken[] {
  const parts: (Chunk | { pause: number })[] = [];
  let chunk: string[] = [];
  /** Şu anki öbek işlem öbeği mi? */
  let math = false;
  /** Bu öbekte zaten bir sayı var mı? (İkinci sayı yeni öbek başlatır.) */
  let hasNumber = false;
  let lastBare = '';

  const flush = () => {
    if (chunk.length) parts.push({ say: chunk.join(' '), math });
    chunk = [];
    hasNumber = false;
  };

  for (const word of text.split(/\s+/)) {
    if (!word) continue;
    const b = bare(word);

    // Sadece noktalama/simge: duraklama
    if (!b) {
      flush();
      math = false;
      parts.push({ pause: Math.max(...[...word].map((c) => PAUSES[c] ?? 150)) });
      lastBare = '';
      continue;
    }

    const isNum = NUMBER.test(b);
    // "kaç" ancak "eşittir"den sonra işlem kelimesidir ("eşittir kaç"); cümle sonundaki
    // "…kaç?" bir sonraki işleme yapışmasın.
    const isMath = isNum || MATH_WORDS.has(b) || (b === 'kaç' && lastBare === 'eşittir');

    if (isMath !== math) {
      flush();
      math = isMath;
    } else if (isMath && isNum && hasNumber) {
      // "4 artı 4 eşittir kaç" → "4 artı" | "4 eşittir kaç"
      flush();
    }
    if (isNum) hasNumber = true;
    chunk.push(word);
    lastBare = b;
  }
  flush();

  // Arka arkaya gelen iki işlem öbeğinin arasına ek es koy.
  const out: VoiceToken[] = [];
  parts.forEach((p, i) => {
    const prev = parts[i - 1];
    if ('say' in p && p.math && prev && 'say' in prev && prev.math) out.push({ pause: TIMING.mathGap });
    out.push('say' in p ? { say: p.say } : p);
  });
  return out;
}

/**
 * Parçanın konuşma bölümünün başı ve sonu (saniye).
 *
 * 10 ms'lik pencerelerin RMS'ine bakar ve eşiği parçanın kendi tepe seviyesine göre belirler;
 * böylece kısık biten rakamlar ("beş", "üç") kesilmez. Hem uygulama hem üretim betikleri bunu kullanır.
 */
export function clipBounds(d: Float32Array, sampleRate: number): { from: number; to: number } {
  const win = Math.max(1, Math.round(sampleRate * 0.01));
  const n = Math.floor(d.length / win);
  const rms = new Float32Array(n);
  let peak = 0;
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = i * win; j < (i + 1) * win; j++) sum += d[j] * d[j];
    rms[i] = Math.sqrt(sum / win);
    if (rms[i] > peak) peak = rms[i];
  }
  const th = Math.max(TIMING.silenceFloor, peak * TIMING.silenceRatio);
  let first = 0;
  let last = n - 1;
  while (first < n && rms[first] < th) first++;
  while (last > first && rms[last] < th) last--;
  if (first >= last) return { from: 0, to: d.length / sampleRate };
  return {
    from: Math.max(0, (first * win) / sampleRate - TIMING.padIn),
    to: Math.min(d.length / sampleRate, ((last + 1) * win) / sampleRate + TIMING.padOut),
  };
}

/** Bir parçanın dosya adı. Üretme betiği ile uygulama aynı sonucu vermeli. */
export function clipKey(text: string): string {
  // FNV-1a, iki farklı tohumla → çakışma riski yok denecek kadar düşük.
  const fnv = (seed: number) => {
    let h = seed >>> 0;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(36);
  };
  return `${fnv(0x811c9dc5)}${fnv(0x7f4a7c15)}`;
}

/* ------------------------------------------------------------------ sayılar */

const BIRLER = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];
const ONLAR = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];

/** Sayıyı Türkçe okunuşuna çevirir: 148 → "yüz kırk sekiz". */
export function sayiyiYaz(n: number): string {
  if (n === 0) return 'sıfır';
  if (n < 0) return `eksi ${sayiyiYaz(-n)}`;
  const parts: string[] = [];
  const bin = Math.floor(n / 1000);
  if (bin) parts.push(bin === 1 ? 'bin' : `${sayiyiYaz(bin)} bin`);
  const kalan = n % 1000;
  const yuz = Math.floor(kalan / 100);
  if (yuz) parts.push(yuz === 1 ? 'yüz' : `${BIRLER[yuz]} yüz`);
  const on = Math.floor((kalan % 100) / 10);
  if (on) parts.push(ONLAR[on]);
  const bir = kalan % 10;
  if (bir) parts.push(BIRLER[bir]);
  return parts.join(' ');
}

/**
 * Ses üretiminde kullanılır: metindeki rakamları okunuşlarıyla değiştirir.
 *
 * Neden: ElevenLabs'e "60" diye gönderince sesi aceleye getirip başını yutuyor; "altmış" diye
 * gönderince normal bir kelime gibi, tam telaffuzla okuyor (ölçüldü: %17-30 daha uzun konuşma).
 * Uygulamanın kendi metni rakam olarak kalır — bu dönüşüm yalnızca seslendirme metnine uygulanır.
 *
 * Türkçe ekler korunur: 20'nin → yirminin, 10'a → ona, 4'ü → dördü (ünsüz yumuşaması).
 */
export function sayilariYaziyaCevir(text: string): string {
  return text.replace(/(-|−)?(\d+)(?:['’]([a-zçğıiöşü]+))?/giu, (_m, eksi, rakam, ek) => {
    let söz = sayiyiYaz(Number(rakam));
    if (eksi) söz = `eksi ${söz}`;
    if (!ek) return söz;
    // "dört" + sesli harfle başlayan ek → "dörd-" (dördü, dörde, dördün)
    if (/[tk]$/.test(söz) && /^[aeıioöuü]/i.test(ek)) söz = söz.replace(/t$/, 'd').replace(/k$/, 'ğ');
    return söz + ek;
  });
}
