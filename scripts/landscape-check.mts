/**
 * Yatay düzen kontrolü: hiçbir düğme ekranın altında kalmasın.
 *   1) npm run dev   2) npm run yatay:kontrol
 *
 * Çocuk kaydırmayı bilmiyor; "Tamam" ya da "Kolay yolu göster" ekranın dışında kalırsa
 * soruyu hiç cevaplayamıyor. Bu betik gerçek ekranları gezer, görünür alanın altında
 * kalan düğme varsa listeler ve hata koduyla çıkar.
 */
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync } from 'node:fs';

const OUT = 'store/yatay';
mkdirSync(OUT, { recursive: true });
const SIZES = [
  { id: 'ipad-1133x744', w: 1133, h: 744 },
  { id: 'android-1280x800', w: 1280, h: 800 },
  { id: 'ipad-1024x768', w: 1024, h: 768 },
  { id: 'telefon-852x393', w: 852, h: 393 },
  { id: 'telefon-740x360', w: 740, h: 360 },
];
const seed = {
  state: {
    profiles: [{ id: 'd1', name: 'Elif', avatar: 'tilki', age: 8, band: 'usta', createdAt: Date.now() }],
    activeId: 'd1',
    data: { d1: { stars: 86, facts: {}, tricks: { 'carpim-7': { best: 3, plays: 2, level: 1 } }, days: {}, records: {}, badges: ['ilk-ders'], newBadges: [], solved: 10, words: 2 } },
    settings: { sfx: false, narration: false, rate: 1 },
  },
  version: 0,
};
const exe = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'].find((x) => existsSync(x));
if (!exe) throw new Error('Chrome bulunamadı');
const b = await chromium.launch({ executablePath: exe });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let kotu = 0;

for (const s of SIZES) {
  const p = await (await b.newContext({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: 1, hasTouch: true })).newPage();
  await p.goto('http://localhost:5290/');
  await p.evaluate((x) => localStorage.setItem('sayio-v1', JSON.stringify(x)), seed);
  await p.goto('http://localhost:5290/?l=1#/');
  await sleep(2200);
  const bak = async (name: string) => {
    const m = await p.evaluate(() => {
      const el = (document.querySelector('.lesson__main') || document.querySelector('.app__main') || document.scrollingElement) as HTMLElement;
      // Alt menü sabit duruyor: altında kalan düğme de görünmüyor sayılır.
      const bar = document.querySelector('.tabbar');
      const vh = bar ? Math.min(window.innerHeight, bar.getBoundingClientRect().top) : window.innerHeight;
      const dugmeler = [...document.querySelectorAll('button, a.pill, .option, .model-opt')].filter((x) => (x as HTMLElement).offsetParent !== null);
      // Tamamen altta kalan ya da yarısından fazlası kesilen düğmeler "görünmüyor" sayılır.
      const altta = dugmeler
        .filter((x) => { const r = x.getBoundingClientRect(); return r.top > vh - 8 || (r.bottom > vh && r.bottom - vh > r.height / 2); })
        .map((x) => (x.textContent || '').trim().slice(0, 22) || '[simge]');
      return { tasan: el.scrollHeight - el.clientHeight, gorunmeyen: [...new Set(altta)] };
    });
    if (m.gorunmeyen.length) kotu++;
    console.log(` ${name.padEnd(16)} taşma:${String(m.tasan).padStart(5)}px  görünmeyen: ${m.gorunmeyen.join(' | ') || '-'}`);
    await p.screenshot({ path: `${OUT}/${s.id}-${name}.png` });
  };
  const git = async (h: string, ms = 2000) => { await p.evaluate((x) => { location.hash = x; }, h); await sleep(ms); };
  console.log('==', s.id);
  await git('#/ders/carpim-7', 2500); await bak('01-kesfet');
  for (let i = 0; i < 4; i++) { const btn = await p.$('.intro__actions .pill:not(.pill--teal)'); if (!btn) break; await btn.click({ force: true }); await sleep(800); }
  await bak('02-kesfet-son');
  const teal = await p.$('.intro__actions .pill--teal'); if (teal) { await teal.click({ force: true }); await sleep(1800); }
  await bak('03-birlikte');
  await git('#/carpim/tur', 2400); await bak('04-gunun-turu');
  await git('#/antrenman', 2400); await bak('05-antrenman');
  await git('#/problemler'); await p.$eval('.pintro .pill--big', (e) => (e as HTMLElement).click()).catch(() => {}); await sleep(2000);
  await bak('06-problem');
  for (let i = 0; i < 6; i++) { const o = await p.$$('.option-list .option:not(.option--off)'); if (!o.length || (await p.$('.model-list'))) break; await o[0].click({ force: true }); await sleep(1200); }
  await bak('07-problem-model');
  await git('#/oyun/simsek'); await p.$eval('.pill', (e) => (e as HTMLElement).click()).catch(() => {}); await sleep(2500);
  await bak('08-oyun');
  await p.close();
}
await b.close();
console.log(kotu ? `\n${kotu} ekranda görünmeyen düğme var → store/yatay/ içindeki görüntülere bak` : '\nhepsi temiz: her düğme ekranda');
process.exit(kotu ? 1 : 0);
