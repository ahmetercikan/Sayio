/**
 * voice/clips.json içindeki parçaları ElevenLabs ile seslendirir → public/voice/*.m4a
 *
 *   npm run ses:ornek     # önce 12 parça üret, sesi beğendin mi diye dinle
 *   npm run ses:uret      # eksik olan bütün parçaları üret (yarıda kalırsa kaldığı yerden devam eder)
 *   npm run ses:sesler    # hesabındaki sesleri listeler (voice id seçmek için)
 *
 * Anahtar: .env.local dosyasına  ELEVENLABS_API_KEY=...  yaz (bu dosya git'e girmez).
 * Ses seçimi: .env.local içinde ELEVENLABS_VOICE_ID=... (varsayılan aşağıda).
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const { sayilariYaziyaCevir, telaffuzDuzelt, ONCEKI_METIN } = await import('../../node_modules/.cache/sayio-voicetext.mjs');

const OUT = 'public/voice';
const TMP = 'node_modules/.cache/sayio-voice';

/* ----------------------------------------------------------- ayarlar */

for (const file of ['.env.local', '.env']) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const KEY = process.env.ELEVENLABS_API_KEY;
// Rachel yerine Türkçe'de iyi çalışan çok dilli bir ses; `npm run ses:sesler` ile değiştirebilirsin.
const VOICE = process.env.ELEVENLABS_VOICE_ID ?? 'XB0fDUnXU5powFXDhCwa';
// v4 Turbo: karakter başına yarım kredi harcar, kalitesi multilingual v2 ile aynı duyuldu.
const MODEL = process.env.ELEVENLABS_MODEL_ID ?? 'eleven_v4_turbo';
const FORMAT = process.env.ELEVENLABS_FORMAT ?? 'mp3_44100_64';
const CONCURRENCY = Number(process.env.ELEVENLABS_CONCURRENCY ?? 3);
const API = 'https://api.elevenlabs.io/v1';

const args = process.argv.slice(2);
const sampleCount = args.includes('--sample') ? Number(args[args.indexOf('--sample') + 1] || 12) : 0;
const listVoices = args.includes('--voices');
/** --local: ElevenLabs yerine macOS'un kendi sesiyle üretir. Sadece düzeneği denemek için
 *  (ses yapay duyulur); gerçek sesler için anahtarla `npm run ses:uret` çalıştır. */
const local = args.includes('--local');

const die = (msg) => {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
};
if (!KEY && !local) die('ELEVENLABS_API_KEY yok. .env.local dosyasına ekle (bkz. docs/ses.md).');

/* ------------------------------------------------------------ sesler */

if (listVoices) {
  const r = await fetch(`${API}/voices`, { headers: { 'xi-api-key': KEY } });
  if (!r.ok) die(`Sesler alınamadı (${r.status}): ${await r.text()}`);
  const { voices } = await r.json();
  console.log('\nHesabındaki sesler — beğendiğinin ID\'sini .env.local içine ELEVENLABS_VOICE_ID olarak yaz:\n');
  for (const v of voices) console.log(`  ${v.voice_id}  ${v.name}${v.labels?.description ? ` — ${v.labels.description}` : ''}`);
  console.log('');
  process.exit(0);
}

/* ----------------------------------------------------------- üretim */

if (!existsSync('voice/clips.json')) die('voice/clips.json yok. Önce: npm run ses:topla');
const { clips } = JSON.parse(readFileSync('voice/clips.json', 'utf8'));
mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

/** macOS'ta afconvert var: mp3'ü küçük bir AAC (.m4a) dosyasına çevir. Yoksa mp3 kalsın. */
const hasAfconvert = (() => {
  try {
    execFileSync('which', ['afconvert'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
})();
const ext = hasAfconvert ? 'm4a' : 'mp3';

// Deneme sesiyle üretilmiş dosyaların üstüne gerçek ses gelmesin diye kaynağı manifestoda tutuyoruz.
const source = local ? 'local' : 'elevenlabs';
const prev = existsSync(`${OUT}/manifest.json`) ? JSON.parse(readFileSync(`${OUT}/manifest.json`, 'utf8')) : null;
if (prev && prev.source && prev.source !== source) {
  console.log(`Önceki sesler "${prev.source}" kaynaklıydı, şimdi "${source}" → eskiler siliniyor.`);
  for (const f of readdirSync(OUT)) if (f.endsWith('.m4a') || f.endsWith('.mp3')) rmSync(`${OUT}/${f}`);
}

const todo = (sampleCount ? clips.slice(0, sampleCount) : clips).filter((c) => !existsSync(`${OUT}/${c.key}.${ext}`));
if (!todo.length) {
  console.log('Bütün sesler zaten üretilmiş.');
} else {
  const chars = Math.round(todo.reduce((n, c) => n + c.text.length, 0) / 2);
  console.log(
    local
      ? `${todo.length.toLocaleString('tr')} parça DENEME sesiyle üretilecek (macOS "say") — gerçek ses değil.`
      : `${todo.length.toLocaleString('tr')} cümle üretilecek (~${chars.toLocaleString('tr')} kredi), ses: ${VOICE}, model: ${MODEL}`,
  );
}

/** Bir cümleyi baştan sona seslendirir. */
async function synth(clip, attempt = 0) {
  const r = await fetch(`${API}/text-to-speech/${VOICE}?output_format=${FORMAT}`, {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'content-type': 'application/json', accept: 'audio/mpeg' },
    body: JSON.stringify({
      // Rakamlar okunuşlarıyla gönderilir ("60" yerine "altmış"): rakam olarak gönderince
      // model telaffuzu aceleye getirip başını/sonunu yutuyor. Ölçüldü, bkz. docs/ses.md.
      text: telaffuzDuzelt(sayilariYaziyaCevir(clip.text)),
      // Okunmayan Türkçe bağlam: ilk kelimeyi yabancı dil sanmasın (bkz. voiceText.ts).
      previous_text: ONCEKI_METIN,
      model_id: MODEL,
      // Çocuklara anlatım: kararlı, net, biraz yayarak (hız 1'in altı = daha anlaşılır).
      voice_settings: {
        stability: 0.55,
        similarity_boost: 0.8,
        style: 0.15,
        use_speaker_boost: true,
        // 0.9: biraz yayarak, çocuğun takip edebileceği tempo (örneklerde seçilen ayar).
        speed: Number(process.env.ELEVENLABS_SPEED ?? 0.9),
      },
    }),
  });
  if (r.status === 429 || r.status >= 500) {
    if (attempt >= 5) throw new Error(`${r.status} — çok deneme yapıldı`);
    await new Promise((res) => setTimeout(res, 1500 * 2 ** attempt));
    return synth(clip, attempt + 1);
  }
  if (!r.ok) throw new Error(`${r.status}: ${(await r.text()).slice(0, 200)}`);
  return Buffer.from(await r.arrayBuffer());
}

let done = 0;
let failed = 0;
async function worker(queue) {
  for (;;) {
    const clip = queue.pop();
    if (!clip) return;
    try {
      if (local) {
        const aiff = resolve(TMP, `${clip.key}.aiff`);
        execFileSync('say', ['-v', process.env.SAY_VOICE ?? 'Yelda', '-o', aiff, '--', clip.text]);
        execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '32000', aiff, resolve(OUT, `${clip.key}.m4a`)]);
        rmSync(aiff, { force: true });
        done++;
        continue;
      }
      const mp3 = await synth(clip);
      if (hasAfconvert) {
        const tmp = resolve(TMP, `${clip.key}.mp3`);
        writeFileSync(tmp, mp3);
        // Küçük ve her yerde çalan AAC (iOS + Android + tarayıcı).
        execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '32000', tmp, resolve(OUT, `${clip.key}.m4a`)]);
        rmSync(tmp, { force: true });
      } else {
        writeFileSync(resolve(OUT, `${clip.key}.mp3`), mp3);
      }
    } catch (e) {
      failed++;
      console.error(`  ✖ "${clip.text.slice(0, 40)}" → ${e.message}`);
    }
    done++;
    if (done % 25 === 0 || done === todo.length) process.stdout.write(`\r  ${done}/${todo.length}   `);
  }
}

const queue = [...todo].reverse();
await Promise.all(Array.from({ length: Math.max(1, CONCURRENCY) }, () => worker(queue)));
if (todo.length) console.log('');

/* ---------------------------------------------------------- manifest */

const files = readdirSync(OUT).filter((f) => f.endsWith(`.${ext}`));
writeFileSync(
  `${OUT}/manifest.json`,
  JSON.stringify({ ext, source, voice: local ? 'macOS say' : VOICE, model: local ? '-' : MODEL, keys: files.map((f) => f.replace(`.${ext}`, '')).sort() }),
);
console.log(`\n✓ ${files.length.toLocaleString('tr')} cümle hazır → ${OUT}/  (eksik: ${(clips.length - files.length).toLocaleString('tr')}${failed ? `, hatalı: ${failed}` : ''})`);
if (sampleCount) console.log('  Dinlemek için:  open public/voice');
