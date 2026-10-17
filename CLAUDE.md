# Sayio — Claude için proje notları

- **Ne:** 4-14 yaş çocuklar için Türkçe matematik uygulaması: dört işlemin kolay yolları (püf noktaları),
  çubuk modeliyle problem çözme (Polya), mini oyunlar. Tasarım dili, akış ve görsel biçim **Çizio** (`../simple-Draw`) ile aynıdır.
  React 18 + TypeScript + Vite 5 (HashRouter), zustand (`src/store/useApp.ts`, localStorage `sayio-v1`).
- **Kullanıcı** teknik değil: her zaman **Türkçe ve sade** yaz.
- **Komutlar:**
  - geliştirme: `npm run dev` (port 5290; 5173/5199/5288 kullanma)
  - test: `npm test` (tüm soru üreticilerini binlerce kez doğrular)
  - tip kontrolü ve derleme: `npm run build`
- **Yapı:**
  - `src/tricks/young.ts` (Minik 4-5, Kaşif 6-7), `src/tricks/older.ts` (Usta 8-10, Dahi 11-14): püf noktaları.
    Her püf `make(level)` ile parametrik soru üretir: `steps` (iskele adımları; son adımın cevabı = asıl cevap), `visual` (somut model).
  - `src/problems/word.ts`: sözel problemler (Anla → Planla → Uygula → Kontrol, çubuk modelleri).
  - `src/visuals/Visual.tsx`: 10'luk çerçeve, sayı doğrusu, onluk bloklar, çubuk/alan/dizi modeli, pullar, balonlar…
  - `src/sketch/`: "kolay yol defteri" — kalem eskizi. `build.ts` el çizimi geometri, `recipes.ts` her püf için eskiz senaryosu
    (adım k = iskele adımı k; tanınmayan varyant genel eskize düşer), `Notebook.tsx` kalemle çizme animasyonu.
  - `src/components/ProblemRunner.tsx`: iskeleli soru çözücü, CPA "göz" anahtarı, nazik geri bildirim.
  - `src/styles/shell.css`: Çizio'dan birebir alınan ortak stiller; `src/styles/app.css`: Sayio'ya özel.
- **Çarpım tablosu (`src/times/`, `/carpim`):** uygulamanın ikinci ana amacı. Ezber değil **türetme
  stratejisi**: her çarpım 10 "aile"den birine düşer (`facts.ts`; aile = çarpanlardan kolay olanı),
  her ailenin bir dersi vardır (`table.ts`, normal ders akışını kullanır, `group: 'carpim'` ile püf
  listelerinden ayrılır). `problemFor(a,b)` bir çarpım için o ailenin kolay yolunu kurar.
  İlerleme Leitner aralıklı tekrarıyla tutulur (`mastery.ts`; kutu 0-5, kutu ≥4 "ezberledi"),
  profil verisinde `facts`. Süre tutulmaz (matematik kaygısı). Ekranlar: `pages/Times.tsx` (harita +
  aileler), `pages/TimesRound.tsx` (günün turu). Dayanak: Baroody 2006, Gray & Tall 1994,
  Boaler "Fluency Without Fear", Roediger-Karpicke (hatırlama pratiği), Rohrer & Taylor (harmanlama).
- **Ses (önemli):** yönergeler **doğal sesle** okunur. 59 bin cümle mümkün olduğu için her cümle
  "sabit metin parçaları + sayılar" olarak bölünür (`src/lib/voiceText.ts` — bu kuralı üretim ve çalma
  birlikte kullanır, değiştirirsen sesleri yeniden üretmek gerekir). ~2.572 parça ElevenLabs ile üretilip
  `public/voice/` içine gömülür; `src/lib/voice.ts` kırpıp birleştirerek çalar. Parça eksikse cihazın
  kendi sesine düşer. Komutlar ve hesap kurulumu: **docs/ses.md**. Yeni sesli cümleleri
  `src/lib/narration.ts` içine yaz ki üretim betiği bulsun.
- **Telefon/tablet uygulaması:** Capacitor 8 (`ios/`, `android/`). `npm run sync` web derlemesini iki
  platforma kopyalar; `npm run ios` / `npm run android` Xcode ve Android Studio'yu açar. Kabuk işleri
  (durum çubuğu, açılış görseli, Android geri tuşu, titreşim) `src/lib/native.ts`. Tablet ölçeği
  `src/styles/tablet.css`. Simge/açılış görselleri `assets-src/*.svg` → `npm run assets`.
  Ayrıntı: **docs/yayin.md**.
- **Yayın:** `main`'e gönderilince GitHub Actions test + derleme yapıp GitHub Pages'e yayınlar (https://ahmetercikan.github.io/Sayio/). Commit mesajları Türkçe.
- **Türkçe ekler:** sayılara ek getirme (8'i, 6'yı…); cümleleri "… sayısı" kalıbıyla kur. Üleştirme için `distrib()`.
- **Pedagoji ilkesi:** yanlışta asla "yanlış, doğrusu X" deme; `nudge()` ile yönlendir, görseli aç, adımlara geç.
