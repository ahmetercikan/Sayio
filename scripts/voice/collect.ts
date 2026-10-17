/**
 * Seslendirilecek bütün CÜMLELERİ toplar → voice/clips.json
 *
 * Uygulamanın söyleyebileceği her cümle (tüm püf noktaları her zorluk seviyesinde binlerce kez,
 * tüm sözel problemler, sabit yönergeler) üretilir ve tekrarsız listeye yazılır. Her cümle
 * scripts/voice/generate.mjs tarafından **tek parça** seslendirilir.
 *
 * Neyi topluyoruz, neyi atlıyoruz:
 *  - Sabit yönergeler, ders fikirleri: hepsi (az sayıda, en çok duyulan cümleler).
 *  - 4-7 yaş (minik, kesif): hepsi. O yaşta anlatım otomatik açık ve çocuk okuyamıyor.
 *  - 8-14 yaş: yalnızca sabit metinler. Soruları sayılarla birlikte milyonlarca cümle eder;
 *    o yaşta anlatım otomatik açılmaz, çocuk ekrandan okur. Kaydı olmayan cümle cihaz sesine düşer.
 *
 *   npm run ses:topla
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fixedLines } from '../../src/lib/narration';
import { readable } from '../../src/lib/speech';
import { clipKey } from '../../src/lib/voiceText';
import { makeWordProblem } from '../../src/problems/word';
import { tricks } from '../../src/tricks';
import type { Band } from '../../src/tricks/types';

/** Her püf × her seviye kaç kez üretilsin? Yüksek sayı = daha eksiksiz kapsama. */
const ROUNDS = Number(process.env.SAYIO_VOICE_ROUNDS ?? 8000);
/** Sesli anlatımın otomatik açık olduğu yaş grupları. */
const KUCUK: Band[] = ['minik', 'kesif'];

const sentences = new Set<string>();
const add = (s?: string) => {
  if (!s) return;
  const t = readable(s);
  if (t) sentences.add(t);
};

// 1) Sabit yönergeler ve her püf noktasının anlatımı (her yaşta duyulur)
for (const line of fixedLines()) add(line);
for (const tr of tricks) add(tr.idea);

// 2) Küçüklerin soruları
for (const tr of tricks.filter((t) => KUCUK.includes(t.band)))
  for (let lvl = 1; lvl <= 3; lvl++)
    for (let i = 0; i < ROUNDS; i++) {
      const p = tr.make(lvl);
      add(p.ask);
      for (const s of p.steps) add(`${s.say} ${s.eq === '?' ? '' : s.eq}`);
    }

// 3) Küçüklerin sözel problemleri
for (const b of KUCUK)
  for (let i = 0; i < ROUNDS * 4; i++) {
    const wp = makeWordProblem(b);
    // askOptions ekranda seçenek olarak görünür, hiç seslendirilmez → üretme.
    add(wp.text);
    for (const s of wp.steps) add(`${s.say} ${s.eq === '?' ? '' : s.eq}`);
    if (wp.check) add(`${wp.check.say} ${wp.check.eq === '?' ? '' : wp.check.eq}`);
  }

const list = [...sentences].sort().map((text) => ({ key: clipKey(text), text }));
if (new Set(list.map((c) => c.key)).size !== list.length) throw new Error('Dosya adı çakışması var (clipKey)');

mkdirSync('voice', { recursive: true });
writeFileSync('voice/clips.json', JSON.stringify({ rounds: ROUNDS, clips: list }, null, 1));

const chars = list.reduce((n, c) => n + c.text.length, 0);
console.log(`cümle        : ${list.length.toLocaleString('tr')}`);
console.log(`karakter     : ${chars.toLocaleString('tr')}`);
console.log(`kredi (0,5×) : ${Math.round(chars / 2).toLocaleString('tr')}  (v4 Turbo yarı kredi harcar)`);
console.log(`tahmini boyut: ${Math.round(list.length * 0.013)} MB`);
console.log(`yazıldı      : voice/clips.json`);
