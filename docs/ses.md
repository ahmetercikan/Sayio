# Sayio'nun doğal sesi

Sayio'nun yönergeleri telefonun robot sesiyle değil, **önceden üretilmiş doğal bir insan sesiyle**
okunuyor. Ses: **İrem** (ElevenLabs, Türkçe anadilli). Bütün kayıtlar uygulamanın içinde,
**internet gerekmiyor**.

## En önemli kural: cümle bölünmez

İlk denemede cümleleri parçalara bölüp ("Deniz'in" + "12" + "balonu var") çalarken birleştirdik.
**Çalışmadı.** Her parça ayrı bir konuşma olarak üretildiği için, araya ne kadar es konursa konsun
cümle "cümle gibi" duyulmuyor; rakamların sonu yutuluyor, anlam bütünlüğü bozuluyor.

Bu yüzden **her cümle baştan sona tek seferde üretilir**. `src/lib/voice.ts` yalnızca doğru dosyayı
bulup çalar — kırpma, es ayarı, birleştirme yok. Kaydı olmayan bir cümle çıkarsa o cümle cihazın
kendi sesiyle okunur (ses hiçbir zaman kesilmez).

## Yol boyunca ölçülen üç şey

Bunları tekrar denemeyin, hepsi ölçüldü:

1. **`next_text` kullanmayın.** ElevenLabs'e "bundan sonra şu geliyor" bilgisini verince sesi yarıda
   kesiyor: `"12"` klibi 0,86 sn yerine **0,26 sn** çıkıyordu.
2. **Rakamları yazıyla gönderin.** `"60"` yerine `"altmış"` → telaffuz %17-30 daha dolgun.
   Bunu `sayilariYaziyaCevir()` yapar; ekranda çocuk yine rakam görür.
3. **Soru işareti iki farklı şeydir.** `8 + ? = 13` içindeki `?` "kaç" diye okunur; `Kaç kaldı?`
   sonundaki `?` okunmaz, yerinde kalır ki ses soru tonunu versin. (Eskiden hepsi "kaç" okunuyor,
   "Kaç kaldı kaç" gibi anlamsız cümleler çıkıyordu.)
4. **Aynı adım ekranda üç ayrı cümledir.** Toplama betiği üçünü de üretmeli, yoksa biri cihaz sesine
   düşer ve çocuk cümlenin ortasında ses değişimi duyar:
   - Keşfet, adımı açarken kutuyu **dolu** okur: `Önce 10 kere al: 8 × 10 = 80`
   - Birlikte yapalım kutuyu **boş** sorar: `Önce 10 kere al: 8 × 10 = ?`
   - Sen yap / günün turu yönergeyle sorar: `Kolay yolu düşün ve cevapla! 8 × 5 = ?`

## Neyin sesi var?

| İçerik | Kapsam | Neden |
| --- | --- | --- |
| Sabit yönergeler, ders fikirleri, övgüler | **Her yaş** | En çok duyulan cümleler, sayısı az |
| Sorular ve sözel problemler | **4-7 yaş** | Anlatım orada otomatik açık, çocuk okuyamıyor |
| **Çarpım tablosu bölümü** | **Her yaş, her çarpan** | 2. sınıf konuyu dinleyerek anlıyor; bölüm 10 aile × 1-10 çarpan, yani tamamı üretilebiliyor |
| 8-14 yaşın püf noktası soruları | Yok | O yaşta anlatım otomatik açılmaz; çocuk ekrandan okur |

**Kaydı olmayan cümle kendiliğinden okunmaz.** Robot ses ancak çocuk 🔊 düğmesine basarsa duyulur:
8-14 yaşın püf soruları ve sözel problemleri. Bu yüzden Keşfet ekranı 8-14 yaşta adımı sesli
açmaz (`voiced`, `src/pages/Lesson.tsx`) — eskiden açıyordu ve robot ses oradan duyuluyordu.
Hepsinin kaydını üretmek 2,1 milyon kredi ve ~850 MB eder; uygulama mağaza sınırını aşar.

Toplam **4.515 cümle**, ~137 MB. Ölçülen kapsama: 4-7 yaş **%100** (478.000 cümle denendi),
çarpım tablosu **%100** (872 cümle; 10 ailenin 1-10 arası her çarpanı + günün turundaki 55 çarpım).

Çarpım bölümünde anlatım **her yaşta otomatik açılır** (`autoSpeak`, `src/pages/Lesson.tsx` ve
`src/pages/TimesRound.tsx`) — konu yeni olduğu için 8-10 yaş da dinleyerek öğreniyor.

### Küçüklerde çeşitlilik neden dar?

`src/problems/word.ts` içindeki `DAR_ISIM` (3) ve `DAR_NESNE` (2): 4-7 yaş sözel problemlerinde
3 isim (Ali, Ayşe, Can) ve 2 nesne (balon, kurabiye) kullanılır. Tam çeşitlilikte (10 isim × 7 nesne)
16.000'den fazla farklı cümle çıkıyor ve hepsinin sesini üretmek 1,2 milyon kredi ediyor.
**Matematik aynı** — değişen tek şey hikâyedeki isim ve nesne. 8-14 yaş tam çeşitliliği görür.

Çeşitliliği artırmak istersen: bu iki sayıyı büyüt, `npm run ses:topla && npm run ses:uret` çalıştır
(yalnızca yeni cümleler üretilir, eskilere ikinci kez para ödenmez). Kabaca maliyet:
0,25 kredi/karakter. 3×3 → +18.000 kredi, +33 MB.

## Kurulum

`.env.local` (git'e girmez):

```
ELEVENLABS_API_KEY=sk_...
```

Varsayılanlar `scripts/voice/generate.mjs` içinde: ses `İrem`, model `eleven_v4_turbo`
(karakter başına yarım kredi), hız `0.9`.

## Komutlar

| Komut | Ne yapar |
| --- | --- |
| `npm run ses:topla` | Söylenebilecek bütün cümleleri tarar → `voice/clips.json` |
| `npm run ses:uret` | Eksik cümleleri üretir (yarıda kalırsa kaldığı yerden devam eder) |
| `npm run ses:sesler` | Hesaptaki sesleri listeler |
| `npm run ses:sec` | Aday sesleri gerçek Sayio cümleleriyle dinletir → `voice/secim-*.m4a` |
| `npm run ses:temizle` | Üretilmiş bütün sesleri siler |

**Metin değiştirdiğinde** (yeni püf, yeni problem, yeni yönerge):

```bash
npm run ses:topla && npm run ses:uret && npm run sync
```

Yeni sesli cümleleri `src/lib/narration.ts` içine yazarsan betik onları da otomatik bulur.

## Dosyalar

- `public/voice/*.m4a` — cümlelerin sesi (dosya adı metnin özeti; aynı metin hep aynı dosya)
- `public/voice/manifest.json` — hangi cümlelerin hazır olduğu
- `voice/clips.json` — üretilecek cümle listesi (git'e girer)
- `src/lib/voiceText.ts` — dosya adı üretimi + sayıları yazıya çevirme
- `src/lib/voice.ts` — çalma katmanı
- `src/lib/speech.ts` — doğal ses → cihaz sesi sıralaması
