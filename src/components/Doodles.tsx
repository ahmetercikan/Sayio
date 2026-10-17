/**
 * Çizio'nun imza zemini: yumuşak suluboya lekeleri ve kenarlarda küçük kalem karalamaları
 * (yıldız, spiral, dalga, kalp). Her ekran farklı bir yerleşim kullanır; içerikle yarışmaz.
 */
const BLOB = [
  'M60,-40 C120,-60 190,-20 200,40 C212,110 150,150 90,140 C20,128 -20,80 -10,20 C-4,-12 20,-30 60,-40 Z',
  'M40,-30 C100,-50 170,0 160,60 C150,120 90,150 30,130 C-30,110 -40,40 -20,0 C-10,-18 10,-24 40,-30 Z',
  'M0,-50 C70,-70 150,-30 140,40 C132,100 70,140 10,120 C-50,100 -70,30 -50,-10 C-40,-30 -20,-44 0,-50 Z',
];

const DOODLES = {
  star: 'M0,-16 L4,-5 L16,-5 L6,2 L10,14 L0,7 L-10,14 L-6,2 L-16,-5 L-4,-5 Z',
  spiral: 'M0,0 C4,-4 10,0 8,6 C6,12 -4,12 -8,4 C-12,-6 -2,-16 10,-12 C20,-8 22,6 16,14',
  wave: 'M-24,0 C-18,-8 -12,-8 -6,0 C0,8 6,8 12,0 C18,-8 24,-8 30,0',
  heart: 'M0,10 C-14,0 -16,-10 -9,-14 C-4,-17 0,-12 0,-9 C0,-12 4,-17 9,-14 C16,-10 14,0 0,10 Z',
  sparkle: 'M0,-12 Q2,-2 12,0 Q2,2 0,12 Q-2,2 -12,0 Q-2,-2 0,-12 Z',
};

type Item = { k: keyof typeof DOODLES; x: number; y: number; r?: number; s?: number; c: string };
type Blob = { i: number; x: number; y: number; s: number; r: number; c: string };

const LAYOUTS: { blobs: Blob[]; items: Item[] }[] = [
  {
    blobs: [
      { i: 0, x: 60, y: 40, s: 1.6, r: 10, c: 'var(--blob-sun)' },
      { i: 1, x: 880, y: 560, s: 1.9, r: -20, c: 'var(--blob-coral)' },
      { i: 2, x: 930, y: 80, s: 0.9, r: 30, c: 'var(--blob-teal)' },
    ],
    items: [
      { k: 'star', x: 190, y: 620, r: 12, c: 'var(--coral)' },
      { k: 'spiral', x: 820, y: 210, c: 'var(--teal)' },
      { k: 'sparkle', x: 300, y: 90, c: 'var(--sun-dark)' },
      { k: 'wave', x: 560, y: 660, c: 'var(--teal)' },
    ],
  },
  {
    blobs: [
      { i: 2, x: 900, y: 60, s: 1.7, r: -10, c: 'var(--blob-coral)' },
      { i: 0, x: 20, y: 600, s: 1.8, r: 40, c: 'var(--blob-teal)' },
      { i: 1, x: 520, y: 700, s: 1.0, r: 0, c: 'var(--blob-sun)' },
    ],
    items: [
      { k: 'heart', x: 130, y: 110, r: -12, c: 'var(--coral)' },
      { k: 'star', x: 860, y: 430, r: -8, c: 'var(--sun-dark)' },
      { k: 'sparkle', x: 700, y: 110, c: 'var(--teal)' },
      { k: 'spiral', x: 260, y: 520, c: 'var(--sun-dark)' },
    ],
  },
  {
    blobs: [
      { i: 1, x: 30, y: 60, s: 1.5, r: -30, c: 'var(--blob-teal)' },
      { i: 0, x: 900, y: 640, s: 1.6, r: 15, c: 'var(--blob-sun)' },
      { i: 2, x: 980, y: 260, s: 0.8, r: 60, c: 'var(--blob-coral)' },
    ],
    items: [
      { k: 'wave', x: 780, y: 90, c: 'var(--coral)' },
      { k: 'star', x: 90, y: 440, r: 20, c: 'var(--teal)' },
      { k: 'heart', x: 640, y: 640, r: 10, c: 'var(--coral)' },
      { k: 'sparkle', x: 380, y: 60, c: 'var(--sun-dark)' },
    ],
  },
  {
    blobs: [
      { i: 0, x: 960, y: 120, s: 1.4, r: 20, c: 'var(--blob-sun)' },
      { i: 2, x: 40, y: 380, s: 1.3, r: -15, c: 'var(--blob-coral)' },
      { i: 1, x: 700, y: 680, s: 1.5, r: 5, c: 'var(--blob-teal)' },
    ],
    items: [
      { k: 'spiral', x: 150, y: 90, c: 'var(--coral)' },
      { k: 'sparkle', x: 880, y: 380, c: 'var(--teal)' },
      { k: 'star', x: 420, y: 670, r: -10, c: 'var(--sun-dark)' },
      { k: 'heart', x: 600, y: 70, r: 8, c: 'var(--teal)' },
    ],
  },
];

export function Doodles({ variant = 0 }: { variant?: number }) {
  const L = LAYOUTS[variant % LAYOUTS.length];
  return (
    <svg className="doodles" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {L.blobs.map((b, i) => (
        <path key={`b${i}`} className="doodles__blob" d={BLOB[b.i]} fill={b.c}
          transform={`translate(${b.x} ${b.y}) rotate(${b.r}) scale(${b.s})`} />
      ))}
      {L.items.map((it, i) => (
        <path key={`d${i}`} className="doodles__ink" d={DOODLES[it.k]} stroke={it.c}
          fill={it.k === 'heart' || it.k === 'star' || it.k === 'sparkle' ? it.c : 'none'}
          fillOpacity={0.25} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"
          style={{ animationDelay: `${0.15 * i}s` }}
          transform={`translate(${it.x} ${it.y}) rotate(${it.r ?? 0}) scale(${it.s ?? 1.3})`} />
      ))}
    </svg>
  );
}
