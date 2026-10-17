/**
 * Somut ve resimli modeller (CPA'nın "C" ve "P" basamakları). Hepsi SVG; Çizio'nun çizim diliyle:
 * koyu mürekkep çizgisi, mercan / turkuaz / güneş dolgular, yuvarlak köşeler, hafif "pop" animasyonları.
 *
 * İlke: görsel yardım eder ama cevabı söylemez. Son nokta "?" kalır; çocuk sayarak ya da düşünerek bulur.
 */
import { Eye } from 'lucide-react';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import type { BarRow, VisualSpec } from '../tricks/types';
import { fmt } from '../lib/util';

const INK = '#3a2b27';
const CORAL = '#ff6b4a';
const TEAL = '#14a89a';
const SUN = '#ffc83d';
const BLUE = '#3f7fe0';
const SOFT = '#fff8ea';
const FONT = 'Fredoka, Nunito, sans-serif';

const delay = (i: number, step = 0.06): CSSProperties => ({ animationDelay: `${i * step}s` });

function Svg({ w, h, children, label }: { w: number; h: number; children: ReactNode; label?: string }) {
  return (
    <svg className="visual__svg" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} style={{ maxWidth: Math.max(w, 260) }}>
      {children}
    </svg>
  );
}

// ------------------------------------------------------------------------------------------------
// Noktalar (zar yüzleri) — saymadan görme
// ------------------------------------------------------------------------------------------------
const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[26, 26], [50, 50], [74, 74]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[26, 26], [74, 26], [50, 50], [26, 74], [74, 74]],
  6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]],
};

function Die({ n, x, color, start }: { n: number; x: number; color: string; start: number }) {
  return (
    <g transform={`translate(${x} 10)`}>
      <rect width="100" height="100" rx="22" fill="#fff" stroke={INK} strokeWidth="4" />
      {PIPS[n]?.map(([cx, cy], i) => (
        <circle key={i} className="v-pop" style={delay(start + i, 0.05)} cx={cx} cy={cy} r="10" fill={color} stroke={INK} strokeWidth="2.5" />
      ))}
    </g>
  );
}

function Dots({ n, flash }: { n: number; flash?: boolean }) {
  const [shown, setShown] = useState(true);
  const [k, setK] = useState(0);
  useEffect(() => {
    if (!flash) return;
    setShown(true);
    const t = setTimeout(() => setShown(false), 1700);
    return () => clearTimeout(t);
  }, [flash, k, n]);
  const two = n > 6;
  const w = two ? 240 : 120;
  return (
    <div className="dots-wrap">
      {shown ? (
        <Svg w={w} h={120} label={`${n} nokta`}>
          {two ? (
            <>
              <Die n={5} x={10} color={CORAL} start={0} />
              <Die n={n - 5} x={130} color={TEAL} start={5} />
            </>
          ) : (
            <Die n={n} x={10} color={CORAL} start={0} />
          )}
        </Svg>
      ) : (
        <button className="peek-btn pop-in" onClick={() => setK((x) => x + 1)}>
          <Eye size={22} /> Tekrar bak
        </button>
      )}
    </div>
  );
}

// ------------------------------------------------------------------------------------------------
// 10'luk çerçeve (ve 20'lik çift çerçeve)
// ------------------------------------------------------------------------------------------------
export const CELL = 46;
export function frameCell(i: number) {
  const frame = Math.floor(i / 10);
  const k = i % 10;
  return { x: 12 + frame * (CELL * 5 + 26) + (k % 5) * CELL, y: 12 + Math.floor(k / 5) * CELL };
}

export function FrameGrid({ frames }: { frames: number }) {
  return (
    <>
      {Array.from({ length: frames }, (_, f) => (
        <g key={f}>
          <rect x={12 + f * (CELL * 5 + 26)} y={12} width={CELL * 5} height={CELL * 2} rx="10" fill="#fff" stroke={INK} strokeWidth="4" />
          {[1, 2, 3, 4].map((c) => (
            <line key={c} x1={12 + f * (CELL * 5 + 26) + c * CELL} y1={12} x2={12 + f * (CELL * 5 + 26) + c * CELL} y2={12 + CELL * 2} stroke={INK} strokeWidth="2.5" />
          ))}
          <line x1={12 + f * (CELL * 5 + 26)} y1={12 + CELL} x2={12 + f * (CELL * 5 + 26) + CELL * 5} y2={12 + CELL} stroke={INK} strokeWidth="2.5" />
        </g>
      ))}
    </>
  );
}

export function Counter({ i, color, faded, d = 0 }: { i: number; color: string; faded?: boolean; d?: number }) {
  const { x, y } = frameCell(i);
  return (
    <g className="v-pop" style={delay(d)} opacity={faded ? 0.35 : 1}>
      <circle cx={x + CELL / 2} cy={y + CELL / 2} r={CELL / 2 - 7} fill={color} stroke={INK} strokeWidth="3" />
      <circle cx={x + CELL / 2 - 5} cy={y + CELL / 2 - 6} r="4" fill="#fff" opacity="0.6" />
      {faded && <path d={`M${x + 10},${y + 10} L${x + CELL - 10},${y + CELL - 10} M${x + CELL - 10},${y + 10} L${x + 10},${y + CELL - 10}`} stroke={INK} strokeWidth="4" strokeLinecap="round" />}
    </g>
  );
}

function TenFrame({ a, b = 0, remove = 0, cap }: { a: number; b?: number; remove?: number; cap?: 10 | 20 }) {
  const frames = cap === 20 || a + b > 10 ? 2 : 1;
  const w = 24 + frames * CELL * 5 + (frames - 1) * 26;
  const total = a + b;
  return (
    <Svg w={w} h={CELL * 2 + 24} label={`${a}${b ? ` ve ${b}` : ''} sayaç`}>
      <FrameGrid frames={frames} />
      {Array.from({ length: total }, (_, i) => (
        <Counter key={i} i={i} color={i < a ? CORAL : TEAL} faded={i >= total - remove} d={i} />
      ))}
    </Svg>
  );
}

// ------------------------------------------------------------------------------------------------
// Açık sayı doğrusu: zıplamalar ve aralıklar
// ------------------------------------------------------------------------------------------------
function NumberLine({ start, jumps, spans = [], marks = [] }: Extract<VisualSpec, { type: 'numberline' }>) {
  const pts = [start];
  for (const j of jumps) pts.push(pts[pts.length - 1] + j.by);
  const all = [...pts, ...spans.flatMap((s) => [s.from, s.to]), ...marks];
  let lo = Math.min(...all), hi = Math.max(...all);
  const small = hi - lo <= 20;
  if (small) {
    lo = Math.max(0, lo - 1);
    hi = hi + 1;
  } else {
    const pad = Math.max(2, Math.round((hi - lo) * 0.08));
    lo -= pad;
    hi += pad;
  }
  const W = 640, L = 30, R = W - 30, Y = spans.length ? 60 + spans.length * 52 : 120;
  const X = (v: number) => L + ((v - lo) / Math.max(1, hi - lo)) * (R - L);
  const final = pts[pts.length - 1];
  const key = new Set<number>(jumps.length ? pts.slice(0, -1) : []);
  if (!jumps.length && spans[0]) { key.add(spans[0].from); key.add(spans[0].to); }
  const h = Y + 50;
  return (
    <Svg w={W} h={h} label="Sayı doğrusu">
      <line x1={L - 14} y1={Y} x2={R + 14} y2={Y} stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <path d={`M${R + 6},${Y - 8} L${R + 16},${Y} L${R + 6},${Y + 8}`} fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {small &&
        Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).map((v) => (
          <g key={v}>
            <line x1={X(v)} y1={Y - 9} x2={X(v)} y2={Y + 9} stroke={INK} strokeWidth="3" />
            <text x={X(v)} y={Y + 32} textAnchor="middle" fontFamily={FONT} fontWeight={key.has(v) ? 700 : 500} fontSize={key.has(v) ? 21 : 16} fill={key.has(v) ? INK : '#8c766e'}>
              {jumps.length && v === final ? '' : fmt(v)}
            </text>
          </g>
        ))}
      {!small &&
        [...key].map((v) => (
          <g key={v}>
            <line x1={X(v)} y1={Y - 11} x2={X(v)} y2={Y + 11} stroke={INK} strokeWidth="3.5" />
            <text x={X(v)} y={Y + 34} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={20} fill={INK}>{fmt(v)}</text>
          </g>
        ))}
      {jumps.map((j, i) => {
        const x1 = X(pts[i]), x2 = X(pts[i + 1]);
        const hgt = Math.min(90, 26 + Math.abs(x2 - x1) * 0.35);
        const mid = (x1 + x2) / 2;
        const col = j.by > 0 ? CORAL : TEAL;
        return (
          <g key={i}>
            <path className="v-draw" style={delay(i, 0.45)} d={`M${x1},${Y - 6} Q${mid},${Y - hgt * 2 + 6} ${x2},${Y - 6}`} fill="none" stroke={col} strokeWidth="4.5" strokeLinecap="round" pathLength={1} />
            <circle className="v-pop" style={delay(i + 0.6, 0.45)} cx={x2} cy={Y - 6} r="6" fill={col} stroke={INK} strokeWidth="2" />
            {j.label && (
              <text className="v-pop" style={delay(i + 0.5, 0.45)} x={mid} y={Y - hgt - 6} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={20} fill={col}>{j.label}</text>
            )}
          </g>
        );
      })}
      {jumps.length > 0 && (
        <g className="v-pop" style={delay(jumps.length, 0.45)}>
          <rect x={X(final) - 20} y={Y + 14} width="40" height="30" rx="9" fill={SUN} stroke={INK} strokeWidth="3" />
          <text x={X(final)} y={Y + 36} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={21} fill={INK}>?</text>
        </g>
      )}
      {spans.map((s, i) => {
        const y = Y - 26 - i * 52;
        const col = i === 0 ? CORAL : TEAL;
        return (
          <g key={i} className="v-pop" style={delay(i, 0.5)}>
            <line x1={X(s.from)} y1={y} x2={X(s.to)} y2={y} stroke={col} strokeWidth="9" strokeLinecap="round" opacity="0.85" />
            <line x1={X(s.from)} y1={y - 10} x2={X(s.from)} y2={Y} stroke={col} strokeWidth="2" strokeDasharray="4 4" />
            <line x1={X(s.to)} y1={y - 10} x2={X(s.to)} y2={Y} stroke={col} strokeWidth="2" strokeDasharray="4 4" />
            <text x={(X(s.from) + X(s.to)) / 2} y={y - 12} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={18} fill={col}>{s.label}</text>
            {i > 0 && (
              <>
                <text x={X(s.from)} y={y - 12} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={18} fill={INK}>{fmt(s.from)}</text>
                <text x={X(s.to)} y={y - 12} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={18} fill={INK}>{fmt(s.to)}</text>
              </>
            )}
          </g>
        );
      })}
    </Svg>
  );
}

// ------------------------------------------------------------------------------------------------
// Onluk taban blokları
// ------------------------------------------------------------------------------------------------
function Blocks({ nums }: { nums: number[] }) {
  const U = 8;
  const groups = nums.map((n) => ({ n, h: Math.floor(n / 100), t: Math.floor(n / 10) % 10, o: n % 10 }));
  let x = 10;
  const laid = groups.map((g, gi) => {
    const start = x;
    const items: ReactNode[] = [];
    const col = gi === 0 ? CORAL : TEAL;
    let k = 0;
    for (let i = 0; i < g.h; i++) {
      items.push(
        <g key={`h${i}`} className="v-pop" style={delay(k++)}>
          <rect x={x} y={20} width={U * 10} height={U * 10} rx="4" fill={BLUE} stroke={INK} strokeWidth="2.5" />
          {Array.from({ length: 9 }, (_, j) => (
            <g key={j} stroke="#fff" strokeOpacity="0.45" strokeWidth="1">
              <line x1={x + (j + 1) * U} y1={20} x2={x + (j + 1) * U} y2={20 + U * 10} />
              <line x1={x} y1={20 + (j + 1) * U} x2={x + U * 10} y2={20 + (j + 1) * U} />
            </g>
          ))}
        </g>,
      );
      x += U * 10 + 8;
    }
    for (let i = 0; i < g.t; i++) {
      items.push(
        <g key={`t${i}`} className="v-pop" style={delay(k++)}>
          <rect x={x} y={20} width={U + 2} height={U * 10} rx="3" fill={col} stroke={INK} strokeWidth="2.5" />
          {Array.from({ length: 9 }, (_, j) => <line key={j} x1={x} y1={20 + (j + 1) * U} x2={x + U + 2} y2={20 + (j + 1) * U} stroke={INK} strokeOpacity="0.35" strokeWidth="1" />)}
        </g>,
      );
      x += U + 8;
    }
    for (let i = 0; i < g.o; i++) {
      const cx = x + Math.floor(i / 5) * (U + 6);
      const cy = 20 + U * 10 - (i % 5) * (U + 6) - U - 2;
      items.push(<rect key={`o${i}`} className="v-pop" style={delay(k++)} x={cx} y={cy} width={U + 2} height={U + 2} rx="2" fill={SUN} stroke={INK} strokeWidth="2" />);
    }
    if (g.o) x += Math.ceil(g.o / 5) * (U + 6);
    const end = x;
    x += 34;
    return (
      <g key={gi}>
        {items}
        <text x={(start + end) / 2} y={20 + U * 10 + 34} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={24} fill={INK}>{g.n}</text>
        {gi < groups.length - 1 && <text x={end + 17} y={20 + U * 5 + 10} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={30} fill={INK}>+</text>}
      </g>
    );
  });
  return (
    <div className="blocks-wrap">
      <Svg w={Math.max(x - 24, 200)} h={20 + U * 10 + 48} label="Onluk bloklar">{laid}</Svg>
      <div className="blocks-key">
        {groups.some((g) => g.h) && <span><i style={{ background: BLUE }} /> yüzlük</span>}
        <span><i style={{ background: CORAL, height: 18, width: 6 }} /> onluk</span>
        <span><i style={{ background: SUN }} /> birlik</span>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------
// Singapur çubuk (bar) modeli
// ------------------------------------------------------------------------------------------------
function Bar({ rows, total, unitLabel }: { rows: BarRow[]; total?: { label: string; unknown?: boolean }; unitLabel?: string }) {
  const named = rows.some((r) => r.name);
  const NW = named ? 108 : 0;
  const BW = 520;
  const max = Math.max(...rows.map((r) => r.segs.reduce((s, x) => s + x.v, 0)));
  const sc = BW / Math.max(1, max);
  const RH = 50, GAP = 20, top = unitLabel ? 30 : 10;
  const h = top + rows.length * (RH + GAP) + (total ? 56 : 0);
  return (
    <Svg w={NW + BW + 24} h={h} label="Çubuk modeli">
      {unitLabel && (
        <text x={NW + 12 + (rows[0].segs[0]?.v ?? 0) * sc / 2} y={20} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={15} fill="#8c766e">{unitLabel}</text>
      )}
      {rows.map((r, ri) => {
        let x = NW + 12;
        const y = top + ri * (RH + GAP);
        return (
          <g key={ri}>
            {named && (
              <text x={NW} y={y + RH / 2 + 7} textAnchor="end" fontFamily={FONT} fontWeight={700} fontSize={19} fill={INK}>{r.name}</text>
            )}
            {r.segs.map((s, si) => {
              const w = s.v * sc;
              const el = (
                <g key={si} className="v-grow" style={{ ...delay(ri * 3 + si, 0.08), transformOrigin: `${x}px ${y}px` }}>
                  <rect x={x + 2} y={y} width={Math.max(4, w - 4)} height={RH} rx="10" fill={s.unknown ? '#fff' : s.color ?? '#fff'} fillOpacity={s.unknown ? 1 : s.color ? 0.9 : 1}
                    stroke={INK} strokeWidth="3" strokeDasharray={s.dashed || s.unknown ? '8 6' : undefined} />
                  {s.label && (
                    <text x={x + w / 2} y={y + RH / 2 + 8} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={w < 40 ? 15 : 22} fill={s.unknown ? CORAL : INK}>{s.label}</text>
                  )}
                </g>
              );
              x += w;
              return el;
            })}
          </g>
        );
      })}
      {total && (() => {
        const y = top + rows.length * (RH + GAP) - 6;
        const x1 = NW + 14, x2 = NW + 12 + max * sc - 2;
        return (
          <g className="v-pop" style={delay(rows.length * 3, 0.08)}>
            <path d={`M${x1},${y} Q${x1},${y + 14} ${x1 + 14},${y + 14} H${(x1 + x2) / 2 - 10} L${(x1 + x2) / 2},${y + 24} L${(x1 + x2) / 2 + 10},${y + 14} H${x2 - 14} Q${x2},${y + 14} ${x2},${y}`}
              fill="none" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
            <text x={(x1 + x2) / 2} y={y + 48} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={22} fill={total.unknown ? CORAL : INK}>{total.label}</text>
          </g>
        );
      })()}
    </Svg>
  );
}

// ------------------------------------------------------------------------------------------------
// Dizi (array): satır × sütun; parçalama çizgisi ve soluk satırlar
// ------------------------------------------------------------------------------------------------
function ArrayModel({ rows, cols, splitCol, fadeRows = 0 }: { rows: number; cols: number; splitCol?: number; fadeRows?: number }) {
  const C = Math.min(34, Math.floor(520 / Math.max(cols, 1)), Math.floor(380 / Math.max(rows, 1)));
  const W = cols * C + 70, H = rows * C + 50;
  const ox = 46, oy = 34;
  return (
    <Svg w={W} h={H} label={`${rows} sıra, ${cols} sütun`}>
      <text x={ox + (cols * C) / 2} y={22} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={20} fill={INK}>{cols}</text>
      <text x={24} y={oy + (rows * C) / 2 + 7} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={20} fill={INK}>{rows}</text>
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const faded = r >= rows - fadeRows;
          const col = splitCol !== undefined ? (c < splitCol ? CORAL : TEAL) : CORAL;
          return (
            <circle key={`${r}-${c}`} className="v-pop" style={delay(r, 0.08)} cx={ox + c * C + C / 2} cy={oy + r * C + C / 2} r={C / 2 - 4}
              fill={col} stroke={INK} strokeWidth="2" opacity={faded ? 0.25 : 1} />
          );
        }),
      )}
      {fadeRows > 0 && (
        <line x1={ox} y1={oy + (rows - fadeRows) * C + C / 2} x2={ox + cols * C} y2={oy + (rows - fadeRows) * C + C / 2} stroke={INK} strokeWidth="4" strokeLinecap="round" />
      )}
      {splitCol !== undefined && (
        <line x1={ox + splitCol * C} y1={oy - 8} x2={ox + splitCol * C} y2={oy + rows * C + 8} stroke={INK} strokeWidth="3.5" strokeDasharray="8 6" strokeLinecap="round" />
      )}
    </Svg>
  );
}

// ------------------------------------------------------------------------------------------------
// Alan (kutu) modeli
// ------------------------------------------------------------------------------------------------
function Area({ a, b }: { a: number[]; b: number[] }) {
  const fit = (parts: number[], total: number) => {
    const s = parts.reduce((x, y) => x + y, 0);
    const raw = parts.map((p) => (p / s) * total);
    return raw.map((r) => Math.max(r, 70));
  };
  const ws = fit(b, 420), hs = fit(a, 260);
  const W = ws.reduce((x, y) => x + y, 0) + 80, H = hs.reduce((x, y) => x + y, 0) + 60;
  const fills = ['#ffe1d8', '#d4f3ee', '#fff1c7', '#dcecff'];
  let k = 0;
  return (
    <Svg w={W} h={H} label="Alan modeli">
      {b.map((v, i) => (
        <text key={`b${i}`} x={60 + ws.slice(0, i).reduce((x, y) => x + y, 0) + ws[i] / 2} y={30} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={22} fill={TEAL}>{v}</text>
      ))}
      {a.map((v, i) => (
        <text key={`a${i}`} x={34} y={44 + hs.slice(0, i).reduce((x, y) => x + y, 0) + hs[i] / 2 + 8} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={22} fill={CORAL}>{v}</text>
      ))}
      {a.map((av, i) =>
        b.map((bv, j) => {
          const x = 60 + ws.slice(0, j).reduce((p, q) => p + q, 0);
          const y = 44 + hs.slice(0, i).reduce((p, q) => p + q, 0);
          const n = k++;
          return (
            <g key={`${i}-${j}`} className="v-pop" style={delay(n, 0.15)}>
              <rect x={x} y={y} width={ws[j]} height={hs[i]} fill={fills[n % 4]} stroke={INK} strokeWidth="3.5" />
              <text x={x + ws[j] / 2} y={y + hs[i] / 2 + 7} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={19} fill={INK}>{av} × {bv}</text>
            </g>
          );
        }),
      )}
    </Svg>
  );
}

function Reshape({ from, to }: { from: [number, number]; to: [number, number] }) {
  const U = 9;
  const rect = (x: number, [r, c]: [number, number], col: string) => (
    <g>
      <rect x={x} y={30} width={c * U} height={r * U} fill={col} stroke={INK} strokeWidth="3" rx="4" />
      {Array.from({ length: c - 1 }, (_, i) => <line key={`c${i}`} x1={x + (i + 1) * U} y1={30} x2={x + (i + 1) * U} y2={30 + r * U} stroke={INK} strokeOpacity="0.18" />)}
      {Array.from({ length: r - 1 }, (_, i) => <line key={`r${i}`} x1={x} y1={30 + (i + 1) * U} x2={x + c * U} y2={30 + (i + 1) * U} stroke={INK} strokeOpacity="0.18" />)}
      <text x={x + (c * U) / 2} y={20} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={20} fill={INK}>{r} × {c}</text>
    </g>
  );
  const w1 = from[1] * U, w2 = to[1] * U;
  const H = Math.max(from[0], to[0]) * U + 44;
  return (
    <Svg w={w1 + w2 + 130} h={H} label="Yarıla ve katla">
      {rect(10, from, '#ffe1d8')}
      <g transform={`translate(${w1 + 30} ${30 + (Math.min(from[0], to[0]) * U) / 2})`}>
        <path d="M0,0 H50 M38,-12 L52,0 L38,12" fill="none" stroke={CORAL} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <text x="25" y="-16" textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={14} fill={CORAL}>aynı alan</text>
      </g>
      <g className="v-pop" style={delay(3, 0.2)}>{rect(w1 + 110, to, '#d4f3ee')}</g>
    </Svg>
  );
}

// ------------------------------------------------------------------------------------------------
// Eşit paylaştırma: tabaklar ve şekerler (birer birer dağıtılır)
// ------------------------------------------------------------------------------------------------
function Share({ total, groups }: { total: number; groups: number }) {
  const PW = 120, W = groups * (PW + 14) + 10;
  const per = Math.ceil(total / groups);
  const cols = per > 6 ? 3 : 2;
  const rowsN = Math.ceil(per / cols);
  const H = Math.max(120, rowsN * 26 + 60);
  const colors = [CORAL, TEAL, SUN, BLUE, '#9b6bff', '#e9487d'];
  return (
    <Svg w={W} h={H} label={`${total} şeker, ${groups} tabak`}>
      {Array.from({ length: groups }, (_, g) => (
        <ellipse key={g} cx={10 + g * (PW + 14) + PW / 2} cy={H / 2 + 6} rx={PW / 2} ry={H / 2 - 12} fill="#fff" stroke={INK} strokeWidth="3.5" />
      ))}
      {Array.from({ length: total }, (_, i) => {
        const g = i % groups, k = Math.floor(i / groups);
        const cx = 10 + g * (PW + 14) + PW / 2 + ((k % cols) - (cols - 1) / 2) * 28;
        const cy = H / 2 + 6 + (Math.floor(k / cols) - (rowsN - 1) / 2) * 26;
        return <circle key={i} className="v-deal" style={delay(i, 0.12)} cx={cx} cy={cy} r="10" fill={colors[k % colors.length]} stroke={INK} strokeWidth="2.5" />;
      })}
    </Svg>
  );
}

// ------------------------------------------------------------------------------------------------
// Negatif / pozitif pullar
// ------------------------------------------------------------------------------------------------
function Chips({ pos, neg }: { pos: number; neg: number }) {
  const pairs = Math.min(pos, neg);
  const left = Math.abs(pos - neg);
  const leftPos = pos > neg;
  const C = 44;
  const W = Math.max(pairs * (C + 8) + (pairs ? 60 : 0) + left * (C + 8), 200) + 20;
  const chip = (x: number, y: number, plus: boolean, faded: boolean, d: number) => (
    <g key={`${x}-${y}`} className="v-pop" style={delay(d)} opacity={faded ? 0.38 : 1}>
      <circle cx={x} cy={y} r={C / 2 - 2} fill={plus ? SUN : '#ef4b4b'} stroke={INK} strokeWidth="3" />
      <text x={x} y={y + 9} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={26} fill={plus ? INK : '#fff'}>{plus ? '+' : '−'}</text>
    </g>
  );
  return (
    <Svg w={W} h={C * 2 + 40} label="Pullar">
      {Array.from({ length: pairs }, (_, i) => (
        <g key={`p${i}`}>
          {chip(20 + i * (C + 8) + C / 2, 10 + C / 2, true, true, i)}
          {chip(20 + i * (C + 8) + C / 2, 16 + C * 1.5, false, true, i)}
        </g>
      ))}
      {pairs > 0 && (
        <text x={20 + pairs * (C + 8) + 18} y={C + 22} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={20} fill="#8c766e">= 0</text>
      )}
      {Array.from({ length: left }, (_, i) => chip(20 + pairs * (C + 8) + (pairs ? 60 : 0) + i * (C + 8) + C / 2, 13 + C, leftPos, false, pairs + i))}
    </Svg>
  );
}

// ------------------------------------------------------------------------------------------------
// Uçan balonlar
// ------------------------------------------------------------------------------------------------
function Balloons({ total, fly }: { total: number; fly: number }) {
  const colors = [CORAL, TEAL, SUN, BLUE, '#9b6bff', '#e9487d'];
  const BW = 52, W = total * BW + 20, H = 190;
  return (
    <Svg w={W} h={H} label={`${total} balon`}>
      {Array.from({ length: total }, (_, i) => {
        const x = 10 + i * BW + BW / 2;
        const flies = i >= total - fly;
        return (
          <g key={i} className={flies ? 'v-fly' : 'v-pop'} style={flies ? { animationDelay: `${0.8 + (i - (total - fly)) * 0.35}s` } : delay(i)}>
            <path d={`M${x},${92} Q${x - 8},${120} ${x},${150} Q${x + 6},${165} ${x},${180}`} fill="none" stroke={INK} strokeWidth="2" />
            <ellipse cx={x} cy={62} rx={21} ry={27} fill={colors[i % colors.length]} stroke={INK} strokeWidth="3" />
            <path d={`M${x - 5},${89} L${x},${95} L${x + 5},${89} Z`} fill={colors[i % colors.length]} stroke={INK} strokeWidth="2" />
            <ellipse cx={x - 7} cy={52} rx={5} ry={8} fill="#fff" opacity="0.5" />
          </g>
        );
      })}
    </Svg>
  );
}

// ------------------------------------------------------------------------------------------------
// Rakam kutuları, çapraz çarpım, işlem sırası
// ------------------------------------------------------------------------------------------------
function Digits({ digits, note }: { digits: number[]; note?: string }) {
  const B = 70, W = digits.length * (B + 12) + 20;
  return (
    <div className="digits-wrap">
      <Svg w={W} h={B + 20} label="Rakamlar">
        {digits.map((d, i) => (
          <g key={i} className="v-pop" style={delay(i, 0.15)}>
            <rect x={10 + i * (B + 12)} y={10} width={B} height={B} rx="18" fill={i % 2 ? '#fff1c7' : '#fff'} stroke={INK} strokeWidth="3.5" />
            <text x={10 + i * (B + 12) + B / 2} y={10 + B / 2 + 12} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={String(d).length > 2 ? 26 : 34} fill={INK}>{d}</text>
          </g>
        ))}
      </Svg>
      {note && <p className="visual__note">{note}</p>}
    </div>
  );
}

function Cross({ a, b }: { a: number; b: number }) {
  const da = [Math.floor(a / 10), a % 10], db = [Math.floor(b / 10), b % 10];
  const panel = (ox: number, title: string, lines: [number, number][], col: string, i: number) => (
    <g className="v-pop" style={delay(i, 0.3)}>
      <rect x={ox} y={4} width={170} height={176} rx="18" fill={SOFT} stroke={INK} strokeWidth="2.5" />
      <text x={ox + 85} y={30} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={16} fill="#8c766e">{title}</text>
      {[0, 1].map((c) => (
        <g key={c}>
          <text x={ox + 55 + c * 60} y={82} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={34} fill={INK}>{da[c]}</text>
          <text x={ox + 55 + c * 60} y={160} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={34} fill={INK}>{db[c]}</text>
        </g>
      ))}
      {lines.map(([t, btm], k) => (
        <line key={k} x1={ox + 55 + t * 60} y1={92} x2={ox + 55 + btm * 60} y2={128} stroke={col} strokeWidth="5" strokeLinecap="round" />
      ))}
    </g>
  );
  return (
    <Svg w={560} h={186} label="Çapraz çarpım">
      {panel(4, '1) Dikey: birler', [[1, 1]], CORAL, 0)}
      {panel(194, '2) Çapraz', [[0, 1], [1, 0]], TEAL, 1)}
      {panel(384, '3) Dikey: onlar', [[0, 0]], BLUE, 2)}
    </Svg>
  );
}

function Order({ parts }: { parts: { t: string; first?: boolean }[] }) {
  let n = 0;
  return (
    <div className="order-row">
      {parts.map((p, i) => (
        <span key={i} className={`order-chip ${p.first ? 'order-chip--first' : ''} v-pop`} style={delay(i, 0.12)}>
          {p.first && <b className="order-chip__n">{++n}</b>}
          {p.t}
        </span>
      ))}
    </div>
  );
}

export function Visual({ spec }: { spec: VisualSpec }) {
  let body: ReactNode;
  switch (spec.type) {
    case 'dots': body = <Dots n={spec.n} flash={spec.flash} />; break;
    case 'tenframe': body = <TenFrame {...spec} />; break;
    case 'numberline': body = <NumberLine {...spec} />; break;
    case 'blocks': body = <Blocks nums={spec.nums} />; break;
    case 'bar': body = <Bar rows={spec.rows} total={spec.total} unitLabel={spec.unitLabel} />; break;
    case 'array': body = <ArrayModel {...spec} />; break;
    case 'area': body = <Area a={spec.a} b={spec.b} />; break;
    case 'reshape': body = <Reshape from={spec.from} to={spec.to} />; break;
    case 'share': body = <Share total={spec.total} groups={spec.groups} />; break;
    case 'chips': body = <Chips pos={spec.pos} neg={spec.neg} />; break;
    case 'balloons': body = <Balloons total={spec.total} fly={spec.fly} />; break;
    case 'digits': body = <Digits digits={spec.digits} note={spec.note} />; break;
    case 'cross': body = <Cross a={spec.a} b={spec.b} />; break;
    case 'order': body = <Order parts={spec.parts} />; break;
  }
  return <div className={`visual visual--${spec.type}`}>{body}</div>;
}
