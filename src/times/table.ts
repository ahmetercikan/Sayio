/**
 * Çarpım tablosunun 10 kolay yolu — her aile için bir ders.
 *
 * Her ders, uygulamanın normal ders akışını kullanır (Keşfet → Birlikte → Sen yap → Yıldızlar),
 * ama ezber yerine **türetme stratejisi** öğretir: 7 × 8'i hatırlamıyorsan 7 × 10'dan 7 × 2'yi çıkar.
 * Adımlar bilerek kısa tutuldu (Bilişsel Yük Teorisi: aynı anda en fazla iki şey).
 */
import { rnd } from '../lib/util';
import type { Problem, Trick } from '../tricks/types';
import { FAMILIES, familyOf, type Family } from './facts';

/** Dersin bu seviyede hangi çarpanla çalışacağı. Küçük seviyede küçük sayılar. */
const other = (level: number) => (level === 1 ? rnd(2, 5) : level === 2 ? rnd(3, 8) : rnd(4, 10));

/** Bir ailenin kolay yolu: verilen çarpan için adımları, görseli ve ipucunu üretir. */
type Build = (a: number, n: number) => Pick<Problem, 'steps' | 'visual' | 'hint'>;

const LESSONS: { f: Family; idea: string; build: Build }[] = [
  entry(
    '1',
    "1 kere almak, bir tane almak demektir. 7 × 1 = 7, 9 × 1 = 9… Sayı aynadaki gibi kendisi kalır!",
    (a) => ({
      visual: { type: 'array', rows: 1, cols: a },
      hint: 'Bir kere alınca sayı değişmez.',
      steps: [{ say: 'Tek sıra var, içinde kaç tane?', eq: `${a} × 1 = ?`, answer: a }],
    }),
  ),

  entry(
    '10',
    "10 ile çarpmak, her şeyi onluk yapmaktır. 6 × 10: 6 tane onluk, yani 60. Sayının sonuna bir sıfır ekle!",
    (a) => ({
      visual: { type: 'blocks', nums: [a * 10] },
      hint: `${a} tane onluk = ${a} ve yanına sıfır.`,
      steps: [{ say: `${a} tane onluk var. Sonuna bir sıfır ekle:`, eq: `${a} × 10 = ?`, answer: a * 10 }],
    }),
  ),

  entry(
    '2',
    "2 ile çarpmak, sayıyı ikiye katlamaktır. 8 × 2: 8 ile 8'i topla, 16! İki katını bilmek bütün tablonun anahtarıdır.",
    (a) => ({
      visual: { type: 'array', rows: 2, cols: a },
      hint: `${a} ile ${a}'yı topla.`,
      steps: [{ say: 'İki katı demek, kendisiyle toplamak demek:', eq: `${a} + ${a} = ?`, answer: a * 2 }],
    }),
  ),

  entry(
    '5',
    "5, 10'un yarısıdır. 8 × 5: önce 8 × 10 = 80, sonra yarısı → 40. Saatin dakikaları da böyle sayılır!",
    (a) => ({
      visual: { type: 'array', rows: a, cols: 10, splitCol: 5 },
      hint: `Önce 10 kere al (${a * 10}), sonra yarısını söyle.`,
      steps: [
        { say: 'Önce 10 kere alalım, o kolay:', eq: `${a} × 10 = ?`, answer: a * 10 },
        { say: '5, 10\'un yarısı. Yarısını söyle:', eq: `${a * 10} ÷ 2 = ?`, answer: a * 5 },
      ],
    }),
  ),

  entry(
    '9',
    "9, 10'dan bir eksiktir. 6 × 9: önce 6 × 10 = 60, sonra bir grup fazla aldık, 6'yı geri ver → 54. Bir de sırrı var: rakamları toplarsan hep 9 eder!",
    (a) => ({
      visual: { type: 'array', rows: a, cols: 10, splitCol: 9 },
      hint: `${a} × 10 = ${a * 10}, sonra ${a} geri ver.`,
      steps: [
        { say: 'Önce 10 kere al:', eq: `${a} × 10 = ?`, answer: a * 10 },
        { say: `Bir grup fazla aldık, ${a} tanesini geri ver:`, eq: `${a * 10} − ${a} = ?`, answer: a * 9 },
      ],
    }),
  ),

  entry(
    '4',
    "4, ikinin iki katıdır. 7 × 4: 7'yi katla → 14, bir daha katla → 28. Katla katla, oldu bitti!",
    (a) => ({
      visual: { type: 'array', rows: a, cols: 4, splitCol: 2 },
      hint: 'Katla, sonra bir daha katla.',
      steps: [
        { say: 'Önce ikiye katla:', eq: `${a} + ${a} = ?`, answer: a * 2 },
        { say: 'Şimdi bir daha katla:', eq: `${a * 2} + ${a * 2} = ?`, answer: a * 4 },
      ],
    }),
  ),

  entry(
    '3',
    "3 kere almak, iki katını alıp bir grup daha eklemektir. 6 × 3: 6 + 6 = 12, bir 6 daha → 18.",
    (a) => ({
      visual: { type: 'array', rows: a, cols: 3, splitCol: 2 },
      hint: `İki katı ${a * 2}, bir ${a} daha ekle.`,
      steps: [
        { say: 'Önce iki katını al:', eq: `${a} + ${a} = ?`, answer: a * 2 },
        { say: 'Bir grup daha ekle:', eq: `${a * 2} + ${a} = ?`, answer: a * 3 },
      ],
    }),
  ),

  entry(
    '6',
    "6 = 5 + 1. 7 × 6: önce 7 × 5 = 35, sonra bir 7 daha → 42. Beşleri biliyorsan altılar bedava!",
    (a) => ({
      visual: { type: 'array', rows: a, cols: 6, splitCol: 5 },
      hint: `${a} × 5 = ${a * 5}, bir ${a} daha ekle.`,
      steps: [
        { say: 'Önce 5 kere al:', eq: `${a} × 5 = ?`, answer: a * 5 },
        { say: 'Bir kere daha ekle:', eq: `${a * 5} + ${a} = ?`, answer: a * 6 },
      ],
    }),
  ),

  entry(
    '8',
    "8, 10'dan iki eksiktir. 6 × 8: 6 × 10 = 60, iki grup fazla aldık (12), geri ver → 48.",
    (a) => ({
      visual: { type: 'array', rows: a, cols: 10, splitCol: 8 },
      hint: `${a} × 10 = ${a * 10}, ${a * 2} geri ver.`,
      steps: [
        { say: 'Önce 10 kere al:', eq: `${a} × 10 = ?`, answer: a * 10 },
        { say: 'İki grup fazla aldık, o kadar:', eq: `${a} × 2 = ?`, answer: a * 2 },
        { say: 'Fazlayı geri ver:', eq: `${a * 10} − ${a * 2} = ?`, answer: a * 8 },
      ],
    }),
  ),

  entry(
    '7',
    "7 = 5 + 2. 8 × 7: 8 × 5 = 40, 8 × 2 = 16, topla → 56. Tablonun en zoru bile iki kolay parçaya ayrılır!",
    (a) => ({
      visual: { type: 'array', rows: a, cols: 7, splitCol: 5 },
      hint: `${a} × 5 = ${a * 5}, ${a} × 2 = ${a * 2}, topla.`,
      steps: [
        { say: 'Önce 5 kere al:', eq: `${a} × 5 = ?`, answer: a * 5 },
        { say: 'Sonra 2 kere al:', eq: `${a} × 2 = ?`, answer: a * 2 },
        { say: 'İki parçayı topla!', eq: `${a * 5} + ${a * 2} = ?`, answer: a * 7 },
      ],
    }),
  ),
];

function entry(f: Family, idea: string, build: Build) {
  return { f, idea, build };
}

export const timesTricks: Trick[] = LESSONS.map(({ f, idea }) => {
  const info = FAMILIES[f];
  return {
    id: info.trickId,
    band: 'usta',
    op: 'mul',
    group: 'carpim',
    title: info.lesson,
    emoji: info.emoji,
    short: info.short,
    idea,
    // Ders kendi ailesinin yolunu öğretir: 5'ler dersi, diğer çarpan 2 olsa bile 5'in yolunu gösterir.
    make: (level: number) => buildFor(f, other(level)),
  };
});

/** Bir ailenin kolay yoluyla, verilen diğer çarpan için soru kurar. */
function buildFor(f: Family, x: number): Problem {
  const n = Number(f);
  const { steps, visual, hint } = LESSONS.find((l) => l.f === f)!.build(x, n);
  return { trickId: FAMILIES[f].trickId, expr: `${x} × ${n} = ?`, answer: x * n, steps, visual, hint };
}

/**
 * Belli bir çarpım için soru üretir: 6 × 9 istendiğinde 9'ların kolay yolunu kullanır.
 * Günün turu (src/pages/TimesRound.tsx) bunu kullanıyor — çocuk her çarpımda en kolay yolu görüyor.
 */
export function problemFor(a: number, b: number): Problem {
  const f = familyOf(a, b);
  // Aile sayısı hangi çarpansa diğeri "x" olur: (3,9) → 9'lar ailesi, x = 3.
  return buildFor(f, a === Number(f) ? b : a);
}

export const timesTrick = (f: Family) => timesTricks.find((t) => t.id === FAMILIES[f].trickId)!;
