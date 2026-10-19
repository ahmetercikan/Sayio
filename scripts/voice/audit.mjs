/**
 * Telaffuz denetimi: üretilmiş ses parçalarını ElevenLabs Scribe ile YAZIYA çevirir ve
 * beklenen cümleyle karşılaştırır. Yanlış okunan kelimeyi böyle yakalıyoruz.
 *
 *   npm run ses:denetle              # her cümle KALIBINDAN bir örnek (≈190 parça, hızlı ve ucuz)
 *   npm run ses:denetle -- --hepsi   # bütün parçalar (4.500+, pahalı)
 *   npm run ses:denetle -- --ara kurbağa    # yalnızca o kelimenin geçtiği parçalar
 *
 * Böyle bulunan gerçek hatalar (18 Ekim 2025): "Geri" → "Jerry", "Kurbağa" → "Kürbağa",
 * "Ali" → "Ale", "Can" → "Ken", "Saymadan" → "Seyma'dan", "Sayio" → "Sayo". Hepsi cümlenin
 * İLK kelimesindeydi; çözüm `previous_text` ve iki yazım düzeltmesi (src/lib/voiceText.ts).
 *
 * Not: Scribe küçük tonlama/ünlü kaymalarını düzeltip doğru yazabilir — yani bu denetim
 * "hata yok" derse ses kesin iyidir demek değil, ama çıkan her fark gerçek bir hatadır.
 */
import { existsSync, readFileSync } from 'node:fs';

const { sayilariYaziyaCevir } = await import('../../node_modules/.cache/sayio-voicetext.mjs');

for (const file of ['.env.local', '.env']) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const KEY = process.env.ELEVENLABS_API_KEY;
const die = (m) => {
  console.error(`\n✖ ${m}\n`);
  process.exit(1);
};
if (!KEY) die('ELEVENLABS_API_KEY yok (.env.local).');
if (!existsSync('voice/clips.json')) die('voice/clips.json yok. Önce: npm run ses:topla');

const args = process.argv.slice(2);
const hepsi = args.includes('--hepsi');
const ara = args.includes('--ara') ? new RegExp(args[args.indexOf('--ara') + 1], 'i') : null;

const OUT = 'public/voice';
const ext = existsSync(`${OUT}/manifest.json`) ? JSON.parse(readFileSync(`${OUT}/manifest.json`, 'utf8')).ext : 'm4a';
const { clips } = JSON.parse(readFileSync('voice/clips.json', 'utf8'));

/** Sayılar her soruda değişiyor; aynı cümlenin sayısı değişmiş hallerini tek kalıpta topla. */
const SAYI_SOZ = ['sıfır', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan', 'yüz', 'bin'];
const SAYI_RE = new RegExp(`\\b(${SAYI_SOZ.join('|')})[a-zçğıiöşü]*\\b`, 'giu');
const kalip = (t) =>
  t
    .replace(/-?\d+(?:['’][a-zçğıiöşü]+)?/giu, '#')
    .replace(SAYI_RE, '#')
    .replace(/#(\s*#)+/g, '#')
    .replace(/\s+/g, ' ')
    .trim();

let liste = clips.filter((c) => existsSync(`${OUT}/${c.key}.${ext}`));
if (ara) liste = liste.filter((c) => ara.test(c.text));
if (!hepsi) {
  const tek = new Map();
  for (const c of liste) if (!tek.has(kalip(c.text))) tek.set(kalip(c.text), c);
  liste = [...tek.values()];
}
if (!liste.length) die('Denetlenecek ses parçası bulunamadı.');
console.log(`${liste.length} parça denetleniyor (ElevenLabs Scribe)…`);

/** Karşılaştırma için sadeleştir: küçük harf, noktalama yok, rakamlar yazıyla. */
const sade = (s) =>
  sayilariYaziyaCevir(s)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
/** Kelime bölünmesi/birleşmesi gerçek hata değil ("iki ile" ↔ "ikiyle"): boşlukları da at. */
const cok = (s) => sade(s).replace(/\s+/g, '');

async function yaz(clip, deneme = 0) {
  const fd = new FormData();
  fd.append('model_id', 'scribe_v1');
  fd.append('language_code', 'tr');
  fd.append('file', new Blob([readFileSync(`${OUT}/${clip.key}.${ext}`)], { type: ext === 'm4a' ? 'audio/mp4' : 'audio/mpeg' }), `${clip.key}.${ext}`);
  const r = await fetch('https://api.elevenlabs.io/v1/speech-to-text', { method: 'POST', headers: { 'xi-api-key': KEY }, body: fd });
  if ((r.status === 429 || r.status >= 500) && deneme < 4) {
    await new Promise((x) => setTimeout(x, 1500 * 2 ** deneme));
    return yaz(clip, deneme + 1);
  }
  if (!r.ok) return { hata: `${r.status}` };
  return { metin: ((await r.json()).text || '').trim() };
}

/** İki kelime dizisini hizalayıp farkları döndürür (LCS). */
function farklar(A, B) {
  const m = A.length, k = B.length;
  const dp = Array.from({ length: m + 1 }, () => new Int32Array(k + 1));
  for (let i = m - 1; i >= 0; i--) for (let j = k - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out = [];
  let i = 0, j = 0;
  while (i < m && j < k) {
    if (A[i] === B[j]) { i++; j++; continue; }
    if (dp[i + 1][j] >= dp[i][j + 1]) out.push([A[i++], '—']);
    else out.push(['—', B[j++]]);
  }
  while (i < m) out.push([A[i++], '—']);
  while (j < k) out.push(['—', B[j++]]);
  return out;
}

const supheli = [];
const kuyruk = [...liste];
let sayac = 0;
await Promise.all(
  Array.from({ length: 4 }, async () => {
    for (;;) {
      const clip = kuyruk.shift();
      if (!clip) return;
      const r = await yaz(clip);
      if (++sayac % 10 === 0) process.stdout.write(`\r  ${sayac}/${liste.length}   `);
      if (r.hata) { supheli.push({ clip, duydu: `(yazıya çevrilemedi: ${r.hata})`, fark: [] }); continue; }
      if (cok(clip.text) === cok(r.metin)) continue;
      supheli.push({ clip, duydu: r.metin, fark: farklar(sade(clip.text).split(' '), sade(r.metin).split(' ')) });
    }
  }),
);
console.log('');

if (!supheli.length) {
  console.log(`\n✓ ${liste.length} parçanın hepsi beklendiği gibi okunuyor.`);
  process.exit(0);
}
const kelime = new Map();
for (const s of supheli) {
  console.log(`\n• beklenen: ${s.clip.text}`);
  console.log(`  duyulan : ${s.duydu}`);
  if (s.fark.length) console.log(`  fark    : ${s.fark.map(([a, b]) => `${a} → ${b}`).join(', ')}`);
  console.log(`  dosya   : ${OUT}/${s.clip.key}.${ext}`);
  for (const [a] of s.fark) if (a !== '—') kelime.set(a, (kelime.get(a) || 0) + 1);
}
console.log(`\n${liste.length} parça denetlendi, ${supheli.length} tanesinde fark var.`);
if (kelime.size) console.log('en sık bozulan kelimeler:', [...kelime].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([w, n]) => `${w}(${n})`).join(' '));
console.log('\nDüzeltme yolu: src/lib/voiceText.ts → telaffuzDuzelt(), sonra o parçaları sil ve `npm run ses:uret`.');
process.exit(1);
