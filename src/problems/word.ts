/**
 * Sözel problem üreticisi — Polya'nın 4 aşaması + Singapur çubuk (bar) modeli.
 *
 * Çocukların asıl takıldığı yer işlem değil, metni matematiğe çevirmektir (temsil boşluğu).
 * Bu yüzden her problem: 1) Anla (ne soruluyor?), 2) Planla (hangi çubuk modeli?), 3) Uygula (iskeleli adımlar),
 * 4) Kontrol (ters işlemle sağlama) aşamalarından geçer.
 */
import { pick, rnd, shuffle } from '../lib/util';
import type { Band, Seg, Step, VisualSpec } from '../tricks/types';

export type ModelKind = 'part-whole' | 'compare' | 'multi' | 'groups';

export interface WordProblem {
  band: Band;
  kind: ModelKind;
  text: string;
  emoji: string;
  given: { label: string; value: number }[];
  askOptions: string[];
  askIndex: number;
  models: VisualSpec[];
  modelIndex: number;
  steps: Step[];
  check?: Step;
  answer: number;
  unit: string;
  /** Minikler için resimli anlatım. */
  picture?: { a: number; b: number; op: '+' | '−' };
}

type Name = { n: string; gen: string; dat: string };
const NAMES: Name[] = [
  { n: 'Ali', gen: 'Ali\'nin', dat: 'Ali\'ye' },
  { n: 'Ayşe', gen: 'Ayşe\'nin', dat: 'Ayşe\'ye' },
  { n: 'Can', gen: 'Can\'ın', dat: 'Can\'a' },
  { n: 'Elif', gen: 'Elif\'in', dat: 'Elif\'e' },
  { n: 'Mert', gen: 'Mert\'in', dat: 'Mert\'e' },
  { n: 'Zeynep', gen: 'Zeynep\'in', dat: 'Zeynep\'e' },
  { n: 'Deniz', gen: 'Deniz\'in', dat: 'Deniz\'e' },
  { n: 'Emir', gen: 'Emir\'in', dat: 'Emir\'e' },
  { n: 'Defne', gen: 'Defne\'nin', dat: 'Defne\'ye' },
  { n: 'Kerem', gen: 'Kerem\'in', dat: 'Kerem\'e' },
];

/** Sıra önemli: küçüklerde yalnızca baştaki birkaçı kullanılır (bkz. DAR_NESNE). */
const THINGS = [
  { w: 'balon', poss: 'balonu', e: '🎈' },
  { w: 'kurabiye', poss: 'kurabiyesi', e: '🍪' },
  { w: 'elma', poss: 'elması', e: '🍎' },
  { w: 'çıkartma', poss: 'çıkartması', e: '⭐' },
  { w: 'bilye', poss: 'bilyesi', e: '🔵' },
  { w: 'kalem', poss: 'kalemi', e: '✏️' },
  { w: 'kitap', poss: 'kitabı', e: '📚' },
];

/**
 * Küçüklerde (4-7 yaş) isim ve nesne çeşidi bilerek dar tutulur.
 *
 * Sebebi pedagojik değil, teknik: o yaşta sesli anlatım otomatik açık ve çocuk okuyamıyor, bu yüzden
 * her cümlenin doğal sesi önceden üretiliyor (bkz. docs/ses.md). 10 isim × 7 nesne 16 binden fazla
 * farklı cümle demek; 4 × 4 ile 2.500 cümleye iniyor ve hepsi tam cümle olarak seslendirilebiliyor.
 * Matematik aynı: değişen tek şey cümledeki isim ve nesne. 8-14 yaş tam çeşitliliği görmeye devam eder.
 */
const DAR_ISIM = 3;
const DAR_NESNE = 2;
const dar = (b: Band) => b === 'minik' || b === 'kesif';

const things = (b: Band) => (dar(b) ? THINGS.slice(0, DAR_NESNE) : THINGS);
const two = (b: Band): [Name, Name] => {
  const [x, y] = shuffle(dar(b) ? NAMES.slice(0, DAR_ISIM) : NAMES);
  return [x, y];
};

const C1 = '#ff6b4a', C2 = '#14a89a', C3 = '#ffc83d';

// ---- Çubuk modelleri ----
function partWhole(a: number, b: number, unknown: 'whole' | 'b'): VisualSpec {
  return {
    type: 'bar',
    rows: [{ name: '', segs: [{ v: a, label: String(a), color: C1 }, { v: b, label: unknown === 'b' ? '?' : String(b), color: C2, unknown: unknown === 'b' }] }],
    total: { label: unknown === 'whole' ? '?' : String(a + b), unknown: unknown === 'whole' },
  };
}

function compare(big: number, small: number, unknown: 'diff' | 'small' | 'big', nb: string, ns: string): VisualSpec {
  return {
    type: 'bar',
    rows: [
      { name: nb, segs: [{ v: small, label: unknown === 'big' ? '' : String(small), color: C1 }, { v: big - small, label: unknown === 'diff' ? '?' : String(big - small), dashed: true, unknown: unknown === 'diff', color: C3 }] },
      { name: ns, segs: [{ v: small, label: unknown === 'small' ? '?' : String(small), color: C2, unknown: unknown === 'small' }] },
    ],
    total: unknown === 'big' ? { label: `${nb}: ?`, unknown: true } : undefined,
  };
}

function multi(k: number, total: number, nb: string, ns: string): VisualSpec {
  const segs = (n: number, c: string): Seg[] => Array.from({ length: n }, (_, i) => ({ v: 1, label: i === 0 ? '?' : '', color: c }));
  return { type: 'bar', rows: [{ name: ns, segs: segs(1, C2) }, { name: nb, segs: segs(k, C1) }], total: { label: `Toplam ${total}` }, unitLabel: '1 kutu' };
}

function groups(g: number, per: number, unknown: 'total' | 'per'): VisualSpec {
  return {
    type: 'bar',
    rows: [{ name: '', segs: Array.from({ length: g }, () => ({ v: 1, label: unknown === 'per' ? '?' : String(per), color: C2, unknown: unknown === 'per' })) }],
    total: { label: unknown === 'total' ? '?' : String(g * per), unknown: unknown === 'total' },
  };
}

/** Doğru model + iki farklı (yanlış) model; sırası karışık. */
function modelSet(right: VisualSpec, wrongs: VisualSpec[]): { models: VisualSpec[]; modelIndex: number } {
  const all = shuffle([right, ...wrongs]);
  return { models: all, modelIndex: all.indexOf(right) };
}

function asks(right: string, wrongs: string[]) {
  const all = shuffle([right, ...wrongs]);
  return { askOptions: all, askIndex: all.indexOf(right) };
}

// ---- Problem kalıpları ----
function minikProblem(): WordProblem {
  const t = pick(things('minik'));
  const [p] = two('minik');
  if (Math.random() < 0.55) {
    const a = rnd(1, 5), b = rnd(1, 4);
    return {
      band: 'minik', kind: 'part-whole', emoji: t.e, unit: t.w,
      text: `${p.n} ${a} ${t.w} buldu. Sonra ${b} tane daha buldu. Kaç ${t.w} oldu?`,
      given: [{ label: 'İlk', value: a }, { label: 'Sonra', value: b }],
      ...asks(`Hepsi kaç ${t.w}?`, [`${p.n} kaç yaşında?`]),
      ...modelSet(partWhole(a, b, 'whole'), []),
      steps: [{ say: 'Hepsini birlikte say!', eq: `${a} + ${b} = ?`, answer: a + b }],
      answer: a + b,
      picture: { a, b, op: '+' },
    };
  }
  const a = rnd(3, 8), b = rnd(1, a - 1);
  return {
    band: 'minik', kind: 'part-whole', emoji: t.e, unit: t.w,
    text: `${p.gen} ${a} ${t.poss} vardı. ${b} tanesini arkadaşına verdi. Kaç ${t.w} kaldı?`,
    given: [{ label: 'Vardı', value: a }, { label: 'Verdi', value: b }],
    ...asks(`Kaç ${t.w} kaldı?`, ['Arkadaşı kim?']),
    ...modelSet(partWhole(b, a - b, 'b'), []),
    steps: [{ say: 'Verilenleri kapat, kalanları say!', eq: `${a} − ${b} = ?`, answer: a - b }],
    answer: a - b,
    picture: { a, b, op: '−' },
  };
}

function kesifProblem(): WordProblem {
  const t = pick(things('kesif'));
  const [p, q] = two('kesif');
  const k = rnd(0, 2);
  if (k === 0) {
    const a = rnd(4, 9), b = rnd(3, 9);
    return {
      band: 'kesif', kind: 'part-whole', emoji: t.e, unit: t.w,
      text: `${p.gen} ${a}, ${q.gen} ${b} ${t.poss} var. İkisinin toplam kaç ${t.poss} var?`,
      given: [{ label: p.n, value: a }, { label: q.n, value: b }],
      ...asks(`Toplam kaç ${t.w}?`, [`${p.n} kaç fazla?`, `${q.n} kaç tane verdi?`]),
      ...modelSet(partWhole(a, b, 'whole'), [compare(Math.max(a, b) + 1, Math.min(a, b), 'diff', p.n, q.n)]),
      steps: [{ say: 'Parçaları birleştir: bütünü bul!', eq: `${a} + ${b} = ?`, answer: a + b }],
      check: { say: 'Kontrol: bütünden bir parçayı çıkarınca diğer parça kalmalı.', eq: `${a + b} − ${a} = ?`, answer: b },
      answer: a + b,
    };
  }
  if (k === 1) {
    const total = rnd(11, 19), a = rnd(3, total - 3);
    return {
      band: 'kesif', kind: 'part-whole', emoji: t.e, unit: t.w,
      text: `Bir kutuda ${total} ${t.w} var. Bunların ${a} tanesi kırmızı, gerisi mavi. Kaç tane mavi ${t.w} var?`,
      given: [{ label: 'Hepsi', value: total }, { label: 'Kırmızı', value: a }],
      ...asks(`Kaç tane mavi ${t.w}?`, [`Hepsi kaç ${t.w}?`, 'Kutu ne renk?']),
      ...modelSet(partWhole(a, total - a, 'b'), [partWhole(total, a, 'whole')]),
      steps: [{ say: 'Bütünden bilinen parçayı çıkar.', eq: `${total} − ${a} = ?`, answer: total - a }],
      check: { say: 'Kontrol: iki parça bütünü vermeli.', eq: `${a} + ${total - a} = ?`, answer: total },
      answer: total - a,
    };
  }
  const big = rnd(9, 18), small = rnd(3, big - 2);
  return {
    band: 'kesif', kind: 'compare', emoji: t.e, unit: t.w,
    text: `${p.gen} ${big}, ${q.gen} ${small} ${t.poss} var. ${p.gen} ${q.gen}kinden kaç fazla ${t.poss} var?`,
    given: [{ label: p.n, value: big }, { label: q.n, value: small }],
    ...asks('Aradaki fark kaç?', [`Toplam kaç ${t.w}?`, `${q.n} kaç tane aldı?`]),
    ...modelSet(compare(big, small, 'diff', p.n, q.n), [partWhole(big, small, 'whole')]),
    steps: [{ say: 'Uzun çubuktan kısa çubuğu çıkar: fark kalır.', eq: `${big} − ${small} = ?`, answer: big - small }],
    check: { say: 'Kontrol: kısa çubuğa farkı ekleyince uzun çubuk olmalı.', eq: `${small} + ${big - small} = ?`, answer: big },
    answer: big - small,
  };
}

function ustaProblem(): WordProblem {
  const [p, q] = two('usta');
  const k = rnd(0, 4);
  if (k === 0) {
    const a = rnd(24, 68), b = rnd(19, 59);
    return {
      band: 'usta', kind: 'part-whole', emoji: '📚', unit: 'kitap',
      text: `Kütüphanede ${a} masal kitabı ve ${b} bilim kitabı var. Toplam kaç kitap var?`,
      given: [{ label: 'Masal', value: a }, { label: 'Bilim', value: b }],
      ...asks('Toplam kaç kitap?', ['Masal kitapları kaç fazla?', 'Kaç raf var?']),
      ...modelSet(partWhole(a, b, 'whole'), [compare(Math.max(a, b), Math.min(a, b) - 1, 'diff', 'Masal', 'Bilim'), groups(3, a, 'total')]),
      steps: [
        { say: 'Soldan topla: önce onluklar.', eq: `${Math.floor(a / 10) * 10} + ${Math.floor(b / 10) * 10} = ?`, answer: Math.floor(a / 10) * 10 + Math.floor(b / 10) * 10 },
        { say: 'Sonra birlikler.', eq: `${a % 10} + ${b % 10} = ?`, answer: (a % 10) + (b % 10) },
        { say: 'Birleştir!', eq: `${a} + ${b} = ?`, answer: a + b },
      ],
      check: { say: 'Kontrol: toplamdan bir parçayı çıkar.', eq: `${a + b} − ${b} = ?`, answer: a },
      answer: a + b,
    };
  }
  if (k === 1) {
    const total = rnd(62, 98), a = rnd(21, total - 15);
    return {
      band: 'usta', kind: 'part-whole', emoji: '🧒', unit: 'öğrenci',
      text: `Bir okulda ${total} öğrenci gezide. Bunların ${a} tanesi kız. Gezide kaç erkek öğrenci var?`,
      given: [{ label: 'Hepsi', value: total }, { label: 'Kız', value: a }],
      ...asks('Kaç erkek öğrenci var?', ['Toplam kaç öğrenci?', 'Kızlar kaç fazla?']),
      ...modelSet(partWhole(a, total - a, 'b'), [partWhole(total, a, 'whole'), compare(total, a, 'big', 'Erkek', 'Kız')]),
      steps: [{ say: 'Bütünden bilinen parçayı çıkar. (Sabit fark hilesini dene!)', eq: `${total} − ${a} = ?`, answer: total - a }],
      check: { say: 'Kontrol: iki parçayı topla, bütün çıkmalı.', eq: `${a} + ${total - a} = ?`, answer: total },
      answer: total - a,
    };
  }
  if (k === 2) {
    const big = rnd(45, 95), d = rnd(12, 29), small = big - d;
    return {
      band: 'usta', kind: 'compare', emoji: '🪙', unit: 'TL',
      text: `${p.n} ${big} TL biriktirdi. ${q.n} ondan ${d} TL az biriktirdi. ${q.n} kaç TL biriktirdi?`,
      given: [{ label: p.n, value: big }, { label: 'Fark', value: d }],
      ...asks(`${q.n} kaç TL biriktirdi?`, ['İkisi toplam kaç TL?', `${p.n} kaç TL fazla?`]),
      ...modelSet(compare(big, small, 'small', p.n, q.n), [partWhole(big, d, 'whole'), groups(2, big, 'total')]),
      steps: [{ say: `${q.gen} çubuğu daha kısa: farkı çıkar.`, eq: `${big} − ${d} = ?`, answer: small }],
      check: { say: 'Kontrol: kısa çubuğa farkı ekle.', eq: `${small} + ${d} = ?`, answer: big },
      answer: small,
    };
  }
  if (k === 3) {
    const g = rnd(4, 9), per = rnd(4, 9);
    return {
      band: 'usta', kind: 'groups', emoji: '✏️', unit: 'kalem',
      text: `Her kutuda ${per} kalem var. ${g} kutuda toplam kaç kalem vardır?`,
      given: [{ label: 'Kutu', value: g }, { label: 'Her kutuda', value: per }],
      ...asks('Toplam kaç kalem?', ['Bir kutuda kaç kalem?', 'Kaç kutu var?']),
      ...modelSet(groups(g, per, 'total'), [partWhole(g, per, 'whole'), compare(g + per, per, 'diff', 'Kutu', 'Kalem')]),
      steps: [{ say: `${g} tane eşit parça: çarp!`, eq: `${g} × ${per} = ?`, answer: g * per }],
      check: { say: 'Kontrol: toplamı kutu sayısına böl.', eq: `${g * per} ÷ ${g} = ?`, answer: per },
      answer: g * per,
    };
  }
  const g = rnd(3, 8), per = rnd(4, 12), total = g * per;
  return {
    band: 'usta', kind: 'groups', emoji: '🍪', unit: 'kurabiye',
    text: `${total} kurabiye ${g} tabağa eşit olarak konuyor. Her tabakta kaç kurabiye olur?`,
    given: [{ label: 'Hepsi', value: total }, { label: 'Tabak', value: g }],
    ...asks('Bir tabakta kaç kurabiye?', ['Toplam kaç kurabiye?', 'Kaç tabak var?']),
    ...modelSet(groups(g, per, 'per'), [groups(g, per, 'total'), partWhole(total, g, 'whole')]),
    steps: [{ say: 'Bütünü eşit parçalara böl. (Çarpmayı düşün!)', eq: `${g} × ? = ${total}`, answer: per }],
    check: { say: 'Kontrol: bir tabaktakini tabak sayısıyla çarp.', eq: `${per} × ${g} = ?`, answer: total },
    answer: per,
  };
}

function dahiProblem(): WordProblem {
  const [p, q] = two('dahi');
  const k = rnd(0, 2);
  if (k === 0) {
    const m = rnd(2, 5), unit = rnd(6, 25), total = unit * (m + 1);
    const askBig = Math.random() < 0.5;
    const ans = askBig ? unit * m : unit;
    return {
      band: 'dahi', kind: 'multi', emoji: '🪙', unit: 'TL',
      text: `${p.gen} parası, ${q.gen} parasının ${m} katıdır. İkisinin toplam ${total} TL parası var. ${askBig ? p.gen : q.gen} kaç TL parası var?`,
      given: [{ label: 'Kat', value: m }, { label: 'Toplam', value: total }],
      ...asks(`${askBig ? p.gen : q.gen} parası`, ['İkisinin farkı', 'Toplam para']),
      ...modelSet(multi(m, total, p.n, q.n), [partWhole(total, m, 'whole'), compare(total, m, 'diff', p.n, q.n)]),
      steps: [
        { say: 'Toplam kaç kutu var?', eq: `1 + ${m} = ?`, answer: m + 1 },
        { say: 'Bir kutu ne kadar?', eq: `${total} ÷ ${m + 1} = ?`, answer: unit },
        ...(askBig ? [{ say: `${p.n} ${m} kutu alıyor.`, eq: `${unit} × ${m} = ?`, answer: unit * m }] : []),
      ],
      check: { say: 'Kontrol: iki kişinin parası toplamı vermeli.', eq: `${unit} + ${unit * m} = ?`, answer: total },
      answer: ans,
    };
  }
  if (k === 1) {
    const small = rnd(12, 40), d = rnd(4, 18), total = small * 2 + d;
    return {
      band: 'dahi', kind: 'compare', emoji: '🔵', unit: 'bilye',
      text: `İki kardeşin toplam ${total} bilyesi var. ${p.gen} bilyeleri ${q.gen}kinden ${d} fazla. ${q.gen} kaç bilyesi var?`,
      given: [{ label: 'Toplam', value: total }, { label: 'Fark', value: d }],
      ...asks(`${q.gen} bilyeleri`, ['Toplam bilye', 'Fark']),
      ...modelSet(compare(small + d, small, 'small', p.n, q.n), [partWhole(total, d, 'whole'), multi(2, total, p.n, q.n)]),
      steps: [
        { say: 'Fazlalığı çıkar: iki eşit çubuk kalır.', eq: `${total} − ${d} = ?`, answer: total - d },
        { say: 'İki eşit parçaya böl.', eq: `${total - d} ÷ 2 = ?`, answer: small },
      ],
      check: { say: `Kontrol: ${q.n} + ${p.n} toplamı vermeli.`, eq: `${small} + ${small + d} = ?`, answer: total },
      answer: small,
    };
  }
  const b = pick([3, 4, 5, 8]), a = rnd(1, b - 1), N = b * rnd(4, 12);
  return {
    band: 'dahi', kind: 'groups', emoji: '🚌', unit: 'öğrenci',
    text: `Bir sınıftaki ${N} öğrencinin ${a}/${b} kadarı müzeye gitti. Kaç öğrenci müzeye gitti?`,
    given: [{ label: 'Hepsi', value: N }, { label: 'Kesir', value: a / b }],
    ...asks('Müzeye giden öğrenci sayısı', ['Gitmeyen öğrenci sayısı', 'Sınıfın mevcudu']),
    ...modelSet(
      { type: 'bar', rows: [{ name: '', segs: Array.from({ length: b }, (_, i) => ({ v: 1, label: i === 0 ? '?' : '', color: i < a ? C1 : undefined })) }], total: { label: String(N) } },
      [partWhole(N, a, 'whole'), groups(a, b, 'total')],
    ),
    steps: [
      { say: `${b} eşit parçaya böl: bir parça kaç?`, eq: `${N} ÷ ${b} = ?`, answer: N / b },
      { say: `${a} parça müzeye gitti.`, eq: `${N / b} × ${a} = ?`, answer: (N / b) * a },
    ],
    check: { say: 'Kontrol: gidenler + gitmeyenler = hepsi', eq: `${(N / b) * a} + ${(N / b) * (b - a)} = ?`, answer: N },
    answer: (N / b) * a,
  };
}

export function makeWordProblem(b: Band): WordProblem {
  switch (b) {
    case 'minik': return minikProblem();
    case 'kesif': return kesifProblem();
    case 'usta': return ustaProblem();
    default: return dahiProblem();
  }
}
