# Sayio'nun doğal sesi

Sayio'nun yönergeleri artık telefonun robot sesiyle değil, **önceden üretilmiş doğal bir insan sesiyle**
okunuyor. Bu belge sesin nasıl üretildiğini ve nasıl değiştirileceğini anlatır.

## Neden parça parça?

Uygulama 59 binden fazla farklı cümle söyleyebiliyor — çünkü her soruda sayılar değişiyor
("8 artı 5 eşittir kaç", "13 artı 7 eşittir kaç"…). Bunların hepsini tek tek seslendirmek
imkânsız (yüzlerce megabayt, binlerce dolar).

Bunun yerine her cümle **sabit metin parçaları** ve **sayılar** olarak bölünüyor:

```
"Deniz'in 12 balonu var. 5 tanesi uçtu. Kaç kaldı?"
 └ "Deniz'in" ┘ └12┘ └ "balonu var." ┘ └5┘ └ "tanesi uçtu. Kaç kaldı" ┘
```

Böylece **2.572 ses parçası** bütün cümleleri karşılıyor (~67 bin karakter, tek seferlik üretim).
Uygulama bu parçaları çalarken baş/son sessizliklerini kırpıp saniyesi saniyesine birleştiriyor,
kulağa tek bir cümle gibi geliyor. Parçalar cihazda olduğu için **internet gerekmiyor**.

Bir parça eksikse o cümle telefonun kendi sesiyle okunur — yani ses hiçbir zaman tamamen kesilmez.

## 1. ElevenLabs hesabı aç

1. <https://elevenlabs.io> → **Sign up** (Google hesabınla da olur).
2. Üst menüden **Pricing** → **Creator** planını seç (aylık ~22 $, 100.000 kredi).
   - Tüm sesleri üretmek **~67.000 kredi** harcar, yani tek ay yeter.
   - **Önemli:** ücretsiz plan ticari kullanıma (mağazada uygulama) izin vermez; Creator verir.
3. Sağ üstte profil resmi → **API Keys** → **Create API Key** → anahtarı kopyala.

## 2. Anahtarı projeye koy

Proje kökünde `.env.local` adında bir dosya aç (bu dosya git'e gitmez, kimse göremez):

```
ELEVENLABS_API_KEY=sk_buraya_kopyaladığın_anahtar
```

## 3. Sesi seç

```bash
npm run ses:sesler      # hesabındaki seslerin listesi ve ID'leri
```

Çocuk anlatımı için sıcak, net ve yavaş konuşan bir kadın sesi iyi sonuç verir.
Beğendiğin sesin ID'sini `.env.local` dosyasına ekle:

```
ELEVENLABS_VOICE_ID=buraya_ses_id
```

Önce birkaç parça üretip dinle (ucuz, ~300 kredi):

```bash
npm run ses:ornek       # 12 parça üretir
npm run ses:dene        # parçaları birleştirip voice/deneme.m4a yazar
open voice/deneme.m4a   # dinle
```

Beğenmediysen `.env.local` içindeki ID'yi değiştir, `npm run ses:temizle` yapıp tekrar dene.

## 4. Bütün sesleri üret

```bash
npm run ses:topla       # söylenebilecek bütün cümleleri tarar → voice/clips.json
npm run ses:uret        # eksik parçaları ElevenLabs'e ürettirir (~20-30 dk)
npm run sync            # sesleri iOS ve Android uygulamalarına kopyalar
```

`ses:uret` yarıda kalırsa tekrar çalıştır; kaldığı yerden devam eder, üretilmiş parçaya
ikinci kez para ödemezsin.

## Soruları/metinleri değiştirdiğinde

Yeni bir püf noktası, yeni bir problem ya da yeni bir yönerge eklediğinde yeni parçalar gerekir:

```bash
npm run ses:topla && npm run ses:uret && npm run sync
```

Sadece **yeni** parçalar üretilir. Sabit yönergeleri `src/lib/narration.ts` içine yazarsan
betik onları da otomatik bulur.

## Komutların özeti

| Komut | Ne yapar |
| --- | --- |
| `npm run ses:topla` | Söylenebilecek bütün cümleleri tarar, parça listesini çıkarır |
| `npm run ses:sesler` | ElevenLabs hesabındaki sesleri listeler |
| `npm run ses:ornek` | 12 parça üretir (deneme) |
| `npm run ses:uret` | Eksik bütün parçaları üretir |
| `npm run ses:dene "cümle"` | Parçaları birleştirip `voice/deneme.m4a` yazar (kulakla kontrol) |
| `npm run ses:temizle` | Üretilmiş bütün sesleri siler (baştan üretmek için) |

## Dosyalar nerede?

- `public/voice/*.m4a` — ses parçaları (~2.572 dosya, uygulamaya gömülür)
- `public/voice/manifest.json` — hangi parçaların hazır olduğu
- `voice/clips.json` — üretilecek parçaların listesi (git'e girer, sesler girmez)
- `src/lib/voiceText.ts` — cümleyi parçalara bölen kural (üretim ve çalma aynı kuralı kullanır)
- `src/lib/voice.ts` — parçaları çalan katman
- `src/lib/speech.ts` — doğal ses → cihaz sesi → tarayıcı sesi sıralaması

## Anahtarsız deneme

API anahtarın yokken düzeneği denemek için (ses yapay duyulur, sadece test amaçlı):

```bash
node scripts/voice/generate.mjs --local
```
