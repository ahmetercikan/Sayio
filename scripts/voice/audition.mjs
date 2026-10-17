/**
 * Ses seçimi: birkaç aday sesle GERÇEK Sayio cümlelerini üretip birleştirir.
 *
 *   npm run ses:sec
 *
 * Her aday için voice/secim-<ad>.m4a dosyası yazar. Uygulamadaki gibi parça parça üretip
 * birleştirir — yani dinlediğin şey, çocuğun duyacağı şeyin aynısıdır.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const { splitForVoice, clipKey, clipBounds, sayilariYaziyaCevir, TIMING } = await import('../../node_modules/.cache/sayio-voicetext.mjs');

for (const f of ['.env.local', '.env']) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) {
  console.error('\n✖ ELEVENLABS_API_KEY yok (.env.local).\n');
  process.exit(1);
}
const MODEL = process.env.ELEVENLABS_MODEL_ID ?? 'eleven_multilingual_v2';
const API = 'https://api.elevenlabs.io/v1';

/**
 * Denenecek adaylar. `speed` sesin konuşma hızı (1 = normal, küçük = daha yayarak),
 * `gap` parçalar arasındaki boşluk çarpanı (1 = src/lib/voiceText.ts'teki değer).
 */
const ADAYLAR = JSON.parse(process.env.SAYIO_ADAYLAR ?? 'null') ?? [
  { ad: 'nino', id: 'GhGcstfCgEq9f007UKXu', aciklama: 'Nino — hikâye anlatıcısı, neşeli' },
  { ad: 'irem', id: 'R0D8QjgVyRju4HRoCrIC', aciklama: 'İrem — yumuşak, vurgulu' },
  { ad: 'ilke', id: 'uPxbcLLbS61WAxoePBhG', aciklama: 'Ilke — sıcak, doğal' },
  { ad: 'eda', id: '3gNXdVLnqjUKPR9NwCZ9', aciklama: 'Eda — sakin, yumuşak' },
];

/** Uygulamadan gerçek cümleler: sabit yönerge, soru, ders anlatımı, övgü. */
const CUMLELER = [
  'Merhaba! Ben Sayio. Matematiğin kolay yollarını birlikte keşfedeceğiz!',
  '7 artı 5 eşittir kaç',
  "9, 10'dan bir eksiktir. 6 çarpı 9: önce 6 çarpı 10 eşittir 60, sonra bir grup fazla aldık, 6'yı geri ver, 54.",
  "Deniz'in 12 balonu var. 5 tanesi uçtu. Kaç kaldı?",
  'Önce iki katını al: 4 artı 4 eşittir kaç',
  'Muhteşem! Üç yıldız! Kolay yolu çok iyi öğrendin.',
];

const RATE = 22050;
const TMP = 'node_modules/.cache/sayio-audition';
mkdirSync(TMP, { recursive: true });
/** Üretilen mp3'ler saklanır: aynı ses+hız+metin ikinci kez istenirse kredi harcanmaz. */
const cached = (aday, k) => resolve(TMP, `${aday.id}-${aday.speed ?? 1}-${k}.mp3`);
mkdirSync('voice', { recursive: true });

async function synth(voice, text, before, after, speed, attempt = 0) {
  const r = await fetch(`${API}/text-to-speech/${voice}?output_format=mp3_44100_64`, {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'content-type': 'application/json', accept: 'audio/mpeg' },
    body: JSON.stringify({
      text: sayilariYaziyaCevir(text),
      model_id: MODEL,
      // next_text KULLANILMIYOR: sesi yarıda kesiyor (bkz. docs/ses.md).
      previous_text: before ? sayilariYaziyaCevir(before) : undefined,
      voice_settings: {
        stability: 0.55,
        similarity_boost: 0.8,
        style: 0.15,
        use_speaker_boost: true,
        ...(speed && speed !== 1 ? { speed } : {}),
      },
    }),
  });
  if ((r.status === 429 || r.status >= 500) && attempt < 4) {
    await new Promise((res) => setTimeout(res, 1500 * 2 ** attempt));
    return synth(voice, text, before, after, speed, attempt + 1);
  }
  if (!r.ok) throw new Error(`${r.status}: ${(await r.text()).slice(0, 160)}`);
  return Buffer.from(await r.arrayBuffer());
}

function pcm(file) {
  const wav = resolve(TMP, 'x.wav');
  execFileSync('afconvert', ['-f', 'WAVE', '-d', `LEI16@${RATE}`, '-c', '1', file, wav]);
  const buf = readFileSync(wav);
  let p = 12;
  while (p + 8 < buf.length && buf.toString('latin1', p, p + 4) !== 'data') p += 8 + buf.readUInt32LE(p + 4);
  const n = buf.readUInt32LE(p + 4) / 2;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = buf.readInt16LE(p + 8 + i * 2) / 32768;
  return out;
}

/** src/lib/voice.ts ile aynı kırpma + tık önleyici yumuşatma. */
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

function wavFile(chunks, path) {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const b = Buffer.alloc(44 + total * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + total * 2, 4); b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(RATE, 24); b.writeUInt32LE(RATE * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(total * 2, 40);
  let o = 44;
  for (const c of chunks) for (const v of c) { b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v * 32767))), o); o += 2; }
  writeFileSync(path, b);
}

let credits = 0;
for (const aday of ADAYLAR) {
  const chunks = [];
  const silence = (sec) => chunks.push(new Float32Array(Math.round(RATE * sec)));
  const cache = new Map();
  process.stdout.write(`${aday.aciklama} … `);
  try {
    for (const cumle of CUMLELER) {
      const tokens = splitForVoice(cumle);
      const said = tokens.filter((t) => 'say' in t);
      for (const [i, tok] of tokens.entries()) {
        if ('pause' in tok) {
          // İşlem öbekleri arasındaki esi adaya göre ölçekle (karşılaştırma için).
          const k = tok.pause === TIMING.mathGap ? (aday.mathGap ?? 1) : 1;
          silence((tok.pause * k) / 1000);
          continue;
        }
        const k = clipKey(tok.say);
        if (!cache.has(k)) {
          const f = cached(aday, k);
          if (!existsSync(f)) {
            const j = said.findIndex((x) => x.say === tok.say && x === tok);
            const before = said.slice(Math.max(0, j - 2), j).map((x) => x.say).join(' ');
            const after = said.slice(j + 1, j + 3).map((x) => x.say).join(' ');
            writeFileSync(f, await synth(aday.id, tok.say, before, after, aday.speed));
            credits += tok.say.length;
          }
          cache.set(k, trim(pcm(f)));
        }
        chunks.push(cache.get(k));
        silence(TIMING.gap * (aday.gap ?? 1));
        void i;
      }
      silence(0.7);
    }
    const raw = resolve('voice', `secim-${aday.ad}.wav`);
    wavFile(chunks, raw);
    execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '48000', raw, resolve('voice', `secim-${aday.ad}.m4a`)]);
    rmSync(raw, { force: true });
    console.log(`✓ voice/secim-${aday.ad}.m4a`);
  } catch (e) {
    console.log(`✖ ${e.message}`);
  }
}
console.log(`\nHarcanan kredi: ~${credits.toLocaleString('tr')}`);
console.log('Dinlemek için:  open voice/');
