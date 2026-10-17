/**
 * Defter eskizi kurucusu: kolay yolu çizgili kâğıda kalemle çizilmiş gibi anlatan öğeler üretir.
 *
 * Her öğe bir adıma (`step`) aittir: 0 = soru, k = k. iskele adımı. Oynatıcı (Notebook) adımları sırayla,
 * kalem çiziyormuş gibi canlandırır. Geometri "el çizimi"dir: hafif eğri çizgiler, tam kapanmayan halkalar.
 * Rastgelelik tohumludur; aynı soru her çizimde aynı görünür.
 */

export const G = '#2f2f36'; // grafit
export const CO = '#e8553a'; // mercan kuru boya
export const TE = '#0f9488'; // turkuaz
export const BL = '#2f6fd6'; // mavi
export const SU = '#d99a00'; // güneş sarısı
export const GR = '#3a9a4a'; // yeşil

export type Pt = [number, number];
type Base = { step: number; color: string; start: Pt; end: Pt };
export type SketchItem =
  | (Base & { k: 'path'; d: string; w: number; fill?: string })
  | (Base & { k: 'text'; x: number; y: number; t: string; size: number; anchor: 'start' | 'middle' | 'end'; w: number })
  | (Base & { k: 'hatch'; x: number; y: number; wd: number; h: number });

export interface Sketch {
  items: SketchItem[];
  h: number;
  steps: number;
}

export interface Box { x1: number; x2: number; cx: number; y: number; size: number; t: string }

/** Caveat kalın yazıda yaklaşık karakter genişlikleri (em); el yazısı dar olduğu için harfe göre değişir. */
function chW(c: string) {
  if (/[0-9]/.test(c)) return 0.4;
  if (/[→←]/.test(c)) return 0.95;
  if (/[+−×÷=<>]/.test(c)) return 0.46;
  if (c === ' ') return 0.22;
  if (c === '%') return 0.5;
  if (/[.,:;!'()|/]/.test(c)) return 0.2;
  if (/[A-ZÇĞİÖŞÜ]/.test(c)) return 0.46;
  if (/[mw]/.test(c)) return 0.5;
  return 0.35;
}
export const textW = (t: string, size: number) => Math.max(size * 0.3, [...t].reduce((s, c) => s + chW(c), 0) * size);

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

const f = (n: number) => Math.round(n * 10) / 10;

/** Açık Catmull-Rom eğrisini kübik Bézier yoluna çevirir. */
function smooth(p: Pt[]): string {
  let d = `M${f(p[0][0])},${f(p[0][1])}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] ?? p2;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
  }
  return d;
}

export class SK {
  items: SketchItem[] = [];
  s = 0;
  maxY = 0;
  private r: () => number;

  constructor(seed: string | number) {
    this.r = mulberry(typeof seed === 'number' ? seed : hash(seed));
  }

  private j(n = 1) {
    return (this.r() - 0.5) * 2 * n;
  }

  private grow(y: number) {
    this.maxY = Math.max(this.maxY, y);
  }

  step(n: number) {
    this.s = n;
    return this;
  }

  path(d: string, start: Pt, end: Pt, o: { color?: string; w?: number; fill?: string } = {}) {
    this.items.push({ k: 'path', d, start, end, step: this.s, color: o.color ?? G, w: o.w ?? 3.2, fill: o.fill });
    this.grow(Math.max(start[1], end[1]));
  }

  text(x: number, y: number, t: string | number, o: { size?: number; color?: string; anchor?: 'start' | 'middle' | 'end' } = {}): Box {
    const s = String(t);
    const size = o.size ?? 50;
    const anchor = o.anchor ?? 'start';
    const w = textW(s, size);
    const x1 = anchor === 'start' ? x : anchor === 'middle' ? x - w / 2 : x - w;
    this.items.push({ k: 'text', x, y, t: s, size, anchor, w, step: this.s, color: o.color ?? G, start: [x1, y - size * 0.3], end: [x1 + w, y - size * 0.3] });
    this.grow(y + size * 0.25);
    return { x1, x2: x1 + w, cx: x1 + w / 2, y, size, t: s };
  }

  /** Bir satır işlem; "?" el çizimi bir kutu olur. Her parçanın konumu döner. */
  row(x: number, y: number, toks: (string | number)[], o: { size?: number; color?: string; colors?: Record<number, string>; gap?: number; noBox?: boolean } = {}): Box[] {
    const size = o.size ?? 50;
    const gap = o.gap ?? size * 0.3;
    let cx = x;
    return toks.map((tk, i) => {
      const t = String(tk);
      if (t === '?' && !o.noBox) {
        const w = size * 0.95;
        this.rect(cx, y - size * 0.78, w, size * 0.95, { color: o.colors?.[i] ?? G, w: 2.6 });
        const b = { x1: cx, x2: cx + w, cx: cx + w / 2, y, size, t: '?' };
        cx += w + gap;
        return b;
      }
      const b = this.text(cx, y, t, { size, color: o.colors?.[i] ?? o.color });
      cx = b.x2 + gap;
      return b;
    });
  }

  /** Kutuya cevabı yazar. */
  fill(b: Box, v: string | number, color = CO) {
    return this.text(b.cx, b.y - 2, v, { size: b.size * 0.92, color, anchor: 'middle' });
  }

  line(x1: number, y1: number, x2: number, y2: number, o: { color?: string; w?: number } = {}) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const len = Math.hypot(x2 - x1, y2 - y1);
    const nx = -(y2 - y1) / (len || 1), ny = (x2 - x1) / (len || 1);
    const off = this.j(len * 0.025);
    const a: Pt = [x1 + this.j(1), y1 + this.j(1)], b: Pt = [x2 + this.j(1), y2 + this.j(1)];
    this.path(`M${f(a[0])},${f(a[1])} Q${f(mx + nx * off)},${f(my + ny * off)} ${f(b[0])},${f(b[1])}`, a, b, o);
  }

  /** Ok (isteğe bağlı bükülme). */
  arrow(x1: number, y1: number, x2: number, y2: number, o: { color?: string; bend?: number; w?: number } = {}) {
    const bend = o.bend ?? 0;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    const nx = -(y2 - y1) / len, ny = (x2 - x1) / len;
    const c: Pt = [mx + nx * bend, my + ny * bend];
    const ang = Math.atan2(y2 - c[1], x2 - c[0]);
    const hl = 13;
    const h1: Pt = [x2 - hl * Math.cos(ang - 0.45), y2 - hl * Math.sin(ang - 0.45)];
    const h2: Pt = [x2 - hl * Math.cos(ang + 0.45), y2 - hl * Math.sin(ang + 0.45)];
    this.path(`M${f(x1)},${f(y1)} Q${f(c[0])},${f(c[1])} ${f(x2)},${f(y2)} M${f(h1[0])},${f(h1[1])} L${f(x2)},${f(y2)} L${f(h2[0])},${f(h2[1])}`, [x1, y1], [x2, y2], o);
  }

  /** Tam kapanmayan el çizimi halka. */
  ring(cx: number, cy: number, rx: number, ry: number, o: { color?: string; w?: number } = {}) {
    const a0 = this.r() * Math.PI * 2;
    const n = 18;
    const sweep = Math.PI * 2 * 1.12;
    const pts: Pt[] = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + (sweep * i) / n;
      const k = 1 + this.j(0.05) + (i / n) * 0.06;
      pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    this.path(smooth(pts), pts[0], pts[pts.length - 1], { color: o.color ?? CO, w: o.w ?? 3 });
    this.grow(cy + ry);
  }

  /** Bir yazının etrafına halka. */
  ringBox(b: Box, color = CO) {
    this.ring(b.cx, b.y - b.size * 0.3, b.x2 - b.x1 > b.size * 0.6 ? (b.x2 - b.x1) / 2 + 14 : b.size * 0.48, b.size * 0.5, { color });
  }

  /** Bir yazının altını çiz. */
  under(b: Box, color = CO) {
    this.line(b.x1 - 4, b.y + 10, b.x2 + 4, b.y + 8, { color, w: 3 });
  }

  rect(x: number, y: number, w: number, h: number, o: { color?: string; w?: number } = {}) {
    const p: Pt[] = [[x + this.j(2), y + this.j(2)], [x + w + this.j(2), y + this.j(2)], [x + w + this.j(2), y + h + this.j(2)], [x + this.j(2), y + h + this.j(2)]];
    const d = `M${f(p[0][0] - 4)},${f(p[0][1])} L${f(p[1][0] + 3)},${f(p[1][1])} M${f(p[1][0])},${f(p[1][1] - 3)} L${f(p[2][0])},${f(p[2][1] + 3)} M${f(p[2][0] + 3)},${f(p[2][1])} L${f(p[3][0] - 3)},${f(p[3][1])} M${f(p[3][0])},${f(p[3][1] + 3)} L${f(p[0][0])},${f(p[0][1] - 3)}`;
    this.path(d, p[0], p[0], { color: o.color ?? G, w: o.w ?? 3 });
  }

  hatch(x: number, y: number, w: number, h: number, color = CO) {
    this.items.push({ k: 'hatch', x, y, wd: w, h, step: this.s, color, start: [x, y], end: [x + w, y + h] });
    this.grow(y + h);
  }

  /** Karalanarak boyanmış küçük nokta (sayaç, şeker…). */
  dot(cx: number, cy: number, r = 11, color = G) {
    const pts: Pt[] = [];
    for (let i = 0; i <= 14; i++) {
      const a = (i / 14) * Math.PI * 2 * 1.1;
      pts.push([cx + Math.cos(a) * r * (1 + this.j(0.08)), cy + Math.sin(a) * r * (1 + this.j(0.08))]);
    }
    const d = smooth(pts) + ` M${f(cx - r * 0.55)},${f(cy - r * 0.2)} L${f(cx + r * 0.5)},${f(cy - r * 0.45)} M${f(cx - r * 0.5)},${f(cy + r * 0.35)} L${f(cx + r * 0.55)},${f(cy + r * 0.05)}`;
    this.path(d, pts[0], [cx + r, cy], { color, w: 2.4, fill: color });
  }

  cross(cx: number, cy: number, s = 16, color = CO) {
    this.path(`M${f(cx - s)},${f(cy - s)} L${f(cx + s)},${f(cy + s)} M${f(cx + s)},${f(cy - s)} L${f(cx - s)},${f(cy + s)}`, [cx - s, cy - s], [cx - s, cy + s], { color, w: 3.4 });
  }

  /** Sayı bağı: üstteki sayıdan iki kola ayrılan parçalar. side: hangi kollar çizilsin. */
  bond(cx: number, yTop: number, left: string | number, right: string | number, o: { side?: 'L' | 'R' | 'both'; cl?: string; cr?: string; spread?: number; drop?: number; r?: number } = {}) {
    const side = o.side ?? 'both';
    const sp = o.spread ?? 44, dr = o.drop ?? 64, r = o.r ?? 25;
    const draw = (dir: -1 | 1, v: string | number, c: string) => {
      const ex = cx + dir * sp, ey = yTop + dr;
      this.line(cx + dir * 4, yTop, ex - dir * r * 0.5, ey - r * 0.85, { color: G, w: 2.6 });
      this.ring(ex, ey, r + 4, r, { color: c, w: 2.8 });
      this.text(ex, ey + r * 0.48, v, { size: r * 1.44, color: c, anchor: 'middle' });
    };
    if (side !== 'R') draw(-1, left, o.cl ?? TE);
    if (side !== 'L') draw(1, right, o.cr ?? CO);
  }

  /** Zıplama yayı (sayı doğrusu üstünde). */
  hop(x1: number, x2: number, y: number, label: string, color = CO, h?: number) {
    const hh = h ?? Math.min(70, 22 + Math.abs(x2 - x1) * 0.35);
    this.arrow(x1, y - 4, x2, y - 4, { color, bend: x2 > x1 ? -hh : hh, w: 3 });
    if (label) this.text((x1 + x2) / 2, y - hh / 2 - 14, label, { size: 30, color, anchor: 'middle' });
  }

  /** El çizimi sayı doğrusu; değerden x'e dönüştürücüyü döndürür. */
  numberLine(x1: number, x2: number, y: number, lo: number, hi: number, labels: number[] | 'all') {
    this.line(x1 - 10, y, x2 + 10, y, { w: 3 });
    this.path(`M${x2 + 2},${y - 8} L${x2 + 14},${y} L${x2 + 2},${y + 8}`, [x2 + 2, y - 8], [x2 + 2, y + 8], { w: 3 });
    const X = (v: number) => x1 + ((v - lo) / Math.max(1, hi - lo)) * (x2 - x1);
    const show = labels === 'all' ? Array.from({ length: hi - lo + 1 }, (_, i) => lo + i) : labels;
    for (const v of show) {
      this.line(X(v), y - 9, X(v), y + 9, { w: 2.6 });
      this.text(X(v), y + 38, v, { size: labels === 'all' ? 28 : 32, anchor: 'middle' });
    }
    return X;
  }

  /** El çizimi 10'luk çerçeve; hücre merkezlerini döndürür. */
  frame(x: number, y: number, cell = 54): Pt[] {
    this.rect(x, y, cell * 5, cell * 2, { w: 3 });
    for (let c = 1; c < 5; c++) this.line(x + c * cell, y + 2, x + c * cell, y + cell * 2 - 2, { w: 2.2 });
    this.line(x + 2, y + cell, x + cell * 5 - 2, y + cell, { w: 2.2 });
    return Array.from({ length: 10 }, (_, i) => [x + (i % 5) * cell + cell / 2, y + Math.floor(i / 5) * cell + cell / 2] as Pt);
  }

  done(): Sketch {
    return { items: this.items, h: Math.ceil(this.maxY + 34), steps: Math.max(0, ...this.items.map((i) => i.step)) };
  }
}
