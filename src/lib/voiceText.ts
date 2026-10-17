/**
 * Doğal ses için metni parçalara ayırma.
 *
 * Uygulama 43 binden fazla farklı cümle söyleyebiliyor (sayılar her soruda değişiyor), bu yüzden
 * her cümleyi ayrı ayrı seslendirtmek mümkün değil. Bunun yerine cümle "sabit metin parçaları" ve
 * "sayılar" olarak bölünür; her parça bir kez seslendirilip uygulamaya gömülür, çalarken arka arkaya
 * eklenir. Böylece ~2.500 ses dosyasıyla bütün cümleler doğal sesle söylenebiliyor.
 *
 * ÖNEMLİ: bu dosya hem uygulamada (çalma) hem de scripts/voice/* içinde (üretme) kullanılır.
 * İkisinin aynı bölmeyi yapması şart, yoksa dosya adları tutmaz.
 */

/** Sayı ve varsa Türkçe eki: "36", "10'a", "20'nin", "−5". */
const NUMBER = /-?[−]?\d+(?:['’][a-zçğıiöşü]+)?/giu;

/** Yalnızca noktalama olan parçalar okunmaz, yerine kısa bir duraklama konur. */
const PAUSES: Record<string, number> = { ',': 180, ';': 220, ':': 240, '.': 320, '!': 320, '?': 320, '→': 260, '-': 120, '—': 200 };

export type VoiceToken = { say: string } | { pause: number };

/** Metni seslendirme parçalarına böler. */
export function splitForVoice(text: string): VoiceToken[] {
  const out: VoiceToken[] = [];
  const push = (raw: string) => {
    const s = raw.trim().replace(/\s+/g, ' ');
    if (!s) return;
    // Sadece noktalama/simge ise: duraklama
    if (!/[\p{L}\p{N}]/u.test(s)) {
      out.push({ pause: Math.max(...[...s].map((c) => PAUSES[c] ?? 150)) });
      return;
    }
    out.push({ say: s });
  };

  let last = 0;
  for (const m of text.matchAll(NUMBER)) {
    push(text.slice(last, m.index));
    push(m[0]);
    last = m.index + m[0].length;
  }
  push(text.slice(last));
  return out;
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
