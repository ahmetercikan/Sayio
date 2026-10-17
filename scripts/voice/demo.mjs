/**
 * Bir cümleyi, uygulamadaki gibi parçaları birleştirerek tek dosyaya yazar — kulakla kontrol için.
 *
 *   npm run ses:dene "7 artı 5 eşittir kaç"
 *   npm run ses:dene                       # birkaç örnek cümle
 *
 * Çıktı: voice/deneme.m4a  (açmak için: open voice/deneme.m4a)
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const OUT = 'public/voice';
const TMP = 'node_modules/.cache/sayio-voice-demo';
const RATE = 22050;

const { splitForVoice, clipKey, clipBounds, TIMING } = await import('../../node_modules/.cache/sayio-voicetext.mjs');

/** Değerler src/lib/voiceText.ts'ten gelir (uygulama ile birebir aynı olsun diye). */
const { gap: GAP } = TIMING;

const manifestPath = `${OUT}/manifest.json`;
if (!existsSync(manifestPath)) {
  console.error('\n✖ Henüz ses üretilmemiş. Önce: npm run ses:uret (ya da denemek için: node scripts/voice/generate.mjs --local --sample 40)\n');
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const have = new Set(manifest.keys);
mkdirSync(TMP, { recursive: true });

const sentences = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const lines = sentences.length ? sentences : ['7 artı 5 eşittir kaç', '3 çarpı 4 eşittir kaç', '100 eksi 18 eşittir kaç'];

/** m4a → 22.05 kHz mono ham PCM (Float32). */
function pcm(key) {
  const wav = resolve(TMP, `${key}.wav`);
  execFileSync('afconvert', ['-f', 'WAVE', '-d', `LEI16@${RATE}`, '-c', '1', resolve(OUT, `${key}.${manifest.ext}`), wav]);
  const buf = readFileSync(wav);
  rmSync(wav, { force: true });
  // 'data' parçasını bul (WAV başlığı değişken uzunlukta olabilir).
  let p = 12;
  while (p + 8 < buf.length && buf.toString('latin1', p, p + 4) !== 'data') p += 8 + buf.readUInt32LE(p + 4);
  const n = buf.readUInt32LE(p + 4) / 2;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = buf.readInt16LE(p + 8 + i * 2) / 32768;
  return out;
}

/** src/lib/voice.ts'teki kırpmanın aynısı. */
function trim(d) {
  const { from, to } = clipBounds(d, RATE);
  const cut = d.slice(Math.round(from * RATE), Math.round(to * RATE));
  const f = Math.min(Math.round(TIMING.fade * RATE), Math.floor(cut.length / 4));
  for (let i = 0; i < f; i++) {
    cut[i] *= i / f;
    cut[cut.length - 1 - i] *= i / f;
  }
  return cut;
}

const chunks = [];
const silence = (sec) => chunks.push(new Float32Array(Math.round(RATE * sec)));
let missing = 0;
for (const line of lines) {
  for (const tok of splitForVoice(line)) {
    if ('pause' in tok) {
      silence(tok.pause / 1000);
      continue;
    }
    const key = clipKey(tok.say);
    if (!have.has(key)) {
      console.warn(`  ! parça yok: "${tok.say}"`);
      missing++;
      continue;
    }
    chunks.push(trim(pcm(key)));
    silence(GAP);
  }
  silence(0.6);
}

const total = chunks.reduce((n, c) => n + c.length, 0);
const wav = Buffer.alloc(44 + total * 2);
wav.write('RIFF', 0);
wav.writeUInt32LE(36 + total * 2, 4);
wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(RATE, 24);
wav.writeUInt32LE(RATE * 2, 28);
wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34);
wav.write('data', 36);
wav.writeUInt32LE(total * 2, 40);
let o = 44;
for (const c of chunks)
  for (const v of c) {
    wav.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v * 32767))), o);
    o += 2;
  }
mkdirSync('voice', { recursive: true });
const raw = resolve('voice', 'deneme.wav');
writeFileSync(raw, wav);
execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '48000', raw, resolve('voice', 'deneme.m4a')]);
rmSync(raw, { force: true });
console.log(`\n✓ voice/deneme.m4a  (${(total / RATE).toFixed(1)} sn, ${lines.length} cümle${missing ? `, ${missing} parça eksik` : ''})`);
console.log('  Dinle:  open voice/deneme.m4a\n');
