/**
 * Çarpım tablosu: aile dağılımı, her çarpım için doğru kolay yol, aralıklı tekrar.
 */
import { describe, expect, it } from 'vitest';
import { FACTS, FAMILY_ORDER, HARD_FACTS, factKey, factsOf, familyOf } from '../facts';
import { MASTERED_BOX, nextState, pickRound, progressOf, today, type FactMap } from '../mastery';
import { problemFor, timesTricks } from '../table';

describe('çarpım tablosu', () => {
  it('1-10 arası tekrarsız 55 çarpım var', () => {
    expect(FACTS).toHaveLength(55);
    expect(new Set(FACTS.map((f) => f.key)).size).toBe(55);
  });

  it('3 × 7 ile 7 × 3 aynı çarpımdır', () => {
    expect(factKey(3, 7)).toBe(factKey(7, 3));
    expect(familyOf(3, 7)).toBe(familyOf(7, 3));
  });

  it('aileler her adımda bir azalır: 10, 9, 8 … 1', () => {
    expect(FAMILY_ORDER.map((f) => factsOf(f).length)).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
  });

  it('gerçekten zor olan tam 21 çarpım vardır', () => {
    expect(HARD_FACTS).toHaveLength(21);
  });

  it('her aile için bir ders var', () => {
    expect(timesTricks).toHaveLength(FAMILY_ORDER.length);
    for (const t of timesTricks) expect(t.group).toBe('carpim');
  });

  it('her çarpım için üretilen soru doğru cevabı ve tutarlı adımları taşır', () => {
    for (const f of FACTS) {
      const p = problemFor(f.a, f.b);
      expect(p.answer, `${f.a} × ${f.b}`).toBe(f.product);
      // Son adımın cevabı asıl cevaptır (uygulamanın her yerinde geçerli kural).
      expect(p.steps.at(-1)!.answer, p.expr).toBe(f.product);
      for (const s of p.steps) {
        expect(s.eq).toContain('?');
        expect(Number.isFinite(s.answer)).toBe(true);
        expect(s.answer).toBeGreaterThanOrEqual(0);
      }
      // Soru, çarpımın kendi ailesinin dersine bağlanır.
      expect(p.trickId).toBe(`carpim-${f.family}`);
    }
  });

  it('ders her seviyede geçerli soru üretir', () => {
    for (const t of timesTricks)
      for (let lvl = 1; lvl <= 3; lvl++)
        for (let i = 0; i < 300; i++) {
          const p = t.make(lvl);
          expect(p.steps.at(-1)!.answer).toBe(p.answer);
          expect(p.answer).toBeGreaterThan(0);
        }
  });
});

describe('aralıklı tekrar', () => {
  it('doğru cevap kutuyu yükseltir, tekrarı ileri atar', () => {
    const a = nextState(undefined, true);
    expect(a.box).toBe(1);
    expect(a.due).toBe(today() + 1);
    const b = nextState(a, true);
    expect(b.box).toBe(2);
    expect(b.due).toBeGreaterThan(a.due);
  });

  it('yanlış cevap bir basamak indirir, sıfırlamaz', () => {
    let s = nextState(undefined, true);
    s = nextState(s, true);
    s = nextState(s, true);
    expect(s.box).toBe(3);
    const wrong = nextState(s, false);
    expect(wrong.box).toBe(2);
    expect(wrong.streak).toBe(0);
    expect(wrong.misses).toBe(1);
  });

  it('kutu 4 ve üstü "ezberledi" sayılır', () => {
    let s = nextState(undefined, true);
    for (let i = 0; i < 3; i++) s = nextState(s, true);
    expect(s.box).toBeGreaterThanOrEqual(MASTERED_BOX);
    const map: FactMap = { [factKey(7, 8)]: s };
    expect(progressOf(map).known).toBe(1);
  });

  it('tur önce zamanı gelmiş tekrarları seçer', () => {
    const t = today();
    const map: FactMap = {
      [factKey(6, 7)]: { box: 2, due: t - 5, streak: 0, misses: 2 },
      [factKey(4, 8)]: { box: 3, due: t - 1, streak: 1, misses: 0 },
      [factKey(2, 3)]: { box: 5, due: t + 10, streak: 6, misses: 0 },
    };
    const round = pickRound(map, 3);
    const keys = round.map((f) => f.key);
    expect(keys).toContain(factKey(6, 7));
    expect(keys).toContain(factKey(4, 8));
    expect(keys).not.toContain(factKey(2, 3));
  });

  it('tur tek aileden ibaret olmaz, aileler harmanlanır', () => {
    const round = pickRound({}, 10);
    expect(round).toHaveLength(10);
    // Aynı aileden bir turda en fazla 4 tane gelir.
    const perFamily = new Map<string, number>();
    for (const f of round) perFamily.set(f.family, (perFamily.get(f.family) ?? 0) + 1);
    expect([...perFamily.values()].every((n) => n <= 4)).toBe(true);
    expect(perFamily.size).toBeGreaterThanOrEqual(3);
    // Harmanlama: arka arkaya aynı aile nadiren gelir.
    let samePair = 0;
    for (let i = 1; i < round.length; i++) if (round[i].family === round[i - 1].family) samePair++;
    expect(samePair).toBeLessThanOrEqual(2);
  });

  it('boş haritada 55 çarpımın hiçbiri bilinmiyor', () => {
    const p = progressOf({});
    expect(p.known).toBe(0);
    expect(p.fresh).toBe(55);
  });
});
