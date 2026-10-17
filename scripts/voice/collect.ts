/**
 * Seslendirilecek bütün CÜMLELERİ toplar → voice/clips.json
 *
 * Buradaki tek kural şu: **uygulamanın ağzından çıkan cümleyi birebir üret.** Ekranda aynı adım
 * iki ayrı cümle olarak okunur ve ikisinin de kaydı olmalı:
 *   - Keşfet ekranı adımı açarken kutuyu DOLU okur:  "Önce 10 kere alalım, o kolay: 8 × 10 = 80"
 *   - Birlikte yapalım ekranı kutuyu BOŞ okur:       "Önce 10 kere alalım, o kolay: 8 × 10 = ?"
 *   - Sen yap / günün turu soruyu yönergeyle okur:   "Kolay yolu düşün ve cevapla! 8 × 5 = ?"
 *
 * Neyi topluyoruz, neyi atlıyoruz:
 *  - Sabit yönergeler, ders fikirleri: hepsi (az sayıda, en çok duyulan cümleler).
 *  - 4-7 yaş (minik, kesif): hepsi. O yaşta anlatım otomatik açık ve çocuk okuyamıyor.
 *  - **Çarpım tablosu: hepsi, her çarpan için.** 2. sınıf çocuğu konuyu dinleyerek anlıyor;
 *    bölüm 10 aile × 1-10 çarpan ile sınırlı olduğu için tamamı üretilebiliyor.
 *  - 8-14 yaş püf noktaları: yalnızca sabit metinler. Soruları sayılarla birlikte milyonlarca cümle
 *    eder; o yaşta anlatım otomatik açılmaz, çocuk ekrandan okur. Kaydı olmayan cümle cihaz sesine düşer.
 *
 *   npm run ses:topla
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { ASK_OLDER, ASK_YOUNG, fixedLines } from '../../src/lib/narration';
import { readable } from '../../src/lib/speech';
import { fmt } from '../../src/lib/util';
import { clipKey } from '../../src/lib/voiceText';
import { makeWordProblem } from '../../src/problems/word';
import { FAMILY_ORDER } from '../../src/times/facts';
import { buildFor } from '../../src/times/table';
import { tricks } from '../../src/tricks';
import type { Band, Problem, Step } from '../../src/tricks/types';

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

const eqOf = (eq: string) => (eq === '?' ? '' : eq);
/** "Birlikte yapalım": kutu boş sorulur. */
const stepAsked = (s: Step) => `${s.say} ${eqOf(s.eq)}`;
/** "Keşfet": adım açılırken cevap da söylenir. */
const stepTold = (s: Step) => `${s.say} ${eqOf(s.eq).replace('?', fmt(s.answer))}`;

/** Bir sorunun bütün adımları (iki okunuşla birlikte). */
function addSteps(p: Problem) {
  for (const s of p.steps) {
    add(stepAsked(s));
    add(stepTold(s));
  }
}

/**
 * "Sen yap" ve "günün turu": soru tek başına sorulur. Yönerge, sorunun kendi metni varsa o,
 * yoksa yaşa göre sabit yönergedir (src/components/ProblemRunner.tsx).
 */
function addSolo(p: Problem, older = false) {
  if (p.ask) add(`${p.ask} ${eqOf(p.expr)}`);
  else {
    add(`${ASK_YOUNG} ${eqOf(p.expr)}`);
    if (older) add(`${ASK_OLDER} ${eqOf(p.expr)}`);
  }
}

// 1) Sabit yönergeler ve her püf noktasının anlatımı (her yaşta duyulur)
for (const line of fixedLines()) add(line);
for (const tr of tricks) add(tr.idea);

// 2) Küçüklerin soruları
for (const tr of tricks.filter((t) => KUCUK.includes(t.band)))
  for (let lvl = 1; lvl <= 3; lvl++)
    for (let i = 0; i < ROUNDS; i++) {
      const p = tr.make(lvl);
      add(p.ask);
      addSolo(p);
      addSteps(p);
    }

// 3) Küçüklerin sözel problemleri
for (const b of KUCUK)
  for (let i = 0; i < ROUNDS * 4; i++) {
    const wp = makeWordProblem(b);
    // askOptions ekranda seçenek olarak görünür, hiç seslendirilmez → üretme.
    add(wp.text);
    for (const s of wp.steps) {
      add(stepAsked(s));
      add(stepTold(s));
    }
    if (wp.check) {
      add(stepAsked(wp.check));
      add(stepTold(wp.check));
    }
  }

// 4) Çarpım tablosu: 10 ailenin kolay yolu, 1-10 arası her çarpan için.
//    Hem ders (Keşfet/Birlikte/Sen yap) hem günün turu buradan çıkar; hepsi sesli.
for (const f of FAMILY_ORDER)
  for (let x = 1; x <= 10; x++) {
    const p = buildFor(f, x);
    addSteps(p);
    addSolo(p, true);
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
