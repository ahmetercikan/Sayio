/**
 * Mağaza için ham ekran görüntüleri: gerçek uygulama gezilir, her ekran yakalanır.
 *   1) npm run dev   2) npx tsx scripts/store-shots.mts [phone|tablet|iphone|ipad]
 * Çıktı:
 *   Google Play: store/screenshots/{phone|tablet}-*.png (telefon 1080×1920, tablet 1920×1200)
 *   App Store:   store/screenshots/ios/{iphone|ipad}-*.png (iPhone 1206×2622, iPad 2064×2752)
 * Tarayıcı: Chrome ya da Edge. Bulunamazsa CHROME_PATH ile yolunu ver.
 */
import { chromium, type Page } from 'playwright-core';
import { existsSync, mkdirSync } from 'node:fs';

const URL = 'http://localhost:5290/';
const KIND = (process.argv[2] ?? 'phone') as keyof typeof VIEWS;
/** Her mağaza boyutu: CSS ölçüsü × deviceScaleFactor = istenen piksel. */
const VIEWS = {
  phone: { width: 405, height: 720, deviceScaleFactor: 1080 / 405 },   // Play telefon 1080×1920
  tablet: { width: 1280, height: 800, deviceScaleFactor: 1.5 },        // Play tablet 1920×1200
  iphone: { width: 402, height: 874, deviceScaleFactor: 3 },           // App Store iPhone 1206×2622
  ipad: { width: 1032, height: 1376, deviceScaleFactor: 2 },           // App Store iPad 13" 2064×2752
} as const;
const VIEW = VIEWS[KIND] ?? VIEWS.phone;
const OUT = KIND === 'iphone' || KIND === 'ipad' ? 'store/screenshots/ios' : 'store/screenshots';
mkdirSync(OUT, { recursive: true });

function browserPath(): string {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const guesses = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ];
  const found = guesses.find((g) => existsSync(g));
  if (!found) throw new Error('Chrome ya da Edge bulunamadı; CHROME_PATH ile yolunu ver.');
  return found;
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Mağaza görselinde hoş duran, çalışılmış bir profil. */
function seed() {
  const id = 'demo1234';
  const days: Record<string, { solved: number; correct: number; quest?: boolean }> = {};
  const d = new Date();
  for (let i = 0; i < 6; i++) {
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    days[k] = { solved: 14, correct: 12, quest: i > 0 };
    d.setDate(d.getDate() - 1);
  }
  // Çarpım tablosunun bir kısmı ezberlenmiş görünsün (kutu 4+ = "ezberledi").
  const facts: Record<string, { box: number; due: number; seen: number }> = {};
  const ezber = [[2,2],[2,3],[2,4],[2,5],[2,6],[2,7],[2,8],[2,9],[2,10],[5,3],[5,4],[5,5],[5,6],[5,7],[5,8],[10,3],[10,4],[10,6],[10,7],[10,9],[3,3],[3,4],[3,6],[4,4],[4,5],[9,3],[9,5]];
  for (const [a, b] of ezber) facts[`${Math.min(a,b)}x${Math.max(a,b)}`] = { box: 5, due: Date.now() + 864e5, seen: 6 };
  for (const [a, b] of [[6,6],[7,4],[7,8],[8,3],[8,6]]) facts[`${Math.min(a,b)}x${Math.max(a,b)}`] = { box: 2, due: Date.now() - 1e5, seen: 3 };

  const tricks: Record<string, { best: number; plays: number; level: number }> = {};
  for (const t of ['soldan-topla', 'yuvarla-duzelt', 'tekrarli-toplama', 'parcala-carp', 'dokuzun-sihri', 'carpim-2', 'carpim-5', 'carpim-10', 'carpim-3'])
    tricks[t] = { best: 3, plays: 2, level: 2 };
  tricks['carpim-9'] = { best: 2, plays: 1, level: 1 };

  return {
    state: {
      profiles: [{ id, name: 'Elif', avatar: 'tilki', age: 8, band: 'usta', createdAt: Date.now() - 12 * 864e5 }],
      activeId: id,
      data: {
        [id]: {
          stars: 86, facts, tricks, days,
          records: { simsek: 17, tahmin: 9 },
          badges: ['ilk-ders', 'uc-yildiz', 'bes-puf', 'elli-soru', 'seri-3', 'carpim-10', 'simsek', 'problem-5'],
          newBadges: [], solved: 168, words: 11,
        },
      },
      settings: { sfx: false, narration: false, rate: 1 },
    },
    version: 0,
  };
}

const b = await chromium.launch({ executablePath: browserPath() });
const ctx = await b.newContext({
  viewport: { width: VIEW.width, height: VIEW.height },
  deviceScaleFactor: VIEW.deviceScaleFactor,
  hasTouch: true,
  isMobile: KIND === 'phone' || KIND === 'iphone',
  locale: 'tr-TR',
});
const p: Page = await ctx.newPage();
const shot = async (n: string) => {
  await p.screenshot({ path: `${OUT}/${KIND}-${n}.png` });
  console.log('  ✓', n);
};
/** Adrese git ve yerleşmesini bekle (HashRouter). */
const go = async (hash: string, wait = 1400) => {
  await p.evaluate((h) => { location.hash = h; }, hash);
  await sleep(wait);
};
const click = async (sel: string, wait = 900) => {
  await p.click(sel, { force: true });
  await sleep(wait);
};

/** Ekrandaki adımın cevabını okuyup tuş takımına yazar (defterin dolması için). */
async function solveStep() {
  const txt = await p.innerText('.runner');
  const m = [...txt.matchAll(/(-?\d+)\s*([+\u2212\-\u00d7\u00f7])\s*(-?\d+)\s*=/g)].pop();
  if (!m) return false;
  const [a, op, b] = [Number(m[1]), m[2], Number(m[3])];
  const v = op === '+' ? a + b : op === '\u00d7' ? a * b : op === '\u00f7' ? a / b : a - b;
  await p.keyboard.type(String(v), { delay: 60 });
  await sleep(250);
  await p.keyboard.press('Enter');
  await sleep(1500);
  return true;
}

await p.goto(URL);
await p.evaluate((s) => localStorage.setItem('sayio-v1', JSON.stringify(s)), seed());
await p.goto(URL + '?s=1#/'); // sorgu değişsin ki sayfa gerçekten yeniden yüklensin
await sleep(2200);
// Animasyonlar bitsin, imleç görünmesin.
await p.addStyleTag({ content: '* { caret-color: transparent !important; }' });

console.log(KIND, '→', OUT);

// 1) Ana sayfa
await shot('01-ana-sayfa');

// 2) Defter eskizi: öğretmen gibi adım adım çizer (çarpımın 7'ler dersi)
await go('#/ders/carpim-7', 1800);
await click('.intro__actions .pill');
await click('.intro__actions .pill');
await sleep(1600);
await shot('02-defter');

// 3) Birlikte yapalım: iskele adımları + kalem çizimi (ilk adımlar çözülünce defter dolar)
while (await p.$('.intro__actions .pill:not(.pill--teal)')) await click('.intro__actions .pill:not(.pill--teal)', 1100);
await click('.intro__actions .pill--teal', 2000);
await solveStep();
await solveStep();
await shot('03-birlikte');

// 4) Çarpım haritası
await go('#/carpim', 1800);
await shot('04-carpim-harita');

// 5) Günün turu
await go('#/carpim/tur', 2000);
await shot('05-gunun-turu');

// 6) Sözel problem (çubuk modeli)
await go('#/problemler', 2000);
for (let i = 0; i < 3 && !(await p.$('.polya')); i++) {
  // Düğme nefes alıyor (pulse): normal tıklama "kararlı değil" diye bekler, doğrudan tetikle.
  await p.$eval('.pintro .pill--big', (el) => (el as HTMLElement).click()).catch(() => {});
  await sleep(1800);
}
// "Ne soruluyor?" şıklarını doğru olanı bulana dek dene (yanlış şık ceza değil, yönlendirme).
for (let i = 0; i < 6 && !(await p.$('.model-list')); i++) {
  const opts = await p.$$('.option-list .option:not(.option--off)');
  if (!opts.length) break;
  await opts[0].click({ force: true });
  await sleep(1400);
}
await sleep(900);
await shot('06-problem');

// 7) Oyun: Şimşek Tur
await go('#/oyun/simsek', 1200);
for (const sel of ['.pill--big', '.pill']) if (await p.$(sel)) { await click(sel, 2600); break; }
await shot('07-oyun');

// 8) Rozetler
await go('#/rozetler', 1600);
await shot('08-rozetler');

await b.close();
console.log('hazır:', OUT);
