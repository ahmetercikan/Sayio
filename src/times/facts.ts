/**
 * Çarpım tablosu — çarpanlar değil, **stratejiler**.
 *
 * Araştırmanın söylediği (Baroody 2006; Gray & Tall 1994; Boaler, "Fluency Without Fear"):
 * çarpım tablosunu ezberleyerek öğrenen çocuk bir yerde tıkanır; **türetme stratejisi** öğrenen çocuk
 * hem hatırlar hem de unuttuğunda yeniden bulabilir. Bu yüzden Sayio tabloyu 10 aileye böler ve
 * her aileye bir "kolay yol" öğretir (6 × 7 → 5 kere al, bir kere daha ekle).
 *
 * İki büyük kolaylık çocuğa açıkça gösterilir:
 *  1. **Yer değiştirme (komütatiflik):** 7 × 8 ile 8 × 7 aynı şey → 100 çarpım aslında 55 tane.
 *  2. **Aileler küçülerek gider:** 1'ler 10 tane, 10'lar 9, 2'ler 8… 7'ler 1 tane.
 *     Geriye gerçekten zor olan sadece **21 çarpım** kalır.
 */

/** Bir çarpımın bağlı olduğu kolay yol ailesi. */
export type Family = '1' | '10' | '2' | '5' | '9' | '4' | '3' | '6' | '8' | '7';

/**
 * Aileler kolaydan zora. Bir çarpım, çarpanlarından bu sırada ÖNCE gelene aittir:
 * 6 × 9 → 9 ailesi (9, 6'dan önce gelir), çünkü "9 ile çarp" daha kolay bir yoldur.
 */
export const FAMILY_ORDER: Family[] = ['1', '10', '2', '5', '9', '4', '3', '6', '8', '7'];

export interface FamilyInfo {
  id: Family;
  /** Bu aileyi öğreten dersin id'si (src/times/table.ts). */
  trickId: string;
  title: string;
  emoji: string;
  /** Dersin başlığı: "9'ların Kolay Yolu". */
  lesson: string;
  /** Kartta görünen tek satırlık kolay yol. */
  short: string;
  color: string;
  dark: string;
  soft: string;
}

export const FAMILIES: Record<Family, FamilyInfo> = {
  '1': { id: '1', trickId: 'carpim-1', title: "1'ler", lesson: "1'lerin Kolay Yolu", emoji: '🪞', short: '1 kere her şey kendisi', color: '#8ec5ff', dark: '#4a90d9', soft: '#e3f1ff' },
  '10': { id: '10', trickId: 'carpim-10', title: "10'lar", lesson: "10'ların Kolay Yolu", emoji: '🔟', short: 'Sonuna bir sıfır ekle', color: '#14a89a', dark: '#0d8074', soft: '#d4f3ee' },
  '2': { id: '2', trickId: 'carpim-2', title: "2'ler", lesson: "2'lerin Kolay Yolu", emoji: '👯', short: 'İki katı: kendisiyle topla', color: '#ff6b4a', dark: '#de4d2d', soft: '#ffe7de' },
  '5': { id: '5', trickId: 'carpim-5', title: "5'ler", lesson: "5'lerin Kolay Yolu", emoji: '🖐️', short: "10 kere al, yarısını söyle", color: '#ffc83d', dark: '#e8a200', soft: '#fff1c7' },
  '9': { id: '9', trickId: 'carpim-9', title: "9'lar", lesson: "9'ların Kolay Yolu", emoji: '✨', short: '10 kere al, bir grup geri ver', color: '#9b6bff', dark: '#7a4fe0', soft: '#f1e8ff' },
  '4': { id: '4', trickId: 'carpim-4', title: "4'ler", lesson: "4'lerin Kolay Yolu", emoji: '🧩', short: 'Katla, bir daha katla', color: '#3f7fe0', dark: '#2a62bd', soft: '#dcecff' },
  '3': { id: '3', trickId: 'carpim-3', title: "3'ler", lesson: "3'lerin Kolay Yolu", emoji: '🎈', short: 'İki katı + bir grup daha', color: '#2bb673', dark: '#1d8a56', soft: '#d9f5e6' },
  '6': { id: '6', trickId: 'carpim-6', title: "6'lar", lesson: "6'ların Kolay Yolu", emoji: '🐞', short: '5 kere + 1 kere', color: '#e9487d', dark: '#c22f61', soft: '#ffe1ec' },
  '8': { id: '8', trickId: 'carpim-8', title: "8'ler", lesson: "8'lerin Kolay Yolu", emoji: '🐙', short: '10 kere al, 2 kere geri ver', color: '#7a4fe0', dark: '#5c34b8', soft: '#ece2ff' },
  '7': { id: '7', trickId: 'carpim-7', title: "7'ler", lesson: "7'lerin Kolay Yolu", emoji: '🌈', short: '5 kere + 2 kere', color: '#ff8a3d', dark: '#d96a1f', soft: '#ffe9d6' },
};

export interface Fact {
  a: number;
  b: number;
  /** Küçük çarpan önce: "3x7". 3 × 7 ile 7 × 3 aynı anahtarı paylaşır. */
  key: string;
  product: number;
  family: Family;
}

/** 3 × 7 ve 7 × 3 aynı bilgidir → tek anahtar. */
export const factKey = (a: number, b: number) => `${Math.min(a, b)}x${Math.max(a, b)}`;

export const familyOf = (a: number, b: number): Family =>
  FAMILY_ORDER.find((f) => Number(f) === a || Number(f) === b) ?? '7';

/** 1-10 arası bütün çarpımlar (tekrarsız): 55 tane. */
export const FACTS: Fact[] = (() => {
  const out: Fact[] = [];
  for (let a = 1; a <= 10; a++)
    for (let b = a; b <= 10; b++) out.push({ a, b, key: factKey(a, b), product: a * b, family: familyOf(a, b) });
  return out;
})();

export const factsOf = (f: Family) => FACTS.filter((x) => x.family === f);

/**
 * Gerçekten ezber isteyen çarpımlar: kolay aileler (1, 10, 2, 5) çıkınca geriye **21** tane kalır.
 * Çocuğa "aslında sadece 21 tane zor var" demek, 100 kutuluk tabloyu korkutucu olmaktan çıkarır.
 */
export const HARD_FAMILIES: Family[] = ['9', '4', '3', '6', '8', '7'];
export const HARD_FACTS = FACTS.filter((f) => HARD_FAMILIES.includes(f.family));
