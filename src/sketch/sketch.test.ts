import { describe, expect, it } from 'vitest';
import { FAMILY_ORDER } from '../times/facts';
import { buildFor } from '../times/table';
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

/**
 * Çarpım tablosu her çarpanla çizilebilmeli. Günün turu (src/pages/TimesRound.tsx) dersin
 * seviyesine bakmadan `problemFor` ile soru kurar, yani 1 × 7 gibi çarpanlar da gelir.
 */
describe('çarpım tablosu eskizleri', () => {
  for (const f of FAMILY_ORDER)
    it(`${f}'ler: 1-10 arası her çarpanda kendi senaryosu`, () => {
      for (let x = 1; x <= 10; x++) {
        const p = buildFor(f, x);
        const info = sketchInfo(p);
        expect(info, 'senaryo yok').not.toBeNull();
        expect(info!.fallback, `${f} × ${x} genel eskize düştü`).toBe(false);
        expect(info!.sketch.steps).toBe(p.steps.length);
        for (const it of info!.sketch.items) {
          expect(JSON.stringify(it), `${f} × ${x}`).not.toMatch(/NaN|undefined|Infinity/);
          for (const v of [...it.start, ...it.end]) {
            expect(v, `${f} × ${x}`).toBeGreaterThan(-60);
            expect(v, `${f} × ${x}`).toBeLessThan(700);
          }
        }
      }
    });
});
