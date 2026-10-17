/**
 * Seslendirilecek bütün parçaları toplar → voice/clips.json
 *
 * Uygulamanın söyleyebileceği her cümle (tüm püf noktaları her zorluk seviyesinde binlerce kez,
 * tüm sözel problemler, sabit yönergeler) üretilir, `splitForVoice` ile parçalara bölünür ve
 * tekrarsız parça listesi çıkarılır. Sonra scripts/voice/generate.ts bu listeyi seslendirir.
 *
 *   npm run ses:topla
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fixedLines } from '../../src/lib/narration';
import { readable } from '../../src/lib/speech';
import { clipKey, splitForVoice } from '../../src/lib/voiceText';
import { makeWordProblem } from '../../src/problems/word';
import { tricks } from '../../src/tricks';
import { BANDS } from '../../src/tricks/types';

/** Her püf × her seviye kaç kez üretilsin? Yüksek sayı = daha eksiksiz kapsama. */
const ROUNDS = Number(process.env.SAYIO_VOICE_ROUNDS ?? 6000);

const sentences = new Set<string>();
const addSentence = (s?: string) => {
  if (!s) return;
  const t = readable(s).replace(/\s+/g, ' ').trim();
  if (t) sentences.add(t);
};

for (const line of fixedLines()) addSentence(line);

for (const tr of tricks) {
  addSentence(tr.idea);
  for (let lvl = 1; lvl <= 3; lvl++)
    for (let i = 0; i < ROUNDS; i++) {
      const p = tr.make(lvl);
      addSentence(p.ask);
      for (const s of p.steps) addSentence(`${s.say} ${s.eq === '?' ? '' : s.eq}`);
    }
}

for (const b of BANDS)
  for (let i = 0; i < ROUNDS * 2; i++) {
    const wp = makeWordProblem(b.id);
    addSentence(wp.text);
    wp.askOptions.forEach(addSentence);
    for (const s of wp.steps) addSentence(`${s.say} ${s.eq === '?' ? '' : s.eq}`);
    if (wp.check) addSentence(`${wp.check.say} ${wp.check.eq === '?' ? '' : wp.check.eq}`);
  }

/**
 * Güvence: soru üreticileri rastgele çalıştığı için nadir bir sayı taramaya düşmemiş olabilir.
 * Eksik tek bir parça bütün cümleyi cihaz sesine düşürür; o yüzden küçük sayıların hepsini
 * ve görülmüş her sayı-eki birleşimini listeye ekliyoruz (sayı klipleri 1-4 karakter, çok ucuz).
 */
function pad(set: Set<string>) {
  const seen = [...set].flatMap((x) => [...x.matchAll(/-?[−]?\d+(?:['’][a-zçğıiöşü]+)?/giu)].map((m) => m[0]));
  const suffixes = new Set(seen.map((n) => n.match(/['’](\w+)$/)?.[1]).filter(Boolean) as string[]);
  const values = new Set(seen.map((n) => n.replace(/['’].*$/, '')));
  for (let n = 0; n <= 200; n++) values.add(String(n));
  const extra = new Set<string>();
  for (const v of values) {
    extra.add(v);
    // Yalnızca gerçekten kullanılmış ek-sayı birleşimlerini üret (hepsi × hepsi çok şişerdi).
    for (const suf of suffixes) if (seen.includes(`${v}'${suf}`)) extra.add(`${v}'${suf}`);
  }
  return extra;
}

/** Parça → (kaç kez geçti, örnek bir cümle). Örnek cümle, seslendirmede tonlama ipucu olarak kullanılır. */
const clips = new Map<string, { text: string; uses: number; before: string; after: string }>();
for (const s of sentences) {
  const parts = splitForVoice(s);
  const spoken = parts.filter((p): p is { say: string } => 'say' in p);
  spoken.forEach((p, i) => {
    const cur = clips.get(p.say);
    if (cur) {
      cur.uses++;
      return;
    }
    clips.set(p.say, {
      text: p.say,
      uses: 1,
      before: spoken.slice(Math.max(0, i - 2), i).map((x) => x.say).join(' '),
      after: spoken.slice(i + 1, i + 3).map((x) => x.say).join(' '),
    });
  });
}

// Sayı parçalarını tamamla
for (const num of pad(sentences))
  if (!clips.has(num)) clips.set(num, { text: num, uses: 0, before: '', after: '' });

const list = [...clips.values()]
  .sort((a, b) => b.uses - a.uses)
  .map((c) => ({ key: clipKey(c.text), ...c }));

const keys = new Set(list.map((c) => c.key));
if (keys.size !== list.length) throw new Error('Dosya adı çakışması var (clipKey)');

mkdirSync('voice', { recursive: true });
writeFileSync('voice/clips.json', JSON.stringify({ rounds: ROUNDS, clips: list }, null, 1));

const chars = list.reduce((n, c) => n + c.text.length, 0);
console.log(`cümle        : ${sentences.size.toLocaleString('tr')}`);
console.log(`ses parçası  : ${list.length.toLocaleString('tr')}`);
console.log(`karakter     : ${chars.toLocaleString('tr')}  (ElevenLabs bu kadar kredi harcar)`);
console.log(`yazıldı      : voice/clips.json`);
