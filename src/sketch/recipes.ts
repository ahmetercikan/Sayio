/**
 * Her püf noktası için defter eskizi senaryosu. Sayılar sorunun kendisinden okunur (her soru farklı çizilir).
 * Bir senaryo sorunun biçimini tanımazsa (ör. zor seviyedeki farklı bir varyant) genel eskize düşülür:
 * adımlar alt alta el yazısıyla yazılır, son cevap halkaya alınır.
 */
import { fmt } from '../lib/util';
import { FAMILIES } from '../times/facts';
import type { Problem } from '../tricks/types';
import { BL, CO, G, GR, SK, SU, TE, textW, type Box, type Sketch } from './build';

const X0 = 84;
type Recipe = (p: Problem, sk: SK) => boolean | void;

/** "(−5) + 8 = ?" → [-5, 8] */
function nums(s: string): number[] {
  const out: number[] = [];
  for (const m of s.matchAll(/\(−(\d+)\)|(\d+)/g)) out.push(m[1] ? -Number(m[1]) : Number(m[2]));
  return out;
}
const toks = (s: string) => s.split(' ').filter(Boolean);
const A = (p: Problem, i: number) => p.steps[i]?.answer ?? NaN;

/** Satır çok uzunsa yazı boyunu küçült. */
function fit(t: (string | number)[], size: number, max = 540) {
  const w = t.reduce<number>((s, x) => s + textW(String(x), size) + size * 0.3, 0);
  return w > max ? Math.max(26, Math.floor((size * max) / w)) : size;
}

function question(p: Problem, sk: SK, y = 80, size = 54) {
  sk.step(0);
  const t = toks(p.expr);
  return sk.row(X0, y, t, { size: fit(t, size) });
}

/** Adım denklemini cevabıyla yazar; cevap renkli. */
function eqRow(sk: SK, x: number, y: number, eq: string, ans: number, o: { size?: number; color?: string; ring?: boolean } = {}) {
  const t = toks(eq);
  const qi = t.indexOf('?');
  const filled = t.map((x) => (x === '?' ? fmt(ans) : x));
  const size = fit(filled, o.size ?? 46, 640 - x - 20);
  const b = sk.row(x, y, filled, { size, colors: { [qi]: o.color ?? TE } });
  if (o.ring && qi >= 0) sk.ringBox(b[qi], CO);
  return b;
}

const qBox = (q: Box[]) => q.find((b) => b.t === '?');
const finish = (sk: SK, q: Box[], ans: number) => {
  const b = qBox(q);
  if (b) sk.fill(b, fmt(ans));
};

// ------------------------------------------------------------------------------------------------
// Çarpım kutusu (dizi modeli) — çarpım tablosu derslerinin ortak tahtası
// ------------------------------------------------------------------------------------------------

const GX = 348, GY = 140, GW = 286, GH = 250;

interface Grid { x: number; y: number; cell: number; W: number; H: number; cx: (c: number) => number; cy: (r: number) => number }

/**
 * Çarpımın kutusu: `rows` satır × `cols` sütun. Kareler hep kare kalır (oran bozulmasın),
 * kutu sağ alana ortalanır. Satır/sütun çizgileri tek kalem darbesi olarak çizilir ki
 * 10 × 10'luk kutu bile hızlı çizilsin. Kenarda satır ve sütun sayısı yazılıdır.
 */
function board(sk: SK, rows: number, cols: number, o: { split?: number } = {}): Grid {
  const cell = Math.min(40, GW / cols, GH / rows);
  const W = cell * cols, H = cell * rows;
  const x = GX + (GW - W) / 2, y = GY;
  sk.rect(x, y, W, H);
  let dr = '';
  for (let r = 1; r < rows; r++) dr += `M${x + 3},${y + r * cell} L${x + W - 3},${y + r * cell} `;
  if (dr) sk.path(dr, [x + 3, y + cell], [x + W - 3, y + (rows - 1) * cell], { w: 1.6 });
  let dc = '';
  for (let c = 1; c < cols; c++) dc += `M${x + c * cell},${y + 3} L${x + c * cell},${y + H - 3} `;
  if (dc) sk.path(dc, [x + cell, y + 3], [x + (cols - 1) * cell, y + H - 3], { w: 1.6 });
  sk.text(x + W / 2, y - 13, cols, { size: 26, color: BL, anchor: 'middle' });
  sk.text(x - 11, y + H / 2 + 9, rows, { size: 26, color: BL, anchor: 'end' });
  if (o.split && o.split < cols) sk.line(x + o.split * cell, y - 8, x + o.split * cell, y + H + 8, { color: SU, w: 3 });
  return { x, y, cell, W, H, cx: (c) => x + c * cell, cy: (r) => y + r * cell };
}

/** Kutunun sütun aralığını boyar. */
const paintCols = (sk: SK, g: Grid, c1: number, c2: number, color: string) =>
  sk.hatch(g.cx(c1) + 3, g.y + 3, (c2 - c1) * g.cell - 6, g.H - 6, color);
/** Kutunun satır aralığını boyar. */
const paintRows = (sk: SK, g: Grid, r1: number, r2: number, color: string) =>
  sk.hatch(g.x + 3, g.cy(r1) + 3, g.W - 6, (r2 - r1) * g.cell - 6, color);
/**
 * Kutunun altına kısa not (boyanan parçanın ne olduğu). Sağ kenara yaslanır — ortalanınca
 * uzun notlar defterin dışına taşıyor. Sol sütundaki denklemlerin de altına iner.
 */
const noteY = (g: Grid) => g.y + g.H + 34;
const note = (sk: SK, g: Grid, t: string, color: string) =>
  sk.text(g.x + g.W, noteY(g), t, { size: 25, color, anchor: 'end' });

/**
 * Ailenin tek satırlık kuralı, defterin en altına — öğretmenin tahtaya yazdığı sonuç.
 * `y` sol sütunun bittiği yer; kutu daha aşağı iniyorsa kural onun da altına geçer.
 */
function rule(sk: SK, p: Problem, g: Grid, y: number) {
  const f = Object.values(FAMILIES).find((x) => x.trickId === p.trickId);
  if (f) sk.text(X0, Math.max(y, noteY(g) + 44), f.short, { size: 26, color: SU });
}

/** Tek adımlı derslerde: cevabı sorunun kutusuna yaz ve halkaya al. */
const crown = (sk: SK, q: Box[], ans: number) => {
  const b = qBox(q);
  if (!b) return;
  sk.fill(b, fmt(ans));
  sk.ringBox(b);
};

// ------------------------------------------------------------------------------------------------
// Genel eskiz (yedek)
// ------------------------------------------------------------------------------------------------
function generic(p: Problem, sk: SK) {
  const q = question(p, sk);
  let y = 80;
  p.steps.forEach((s, i) => {
    sk.step(i + 1);
    y += 68;
    sk.text(X0 - 8, y, '→', { size: 34, color: SU });
    eqRow(sk, X0 + 34, y, s.eq, s.answer, { ring: i === p.steps.length - 1 });
  });
  finish(sk, q, p.answer);
}

// ------------------------------------------------------------------------------------------------
// Minikler
// ------------------------------------------------------------------------------------------------
const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[26, 26], [50, 50], [74, 74]], 4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[26, 26], [74, 26], [50, 50], [26, 74], [74, 74]], 6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]],
};
function die(sk: SK, x: number, y: number, n: number, color: string) {
  sk.rect(x, y, 140, 140, { w: 3.2 });
  for (const [px, py] of PIPS[n] ?? []) sk.dot(x + px * 1.4, y + py * 1.4, 12, color);
}

const R: Record<string, Recipe> = {
  'sayma-gor': (p, sk) => {
    const n = p.answer;
    sk.step(0);
    die(sk, X0, 40, Math.min(n, 5), CO);
    if (n > 5) die(sk, X0 + 170, 40, n - 5, TE);
    const box = sk.row(n > 5 ? 460 : 300, 140, ['=', '?'], { size: 60 })[1];
    sk.step(1);
    if (n > 5) {
      sk.text(X0 + 70, 230, '5', { size: 40, color: CO, anchor: 'middle' });
      sk.text(X0 + 240, 230, n - 5, { size: 40, color: TE, anchor: 'middle' });
      sk.text(X0 + 155, 230, '+', { size: 40, anchor: 'middle' });
    } else sk.text(X0 + 70, 230, n === 5 ? '4 köşe + 1 orta' : 'zar yüzü!', { size: 32, color: TE, anchor: 'middle' });
    sk.fill(box, n);
    sk.ringBox(box);
  },

  'bir-fazla': (p, sk) => {
    const [n, by] = nums(p.expr);
    const up = p.expr.includes('+');
    const q = question(p, sk);
    const X = sk.numberLine(X0, 590, 230, 0, 10, 'all');
    sk.ring(X(n), 196, 15, 13, { color: GR });
    sk.dot(X(n) - 5, 192, 2.5, G);
    sk.dot(X(n) + 5, 192, 2.5, G);
    sk.step(1);
    let v = n;
    for (let i = 0; i < by; i++) {
      const nx = v + (up ? 1 : -1);
      sk.hop(X(v), X(nx), 214, up ? '+1' : '−1', up ? CO : TE, 40);
      v = nx;
    }
    sk.ring(X(v), 262, 18, 20, { color: CO });
    finish(sk, q, p.answer);
  },

  'besli-cerceve': (p, sk) => {
    const r = p.answer - 5;
    const q = question(p, sk);
    const c = sk.frame(X0, 120);
    for (let i = 0; i < 5; i++) sk.dot(c[i][0], c[i][1], 15, CO);
    for (let i = 0; i < r; i++) sk.dot(c[5 + i][0], c[5 + i][1], 15, TE);
    sk.step(1);
    sk.text(X0 + 300, 162, '← bir el: 5', { size: 32, color: CO });
    sk.text(X0 + 300, 216, `← ${r}`, { size: 32, color: TE });
    sk.step(2);
    finish(sk, q, p.answer);
    sk.ringBox(qBox(q)!);
  },

  'buyukten-say': (p, sk) => {
    const [a, b] = nums(p.expr);
    const big = Math.max(a, b), small = Math.min(a, b);
    const q = question(p, sk);
    sk.step(1);
    const bb = q[a >= b ? 0 : 2];
    sk.ringBox(bb, CO);
    sk.text(bb.cx, bb.y + 46, 'büyük!', { size: 28, color: CO, anchor: 'middle' });
    sk.step(2);
    const y = 230;
    let x = X0 + 10;
    sk.text(x, y, big, { size: 46, color: CO, anchor: 'middle' });
    for (let i = 1; i <= small; i++) {
      const nx = x + 80;
      sk.hop(x + 8, nx - 8, y - 36, '+1', TE, 34);
      const t = sk.text(nx, y, big + i, { size: 46, anchor: 'middle' });
      if (i === small) sk.ringBox(t);
      x = nx;
    }
    finish(sk, q, p.answer);
  },

  'ucan-balon': (p, sk) => {
    const [total, fly] = nums(p.expr);
    const q = question(p, sk, 64);
    const cols = [CO, TE, SU, BL, '#8e5bd8', '#e2457c'];
    const xs = Array.from({ length: total }, (_, i) => X0 + 26 + i * 52);
    xs.forEach((x, i) => {
      sk.ring(x, 180, 20, 26, { color: cols[i % 6], w: 3 });
      sk.line(x, 208, x + 3, 270, { w: 2 });
    });
    sk.step(1);
    for (let i = total - fly; i < total; i++) {
      sk.cross(xs[i], 180, 14, CO);
      sk.arrow(xs[i] + 16, 150, xs[i] + 26, 130, { color: CO, w: 2.4 });
    }
    sk.text(xs[total - 1] + 30, 128, `${fly} uçtu`, { size: 28, color: CO, anchor: 'end' });
    sk.step(2);
    for (let i = 0; i < total - fly; i++) sk.text(xs[i], 310, i + 1, { size: 32, color: TE, anchor: 'middle' });
    finish(sk, q, p.answer);
    sk.ringBox(qBox(q)!);
  },

  // ----------------------------------------------------------------------------------------------
  // Kaşifler
  // ----------------------------------------------------------------------------------------------
  'onun-arkadaslari': (p, sk) => {
    const a = nums(p.expr)[0];
    const q = question(p, sk);
    const c = sk.frame(X0, 120);
    for (let i = 0; i < a; i++) sk.dot(c[i][0], c[i][1], 15, CO);
    sk.step(1);
    for (let i = a; i < 10; i++) sk.text(c[i][0], c[i][1] + 12, i - a + 1, { size: 32, color: TE, anchor: 'middle' });
    ['1 + 9', '2 + 8', '3 + 7', '4 + 6', '5 + 5'].forEach((t, i) => sk.text(430, 136 + i * 30, t, { size: 26, color: i + 1 === Math.min(a, 10 - a) ? CO : G }));
    finish(sk, q, p.answer);
    sk.ringBox(qBox(q)!);
  },

  'ona-tamamla': (p, sk) => {
    const [a, b] = nums(p.expr);
    const need = A(p, 0), rest = A(p, 1);
    if (p.steps.length !== 3) return false;
    const base = 10 - need;
    const bi = a === base ? 0 : 2, oi = 2 - bi;
    const q = question(p, sk, 110);
    const ob = q[oi], bb = q[bi];
    sk.step(1);
    sk.bond(ob.cx, ob.y + 14, need, rest, { side: 'L', cl: TE });
    sk.arrow(ob.cx - 44 + (bi < oi ? -24 : 24), 200, bb.cx, bb.y + 18, { color: TE, bend: bi < oi ? -30 : 30 });
    sk.text(Math.max(bb.cx, X0 + 40), 52, `${base} + ${need} = 10`, { size: 30, color: TE, anchor: 'middle' });
    sk.step(2);
    sk.bond(ob.cx, ob.y + 14, need, rest, { side: 'R', cr: CO });
    sk.step(3);
    eqRow(sk, X0, 300, `10 + ${rest} = ?`, a + b, { size: 50, color: CO, ring: true });
    finish(sk, q, p.answer);
  },

  ikizler: (p, sk) => {
    const n = nums(p.expr)[0];
    const q = question(p, sk, 130);
    sk.step(1);
    sk.arrow(q[0].cx, q[0].y - 50, q[2].cx, q[2].y - 50, { color: TE, bend: -26 });
    sk.text((q[0].cx + q[2].cx) / 2, 50, 'ikiz!', { size: 28, color: TE, anchor: 'middle' });
    eqRow(sk, X0, 230, `2 × ${n} = ?`, 2 * n, { size: 50, color: CO, ring: true });
    sk.text(X0 + 330, 230, `(iki tane ${n})`, { size: 28, color: G });
    finish(sk, q, p.answer);
  },

  'ikizler-bir': (p, sk) => {
    const [a, b] = nums(p.expr);
    const n = Math.min(a, b);
    const q = question(p, sk);
    const big = q[a > b ? 0 : 2];
    sk.step(1);
    sk.bond(big.cx, big.y + 14, n, 1, { cl: TE, cr: CO });
    const r = eqRow(sk, X0, 260, `${n} + ${n} = ?`, 2 * n, { size: 46 });
    sk.text((r[0].cx + r[2].cx) / 2, 304, 'ikizler', { size: 26, color: TE, anchor: 'middle' });
    sk.step(2);
    eqRow(sk, X0, 372, `${2 * n} + 1 = ?`, 2 * n + 1, { size: 46, color: CO, ring: true });
    finish(sk, q, p.answer);
  },

  'farki-bul': (p, sk) => {
    const [a, b] = nums(p.expr);
    const q = question(p, sk);
    const X = sk.numberLine(X0 + 20, 580, 250, b - 1, a + 1, [b, 10, a]);
    sk.step(1);
    sk.hop(X(b), X(10), 246, `+${10 - b}`, CO);
    sk.step(2);
    sk.hop(X(10), X(a), 246, `+${a - 10}`, TE);
    sk.step(3);
    eqRow(sk, X0, 350, `${10 - b} + ${a - 10} = ?`, a - b, { color: CO, ring: true });
    finish(sk, q, p.answer);
  },

  'ondan-gec': (p, sk) => {
    const [a, b] = nums(p.expr);
    const ones = a - 10, rest = b - ones, ans = a - b;
    const q = question(p, sk);
    const X = sk.numberLine(X0 + 20, 580, 300, ans - 1, a + 1, [ans, 10, a]);
    sk.step(1);
    sk.hop(X(a), X(10), 296, `−${ones}`, TE);
    sk.step(2);
    sk.bond(q[2].cx, q[2].y + 14, ones, rest, { cl: TE, cr: CO });
    sk.step(3);
    sk.hop(X(10), X(ans), 296, `−${rest}`, CO);
    sk.ring(X(ans), 326, 22, 22, { color: CO });
    finish(sk, q, p.answer);
  },

  // ----------------------------------------------------------------------------------------------
  // Ustalar
  // ----------------------------------------------------------------------------------------------
  'soldan-topla': (p, sk) => {
    if (p.steps.length !== 3) return false;
    const [a, b] = nums(p.expr);
    const At = Math.floor(a / 10) * 10, Bt = Math.floor(b / 10) * 10;
    sk.step(0);
    const q = sk.row(X0, 80, toks(p.expr), { size: 54, gap: 44 });
    sk.step(1);
    sk.bond(q[0].cx, q[0].y + 14, At, a % 10, { cl: TE, cr: CO, spread: 32, r: 22 });
    sk.bond(q[2].cx, q[2].y + 14, Bt, b % 10, { cl: TE, cr: CO, spread: 32, r: 22 });
    eqRow(sk, X0, 260, `${At} + ${Bt} = ?`, At + Bt, { size: 44, color: TE });
    sk.text(470, 260, 'onluklar', { size: 28, color: TE });
    sk.step(2);
    eqRow(sk, X0, 320, `${a % 10} + ${b % 10} = ?`, (a % 10) + (b % 10), { size: 44, color: CO });
    sk.text(470, 320, 'birlikler', { size: 28, color: CO });
    sk.step(3);
    eqRow(sk, X0, 390, `${At + Bt} + ${(a % 10) + (b % 10)} = ?`, a + b, { size: 50, color: CO, ring: true });
    finish(sk, q, p.answer);
  },

  'yuvarla-duzelt': (p, sk) => {
    const [a, b] = nums(p.expr);
    const R0 = A(p, 0), k = R0 - a;
    const q = question(p, sk, 150);
    sk.step(1);
    sk.arrow(q[0].cx, q[0].y - 52, q[0].cx, 70, { color: TE });
    sk.text(q[0].cx, 56, R0, { size: 40, color: TE, anchor: 'middle' });
    sk.text(q[0].cx + 12, 100, `+${k}`, { size: 26, color: TE });
    sk.step(2);
    eqRow(sk, X0, 240, `${R0} + ${b} = ?`, R0 + b, { size: 46 });
    sk.step(3);
    eqRow(sk, X0, 310, `${R0 + b} − ${k} = ?`, a + b, { size: 46, color: CO, ring: true });
    sk.text(X0 + 330, 310, `fazlayı geri ver!`, { size: 28, color: CO });
    finish(sk, q, p.answer);
  },

  'sabit-fark': (p, sk) => {
    const [a, b] = nums(p.expr);
    const k = A(p, 0) - b;
    const q = question(p, sk, 160);
    const up = (b0: Box, v: number) => {
      sk.arrow(b0.cx, b0.y - 50, b0.cx, 76, { color: TE });
      sk.text(b0.cx + 10, 104, `+${k}`, { size: 26, color: TE });
      sk.text(b0.cx, 58, v, { size: 40, color: TE, anchor: 'middle' });
    };
    sk.step(1);
    up(q[2], b + k);
    sk.step(2);
    up(q[0], a + k);
    const nx = Math.min(Math.max(q[q.length - 1].x2 + 24, 400), 470);
    sk.text(nx, 96, 'ikisine de +' + k, { size: 26, color: SU });
    sk.text(nx, 124, 'fark değişmez!', { size: 26, color: SU });
    sk.step(3);
    eqRow(sk, X0, 260, `${a + k} − ${b + k} = ?`, a - b, { size: 50, color: CO, ring: true });
    finish(sk, q, p.answer);
  },

  'tekrarli-toplama': (p, sk) => {
    const [a, b] = nums(p.expr);
    const q = question(p, sk);
    const gap = Math.min(34, 300 / b);
    for (let r = 0; r < a; r++) for (let c = 0; c < b; c++) sk.dot(X0 + 14 + c * gap, 130 + r * 40, 10, CO);
    const lx = X0 + 14 + b * gap + 10;
    sk.step(1);
    for (let r = 0; r < Math.min(2, a); r++) sk.text(lx, 140 + r * 40, `→ ${b * (r + 1)}`, { size: 30, color: TE });
    sk.step(2);
    for (let r = 2; r < a; r++) sk.text(lx, 140 + r * 40, `→ ${b * (r + 1)}`, { size: 30, color: r === a - 1 ? CO : TE });
    eqRow(sk, X0, 150 + a * 40 + 40, `${a} × ${b} = ?`, a * b, { size: 46, color: CO, ring: true });
    finish(sk, q, p.answer);
  },

  'parcala-carp': (p, sk) => {
    const [a, b] = nums(p.expr);
    const s = A(p, 0) / a, r = b - s;
    const q = question(p, sk);
    sk.step(1);
    sk.bond(q[2].cx, q[2].y + 14, s, r, { cl: TE, cr: CO });
    eqRow(sk, X0, 260, `${a} × ${s} = ?`, a * s, { size: 44, color: TE });
    const rx = 400, ry = 210, W = 200, H = 110, sw = (W * s) / b;
    sk.rect(rx, ry, W, H);
    sk.line(rx + sw, ry, rx + sw, ry + H, { w: 2.6 });
    sk.hatch(rx + 3, ry + 3, sw - 6, H - 6, TE);
    sk.text(rx + sw / 2, ry - 10, s, { size: 26, color: TE, anchor: 'middle' });
    sk.text(rx - 14, ry + H / 2 + 8, a, { size: 26, anchor: 'end' });
    sk.step(2);
    eqRow(sk, X0, 320, `${a} × ${r} = ?`, a * r, { size: 44, color: CO });
    sk.hatch(rx + sw + 3, ry + 3, W - sw - 6, H - 6, CO);
    sk.text(rx + sw + (W - sw) / 2, ry - 10, r, { size: 26, color: CO, anchor: 'middle' });
    sk.step(3);
    eqRow(sk, X0, 390, `${a * s} + ${a * r} = ?`, a * b, { size: 50, color: CO, ring: true });
    finish(sk, q, p.answer);
  },

  'dokuzun-sihri': (p, sk) => {
    const n = nums(p.expr)[1];
    const q = question(p, sk, 120);
    sk.step(1);
    sk.arrow(q[0].cx, q[0].y - 52, q[0].cx, 60, { color: TE });
    sk.text(q[0].cx, 46, '10', { size: 40, color: TE, anchor: 'middle' });
    sk.text(q[0].cx + 34, 84, '(10 − 1)', { size: 26, color: TE });
    eqRow(sk, X0, 210, `10 × ${n} = ?`, 10 * n, { size: 46, color: TE });
    sk.step(2);
    eqRow(sk, X0, 280, `${10 * n} − ${n} = ?`, 9 * n, { size: 46, color: CO, ring: true });
    sk.text(X0 + 330, 280, `bir tane ${n} fazlaydı`, { size: 26, color: CO });
    finish(sk, q, p.answer);
  },

  'yarila-katla': (p, sk) => {
    const [a, m] = nums(p.expr);
    const q = question(p, sk);
    if (m === 25 && p.steps.length === 2) {
      sk.step(1);
      sk.arrow(q[0].cx, q[0].y + 16, q[0].cx, 170, { color: TE });
      sk.text(q[0].cx + 12, 138, '÷4', { size: 28, color: TE });
      sk.text(q[0].cx, 210, a / 4, { size: 44, color: TE, anchor: 'middle' });
      sk.arrow(q[2].cx, q[2].y + 16, q[2].cx, 170, { color: CO });
      sk.text(q[2].cx + 12, 138, '×4', { size: 28, color: CO });
      sk.text(q[2].cx, 210, 100, { size: 44, color: CO, anchor: 'middle' });
      sk.step(2);
      eqRow(sk, X0, 290, `${a / 4} × 100 = ?`, a * 25, { size: 50, color: CO, ring: true });
      finish(sk, q, p.answer);
      return;
    }
    if (p.steps.length !== 3) return false;
    sk.step(1);
    sk.arrow(q[0].cx, q[0].y + 16, q[0].cx, 170, { color: TE });
    sk.text(q[0].cx + 12, 138, '÷2', { size: 28, color: TE });
    sk.text(q[0].cx, 210, a / 2, { size: 44, color: TE, anchor: 'middle' });
    sk.step(2);
    sk.arrow(q[2].cx, q[2].y + 16, q[2].cx, 170, { color: CO });
    sk.text(q[2].cx + 12, 138, '×2', { size: 28, color: CO });
    sk.text(q[2].cx, 210, 10, { size: 44, color: CO, anchor: 'middle' });
    sk.text(q[2].cx + 60, 200, 'sonuç aynı kalır!', { size: 26, color: SU });
    sk.step(3);
    eqRow(sk, X0, 290, `${a / 2} × 10 = ?`, a * 5, { size: 50, color: CO, ring: true });
    finish(sk, q, p.answer);
  },

  'esit-paylastir': (p, sk) => {
    const [total, g] = nums(p.expr);
    const per = total / g;
    const q = question(p, sk);
    const pw = Math.min(120, 500 / g);
    const cx = (i: number) => X0 + pw / 2 + i * (pw + 12);
    for (let i = 0; i < g; i++) sk.ring(cx(i), 210, pw / 2, 52, { color: G, w: 2.6 });
    const pos = (k: number) => [((k % 3) - 1) * 22, (Math.floor(k / 3) - 1) * 22 - 4] as const;
    sk.step(1);
    for (let i = 0; i < g; i++) sk.dot(cx(i) + pos(0)[0], 210 + pos(0)[1], 9, CO);
    sk.step(2);
    for (let k = 1; k < per; k++) for (let i = 0; i < g; i++) sk.dot(cx(i) + pos(k)[0], 210 + pos(k)[1], 9, [CO, TE, SU, BL][k % 4]);
    for (let i = 0; i < g; i++) sk.text(cx(i), 300, per, { size: 34, color: TE, anchor: 'middle' });
    finish(sk, q, p.answer);
    sk.ringBox(qBox(q)!);
  },

  'carpmayi-dusun': (p, sk) => {
    const [n, b] = nums(p.expr);
    const q = question(p, sk);
    sk.step(1);
    sk.arrow(X0 - 10, 96, X0 - 6, 160, { color: SU, bend: -24 });
    sk.text(X0 + 340, 130, 'ters işlem!', { size: 28, color: SU });
    const r = sk.row(X0 + 20, 180, [b, '×', '?', '=', n], { size: 46 });
    sk.fill(r[2], n / b, TE);
    sk.step(2);
    finish(sk, q, p.answer);
    sk.ringBox(qBox(q)!);
  },

  'bese-bol': (p, sk) => {
    const n = nums(p.expr)[0];
    const k = n / 5;
    const q = question(p, sk);
    sk.step(1);
    eqRow(sk, X0, 180, `${n} × 2 = ?`, 2 * n, { size: 46, color: TE });
    sk.text(X0 + 330, 180, '÷5 yerine ÷10', { size: 26, color: SU });
    sk.step(2);
    const r = sk.row(X0, 260, [2 * n, '÷', 10, '=', k], { size: 46, colors: { 4: CO } });
    const last = r[0];
    const cw = textW('0', 46);
    sk.line(last.x2 - cw - 2, last.y - 4, last.x2 + 4, last.y - 28, { color: CO, w: 3.4 });
    sk.ringBox(r[4]);
    finish(sk, q, p.answer);
  },

  // ----------------------------------------------------------------------------------------------
  // Dahiler
  // ----------------------------------------------------------------------------------------------
  'on-birin-sirri': (p, sk) => {
    const n = nums(p.expr)[0];
    const d1 = Math.floor(n / 10), d2 = n % 10, s = d1 + d2;
    const q = question(p, sk);
    sk.step(1);
    sk.text(X0 + 40, 200, d1, { size: 64, anchor: 'middle' });
    sk.text(X0 + 240, 200, d2, { size: 64, anchor: 'middle' });
    sk.arrow(X0 + 56, 214, X0 + 120, 262, { color: TE });
    sk.arrow(X0 + 224, 214, X0 + 160, 262, { color: TE });
    sk.text(X0 + 140, 300, `${d1} + ${d2} = ${s}`, { size: 34, color: TE, anchor: 'middle' });
    sk.step(2);
    sk.text(X0 + 140, 200, s % 10, { size: 64, color: CO, anchor: 'middle' });
    if (s >= 10) {
      sk.text(X0 + 40, 132, `+1`, { size: 28, color: CO, anchor: 'middle' });
      sk.text(X0 + 360, 190, `(1 elde soldakine)`, { size: 26, color: CO });
    }
    sk.ring(X0 + 140, 180, 150, 46, { color: CO });
    finish(sk, q, p.answer);
  },

  'capraz-carpim': (p, sk) => {
    if (p.steps.length !== 4) return false;
    const [a, b] = nums(p.expr);
    const da = [Math.floor(a / 10), a % 10], db = [Math.floor(b / 10), b % 10];
    const u = A(p, 0), c = A(p, 1), h = A(p, 2);
    sk.step(0);
    const xs = [X0 + 70, X0 + 150];
    da.forEach((d, i) => sk.text(xs[i], 90, d, { size: 60, anchor: 'middle' }));
    db.forEach((d, i) => sk.text(xs[i], 190, d, { size: 60, anchor: 'middle' }));
    sk.text(X0 + 10, 190, '×', { size: 50, anchor: 'middle' });
    sk.line(X0, 214, X0 + 200, 212, { w: 3 });
    sk.step(1);
    sk.line(xs[1], 104, xs[1], 140, { color: CO, w: 4 });
    sk.text(380, 90, `birler: ${da[1]}×${db[1]} = ${u}`, { size: 30, color: CO });
    sk.step(2);
    sk.line(xs[0] + 6, 104, xs[1] - 6, 142, { color: TE, w: 4 });
    sk.line(xs[1] - 6, 104, xs[0] + 6, 142, { color: TE, w: 4 });
    sk.text(380, 140, `çapraz: ${da[0]}×${db[1]} + ${da[1]}×${db[0]} = ${c}`, { size: 26, color: TE });
    sk.step(3);
    sk.line(xs[0], 104, xs[0], 140, { color: BL, w: 4 });
    sk.text(380, 190, `onlar: ${da[0]}×${db[0]} = ${h}`, { size: 30, color: BL });
    sk.step(4);
    const r = sk.row(X0, 280, [`${h}×100`, '+', `${c}×10`, '+', u, '=', a * b], { size: 40, colors: { 0: BL, 2: TE, 4: CO, 6: CO } });
    sk.ringBox(r[6]);
  },

  'kutu-yontemi': (p, sk) => {
    if (p.steps.length !== 5) return false;
    const [a, b] = nums(p.expr);
    const Aa = Math.floor(a / 10) * 10, a1 = a % 10, Bb = Math.floor(b / 10) * 10, b1 = b % 10;
    const q = question(p, sk, 66, 50);
    const x = X0 + 50, y = 130, W = 400, H = 210;
    const w1 = Math.max(120, Math.min(300, (W * Bb) / b)), h1 = Math.max(80, Math.min(150, (H * Aa) / a));
    sk.rect(x, y, W, H);
    sk.line(x + w1, y, x + w1, y + H, { w: 2.6 });
    sk.line(x, y + h1, x + W, y + h1, { w: 2.6 });
    sk.text(x + w1 / 2, y - 12, Bb, { size: 30, color: TE, anchor: 'middle' });
    sk.text(x + w1 + (W - w1) / 2, y - 12, b1, { size: 30, color: TE, anchor: 'middle' });
    sk.text(x - 14, y + h1 / 2 + 10, Aa, { size: 30, color: CO, anchor: 'end' });
    sk.text(x - 14, y + h1 + (H - h1) / 2 + 10, a1, { size: 30, color: CO, anchor: 'end' });
    const cells: [number, number][] = [[x + w1 / 2, y + h1 / 2], [x + w1 + (W - w1) / 2, y + h1 / 2], [x + w1 / 2, y + h1 + (H - h1) / 2], [x + w1 + (W - w1) / 2, y + h1 + (H - h1) / 2]];
    const vals = [Aa * Bb, Aa * b1, a1 * Bb, a1 * b1];
    cells.forEach(([cx, cy], i) => {
      sk.step(i + 1);
      sk.text(cx, cy + 12, vals[i], { size: 36, color: [BL, TE, CO, SU][i], anchor: 'middle' });
    });
    sk.step(5);
    const r = sk.row(X0, 400, [vals[0], '+', vals[1], '+', vals[2], '+', vals[3], '=', a * b], { size: 38, colors: { 8: CO } });
    sk.ringBox(r[8]);
    finish(sk, q, p.answer);
  },

  yuzde: (p, sk) => {
    const [N, pc] = nums(p.expr);
    const q = question(p, sk, 70, 46);
    const parts = pc % 10 === 0 ? 10 : pc % 25 === 0 ? 4 : 20;
    const x = X0, y = 110, W = 500, H = 50, pw = W / parts;
    sk.rect(x, y, W, H);
    for (let i = 1; i < parts; i++) sk.line(x + i * pw, y + 2, x + i * pw, y + H - 2, { w: 1.8 });
    sk.text(x + W, y + H + 34, `%100 = ${N}`, { size: 28, anchor: 'end' });
    let yy = y + H + 40;
    p.steps.forEach((s, i) => {
      sk.step(i + 1);
      yy += 62;
      eqRow(sk, X0, yy, s.eq, s.answer, { size: 42, color: i === p.steps.length - 1 ? CO : TE, ring: i === p.steps.length - 1 });
    });
    sk.hatch(x + 3, y + 3, (W * pc) / 100 - 6, H - 6, CO);
    finish(sk, q, p.answer);
  },

  'islem-sirasi': (p, sk) => {
    const expr = p.expr.replace(' = ?', '');
    let cur = expr.replace(/\(/g, '( ').replace(/\)/g, ' )').split(' ').filter(Boolean);
    sk.step(0);
    let y = 80;
    let boxes = sk.row(X0, y, [...cur, '=', '?'], { size: 50 });
    const qb = boxes[boxes.length - 1];
    for (let i = 0; i < p.steps.length; i++) {
      sk.step(i + 1);
      const lhs = p.steps[i].eq.split(' = ')[0].split(' ');
      // eşleşen parçayı (parantezleri yok sayarak) bul
      let at = -1, len = 0;
      for (let k = 0; k < cur.length && at < 0; k++) {
        let m = 0, j = k;
        while (j < cur.length && m < lhs.length) {
          if (cur[j] === '(' || cur[j] === ')') { j++; continue; }
          if (cur[j] !== lhs[m]) break;
          m++; j++;
        }
        if (m === lhs.length) { at = k; len = j - k; }
      }
      if (at < 0) return false;
      if (cur[at - 1] === '(' && cur[at + len] === ')') { at--; len += 2; }
      const first = boxes[at], last = boxes[at + len - 1];
      sk.line(first.x1 - 4, y + 12, last.x2 + 4, y + 12, { color: CO, w: 3.2 });
      sk.ring(first.x1 - 22, y + 30, 13, 13, { color: CO, w: 2.4 });
      sk.text(first.x1 - 22, y + 39, i + 1, { size: 24, color: CO, anchor: 'middle' });
      cur = [...cur.slice(0, at), String(p.steps[i].answer), ...cur.slice(at + len)];
      y += 80;
      boxes = sk.row(X0, y, cur, { size: 50, colors: { [at]: i === p.steps.length - 1 ? CO : TE } });
      if (i === p.steps.length - 1) sk.ringBox(boxes[at]);
    }
    sk.fill(qb, fmt(p.answer));
  },

  'negatif-pullar': (p, sk) => {
    const v = p.visual;
    if (v?.type !== 'chips') return false;
    const { pos, neg } = v;
    const q = question(p, sk);
    const pairs = Math.min(pos, neg);
    const gap = Math.min(52, 520 / Math.max(pos, neg, 1));
    const rr = Math.min(21, gap * 0.42);
    const cx = (i: number) => X0 + rr + 5 + i * gap;
    const chip = (x: number, y: number, plus: boolean) => {
      sk.ring(x, y, rr, 21, { color: plus ? SU : CO, w: 3 });
      sk.text(x, y + 12, plus ? '+' : '−', { size: Math.min(34, rr * 1.6), color: plus ? SU : CO, anchor: 'middle' });
    };
    for (let i = 0; i < pos; i++) chip(cx(i), 160, true);
    for (let i = 0; i < neg; i++) chip(cx(i), 230, false);
    sk.step(1);
    for (let i = 0; i < pairs; i++) {
      sk.line(cx(i), 183, cx(i), 207, { color: TE, w: 3.4 });
    }
    if (pairs) sk.text(cx(pairs - 1) + 34, 290, `${pairs} çift = 0`, { size: 28, color: TE, anchor: 'end' });
    sk.step(2);
    const left = Math.abs(pos - neg), y = pos > neg ? 160 : 230;
    if (left) sk.ring((cx(pairs) + cx(pairs + left - 1)) / 2, y, (left * gap) / 2 + 6, 32, { color: CO });
    finish(sk, q, p.answer);
    sk.ringBox(qBox(q)!);
  },

  bolunebilme: (p, sk) => {
    const [N, k] = nums(p.expr);
    const d = String(N).split('');
    const s = A(p, 0);
    sk.step(0);
    const q = sk.row(X0, 80, [N, '÷', k], { size: 54 });
    sk.text(q[2].x2 + 20, 80, 'tam bölünür mü?', { size: 34 });
    sk.step(1);
    d.forEach((_, i) => sk.arrow(q[0].x1 + (i + 0.5) * ((q[0].x2 - q[0].x1) / d.length), 98, X0 + 30 + i * 90, 150, { color: TE, w: 2.4 }));
    const r = sk.row(X0 + 10, 190, [d.join(' + '), '=', s], { size: 46, colors: { 2: TE } });
    sk.ringBox(r[2], TE);
    sk.step(2);
    const ok = p.answer === 1;
    sk.text(X0 + 10, 270, `${s} ÷ ${k} → ${ok ? 'tam!' : 'artan var'}`, { size: 40, color: ok ? GR : CO });
    const t = sk.text(X0 + 10, 340, ok ? 'Evet, bölünür ✓' : 'Hayır, bölünmez', { size: 44, color: CO });
    sk.ringBox(t);
  },

  'bes-kare': (p, sk) => {
    const n = nums(p.expr)[0];
    const d = Math.floor(n / 10), P = d * (d + 1);
    const q = question(p, sk);
    sk.step(1);
    const w = q[0].x2 - q[0].x1;
    sk.ring(q[0].x1 + w * 0.25, q[0].y - 16, w * 0.32, 30, { color: TE });
    eqRow(sk, X0, 190, `${d} × ${d + 1} = ?`, P, { size: 46, color: TE });
    sk.text(X0 + 300, 190, 'bir fazlasıyla çarp', { size: 26, color: TE });
    sk.step(2);
    const a = sk.text(X0, 280, P, { size: 56, color: TE });
    const b = sk.text(a.x2 + 2, 280, '25', { size: 56, color: CO });
    sk.text(b.x2 + 24, 280, '← sonuna 25!', { size: 28, color: CO });
    sk.ring((a.x1 + b.x2) / 2, 262, (b.x2 - a.x1) / 2 + 16, 34, { color: CO });
    finish(sk, q, p.answer);
  },

  'kesrin-degeri': (p, sk) => {
    const [N, a, b] = nums(p.expr);
    const unit = N / b;
    const q = question(p, sk, 70, 48);
    const x = X0, y = 120, W = 480, H = 56, pw = W / b;
    sk.rect(x, y, W, H);
    for (let i = 1; i < b; i++) sk.line(x + i * pw, y + 2, x + i * pw, y + H - 2, { w: 2 });
    sk.text(x + W + 10, y + 40, N, { size: 30 });
    sk.step(1);
    for (let i = 0; i < b; i++) sk.text(x + i * pw + pw / 2, y + 40, unit, { size: Math.min(30, pw * 0.6), color: TE, anchor: 'middle' });
    eqRow(sk, X0, 250, `${N} ÷ ${b} = ?`, unit, { size: 44, color: TE });
    sk.step(2);
    for (let i = 0; i < a; i++) sk.hatch(x + i * pw + 3, y + 3, pw - 6, H - 6, CO);
    eqRow(sk, X0, 320, `${unit} × ${a} = ?`, unit * a, { size: 48, color: CO, ring: true });
    finish(sk, q, p.answer);
  },
  // ----------------------------------------------------------------------------------------------
  // Çarpım tablosu — 10 ailenin kolay yolu
  //
  // Hepsi aynı öğretmen hareketini izler: soru deftere yazılır, sağa çarpımın KUTUSU çizilir
  // (dizi modeli: kaç satır, kaç sütun), sonra kolay yol o kutunun üstünde gösterilir. Böylece
  // çocuk "neden" ile "nasıl"ı yan yana görür: solda sayılar, sağda sebebi.
  //
  // Renk dili her derste aynıdır:
  //   turkuaz    → kolay yolun ilk parçası ("önce 5 kere al")
  //   mercan     → ikinci parça: ya eklenen ya geri verilen; hangisi olduğunu kutunun altındaki not söyler
  //   sarı çizgi → kolay yolun kutuyu kestiği yer
  // 10'dan geri veren derslerde (5, 9, 8) kutu baştan 10 sütun çizilir: "10 kolay, fazlasını geri ver".
  // ----------------------------------------------------------------------------------------------

  'carpim-1': (p, sk) => {
    const x = nums(p.expr)[0];
    const q = question(p, sk);
    const g = board(sk, 1, x);
    sk.step(1);
    paintRows(sk, g, 0, 1, TE);
    note(sk, g, `bir sıra: ${x} tane`, TE);
    sk.text(X0, 206, 'Bir kere almak →', { size: 32, color: TE });
    sk.text(X0, 256, 'sayı kendisi kalır!', { size: 32, color: CO });
    crown(sk, q, p.answer);
    rule(sk, p, g, 320);
  },

  'carpim-10': (p, sk) => {
    const x = nums(p.expr)[0];
    const q = question(p, sk);
    const g = board(sk, x, 10);
    note(sk, g, `${x} satır, her satır bir onluk`, BL);
    sk.step(1);
    const a = sk.text(X0, 232, x, { size: 62, color: TE });
    const z = sk.text(a.x2 + 3, 232, '0', { size: 62, color: CO });
    sk.ring((a.x1 + z.x2) / 2, 212, (z.x2 - a.x1) / 2 + 15, 38, { color: CO });
    sk.text(X0, 296, 'sonuna bir sıfır!', { size: 30, color: CO });
    crown(sk, q, p.answer);
    rule(sk, p, g, 348);
  },

  'carpim-2': (p, sk) => {
    const x = nums(p.expr)[0];
    const q = question(p, sk);
    const g = board(sk, 2, x);
    sk.step(1);
    paintRows(sk, g, 0, 1, TE);
    paintRows(sk, g, 1, 2, CO);
    note(sk, g, 'iki sıra = iki katı', CO);
    eqRow(sk, X0, 226, `${x} + ${x} = ?`, 2 * x, { size: 50, color: CO, ring: true });
    finish(sk, q, p.answer);
    rule(sk, p, g, 340);
  },

  'carpim-5': (p, sk) => {
    const x = nums(p.expr)[0];
    const q = question(p, sk);
    const g = board(sk, x, 10, { split: 5 });
    sk.step(1);
    eqRow(sk, X0, 200, `${x} × 10 = ?`, 10 * x, { size: 46, color: TE });
    sk.text(X0, 244, 'önce 10 kere al', { size: 27, color: TE });
    sk.step(2);
    paintCols(sk, g, 5, 10, CO);
    note(sk, g, "5, 10'un yarısı", CO);
    eqRow(sk, X0, 318, `${10 * x} ÷ 2 = ?`, 5 * x, { size: 46, color: CO, ring: true });
    finish(sk, q, p.answer);
    rule(sk, p, g, 372);
  },

  'carpim-9': (p, sk) => {
    const x = nums(p.expr)[0];
    const q = question(p, sk);
    const g = board(sk, x, 10, { split: 9 });
    sk.step(1);
    eqRow(sk, X0, 200, `${x} × 10 = ?`, 10 * x, { size: 46, color: TE });
    sk.text(X0, 244, 'önce 10 kere al', { size: 27, color: TE });
    sk.step(2);
    paintCols(sk, g, 9, 10, CO);
    note(sk, g, `bir grup fazla: ${x} geri`, CO);
    eqRow(sk, X0, 318, `${10 * x} − ${x} = ?`, 9 * x, { size: 46, color: CO, ring: true });
    finish(sk, q, p.answer);
    rule(sk, p, g, 372);
  },

  'carpim-4': (p, sk) => {
    const x = nums(p.expr)[0];
    const q = question(p, sk);
    const g = board(sk, x, 4, { split: 2 });
    sk.step(1);
    paintCols(sk, g, 0, 2, TE);
    eqRow(sk, X0, 206, `${x} + ${x} = ?`, 2 * x, { size: 46, color: TE });
    sk.text(X0, 250, 'katla', { size: 27, color: TE });
    sk.step(2);
    paintCols(sk, g, 2, 4, CO);
    note(sk, g, 'bir daha katla', CO);
    eqRow(sk, X0, 320, `${2 * x} + ${2 * x} = ?`, 4 * x, { size: 50, color: CO, ring: true });
    finish(sk, q, p.answer);
    rule(sk, p, g, 374);
  },

  'carpim-3': (p, sk) => {
    const x = nums(p.expr)[0];
    const q = question(p, sk);
    const g = board(sk, x, 3, { split: 2 });
    sk.step(1);
    paintCols(sk, g, 0, 2, TE);
    eqRow(sk, X0, 206, `${x} + ${x} = ?`, 2 * x, { size: 46, color: TE });
    sk.text(X0, 250, 'iki katı', { size: 27, color: TE });
    sk.step(2);
    paintCols(sk, g, 2, 3, CO);
    note(sk, g, 'bir grup daha', CO);
    eqRow(sk, X0, 320, `${2 * x} + ${x} = ?`, 3 * x, { size: 50, color: CO, ring: true });
    finish(sk, q, p.answer);
    rule(sk, p, g, 374);
  },

  'carpim-6': (p, sk) => {
    const x = nums(p.expr)[0];
    const q = question(p, sk);
    const g = board(sk, x, 6, { split: 5 });
    sk.step(1);
    paintCols(sk, g, 0, 5, TE);
    eqRow(sk, X0, 206, `${x} × 5 = ?`, 5 * x, { size: 46, color: TE });
    sk.text(X0, 250, 'beşleri biliyorsun', { size: 27, color: TE });
    sk.step(2);
    paintCols(sk, g, 5, 6, CO);
    note(sk, g, 'bir kere daha', CO);
    eqRow(sk, X0, 320, `${5 * x} + ${x} = ?`, 6 * x, { size: 50, color: CO, ring: true });
    finish(sk, q, p.answer);
    rule(sk, p, g, 374);
  },

  'carpim-8': (p, sk) => {
    const x = nums(p.expr)[0];
    const q = question(p, sk);
    const g = board(sk, x, 10, { split: 8 });
    sk.step(1);
    eqRow(sk, X0, 194, `${x} × 10 = ?`, 10 * x, { size: 44, color: TE });
    sk.step(2);
    // Fazla alınan iki sütun önce halkaya alınır, sonra (3. adımda) karalanıp geri verilir.
    sk.ring(g.cx(9), g.y + g.H / 2, g.cell + 2, g.H / 2 + 8, { color: CO });
    eqRow(sk, X0, 258, `${x} × 2 = ?`, 2 * x, { size: 44, color: CO });
    sk.step(3);
    paintCols(sk, g, 8, 10, CO);
    note(sk, g, 'fazlayı geri ver', CO);
    eqRow(sk, X0, 326, `${10 * x} − ${2 * x} = ?`, 8 * x, { size: 48, color: CO, ring: true });
    finish(sk, q, p.answer);
    rule(sk, p, g, 380);
  },

  'carpim-7': (p, sk) => {
    const x = nums(p.expr)[0];
    const q = question(p, sk);
    const g = board(sk, x, 7, { split: 5 });
    sk.step(1);
    paintCols(sk, g, 0, 5, TE);
    eqRow(sk, X0, 194, `${x} × 5 = ?`, 5 * x, { size: 44, color: TE });
    sk.step(2);
    paintCols(sk, g, 5, 7, CO);
    eqRow(sk, X0, 258, `${x} × 2 = ?`, 2 * x, { size: 44, color: CO });
    note(sk, g, '5 parça + 2 parça', CO);
    sk.step(3);
    eqRow(sk, X0, 326, `${5 * x} + ${2 * x} = ?`, 7 * x, { size: 48, color: CO, ring: true });
    finish(sk, q, p.answer);
    rule(sk, p, g, 380);
  },
};

/** Ders oynatıcısında eskiz gösterilmeyecek püfler (cevabı ilk adımda ele veren). */
const NOT_IN_RUNNER = new Set(['sayma-gor']);

export function hasSketch(trickId: string, inRunner = false) {
  return trickId in R && !(inRunner && NOT_IN_RUNNER.has(trickId));
}

/** Eskiz + yedek (genel) eskize düşülüp düşülmediği (testler için). */
export function sketchInfo(p: Problem): { sketch: Sketch; fallback: boolean } | null {
  const recipe = R[p.trickId];
  if (!recipe) return null;
  const seed = `${p.trickId}|${p.expr}`;
  try {
    const sk = new SK(seed);
    if (recipe(p, sk) !== false) return { sketch: sk.done(), fallback: false };
  } catch {
    /* genel eskize düş */
  }
  const sk = new SK(seed);
  generic(p, sk);
  return { sketch: sk.done(), fallback: true };
}

/** Sorunun defter eskizi (senaryo yoksa null). */
export const sketchFor = (p: Problem): Sketch | null => sketchInfo(p)?.sketch ?? null;
