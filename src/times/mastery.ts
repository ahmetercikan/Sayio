/**
 * Hangi çarpımı biliyor, hangisini tekrar etmeli?
 *
 * **Aralıklı tekrar (Leitner / spaced retrieval).** Ebbinghaus'tan beri bilinen ve Roediger-Karpicke'in
 * defalarca gösterdiği şey: bir bilgiyi *hatırlamaya çalışmak*, tekrar tekrar okumaktan çok daha
 * kalıcıdır; ve tekrarlar araları açılarak yapılırsa en iyi sonucu verir.
 *
 * Her çarpım bir "kutu"dadır. Doğru bilirse bir üst kutuya çıkar ve bir dahaki sefere daha geç sorulur;
 * yanılırsa bir alt kutuya iner ve yarın tekrar karşısına çıkar. Kutu 4'e çıkan çarpım "ezberlendi"
 * sayılır — ama yine de arada bir sorulmaya devam eder.
 *
 * **Zaman tutulmaz.** Süreli test, matematik kaygısını büyüten en bilinen etkendir (Boaler; Ramirez ve
 * ark.). Burada acele ettiren hiçbir şey yok; sadece "biliyor musun?" var.
 */
import { FACTS, HARD_FACTS, factKey, type Fact } from './facts';

export interface FactState {
  /** Leitner kutusu 0-5. 4 ve üstü "ezberledi". */
  box: number;
  /** Bir sonraki tekrar günü (gün sayısı olarak; bkz. today()). */
  due: number;
  /** Üst üste doğru sayısı. */
  streak: number;
  /** Kaç kez yanıldı (ebeveyn raporu için). */
  misses: number;
}

export type FactMap = Record<string, FactState>;

/** Kutudan sonraki tekrara kaç gün: hemen, yarın, 2, 4, 8, 16 gün. */
const INTERVALS = [0, 1, 2, 4, 8, 16];
/** Bu kutudan itibaren "ezberledi" sayılır. */
export const MASTERED_BOX = 4;

/** Bugünün gün numarası (yerel saatle). */
export const today = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);

export const stateOf = (map: FactMap, a: number, b: number): FactState | undefined => map[factKey(a, b)];
export const isMastered = (s?: FactState) => !!s && s.box >= MASTERED_BOX;
export const isLearning = (s?: FactState) => !!s && s.box > 0 && s.box < MASTERED_BOX;

/** Cevaptan sonraki yeni durum. */
export function nextState(prev: FactState | undefined, correct: boolean): FactState {
  const cur = prev ?? { box: 0, due: 0, streak: 0, misses: 0 };
  // Yanılınca sıfıra düşürmüyoruz: bir basamak inmek yeterli, çocuk baştan başlamış hissetmesin.
  const box = correct ? Math.min(INTERVALS.length - 1, cur.box + 1) : Math.max(0, cur.box - 1);
  return {
    box,
    due: today() + INTERVALS[box],
    streak: correct ? cur.streak + 1 : 0,
    misses: cur.misses + (correct ? 0 : 1),
  };
}

export interface Progress {
  /** Ezberlenen çarpım sayısı (55 üzerinden). */
  known: number;
  /** Üzerinde çalışılan ama henüz oturmamış. */
  learning: number;
  /** Hiç karşılaşılmamış. */
  fresh: number;
  /** "Gerçekten zor" 21 çarpımdan kaçı bitti. */
  hardKnown: number;
  /** Bugün tekrar edilmesi gereken çarpımlar. */
  due: number;
}

export function progressOf(map: FactMap): Progress {
  const t = today();
  let known = 0;
  let learning = 0;
  let due = 0;
  for (const f of FACTS) {
    const s = map[f.key];
    if (isMastered(s)) known++;
    else if (isLearning(s)) learning++;
    if (s && s.due <= t) due++;
  }
  return {
    known,
    learning,
    fresh: FACTS.length - known - learning,
    hardKnown: HARD_FACTS.filter((f) => isMastered(map[f.key])).length,
    due,
  };
}

/**
 * Günün turu için çarpım seçer.
 *
 * Sıra: (1) zamanı gelmiş tekrarlar — en çok gecikmiş önce, (2) henüz hiç çalışılmamış çarpımlar —
 * kolay aileden zora doğru. **Harmanlanır** (interleaving): araştırmada aynı aileyi arka arkaya
 * çalışmak (blok) kısa vadede kolay gelir ama kalıcılığı düşürür (Rohrer & Taylor).
 */
export function pickRound(map: FactMap, count = 10, known: Set<string> = new Set()): Fact[] {
  const t = today();
  const seen = FACTS.filter((f) => map[f.key]);
  const overdue = seen
    .filter((f) => map[f.key]!.due <= t)
    .sort((x, y) => map[x.key]!.due - map[y.key]!.due || map[x.key]!.box - map[y.key]!.box);

  // Yeni çarpımlar: yalnızca kolay yolu öğrenilmiş ailelerden, kolaydan zora.
  // Bir turda aynı aileden en fazla 4 tane — tur tek düze olmasın.
  const perFamily = new Map<string, number>();
  const fresh = FACTS.filter((f) => {
    if (map[f.key] || (known.size > 0 && !known.has(f.family))) return false;
    const n = perFamily.get(f.family) ?? 0;
    if (n >= 4) return false;
    perFamily.set(f.family, n + 1);
    return true;
  });

  const out = [...overdue.slice(0, count)];
  for (const f of fresh) {
    if (out.length >= count) break;
    out.push(f);
  }
  // Aynı aile arka arkaya gelmesin diye harmanla.
  return interleave(out);
}

/** Aynı aileden olanları birbirinden uzaklaştırır. */
function interleave(list: Fact[]): Fact[] {
  const byFamily = new Map<string, Fact[]>();
  for (const f of list) (byFamily.get(f.family) ?? byFamily.set(f.family, []).get(f.family)!).push(f);
  const groups = [...byFamily.values()].sort((a, b) => b.length - a.length);
  const out: Fact[] = [];
  while (out.length < list.length) {
    for (const g of groups) {
      const next = g.shift();
      if (next) out.push(next);
    }
  }
  return out;
}
