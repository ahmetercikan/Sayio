/**
 * Sayio'nun öğretim modeli.
 *
 * Her "püf noktası" (Trick) bir zihinsel kısayoldur (10'a tamamla, sabit fark, parçala-çarp…). Sorular statik
 * metin değildir: `make(level)` her çağrıda parametrik bir soru üretir. Her soru, kolay yolu adım adım yürüten
 * iskele adımları (scaffolding) ve somut bir görsel model (CPA: somut → resimli → soyut) taşır.
 */

/** Yaş grupları: 4-5 Minik, 6-7 Keşif, 8-10 Usta, 11-14 Dahi. */
export type Band = 'minik' | 'kesif' | 'usta' | 'dahi';
export type Op = 'add' | 'sub' | 'mul' | 'div' | 'mix';

export type Seg = { v: number; label?: string; color?: string; unknown?: boolean; dashed?: boolean };
export type BarRow = { name: string; segs: Seg[] };

/** Somut / resimli modeller (src/visuals/Visual.tsx çizer). */
export type VisualSpec =
  | { type: 'dots'; n: number; flash?: boolean }
  | { type: 'tenframe'; a: number; b?: number; remove?: number; cap?: 10 | 20 }
  | { type: 'numberline'; start: number; jumps: { by: number; label?: string }[]; spans?: { from: number; to: number; label: string }[]; marks?: number[] }
  | { type: 'blocks'; nums: number[] }
  | { type: 'bar'; rows: BarRow[]; total?: { label: string; unknown?: boolean }; unitLabel?: string }
  | { type: 'array'; rows: number; cols: number; splitCol?: number; fadeRows?: number; labels?: boolean }
  | { type: 'area'; a: number[]; b: number[] }
  | { type: 'reshape'; from: [number, number]; to: [number, number] }
  | { type: 'share'; total: number; groups: number }
  | { type: 'chips'; pos: number; neg: number }
  | { type: 'balloons'; total: number; fly: number }
  | { type: 'digits'; digits: number[]; note?: string }
  | { type: 'cross'; a: number; b: number }
  | { type: 'order'; parts: { t: string; first?: boolean }[] };

export interface Choice { label: string; value: number }

/** İskele adımı: `eq` içindeki "?" çocuğun dolduracağı kutudur. */
export interface Step {
  say: string;
  eq: string;
  answer: number;
  hint?: string;
  choices?: Choice[];
}

export interface Problem {
  trickId: string;
  /** Asıl soru ("8 + 5 = ?"). */
  expr: string;
  answer: number;
  /** Kolay yoldan çözüm adımları; son adımın cevabı = answer. */
  steps: Step[];
  /** Kısa püf cümlesi (ipucu). */
  hint: string;
  visual?: VisualSpec;
  /** Soru metni (ör. "Kaç nokta var?"). */
  ask?: string;
  /** Cevap seçenekleri hazır verilmişse (evet/hayır gibi). */
  choices?: Choice[];
  /** 'frame': 10'luk çerçevede boş gözlere dokunarak cevaplanır (küçükler için klavyesiz). */
  input?: 'frame';
  /** Görsel her zaman açık (sayma soruları). */
  visualAlways?: boolean;
  /** Cevap eksi olabilir (numpad'de ± tuşu). */
  negative?: boolean;
}

export interface Trick {
  id: string;
  band: Band;
  op: Op;
  title: string;
  emoji: string;
  /** Kartta görünen tek satırlık özet: "8+5 → 10+3". */
  short: string;
  /** Maskotun anlattığı fikir (1-2 cümle). */
  idea: string;
  make: (level: number) => Problem;
}

export const BANDS: { id: Band; title: string; ages: string; min: number; max: number; color: string; dark: string; soft: string }[] = [
  { id: 'minik', title: 'Minikler', ages: '4-5 yaş', min: 4, max: 5, color: '#ff6b4a', dark: '#de4d2d', soft: '#ffe7de' },
  { id: 'kesif', title: 'Kaşifler', ages: '6-7 yaş', min: 6, max: 7, color: '#14a89a', dark: '#0d8074', soft: '#d4f3ee' },
  { id: 'usta', title: 'Ustalar', ages: '8-10 yaş', min: 8, max: 10, color: '#3f7fe0', dark: '#2a62bd', soft: '#dcecff' },
  { id: 'dahi', title: 'Dahiler', ages: '11-14 yaş', min: 11, max: 14, color: '#9b6bff', dark: '#7a4fe0', soft: '#f1e8ff' },
];

export const OPS: Record<Op, { title: string; sign: string; color: string; dark: string; soft: string }> = {
  add: { title: 'Toplama', sign: '+', color: '#ff6b4a', dark: '#de4d2d', soft: '#ffe7de' },
  sub: { title: 'Çıkarma', sign: '−', color: '#14a89a', dark: '#0d8074', soft: '#d4f3ee' },
  mul: { title: 'Çarpma', sign: '×', color: '#3f7fe0', dark: '#2a62bd', soft: '#dcecff' },
  div: { title: 'Bölme', sign: '÷', color: '#9b6bff', dark: '#7a4fe0', soft: '#f1e8ff' },
  mix: { title: 'Karışık', sign: '%', color: '#e8a200', dark: '#b87f00', soft: '#fff1c7' },
};

export function bandOfAge(age: number): Band {
  if (age <= 5) return 'minik';
  if (age <= 7) return 'kesif';
  if (age <= 10) return 'usta';
  return 'dahi';
}

export const bandInfo = (b: Band) => BANDS.find((x) => x.id === b)!;
export const bandIndex = (b: Band) => BANDS.findIndex((x) => x.id === b);
