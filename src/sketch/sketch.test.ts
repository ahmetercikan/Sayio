import { describe, expect, it } from 'vitest';
import { tricks } from '../tricks';
import { sketchInfo } from './recipes';

/** Seviye-1 örnekleri her zaman kendi senaryosuyla çizilmeli; zor varyantlarda yedek eskiz kabul. */
describe('defter eskizleri', () => {
  for (const t of tricks) {
    it(`${t.id}: her soruda geçerli eskiz`, () => {
      for (let level = 1; level <= 3; level++) {
        for (let i = 0; i < 150; i++) {
          const p = t.make(level);
          const info = sketchInfo(p);
          expect(info, 'senaryo yok').not.toBeNull();
          const { sketch, fallback } = info!;
          if (level === 1) expect(fallback, `${t.id} ${p.expr}`).toBe(false);
          expect(sketch.steps, `${t.id} ${p.expr}`).toBe(p.steps.length);
          expect(sketch.h).toBeGreaterThan(100);
          for (const it of sketch.items) {
            const txt = JSON.stringify(it);
            expect(txt, `${t.id} ${p.expr}`).not.toMatch(/NaN|undefined|Infinity/);
            for (const v of [...it.start, ...it.end]) {
              expect(v).toBeGreaterThan(-60);
              expect(v).toBeLessThan(700);
            }
          }
        }
      }
    });
  }
});
