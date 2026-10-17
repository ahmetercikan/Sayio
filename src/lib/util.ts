import type { Choice } from '../tricks/types';

export const rnd = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
export const pick = <T,>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];
export function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Üst üste etkinlik yapılan gün sayısı (bugün ya da dün biten seri). */
export function streakOf(days: Record<string, unknown>) {
  const d = new Date();
  if (!days[dayKey(d)]) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days[dayKey(d)]) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/** Sayıyı Türkçe biçimde yazar; eksi işareti matematik eksisiyle. */
export const fmt = (n: number) => (n < 0 ? `−${Math.abs(n)}` : String(n));
const DISTRIB = ['', 'birer', 'ikişer', 'üçer', 'dörder', 'beşer', 'altışar', 'yedişer', 'sekizer', 'dokuzar', 'onar'];
/** Üleştirme sayısı: 4 → "dörder" (Türkçe ekler sayıya göre değişir). */
export const distrib = (n: number) => DISTRIB[n] ?? `${n} tane`;
/** Eksi sayıyı parantezli yazar: (−5). */
export const fmtp = (n: number) => (n < 0 ? `(−${Math.abs(n)})` : String(n));

/**
 * Küçükler için cevap seçenekleri: doğru cevap + yakın, mantıklı çeldiriciler (±1, ±2, ±10).
 * Çeldiriciler tipik hataları temsil eder: bir fazla/eksik sayma, onluğu kaçırma.
 */
export function makeChoices(answer: number, count = 3, allowNegative = false): Choice[] {
  const set = new Set<number>([answer]);
  const near = answer >= 20 ? [10, -10, 1, -1, 2, -2, 20, -20] : [1, -1, 2, -2, 3, -3];
  for (const d of shuffle(near)) {
    if (set.size >= count) break;
    const v = answer + d;
    if (!allowNegative && v < 0) continue;
    set.add(v);
  }
  let k = 4;
  while (set.size < count) set.add(answer + k++);
  return shuffle([...set]).map((v) => ({ label: fmt(v), value: v }));
}

/**
 * Yanlış cevapta "yanlış, doğrusu X" demek yerine, hatanın türüne göre yol gösteren nazik bir cümle.
 * (Bilişsel Yük Teorisi: geri bildirim, çocuğun nerede saptığını göstermeli.)
 */
export function nudge(given: number, correct: number): string {
  const d = given - correct;
  if (d === 1) return 'Çok yaklaştın! Bir tane fazla saydın galiba.';
  if (d === -1) return 'Çok yaklaştın! Bir tane eksik kaldı.';
  if (Math.abs(d) === 2) return 'Az kaldı! Bir daha say bakalım.';
  if (Math.abs(d) === 10 || Math.abs(d) === 100) return 'Birlikler doğru! Onluklara bir daha bak.';
  if (given === -correct && correct !== 0) return 'Sayı doğru, işaretine bir bak!';
  if (Math.abs(d) <= Math.max(3, Math.abs(correct) * 0.1)) return 'Çok yakın! Bir kez daha kontrol et.';
  return 'Hmm, bir daha düşünelim. Resme bak, ipucu orada!';
}

/** Gelişim zihniyeti: yetenek değil çaba ve strateji övülür. */
export const PRAISE = [
  'Harika düşündün!',
  'Kolay yolu buldun!',
  'Beynin kas gibi, çalıştıkça güçleniyor!',
  'Süper strateji!',
  'Tam bir matematik kaşifisin!',
  'Pes etmedin, işte bu!',
  'Çok akıllıca!',
  'Bravo, adım adım çözdün!',
];

export const TRY_AGAIN = ['Hadi bir daha dene!', 'Hata yapmak öğrenmenin parçası!', 'Neredeyse! Birlikte bakalım.'];
