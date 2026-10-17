/**
 * Ustalar (8-10) ve Dahiler (11-14): basamak parçalama, dengeleme, alan modeli, Veda kısayolları,
 * yüzde, işlem önceliği, negatif pullar, bölünebilme.
 */
import { distrib, fmtp, pick, rnd } from '../lib/util';
import type { Step, Trick, VisualSpec } from './types';

const CORAL = '#ff6b4a';

export const usta: Trick[] = [
  {
    id: 'soldan-topla',
    band: 'usta',
    op: 'add',
    title: 'Soldan Topla',
    emoji: '⬅️',
    short: '47 + 36 → 70 + 13',
    idea: 'Okulda sağdan toplarız ama zihinden soldan toplamak daha kolay! Önce onluklar, sonra birlikler, en son birleştir.',
    make(level) {
      if (level === 3) {
        const a = rnd(120, 480), b = rnd(110, 480);
        const h = Math.floor(a / 100) * 100 + Math.floor(b / 100) * 100;
        const t = (Math.floor(a / 10) % 10) * 10 + (Math.floor(b / 10) % 10) * 10;
        const u = (a % 10) + (b % 10);
        return {
          trickId: 'soldan-topla',
          expr: `${a} + ${b} = ?`,
          answer: a + b,
          visual: { type: 'blocks', nums: [a, b] },
          hint: 'Yüzlükler, onluklar, birlikler: soldan sağa!',
          steps: [
            { say: 'Önce yüzlükleri topla.', eq: `${Math.floor(a / 100) * 100} + ${Math.floor(b / 100) * 100} = ?`, answer: h },
            { say: 'Şimdi onlukları topla.', eq: `${(Math.floor(a / 10) % 10) * 10} + ${(Math.floor(b / 10) % 10) * 10} = ?`, answer: t },
            { say: 'Birlikleri topla.', eq: `${a % 10} + ${b % 10} = ?`, answer: u },
            { say: 'Hepsini birleştir!', eq: `${h} + ${t} + ${u} = ?`, answer: a + b },
          ],
        };
      }
      const a = rnd(12, level === 1 ? 49 : 79), b = rnd(11, level === 1 ? 49 : 79);
      const A = Math.floor(a / 10) * 10, B = Math.floor(b / 10) * 10;
      const u = (a % 10) + (b % 10);
      return {
        trickId: 'soldan-topla',
        expr: `${a} + ${b} = ?`,
        answer: a + b,
        visual: { type: 'blocks', nums: [a, b] },
        hint: 'Önce onlukları, sonra birlikleri topla!',
        steps: [
          { say: 'Önce onlukları topla (soldan başla!).', eq: `${A} + ${B} = ?`, answer: A + B },
          { say: 'Şimdi birlikleri topla.', eq: `${a % 10} + ${b % 10} = ?`, answer: u },
          { say: 'İkisini birleştir.', eq: `${A + B} + ${u} = ?`, answer: a + b },
        ],
      };
    },
  },
  {
    id: 'yuvarla-duzelt',
    band: 'usta',
    op: 'add',
    title: 'Yuvarla ve Düzelt',
    emoji: '🎯',
    short: '58 + 27 → 60 + 27 − 2',
    idea: '9, 8 ya da 7 ile biten sayıyı en yakın onluğa yuvarla, kolayca topla, sonra fazladan eklediğini geri çıkar!',
    make(level) {
      const ones = level === 1 ? 9 : level === 2 ? pick([8, 9]) : pick([7, 8, 9]);
      const a = rnd(1, 8) * 10 + ones;
      const b = rnd(12, 69);
      const k = 10 - ones, R = a + k;
      return {
        trickId: 'yuvarla-duzelt',
        expr: `${a} + ${b} = ?`,
        answer: a + b,
        visual: { type: 'numberline', start: b, jumps: [{ by: R, label: `+${R}` }, { by: -k }] },
        hint: `${a} yerine ${R} kullan, sonra ${k} çıkar!`,
        steps: [
          { say: `${a} sayısını en yakın onluğa yuvarla.`, eq: `${a} + ${k} = ?`, answer: R },
          { say: 'Yuvarlak sayıyla toplamak çok kolay!', eq: `${R} + ${b} = ?`, answer: R + b },
          { say: `Fazladan ${k} ekledik, şimdi geri çıkar.`, eq: `${R + b} − ${k} = ?`, answer: a + b },
        ],
      };
    },
  },
  {
    id: 'sabit-fark',
    band: 'usta',
    op: 'sub',
    title: 'Sabit Fark',
    emoji: '⚖️',
    short: '73 − 39 → 74 − 40',
    idea: 'İki sayıya da aynı şeyi eklersen aradaki fark değişmez! Çıkanı yuvarlak sayıya çevir: 73 − 39 = 74 − 40 = 34.',
    make(level) {
      let a: number, b: number, k: number;
      if (level === 3) {
        b = rnd(1, 6) * 100 + pick([97, 98, 99]);
        a = rnd(b + 20, 999);
        k = 100 - (b % 100);
      } else {
        const ones = level === 1 ? 9 : pick([7, 8, 9]);
        b = rnd(1, 6) * 10 + ones;
        a = rnd(b + 5, 99);
        k = 10 - ones;
      }
      return {
        trickId: 'sabit-fark',
        expr: `${a} − ${b} = ?`,
        answer: a - b,
        visual: { type: 'numberline', start: b, jumps: [], spans: [{ from: b, to: a, label: 'fark' }, { from: b + k, to: a + k, label: 'aynı fark' }] },
        hint: `İki sayıya da ${k} ekle; fark değişmez!`,
        steps: [
          { say: 'Çıkan sayıyı yuvarlak sayıya çevirelim.', eq: `${b} + ${k} = ?`, answer: b + k },
          { say: `Farkın bozulmaması için ilk sayıya da ${k} eklemeliyiz.`, eq: `${a} + ${k} = ?`, answer: a + k },
          { say: 'Şimdi zihinden çıkar!', eq: `${a + k} − ${b + k} = ?`, answer: a - b },
        ],
      };
    },
  },
  {
    id: 'tekrarli-toplama',
    band: 'usta',
    op: 'mul',
    title: 'Çarpma = Tekrarlı Toplama',
    emoji: '🍪',
    short: '3 × 4 → 4 + 4 + 4',
    idea: 'Çarpma, aynı sayıyı tekrar tekrar toplamaktır. 3 × 4: 3 sıra, her sırada 4 kurabiye. 4, 8, 12!',
    make(level) {
      const a = rnd(3, level === 1 ? 4 : 6), b = rnd(2, level === 1 ? 5 : 9);
      return {
        trickId: 'tekrarli-toplama',
        expr: `${a} × ${b} = ?`,
        answer: a * b,
        visual: { type: 'array', rows: a, cols: b },
        hint: `${distrib(b)} ${distrib(b)} say: ${b}, ${2 * b}, ${3 * b}…`,
        steps: [
          { say: `${a} sıra var, her sırada ${b} tane. İlk iki sıra:`, eq: `${b} + ${b} = ?`, answer: 2 * b },
          { say: 'Kalan sıraları da ekleyerek say!', eq: `${a} × ${b} = ?`, answer: a * b },
        ],
      };
    },
  },
  {
    id: 'parcala-carp',
    band: 'usta',
    op: 'mul',
    title: 'Parçala Çarp',
    emoji: '✂️',
    short: '7 × 8 → 7×5 + 7×3',
    idea: 'Zor çarpımı iki kolay çarpıma böl! 7 × 8: 8\'i 5 ve 3 diye parçala. 7 × 5 = 35, 7 × 3 = 21. 35 + 21 = 56!',
    make(level) {
      const a = rnd(level === 1 ? 3 : 6, 9);
      const split = level === 3 ? 10 : 5;
      const b = level === 3 ? rnd(11, 19) : rnd(6, 9);
      const r = b - split;
      return {
        trickId: 'parcala-carp',
        expr: `${a} × ${b} = ?`,
        answer: a * b,
        visual: { type: 'array', rows: a, cols: b, splitCol: split },
        hint: `${b} = ${split} + ${r}. İki çarpımı topla!`,
        steps: [
          { say: `${b} sayısını ${split} ve ${r} diye parçala. Önce ${split === 5 ? "5'lik" : "10'luk"} kısım:`, eq: `${a} × ${split} = ?`, answer: a * split },
          { say: 'Şimdi kalan kısım:', eq: `${a} × ${r} = ?`, answer: a * r },
          { say: 'İki parçayı topla!', eq: `${a * split} + ${a * r} = ?`, answer: a * b },
        ],
      };
    },
  },
  {
    id: 'dokuzun-sihri',
    band: 'usta',
    op: 'mul',
    title: '9\'un Sihri',
    emoji: '🪄',
    short: '9 × 7 → 70 − 7',
    idea: '9 ile çarpmak yerine 10 ile çarp, sonra bir tane çıkar! 9 × 7 = 10 × 7 − 7 = 70 − 7 = 63.',
    make(level) {
      const n = level === 1 ? rnd(2, 6) : level === 2 ? rnd(3, 10) : rnd(11, 25);
      return {
        trickId: 'dokuzun-sihri',
        expr: `9 × ${n} = ?`,
        answer: 9 * n,
        visual: n <= 12 ? { type: 'array', rows: 10, cols: n, fadeRows: 1 } : undefined,
        hint: `10 × ${n}, sonra ${n} çıkar!`,
        steps: [
          { say: '9 yerine 10 ile çarpmak çok kolay!', eq: `10 × ${n} = ?`, answer: 10 * n },
          { say: `Ama 10 değil 9 tane istiyoruz: bir tane ${n} fazla. Çıkaralım!`, eq: `${10 * n} − ${n} = ?`, answer: 9 * n },
        ],
      };
    },
  },
  {
    id: 'yarila-katla',
    band: 'usta',
    op: 'mul',
    title: 'Yarıla, İkiye Katla',
    emoji: '🔁',
    short: '16 × 5 → 8 × 10',
    idea: 'Bir sayıyı yarıla, diğerini ikiye katla: sonuç değişmez! 16 × 5 = 8 × 10 = 80. 10 ile çarpmak çok kolay.',
    make(level) {
      if (level === 3) {
        const a = pick([12, 16, 24, 28, 32, 36, 44, 48]);
        return {
          trickId: 'yarila-katla',
          expr: `${a} × 25 = ?`,
          answer: a * 25,
          hint: '25 × 4 = 100. Sayıyı 4\'e böl, 100 ile çarp!',
          steps: [
            { say: 'İki kez yarıla (yani 4\'e böl).', eq: `${a} ÷ 4 = ?`, answer: a / 4 },
            { say: '25\'i iki kez katlarsak 100 olur!', eq: `${a / 4} × 100 = ?`, answer: a * 25 },
          ],
        };
      }
      const a = level === 1 ? pick([12, 14, 16, 18]) : pick([22, 24, 26, 28, 32, 36, 44, 48]);
      return {
        trickId: 'yarila-katla',
        expr: `${a} × 5 = ?`,
        answer: a * 5,
        visual: { type: 'reshape', from: [a, 5], to: [a / 2, 10] },
        hint: 'Yarısını al, 10 ile çarp!',
        steps: [
          { say: `${a} sayısının yarısını al.`, eq: `${a} ÷ 2 = ?`, answer: a / 2 },
          { say: '5 sayısını ikiye katla.', eq: '5 × 2 = ?', answer: 10 },
          { say: 'Yarı × 10 çok kolay!', eq: `${a / 2} × 10 = ?`, answer: a * 5 },
        ],
      };
    },
  },
  {
    id: 'esit-paylastir',
    band: 'usta',
    op: 'div',
    title: 'Eşit Paylaştır',
    emoji: '🍬',
    short: '12 ÷ 3 → 3 tabağa 4\'er',
    idea: 'Bölme, eşit paylaştırmaktır. Şekerleri tabaklara birer birer dağıt; her tabakta kaç tane olduğunu say!',
    make(level) {
      const g = rnd(2, level === 1 ? 3 : 5), p = rnd(2, level === 1 ? 4 : 7);
      const total = g * p;
      return {
        trickId: 'esit-paylastir',
        expr: `${total} ÷ ${g} = ?`,
        answer: p,
        ask: `${total} şekeri ${g} arkadaşa eşit paylaştır. Her biri kaç alır?`,
        visual: { type: 'share', total, groups: g },
        hint: 'Her tabağa birer birer dağıt!',
        steps: [
          { say: `${g} tabağın her birine 1 şeker koy. Kaç şeker kullandın?`, eq: `${g} × 1 = ?`, answer: g },
          { say: 'Şekerler bitene kadar dağıt. Her tabakta kaç tane oldu?', eq: `${total} ÷ ${g} = ?`, answer: p },
        ],
      };
    },
  },
  {
    id: 'carpmayi-dusun',
    band: 'usta',
    op: 'div',
    title: 'Çarpmayı Düşün',
    emoji: '🔄',
    short: '56 ÷ 8 → 8 × ? = 56',
    idea: 'Bölme, çarpmanın tersidir. 56 ÷ 8 sorusu aslında "8 kere kaç 56 eder?" sorusudur. Çarpım tablosu burada sihirli anahtar!',
    make(level) {
      const b = rnd(3, 9), q = rnd(3, level === 1 ? 5 : 9);
      return {
        trickId: 'carpmayi-dusun',
        expr: `${b * q} ÷ ${b} = ?`,
        answer: q,
        visual: { type: 'array', rows: b, cols: q },
        hint: `${b} kere kaç ${b * q} eder?`,
        steps: [
          { say: 'Bölmeyi çarpma gibi düşün: hangi sayı?', eq: `${b} × ? = ${b * q}`, answer: q },
          { say: 'Demek ki cevap:', eq: `${b * q} ÷ ${b} = ?`, answer: q },
        ],
      };
    },
  },
  {
    id: 'bese-bol',
    band: 'usta',
    op: 'div',
    title: '5\'e Bölme Kısayolu',
    emoji: '🖐️',
    short: '140 ÷ 5 → 280 ÷ 10',
    idea: '5\'e bölmek yerine önce 2 ile çarp, sonra 10\'a böl! 140 ÷ 5 = 280 ÷ 10 = 28. 10\'a bölmek sadece sondaki 0\'ı silmek!',
    make(level) {
      const k = level === 1 ? rnd(6, 20) : level === 2 ? rnd(10, 60) : rnd(50, 200);
      const n = 5 * k;
      const piece = Math.min(10, k);
      const v: VisualSpec | undefined = k <= 20
        ? { type: 'bar', rows: [
            { name: `${n} ÷ 5`, segs: Array.from({ length: 5 }, (_, i) => ({ v: piece, label: i === 0 ? '?' : undefined, color: i === 0 ? CORAL : undefined })) },
            { name: `${2 * n} ÷ 10`, segs: Array.from({ length: 10 }, (_, i) => ({ v: piece, label: i === 0 ? '?' : undefined, color: i === 0 ? CORAL : undefined })) },
          ] }
        : undefined;
      return {
        trickId: 'bese-bol',
        expr: `${n} ÷ 5 = ?`,
        answer: k,
        visual: v,
        hint: '2 ile çarp, sonra sondaki 0\'ı sil!',
        steps: [
          { say: '5 ile bölmek yerine: önce 2 ile çarp...', eq: `${n} × 2 = ?`, answer: 2 * n },
          { say: '...sonra 10\'a böl (sondaki 0 gider)!', eq: `${2 * n} ÷ 10 = ?`, answer: k },
        ],
      };
    },
  },
];

const PCT_SUFFIX: Record<number, string> = { 5: 'i', 10: 'u', 15: 'i', 20: 'si', 25: 'i', 30: 'u', 50: 'si', 75: 'i' };

export const dahi: Trick[] = [
  {
    id: 'on-birin-sirri',
    band: 'dahi',
    op: 'mul',
    title: '11\'in Sırrı',
    emoji: '🎩',
    short: '36 × 11 → 3 (9) 6',
    idea: 'İki basamaklı bir sayıyı 11 ile çarparken rakamları topla ve ortaya yaz! 36 × 11: 3 + 6 = 9 → 396. Toplam 10\'u geçerse 1\'i soldakine ekle.',
    make(level) {
      let d1: number, d2: number;
      if (level === 1) {
        d1 = rnd(1, 8);
        d2 = rnd(0, 9 - d1);
      } else {
        d1 = rnd(1, 9);
        d2 = level === 3 ? rnd(10 - d1 > 9 ? 0 : 10 - d1, 9) : rnd(0, 9);
      }
      const n = d1 * 10 + d2, s = d1 + d2;
      const carry = s >= 10;
      return {
        trickId: 'on-birin-sirri',
        expr: `${n} × 11 = ?`,
        answer: n * 11,
        visual: { type: 'digits', digits: carry ? [d1 + 1, s % 10, d2] : [d1, s, d2], note: carry ? `${d1} + 1 | ${s % 10} | ${d2}` : `${d1} | ${d1}+${d2} | ${d2}` },
        hint: 'Rakamları topla, ortaya yaz!',
        steps: [
          { say: 'Rakamları topla.', eq: `${d1} + ${d2} = ?`, answer: s },
          {
            say: carry ? `Toplam 10'u geçti: ${s % 10} ortaya, 1 de soldaki ${d1} rakamına eklenir!` : `Toplamı ${d1} ile ${d2} arasına yerleştir!`,
            eq: `${n} × 11 = ?`,
            answer: n * 11,
          },
        ],
      };
    },
  },
  {
    id: 'capraz-carpim',
    band: 'dahi',
    op: 'mul',
    title: 'Çapraz Çarpım',
    emoji: '✖️',
    short: 'Dikey · Çapraz · Dikey',
    idea: 'Veda matematiğinden bir hile: iki basamaklı sayıları "dikey, çapraz, dikey" çarparız. Önce birler, sonra çaprazların toplamı, en son onlar.',
    make(level) {
      const max = level === 1 ? 23 : level === 2 ? 39 : 69;
      const a = rnd(11, max), b = rnd(11, max);
      const a1 = a % 10, a10 = Math.floor(a / 10), b1 = b % 10, b10 = Math.floor(b / 10);
      const u = a1 * b1, c = a10 * b1 + a1 * b10, h = a10 * b10;
      return {
        trickId: 'capraz-carpim',
        expr: `${a} × ${b} = ?`,
        answer: a * b,
        visual: { type: 'cross', a, b },
        hint: 'Birler, çapraz toplam, onlar!',
        steps: [
          { say: 'Dikey: birler basamaklarını çarp.', eq: `${a1} × ${b1} = ?`, answer: u },
          { say: 'Çapraz: iki çapraz çarpımı topla.', eq: `${a10}×${b1} + ${a1}×${b10} = ?`, answer: c },
          { say: 'Dikey: onlar basamaklarını çarp.', eq: `${a10} × ${b10} = ?`, answer: h },
          { say: 'Birleştir: yüzler, onlar, birler.', eq: `${h}×100 + ${c}×10 + ${u} = ?`, answer: a * b },
        ],
      };
    },
  },
  {
    id: 'kutu-yontemi',
    band: 'dahi',
    op: 'mul',
    title: 'Kutu Yöntemi',
    emoji: '🔲',
    short: '23 × 14 → 4 kutu',
    idea: 'Sayıları onluk ve birlik diye parçala, bir dikdörtgeni 4 kutuya böl. Her kutu kolay bir çarpım; sonra hepsini topla!',
    make(level) {
      let a = rnd(12, level === 1 ? 29 : 49);
      if (a % 10 === 0) a++;
      let b = rnd(11, level === 3 ? 39 : 19);
      if (b % 10 === 0) b++;
      const A = Math.floor(a / 10) * 10, a1 = a % 10, B = Math.floor(b / 10) * 10, b1 = b % 10;
      return {
        trickId: 'kutu-yontemi',
        expr: `${a} × ${b} = ?`,
        answer: a * b,
        visual: { type: 'area', a: [A, a1], b: [B, b1] },
        hint: `${a} = ${A} + ${a1}, ${b} = ${B} + ${b1}`,
        steps: [
          { say: 'Büyük kutu: onluk × onluk.', eq: `${A} × ${B} = ?`, answer: A * B },
          { say: 'Sağ kutu:', eq: `${A} × ${b1} = ?`, answer: A * b1 },
          { say: 'Alt kutu:', eq: `${a1} × ${B} = ?`, answer: a1 * B },
          { say: 'Küçük kutu:', eq: `${a1} × ${b1} = ?`, answer: a1 * b1 },
          { say: 'Dört kutuyu topla!', eq: `${A * B} + ${A * b1} + ${a1 * B} + ${a1 * b1} = ?`, answer: a * b },
        ],
      };
    },
  },
  {
    id: 'yuzde',
    band: 'dahi',
    op: 'mix',
    title: 'Yüzde Kolaylığı',
    emoji: '💯',
    short: '%15 → %10 + yarısı',
    idea: '%10 bulmak çok kolay: 10\'a böl! Gerisini ondan türet: %5 onun yarısı, %20 iki katı, %15 = %10 + %5. %50 yarısı, %25 yarısının yarısı.',
    make(level) {
      const p = level === 1 ? pick([50, 10]) : level === 2 ? pick([25, 20, 5]) : pick([15, 30, 75]);
      const N = 20 * rnd(2, level === 1 ? 10 : 25);
      const t = N / 10, h = N / 2;
      let steps: Step[];
      switch (p) {
        case 50: steps = [{ say: '%50 demek yarısı demek!', eq: `${N} ÷ 2 = ?`, answer: h }]; break;
        case 10: steps = [{ say: '%10 için 10\'a böl (sondaki 0\'ı sil).', eq: `${N} ÷ 10 = ?`, answer: t }]; break;
        case 25: steps = [
          { say: '%50 = yarısı.', eq: `${N} ÷ 2 = ?`, answer: h },
          { say: '%25 = yarısının yarısı.', eq: `${h} ÷ 2 = ?`, answer: h / 2 },
        ]; break;
        case 20: steps = [
          { say: '%10 için 10\'a böl.', eq: `${N} ÷ 10 = ?`, answer: t },
          { say: '%20 = %10\'un iki katı.', eq: `${t} × 2 = ?`, answer: t * 2 },
        ]; break;
        case 5: steps = [
          { say: '%10 için 10\'a böl.', eq: `${N} ÷ 10 = ?`, answer: t },
          { say: '%5 = %10\'un yarısı.', eq: `${t} ÷ 2 = ?`, answer: t / 2 },
        ]; break;
        case 15: steps = [
          { say: '%10 için 10\'a böl.', eq: `${N} ÷ 10 = ?`, answer: t },
          { say: '%5 = %10\'un yarısı.', eq: `${t} ÷ 2 = ?`, answer: t / 2 },
          { say: '%15 = %10 + %5', eq: `${t} + ${t / 2} = ?`, answer: t * 1.5 },
        ]; break;
        case 30: steps = [
          { say: '%10 için 10\'a böl.', eq: `${N} ÷ 10 = ?`, answer: t },
          { say: '%30 = %10\'un üç katı.', eq: `${t} × 3 = ?`, answer: t * 3 },
        ]; break;
        default: steps = [
          { say: '%50 = yarısı.', eq: `${N} ÷ 2 = ?`, answer: h },
          { say: '%25 = yarısının yarısı.', eq: `${h} ÷ 2 = ?`, answer: h / 2 },
          { say: '%75 = %50 + %25', eq: `${h} + ${h / 2} = ?`, answer: h * 1.5 },
        ];
      }
      const parts = p % 10 === 0 ? 10 : p % 25 === 0 ? 4 : 20;
      const per = 100 / parts;
      const on = p / per;
      return {
        trickId: 'yuzde',
        expr: `${N} sayısının %${p}'${PCT_SUFFIX[p]} = ?`,
        answer: (N * p) / 100,
        visual: { type: 'bar', rows: [{ name: `${N}`, segs: Array.from({ length: parts }, (_, i) => ({ v: 1, color: i < on ? CORAL : undefined, label: i === 0 && parts <= 10 ? `%${per}` : undefined })) }], total: { label: `%100 = ${N}` } },
        hint: '%10 bul, gerisini ondan türet!',
        steps,
      };
    },
  },
  {
    id: 'islem-sirasi',
    band: 'dahi',
    op: 'mix',
    title: 'İşlem Sırası',
    emoji: '🚦',
    short: 'Parantez → × ÷ → + −',
    idea: 'Uzun işlemlerde trafik kuralı var: önce parantez, sonra çarpma ve bölme, en son toplama ve çıkarma. Soldan sağa!',
    make(level) {
      const t = level === 1 ? pick([1, 2]) : level === 2 ? pick([1, 2, 3]) : pick([2, 3, 4]);
      if (t === 1) {
        const a = rnd(2, 20), b = rnd(2, 9), c = rnd(2, 9);
        return {
          trickId: 'islem-sirasi', expr: `${a} + ${b} × ${c} = ?`, answer: a + b * c,
          visual: { type: 'order', parts: [{ t: `${a} +` }, { t: `${b} × ${c}`, first: true }] },
          hint: 'Önce çarpma, sonra toplama!',
          steps: [
            { say: 'Önce çarpma yapılır!', eq: `${b} × ${c} = ?`, answer: b * c },
            { say: 'Sonra toplama.', eq: `${a} + ${b * c} = ?`, answer: a + b * c },
          ],
        };
      }
      if (t === 2) {
        const a = rnd(2, 12), b = rnd(2, 12), c = rnd(2, 6);
        return {
          trickId: 'islem-sirasi', expr: `(${a} + ${b}) × ${c} = ?`, answer: (a + b) * c,
          visual: { type: 'order', parts: [{ t: `(${a} + ${b})`, first: true }, { t: `× ${c}` }] },
          hint: 'Parantez her zaman önce!',
          steps: [
            { say: 'Parantez her zaman önce!', eq: `${a} + ${b} = ?`, answer: a + b },
            { say: 'Şimdi çarp.', eq: `${a + b} × ${c} = ?`, answer: (a + b) * c },
          ],
        };
      }
      if (t === 3) {
        const a = rnd(5, 9), b = rnd(5, 9), c = rnd(2, 4), d = rnd(2, 4);
        return {
          trickId: 'islem-sirasi', expr: `${a} × ${b} − ${c} × ${d} = ?`, answer: a * b - c * d,
          visual: { type: 'order', parts: [{ t: `${a} × ${b}`, first: true }, { t: '−' }, { t: `${c} × ${d}`, first: true }] },
          hint: 'İki çarpımı önce yap, sonra çıkar!',
          steps: [
            { say: 'Önce soldaki çarpma.', eq: `${a} × ${b} = ?`, answer: a * b },
            { say: 'Sonra sağdaki çarpma.', eq: `${c} × ${d} = ?`, answer: c * d },
            { say: 'En son çıkarma.', eq: `${a * b} − ${c * d} = ?`, answer: a * b - c * d },
          ],
        };
      }
      const c = rnd(2, 9), q = rnd(2, 9), d = rnd(2, 5), a = rnd(q * d + 1, q * d + 30);
      return {
        trickId: 'islem-sirasi', expr: `${a} − ${c * q} ÷ ${c} × ${d} = ?`, answer: a - q * d,
        visual: { type: 'order', parts: [{ t: `${a} −` }, { t: `${c * q} ÷ ${c}`, first: true }, { t: `× ${d}` }] },
        hint: 'Bölme ve çarpma soldan sağa, en son çıkarma!',
        steps: [
          { say: 'Çarpma ve bölme soldan sağa: önce bölme.', eq: `${c * q} ÷ ${c} = ?`, answer: q },
          { say: 'Sonra çarpma.', eq: `${q} × ${d} = ?`, answer: q * d },
          { say: 'En son çıkarma.', eq: `${a} − ${q * d} = ?`, answer: a - q * d },
        ],
      };
    },
  },
  {
    id: 'negatif-pullar',
    band: 'dahi',
    op: 'mix',
    title: 'Negatif Pullar',
    emoji: '🔴',
    short: '(−5) + 8 → 3 sarı kalır',
    idea: 'Sarı pullar artı, kırmızı pullar eksidir. Bir sarı ile bir kırmızı yan yana gelince birbirini sıfırlar. Geriye kalanlar sonucu söyler!',
    make(level) {
      const kind = level === 1 ? 1 : level === 2 ? pick([1, 2]) : pick([2, 3]);
      if (kind === 3) {
        const a = rnd(2, 8), b = rnd(2, 8);
        return {
          trickId: 'negatif-pullar', negative: true, expr: `${fmtp(-a)} + ${fmtp(-b)} = ?`, answer: -(a + b),
          visual: { type: 'chips', pos: 0, neg: a + b },
          hint: 'Hepsi kırmızı: sonuç eksi!',
          steps: [
            { say: 'Hepsi kırmızı! Kaç kırmızı pul var?', eq: `${a} + ${b} = ?`, answer: a + b },
            { say: 'Hepsi eksi olduğu için sonuç da eksi.', eq: `${fmtp(-a)} + ${fmtp(-b)} = ?`, answer: -(a + b) },
          ],
        };
      }
      let pos: number, neg: number, expr: string;
      if (kind === 1) {
        neg = rnd(2, 9);
        pos = rnd(1, 12);
        if (pos === neg) pos++;
        expr = `${fmtp(-neg)} + ${pos} = ?`;
      } else {
        pos = rnd(1, 8);
        neg = rnd(pos + 1, 14);
        expr = `${pos} − ${neg} = ?`;
      }
      const ans = pos - neg;
      return {
        trickId: 'negatif-pullar', negative: true, expr, answer: ans,
        visual: { type: 'chips', pos, neg },
        hint: 'Sarı-kırmızı çiftleri sıfırla, kalanlara bak!',
        steps: [
          { say: 'Bir sarı ile bir kırmızı birbirini sıfırlar. Kaç çift oluşur?', eq: 'Çift: ?', answer: Math.min(pos, neg) },
          { say: `Geriye ${Math.abs(ans)} tane ${ans < 0 ? 'kırmızı (eksi)' : 'sarı (artı)'} pul kaldı. Sonuç?`, eq: expr, answer: ans },
        ],
      };
    },
  },
  {
    id: 'bolunebilme',
    band: 'dahi',
    op: 'div',
    title: 'Bölünebilme Dedektifi',
    emoji: '🕵️',
    short: '3\'e bölünür mü? Rakamları topla!',
    idea: 'Bir sayının rakamlarının toplamı 3\'e bölünüyorsa sayının kendisi de 3\'e bölünür. 9 için de aynı kural geçerli!',
    make(level) {
      const k = level === 3 ? 9 : 3;
      const yes = Math.random() < 0.5;
      let N = k * rnd(Math.ceil(102 / k), Math.floor(999 / k));
      if (!yes) N += rnd(1, k - 1);
      if (N > 999) N -= k;
      const d = String(N).split('').map(Number);
      const s = d.reduce((x, y) => x + y, 0);
      const yn = [{ label: 'Evet', value: 1 }, { label: 'Hayır', value: 0 }];
      const ok = N % k === 0 ? 1 : 0;
      return {
        trickId: 'bolunebilme',
        expr: `${N} ÷ ${k} → tam bölünür mü?`,
        answer: ok,
        choices: yn,
        visual: { type: 'digits', digits: d, note: `toplam: ${s}` },
        hint: 'Rakamları topla; toplam bölünüyorsa sayı da bölünür!',
        steps: [
          { say: 'Rakamları topla.', eq: `${d.join(' + ')} = ?`, answer: s },
          { say: `${s} sayısı ${k} ile tam bölünüyor mu? O zaman ${N} de aynı cevabı verir!`, eq: `${N}, ${k} ile bölünür mü? ?`, answer: ok, choices: yn },
        ],
      };
    },
  },
  {
    id: 'bes-kare',
    band: 'dahi',
    op: 'mul',
    title: '5\'le Biten Kare',
    emoji: '🎆',
    short: '35 × 35 → 3×4 | 25',
    idea: '5 ile biten bir sayının karesi için: onlar basamağını bir fazlasıyla çarp, sonuna 25 ekle! 35 × 35: 3 × 4 = 12 → 1225.',
    make(level) {
      const d = rnd(1, level === 1 ? 4 : 9);
      const n = d * 10 + 5;
      return {
        trickId: 'bes-kare',
        expr: `${n} × ${n} = ?`,
        answer: n * n,
        visual: { type: 'digits', digits: [d * (d + 1), 25], note: `${d} × ${d + 1} | 25` },
        hint: `${d} × ${d + 1}, sonra sonuna 25!`,
        steps: [
          { say: `Onlar basamağını (${d}) bir fazlasıyla çarp.`, eq: `${d} × ${d + 1} = ?`, answer: d * (d + 1) },
          { say: 'Şimdi sonuna 25 ekle!', eq: `${n} × ${n} = ?`, answer: n * n },
        ],
      };
    },
  },
  {
    id: 'kesrin-degeri',
    band: 'dahi',
    op: 'div',
    title: 'Kesrin Değeri',
    emoji: '🍕',
    short: '20\'nin 3/4\'ü → 5 × 3',
    idea: 'Bir sayının kesrini bulmak için önce paydaya böl (bir parça), sonra pay kadar parça al. 20\'nin 3/4\'ü: 20 ÷ 4 = 5, 5 × 3 = 15!',
    make(level) {
      const b = level === 1 ? pick([2, 3, 4]) : pick([3, 4, 5, 6, 8, 10]);
      const a = rnd(1, b - 1);
      const N = b * rnd(2, level === 1 ? 6 : 12);
      const unit = N / b;
      return {
        trickId: 'kesrin-degeri',
        expr: `${N} × ${a}/${b} = ?`,
        answer: unit * a,
        ask: `${N} sayısının ${a}/${b} kadarı kaçtır?`,
        visual: { type: 'bar', rows: [{ name: `${N}`, segs: Array.from({ length: b }, (_, i) => ({ v: 1, color: i < a ? CORAL : undefined, label: i === 0 ? '?' : undefined })) }], total: { label: `${N}` } },
        hint: 'Önce paydaya böl, sonra pay ile çarp!',
        steps: [
          { say: `Bütünü ${b} eşit parçaya böl. Bir parça kaç?`, eq: `${N} ÷ ${b} = ?`, answer: unit },
          { say: `${a} parça alıyoruz.`, eq: `${unit} × ${a} = ?`, answer: unit * a },
        ],
      };
    },
  },
];

