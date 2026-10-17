import { rnd, pick } from '../lib/util';
import { dahi, usta } from './older';
import type { Band, Op, Problem, Trick } from './types';
import { BANDS } from './types';
import { kesif, minik } from './young';

export const tricks: Trick[] = [...minik, ...kesif, ...usta, ...dahi];
export const getTrick = (id: string) => tricks.find((t) => t.id === id);
export const tricksByBand = (b: Band) => tricks.filter((t) => t.band === b);
export const tricksByOp = (op: Op, b?: Band) => tricks.filter((t) => t.op === op && (!b || t.band === b));

/** Bir sonraki püf noktası (aynı yaş grubunda sırayla, sonra bir üst grup). */
export function nextTrick(id: string): Trick | undefined {
  const i = tricks.findIndex((t) => t.id === id);
  return tricks[i + 1];
}

/** Bandın ve bir alt bandın püfleri: tekrar ve pekiştirme için. */
export function reviewPool(b: Band): Trick[] {
  const i = BANDS.findIndex((x) => x.id === b);
  const own = tricksByBand(b);
  return i > 0 ? [...own, ...tricksByBand(BANDS[i - 1].id)] : own;
}

/**
 * Oyunlar için hızlı, tek adımlı temel işlem soruları (Şimşek Tur). Yaşa uygun aralıklar;
 * her soru yine de bir püf noktasına bağlanır ki ipucu verilebilsin.
 */
export function quickFact(b: Band): Problem {
  const mk = (expr: string, answer: number, trickId: string, hint: string, negative = false): Problem => ({
    trickId, expr, answer, hint, negative, steps: [{ say: '', eq: expr, answer }],
  });
  switch (b) {
    case 'minik': {
      if (Math.random() < 0.6) {
        const a = rnd(1, 5), c = rnd(1, Math.min(4, 9 - a));
        return { ...mk(`${a} + ${c} = ?`, a + c, 'buyukten-say', 'Büyükten başla, ileri say!'), visual: { type: 'tenframe', a, b: c } };
      }
      const t = rnd(3, 8), f = rnd(1, t - 1);
      return { ...mk(`${t} − ${f} = ?`, t - f, 'ucan-balon', 'Kalanları say!'), visual: { type: 'balloons', total: t, fly: f } };
    }
    case 'kesif': {
      const k = rnd(0, 3);
      if (k === 0) { const a = rnd(1, 9); return mk(`${a} + ? = 10`, 10 - a, 'onun-arkadaslari', 'On\'un arkadaşını bul!'); }
      if (k === 1) { const a = rnd(6, 9), c = rnd(11 - a, 9); return mk(`${a} + ${c} = ?`, a + c, 'ona-tamamla', 'Önce 10\'a tamamla!'); }
      if (k === 2) { const n = rnd(2, 9); return mk(`${n} + ${n} = ?`, 2 * n, 'ikizler', 'İkizler!'); }
      const a = rnd(11, 18), c = rnd(a - 9, 9); return mk(`${a} − ${c} = ?`, a - c, 'farki-bul', 'Küçükten büyüğe zıpla!');
    }
    case 'usta': {
      const k = rnd(0, 4);
      if (k === 0) { const a = rnd(2, 9), c = rnd(2, 9); return mk(`${a} × ${c} = ?`, a * c, 'parcala-carp', 'Parçala çarp!'); }
      if (k === 1) { const a = rnd(2, 9), q = rnd(2, 9); return mk(`${a * q} ÷ ${a} = ?`, q, 'carpmayi-dusun', 'Çarpmayı düşün!'); }
      if (k === 2) { const a = rnd(1, 8) * 10 + 9, c = rnd(11, 59); return mk(`${a} + ${c} = ?`, a + c, 'yuvarla-duzelt', 'Yuvarla ve düzelt!'); }
      if (k === 3) { const c = rnd(1, 6) * 10 + 9, a = rnd(c + 3, 99); return mk(`${a} − ${c} = ?`, a - c, 'sabit-fark', 'İkisine de 1 ekle!'); }
      const n = rnd(2, 10); return mk(`9 × ${n} = ?`, 9 * n, 'dokuzun-sihri', '10 ile çarp, bir tane çıkar!');
    }
    default: {
      const k = rnd(0, 4);
      if (k === 0) { const d1 = rnd(1, 8), d2 = rnd(0, 9 - d1), n = d1 * 10 + d2; return mk(`${n} × 11 = ?`, n * 11, 'on-birin-sirri', 'Rakamları topla, ortaya yaz!'); }
      if (k === 1) { const N = 20 * rnd(2, 20); return mk(`${N} sayısının %10'u = ?`, N / 10, 'yuzde', '10\'a böl!'); }
      if (k === 2) { const a = rnd(2, 9), c = rnd(a + 1, 15); return mk(`${a} − ${c} = ?`, a - c, 'negatif-pullar', 'Pulları sıfırla!', true); }
      if (k === 3) { const d = rnd(1, 9), n = d * 10 + 5; return mk(`${n} × ${n} = ?`, n * n, 'bes-kare', `${d} × ${d + 1}, sonuna 25!`); }
      const a = rnd(2, 15), x = rnd(2, 9), y = rnd(2, 9); return mk(`${a} + ${x} × ${y} = ?`, a + x * y, 'islem-sirasi', 'Önce çarpma!');
    }
  }
}

/** Tahmin oyunu için: hızlı kestirim sorusu (küçüklerde "hangisi daha büyük?"). */
export function estimateRound(b: Band): { q: string; options: { label: string; value: number }[]; answer: number } {
  if (b === 'minik' || b === 'kesif') {
    const m = b === 'minik' ? 5 : 9;
    const a = rnd(1, m), c = rnd(1, m), x = rnd(1, m), y = rnd(1, m);
    if (a + c === x + y) return estimateRound(b);
    return {
      q: 'Hangisi daha büyük?',
      options: [{ label: `${a} + ${c}`, value: a + c }, { label: `${x} + ${y}`, value: x + y }],
      answer: Math.max(a + c, x + y),
    };
  }
  const shuffle3 = (ns: number[]) => ns.sort(() => Math.random() - 0.5).map((v) => ({ label: `≈ ${v}`, value: v }));
  if (b === 'usta') {
    const a = rnd(110, 480), c = rnd(110, 480);
    const ans = Math.round((a + c) / 100) * 100;
    return { q: `${a} + ${c}`, options: shuffle3([ans - 100, ans, ans + 100]), answer: ans };
  }
  const a = rnd(21, 79), c = rnd(11, 39);
  const ans = Math.round((a * c) / 100) * 100;
  return { q: `${a} × ${c}`, options: shuffle3([ans, Math.round(ans / 20) * 10, ans * 2]), answer: ans };
}

/** Sayı Arkadaşları oyunu: hedef toplam ve tahta. */
export function bondBoard(b: Band): { target: number; nums: number[]; sign: '+' | '×' } {
  const target = b === 'minik' ? 5 : b === 'kesif' ? 10 : b === 'usta' ? 100 : pick([24, 36, 48, 60]);
  const sign: '+' | '×' = b === 'dahi' ? '×' : '+';
  const pairs: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    if (sign === '×') {
      const divs = Array.from({ length: target }, (_, k) => k + 1).filter((d) => target % d === 0 && d > 1 && d < target);
      const d = pick(divs);
      pairs.push([d, target / d]);
    } else if (target === 100) {
      const a = rnd(1, 9) * 10 + (Math.random() < 0.5 ? 0 : 5);
      pairs.push([a, 100 - a]);
    } else {
      const a = rnd(target === 5 ? 0 : 1, target === 5 ? 5 : 9);
      pairs.push([a, target - a]);
    }
  }
  return { target, sign, nums: pairs.flat().sort(() => Math.random() - 0.5) };
}

