import { describe, expect, it } from 'vitest';
import { bondBoard, estimateRound, quickFact, tricks } from '..';
import { makeWordProblem } from '../../problems/word';
import { makeChoices, nudge } from '../../lib/util';
import { BANDS } from '../types';

const RUNS = 400;

/** Bir denklemi ("8 + ? = 10", "7 × 8 = ?") cevabıyla doldurup iki tarafını hesaplar. */
function holds(eq: string, answer: number): boolean | null {
  if (!/^[\d\s+−×÷()=?]+$/.test(eq) || (eq.match(/=/g) ?? []).length !== 1) return null;
  const js = eq.replace('?', `(${answer})`).replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/');
  const [l, r] = js.split('=');
  // eslint-disable-next-line no-new-func
  const ev = (s: string) => Function(`return (${s})`)() as number;
  return Math.abs(ev(l) - ev(r)) < 1e-9;
}

describe('püf noktaları', () => {
  it('benzersiz kimlikler ve her yaş grubunda püf var', () => {
    expect(new Set(tricks.map((t) => t.id)).size).toBe(tricks.length);
    for (const b of BANDS) expect(tricks.filter((t) => t.band === b.id).length).toBeGreaterThanOrEqual(4);
  });

  for (const t of tricks) {
    it(`${t.id}: tüm seviyelerde tutarlı sorular`, () => {
      for (let level = 1; level <= 3; level++) {
        for (let i = 0; i < RUNS; i++) {
          const p = t.make(level);
          expect(p.trickId).toBe(t.id);
          expect(Number.isInteger(p.answer), `${p.expr} → ${p.answer}`).toBe(true);
          expect(p.steps.length).toBeGreaterThan(0);
          expect(p.steps[p.steps.length - 1].answer).toBe(p.answer);
          if (!p.negative) expect(p.answer).toBeGreaterThanOrEqual(0);
          for (const s of p.steps) {
            expect(Number.isInteger(s.answer), `${s.eq} → ${s.answer}`).toBe(true);
            expect(s.eq.includes('?')).toBe(true);
            const ok = holds(s.eq, s.answer);
            if (ok !== null) expect(ok, `${t.id}: ${s.eq} = ${s.answer}`).toBe(true);
            if (s.choices) expect(s.choices.some((c) => c.value === s.answer)).toBe(true);
          }
          const main = holds(p.expr, p.answer);
          if (main !== null) expect(main, `${t.id}: ${p.expr} = ${p.answer}`).toBe(true);
          if (p.visual?.type === 'tenframe') expect(p.visual.a + (p.visual.b ?? 0)).toBeLessThanOrEqual(20);
        }
      }
    });
  }
});

describe('oyun ve problem üreticileri', () => {
  it('hızlı sorular doğru', () => {
    for (const b of BANDS) for (let i = 0; i < RUNS; i++) {
      const q = quickFact(b.id);
      expect(Number.isInteger(q.answer)).toBe(true);
      const ok = holds(q.expr, q.answer);
      if (ok !== null) expect(ok, q.expr).toBe(true);
    }
  });

  it('tahmin turlarında doğru cevap seçeneklerde ve gerçekten en yakın', () => {
    for (const b of BANDS) for (let i = 0; i < RUNS; i++) {
      const r = estimateRound(b.id);
      expect(r.options.some((o) => o.value === r.answer)).toBe(true);
      expect(new Set(r.options.map((o) => o.value)).size).toBe(r.options.length);
      if (b.id === 'usta' || b.id === 'dahi') {
        const real = Function(`return ${r.q.replace('×', '*')}`)() as number;
        const best = Math.min(...r.options.map((o) => Math.abs(o.value - real)));
        expect(Math.abs(r.answer - real)).toBe(best);
      }
    }
  });

  it('sayı arkadaşları tahtası çiftlerle çözülebilir', () => {
    for (const b of BANDS) for (let i = 0; i < 100; i++) {
      const { target, nums, sign } = bondBoard(b.id);
      expect(nums.length).toBe(12);
      const left = [...nums];
      while (left.length) {
        const a = left.shift()!;
        const j = left.findIndex((x) => (sign === '+' ? a + x : a * x) === target);
        expect(j, `${nums} hedef ${target}`).toBeGreaterThanOrEqual(0);
        left.splice(j, 1);
      }
    }
  });

  it('sözel problemler: adımlar ve sağlama tutarlı', () => {
    for (const b of BANDS) for (let i = 0; i < RUNS; i++) {
      const w = makeWordProblem(b.id);
      expect(w.steps[w.steps.length - 1].answer).toBe(w.answer);
      expect(Number.isInteger(w.answer)).toBe(true);
      expect(w.answer).toBeGreaterThan(0);
      expect(w.askIndex).toBeGreaterThanOrEqual(0);
      expect(w.modelIndex).toBeGreaterThanOrEqual(0);
      expect(w.text).not.toMatch(/undefined|NaN/);
      for (const s of [...w.steps, ...(w.check ? [w.check] : [])]) {
        const ok = holds(s.eq, s.answer);
        if (ok !== null) expect(ok, `${w.text} | ${s.eq} = ${s.answer}`).toBe(true);
      }
    }
  });

  it('seçenekler benzersiz ve doğruyu içerir; geri bildirim asla cevabı söylemez', () => {
    for (let a = 0; a < 200; a++) {
      const c = makeChoices(a, 4);
      expect(new Set(c.map((x) => x.value)).size).toBe(4);
      expect(c.some((x) => x.value === a)).toBe(true);
      expect(c.every((x) => x.value >= 0)).toBe(true);
      expect(nudge(a + 3, a)).not.toContain(String(a));
    }
  });
});
