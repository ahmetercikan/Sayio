/**
 * Minikler (4-5) ve Kaşifler (6-7): sayı hissi, 10'luk çerçeve, sayı çiftleri.
 * Somut modeller her zaman yakında; cevaplar klavyesiz (seçenek ya da çerçeveye dokunma).
 * Not: sayılara ek getirmek (8'i, 6'yı…) ünlü uyumu ister; cümleler "… sayısı" kalıbıyla kurulur.
 */
import { rnd } from '../lib/util';
import type { Trick } from './types';

export const minik: Trick[] = [
  {
    id: 'sayma-gor',
    band: 'minik',
    op: 'add',
    title: 'Saymadan Gör',
    emoji: '🎲',
    short: 'Zar yüzü → hemen 5!',
    idea: 'Bazı şekilleri saymadan tanırız! Zarın yüzüne bak: köşelerde 4, ortada 1 nokta. Saymadan "5" deriz.',
    make(level) {
      const n = rnd(level === 1 ? 1 : 3, level === 1 ? 5 : level === 2 ? 6 : 10);
      return {
        trickId: 'sayma-gor',
        expr: '?',
        answer: n,
        ask: level >= 2 ? 'Hızlıca bak! Kaç nokta vardı?' : 'Saymadan bak: kaç nokta var?',
        visual: { type: 'dots', n, flash: level >= 2 },
        visualAlways: true,
        hint: n <= 6 ? 'Zarın yüzüne benziyor mu?' : 'Önce 5 noktalık zarı gör, sonra kalanları ekle!',
        steps: [{ say: 'Kaç nokta var?', eq: '?', answer: n }],
      };
    },
  },
  {
    id: 'bir-fazla',
    band: 'minik',
    op: 'add',
    title: 'Bir Fazla, Bir Eksik',
    emoji: '🐸',
    short: '5 → 6 → 7',
    idea: 'Kurbağamız sayı yolunda zıplıyor! İleri zıplarsa sayı 1 büyür, geri zıplarsa 1 küçülür.',
    make(level) {
      const up = level === 1 ? true : Math.random() < 0.6;
      const by = level === 3 ? 2 : 1;
      const n = up ? rnd(1, 10 - by) : rnd(1 + by, 10);
      const ans = up ? n + by : n - by;
      const expr = `${n} ${up ? '+' : '−'} ${by} = ?`;
      return {
        trickId: 'bir-fazla',
        expr,
        answer: ans,
        visual: { type: 'numberline', start: n, jumps: Array.from({ length: by }, () => ({ by: up ? 1 : -1 })) },
        visualAlways: true,
        hint: up ? 'İleri zıpla: sayı büyür!' : 'Geri zıpla: sayı küçülür!',
        steps: [{ say: `Kurbağa ${n} sayısında. ${by} adım ${up ? 'ileri' : 'geri'} zıplarsa nereye gelir?`, eq: expr, answer: ans }],
      };
    },
  },
  {
    id: 'besli-cerceve',
    band: 'minik',
    op: 'add',
    title: 'Beşlik Sıra',
    emoji: '🖐️',
    short: 'Dolu sıra = 5',
    idea: 'Çerçevenin üst sırası dolunca 5 tane olur, tıpkı bir elimizin parmakları gibi! Sonra alt sıraya bakarız.',
    make(level) {
      const n = rnd(6, level === 1 ? 8 : 10);
      const rest = n - 5;
      return {
        trickId: 'besli-cerceve',
        expr: `5 + ${rest} = ?`,
        answer: n,
        ask: 'Çerçevede kaç tane var?',
        visual: { type: 'tenframe', a: 5, b: rest },
        visualAlways: true,
        hint: 'Üst sıra dolu: 5. Sonra alt sırayı ekle!',
        steps: [
          { say: 'Üst sıra dolu, yani 5. Alt sırada kaç tane var?', eq: 'Alt sıra: ?', answer: rest },
          { say: `5 ve ${rest} daha... Hepsi kaç?`, eq: `5 + ${rest} = ?`, answer: n },
        ],
      };
    },
  },
  {
    id: 'buyukten-say',
    band: 'minik',
    op: 'add',
    title: 'Büyükten Başla',
    emoji: '🦒',
    short: '2 + 6 → 6, 7, 8',
    idea: 'Toplarken büyük sayıyı aklında tut, küçük sayı kadar ileri say. 2 + 6 için 6\'dan başla: 7, 8!',
    make(level) {
      const max = level === 1 ? 6 : level === 2 ? 8 : 10;
      const big = rnd(3, max - 1);
      const small = rnd(1, Math.min(3, max - big, big - 1));
      const [a, b] = Math.random() < 0.5 ? [small, big] : [big, small];
      return {
        trickId: 'buyukten-say',
        expr: `${a} + ${b} = ?`,
        answer: big + small,
        visual: { type: 'numberline', start: big, jumps: Array.from({ length: small }, () => ({ by: 1 })) },
        hint: 'Büyük sayıyı aklında tut, küçüğü parmaklarınla say!',
        steps: [
          {
            say: 'Hangisi daha büyük? Saymaya ondan başlayacağız.',
            eq: 'Büyük sayı: ?',
            answer: big,
            choices: [{ label: String(a), value: a }, { label: String(b), value: b }],
          },
          { say: `${big} sayısını aklında tut, ${small} adım ileri zıpla!`, eq: `${big} + ${small} = ?`, answer: big + small },
        ],
      };
    },
  },
  {
    id: 'ucan-balon',
    band: 'minik',
    op: 'sub',
    title: 'Uçan Balonlar',
    emoji: '🎈',
    short: '5 balon, 2 uçtu → 3',
    idea: 'Çıkarma, bir şeylerin gitmesidir. Balonlardan bazıları uçup gidince, elimizde kalanları sayarız!',
    make(level) {
      const total = level === 1 ? rnd(3, 5) : level === 2 ? rnd(4, 8) : rnd(6, 10);
      const fly = rnd(1, total - 1);
      return {
        trickId: 'ucan-balon',
        expr: `${total} − ${fly} = ?`,
        answer: total - fly,
        ask: `${total} balondan ${fly} tanesi uçtu. Kaç balon kaldı?`,
        visual: { type: 'balloons', total, fly },
        visualAlways: true,
        hint: 'Uçanları değil, elde kalanları say!',
        steps: [
          { say: 'Kaç balon uçup gitti?', eq: 'Uçan: ?', answer: fly },
          { say: 'Elinde kalan balonları say!', eq: `${total} − ${fly} = ?`, answer: total - fly },
        ],
      };
    },
  },
];

export const kesif: Trick[] = [
  {
    id: 'onun-arkadaslari',
    band: 'kesif',
    op: 'add',
    title: 'On\'un Arkadaşları',
    emoji: '🤝',
    short: '7 + 3 = 10',
    idea: 'Toplamı 10 eden sayı çiftleri en iyi arkadaştır: 1-9, 2-8, 3-7, 4-6, 5-5. Bunları bilen her işlemi kolay yapar!',
    make(level) {
      const a = level === 1 ? rnd(3, 7) : rnd(1, 9);
      return {
        trickId: 'onun-arkadaslari',
        expr: `${a} + ? = 10`,
        answer: 10 - a,
        input: 'frame',
        visual: { type: 'tenframe', a },
        visualAlways: true,
        hint: 'Çerçevedeki boş gözleri say!',
        steps: [{ say: 'Çerçeveyi doldurmak için kaç tane daha lazım? Boş gözlere dokun!', eq: `${a} + ? = 10`, answer: 10 - a }],
      };
    },
  },
  {
    id: 'ona-tamamla',
    band: 'kesif',
    op: 'add',
    title: '10\'a Tamamla',
    emoji: '🔟',
    short: '8 + 5 → 10 + 3',
    idea: 'Büyük sayıyı önce 10\'a tamamla, sonra kalanı ekle. 8 + 5: 8\'e 2 verirsek 10 olur, 5\'ten 3 kalır: 10 + 3 = 13!',
    make(level) {
      const base = rnd(level === 1 ? 8 : 6, 9);
      const need = 10 - base;
      const other = rnd(need + 1, base);
      const rest = other - need;
      const [a, b] = level >= 2 && Math.random() < 0.5 ? [other, base] : [base, other];
      return {
        trickId: 'ona-tamamla',
        expr: `${a} + ${b} = ?`,
        answer: base + other,
        visual: { type: 'tenframe', a: base, b: other, cap: 20 },
        hint: 'Önce 10\'a tamamla, sonra kalanı ekle!',
        steps: [
          { say: `${base} sayısını 10 yapmak için kaç lazım?`, eq: `${base} + ? = 10`, answer: need },
          { say: `${other} sayısını parçala: ${need} ve kaç?`, eq: `${other} = ${need} + ?`, answer: rest },
          { say: `10 ve ${rest}: çok kolay!`, eq: `10 + ${rest} = ?`, answer: base + other },
        ],
      };
    },
  },
  {
    id: 'ikizler',
    band: 'kesif',
    op: 'add',
    title: 'İkizler',
    emoji: '👯',
    short: '6 + 6 = 12',
    idea: 'Aynı sayıyı iki kez toplamak "ikizler"dir. İki elin parmakları gibi: 5 + 5 = 10. İkizleri ezberlersen çok hızlanırsın!',
    make(level) {
      const n = level === 1 ? rnd(1, 5) : level === 2 ? rnd(3, 10) : rnd(6, 15);
      return {
        trickId: 'ikizler',
        expr: `${n} + ${n} = ?`,
        answer: n * 2,
        visual: n <= 10 ? { type: 'tenframe', a: n, b: n, cap: 20 } : { type: 'blocks', nums: [n, n] },
        hint: 'İkizler! Aynı sayıyı iki kez say.',
        steps: [{ say: 'İkizler! Aynı sayıyı iki kez topluyoruz.', eq: `${n} + ${n} = ?`, answer: n * 2 }],
      };
    },
  },
  {
    id: 'ikizler-bir',
    band: 'kesif',
    op: 'add',
    title: 'İkizler + 1',
    emoji: '➕',
    short: '6 + 7 → 6 + 6 + 1',
    idea: 'Yan yana sayıları toplarken ikizleri kullan! 6 + 7 aslında 6 + 6 ve 1 fazlası: 12 + 1 = 13.',
    make(level) {
      const n = level === 1 ? rnd(2, 5) : level === 2 ? rnd(3, 9) : rnd(5, 12);
      const [a, b] = Math.random() < 0.5 ? [n, n + 1] : [n + 1, n];
      return {
        trickId: 'ikizler-bir',
        expr: `${a} + ${b} = ?`,
        answer: 2 * n + 1,
        visual: 2 * n + 1 <= 20 ? { type: 'tenframe', a: n, b: n + 1, cap: 20 } : { type: 'blocks', nums: [n, n + 1] },
        hint: 'Önce ikizleri topla, sonra 1 ekle!',
        steps: [
          { say: `${n + 1} sayısı, ${n} sayısından 1 fazla. Önce ikizleri topla:`, eq: `${n} + ${n} = ?`, answer: 2 * n },
          { say: 'Şimdi o fazladan 1\'i ekle!', eq: `${2 * n} + 1 = ?`, answer: 2 * n + 1 },
        ],
      };
    },
  },
  {
    id: 'farki-bul',
    band: 'kesif',
    op: 'sub',
    title: 'Farkı Bul',
    emoji: '🦘',
    short: '11 − 8 → 8\'den 11\'e?',
    idea: 'Geri saymak zor! Onun yerine küçük sayıdan büyük sayıya zıpla. 11 − 8: 8\'den 10\'a 2, 10\'dan 11\'e 1. Toplam 3!',
    make(level) {
      const b = level === 1 ? rnd(8, 9) : rnd(6, 9);
      const a = rnd(11, Math.min(18, b + 9));
      return {
        trickId: 'farki-bul',
        expr: `${a} − ${b} = ?`,
        answer: a - b,
        visual: { type: 'numberline', start: b, jumps: [{ by: 10 - b }, { by: a - 10 }] },
        hint: 'Küçük sayıdan büyük sayıya kaç adım var?',
        steps: [
          { say: `Geri saymak yerine ${b} sayısından ${a} sayısına zıplayalım. Önce 10'a kaç adım?`, eq: `${b} + ? = 10`, answer: 10 - b },
          { say: `10'dan ${a} sayısına kaç adım?`, eq: `10 + ? = ${a}`, answer: a - 10 },
          { say: 'Zıplamaları topla, fark bu!', eq: `${10 - b} + ${a - 10} = ?`, answer: a - b },
        ],
      };
    },
  },
  {
    id: 'ondan-gec',
    band: 'kesif',
    op: 'sub',
    title: '10\'dan Geç',
    emoji: '🛝',
    short: '13 − 5 → 13 − 3 − 2',
    idea: 'Önce 10\'a in, sonra kalanı çıkar. 13 − 5: 13\'ten 3 çıkar 10 olur, kalan 2\'yi de çıkar: 8!',
    make(level) {
      const a = rnd(11, level === 1 ? 14 : 18);
      const ones = a - 10;
      const b = rnd(ones + 1, 9);
      const rest = b - ones;
      return {
        trickId: 'ondan-gec',
        expr: `${a} − ${b} = ?`,
        answer: a - b,
        visual: { type: 'numberline', start: a, jumps: [{ by: -ones }, { by: -rest }] },
        hint: 'Önce 10\'a in, sonra kalanı çıkar!',
        steps: [
          { say: `Önce 10'a in: ${a} sayısından ${ones} çıkar.`, eq: `${a} − ${ones} = ?`, answer: 10 },
          { say: `${b} sayısını parçala: ${ones} ve kaç?`, eq: `${b} = ${ones} + ?`, answer: rest },
          { say: '10\'dan kalanı çıkar.', eq: `10 − ${rest} = ?`, answer: a - b },
        ],
      };
    },
  },
];
