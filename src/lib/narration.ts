/**
 * Uygulamanın sabit seslendirme cümleleri — soruya göre değişmeyen, elle yazılmış metinler.
 *
 * Hepsi tek yerde duruyor ki doğal ses üretme betiği (scripts/voice/collect.ts) hiçbirini kaçırmasın.
 * YENİ SESLİ CÜMLE EKLERKEN buraya ekle, sonra `npm run ses:uret` ile sesini üret.
 */

export const ONBOARDING_LINES = {
  splash: 'Merhaba! Ben Sayio. Matematiğin kolay yollarını birlikte keşfedeceğiz!',
  avatar: 'Avatarını seç!',
  name: 'Adın ne?',
  age: 'Kaç yaşındasın?',
  parent: 'Hadi bir büyüğünü çağır! Sayio\'yu birlikte kuralım.',
  start: 'Hadi başlayalım!',
} as const;

/** Ders sonu: 3 yıldız alınca baş cümle + rastgele bir övgü. */
export const PRAISE_PERFECT = 'Muhteşem! Üç yıldız!';
export const PRAISE_PERFECT_EXTRA = ['Kolay yolu çok iyi öğrendin.', 'Beynin kas gibi güçleniyor!'];
export const PRAISE_DONE = 'Harika çalıştın! Her denemede daha da güçleniyorsun.';

/** İskele kapalıyken sorulan genel yönerge. */
export const ASK_YOUNG = 'Kolay yolu düşün!';
export const ASK_OLDER = 'Kolay yolu düşün ve cevapla!';

/** Ses üretme betiği için: yukarıdaki her şeyin düz listesi. */
export function fixedLines(): string[] {
  return [
    ...Object.values(ONBOARDING_LINES),
    ...PRAISE_PERFECT_EXTRA.map((x) => `${PRAISE_PERFECT} ${x}`),
    PRAISE_DONE,
    ASK_YOUNG,
    ASK_OLDER,
  ];
}
