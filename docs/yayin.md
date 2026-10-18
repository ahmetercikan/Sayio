# Sayio'yu App Store ve Google Play'e gönderme

Aynı koddan üç sürüm çıkıyor: web (GitHub Pages), **iOS** ve **Android**.
Telefon ve tabletlerin hepsi destekleniyor (iPhone, iPad, Android telefon ve tabletler).

## 0. Her yayından önce

```bash
npm test          # soru üreticileri + ses parçalama kuralı
npm run sync      # web derlemesini ios/ ve android/ içine kopyalar
```

`npm run sync` çalışmazsa uygulamalar **eski** arayüzle derlenir — unutma.

### Uygulama kimliği (bundle id)

Şu an: **`com.ahmetercikan.sayio`**

İlk yayından sonra bu **değiştirilemez**. Başka bir kimlik istiyorsan (örneğin kendi alan adın
üzerinden `com.sayio.app`) şimdi değiştir:

1. `capacitor.config.ts` → `appId`
2. `npx cap sync`
3. iOS: Xcode → App hedefi → Signing & Capabilities → Bundle Identifier
4. Android: `android/app/build.gradle` → `namespace` ve `applicationId`

### Sürüm numarası

| Nerede | Alan | Ne zaman artar |
| --- | --- | --- |
| `package.json` | `version` | her yeni sürümde (ör. 1.0.0 → 1.1.0) |
| iOS (Xcode) | Version / Build | Build her yüklemede +1 olmalı |
| `android/app/build.gradle` | `versionName` / `versionCode` | versionCode her yüklemede +1 olmalı |

---

## 1. iOS — App Store

### Gerekenler
- **Apple Developer Program** üyeliği: yılda 99 $ — <https://developer.apple.com/programs/>
  (Kayıt 24-48 saat sürebilir, önce bunu başlat.)
- Xcode (kurulu).

### Adımlar

1. **Projeyi aç**
   ```bash
   npm run ios
   ```

2. **İmzalama.** Xcode'da sol panelden `App` → hedef `App` → **Signing & Capabilities**:
   - *Automatically manage signing* işaretli olsun.
   - **Team**: Apple geliştirici hesabını seç (Xcode → Settings → Accounts'tan eklenir).

3. **App Store Connect'te uygulamayı oluştur** — <https://appstoreconnect.apple.com>
   - My Apps → **+** → New App
   - Platform: iOS · Ad: **Sayio** · Dil: Türkçe · Bundle ID: `com.ahmetercikan.sayio` · SKU: `sayio`

   > **Önce bundle id kaydedilmeli.** New App penceresi yalnızca daha önce kaydedilmiş
   > kimlikleri listeler. Hesap **ABDURRAHMAN KAAN DIKEC** (Team ID `AQ2Y664A4Z`) ve bu bir
   > *bireysel* üyelik: App Store Connect'e kullanıcı eklenebiliyor ama geliştirici portalına
   > (Certificates, Identifiers & Profiles) yalnızca hesap sahibi girebiliyor. Yani
   > `com.ahmetercikan.sayio` kimliğini **Kaan'ın** kaydetmesi gerekir:
   > developer.apple.com → Identifiers → **+** → App IDs → App →
   > Description: `Sayio`, Bundle ID (Explicit): `com.ahmetercikan.sayio` → Register.
   > (Çizio'nun kimliği de aynı yoldan kaydedilmişti.)

4. **Arşivle ve yükle.** Xcode'da üstteki cihaz seçicide **Any iOS Device** seç →
   menüden **Product → Archive** → arşiv penceresinde **Distribute App** → *App Store Connect* → Upload.

5. **Mağaza bilgileri** (App Store Connect'te):
   - **Kategori:** Eğitim (Education). İkincil: Çocuklar/Aile.
   - **Yaş derecesi:** 4+.
   - **Gizlilik politikası (zorunlu):** aşağıdaki "Gizlilik" bölümüne bak.
   - **App Privacy:** "Data Not Collected" — Sayio hiçbir veri toplamıyor, her şey cihazda kalıyor.
   - **Ekran görüntüleri (zorunlu):**
     - iPhone 6.9" (1320×2868 veya 1290×2796) — en az 3 tane
     - iPad 13" (2064×2752) — en az 3 tane
     - Simülatörden almak için: uygulamayı aç → `Cmd+S` ya da
       `xcrun simctl io booted screenshot ekran.png`

6. **Kids Category uyarısı.** Uygulamayı "Kids" kategorisine koyarsan Apple şunları şart koşar
   (Sayio zaten hepsine uyuyor): reklam yok, üçüncü taraf izleme yok, dış bağlantılar
   ebeveyn kapısının arkasında. Sayio'nun ebeveyn bölümü bir işlem sorusuyla korunuyor.

---

## 2. Android — Google Play

### Gerekenler
- **Google Play Console** hesabı: tek seferlik 25 $ — <https://play.google.com/console>

### İmza anahtarı (bir kez, çok önemli)

Bu anahtarı kaybedersen uygulamayı bir daha **güncelleyemezsin**. Yedekle.

```bash
cd android
keytool -genkey -v -keystore sayio-release.keystore \
  -alias sayio -keyalg RSA -keysize 2048 -validity 10000
```

Sorulan parolaları ve bilgileri gir. Sonra:

```bash
cp keystore.properties.example keystore.properties
```

`android/keystore.properties` dosyasını kendi parolalarınla doldur.
Bu dosya ve `.keystore` git'e **girmez** (`.gitignore` içinde).

> Anahtar dosyasını ve parolaları bir parola yöneticisinde sakla.

**Durum:** anahtar **18 Ekim 2026**'da oluşturuldu — `android/sayio-release.keystore`
(alias `sayio`, 2054'e kadar geçerli, SHA-256 `43:24:32:DF:…`). Parola
`android/keystore.properties` içinde; ikisi de git'e girmiyor, izinleri 600.
**Bu iki dosyayı yedekle** — bu Mac giderse uygulama bir daha güncellenemez.
(Play'de "App Signing" açılırsa asıl anahtarı Google saklar, yükleme anahtarı sıfırlanabilir.)

### Derleme

```bash
npm run sync
cd android && ./gradlew bundleRelease
```

Çıktı: `android/app/build/outputs/bundle/release/app-release.aab` → Play Console'a bu dosya yüklenir.

### Play Console adımları

1. **Create app** → Ad: `Sayio: Matematiğin Kolay Yolu` · Paket: `com.ahmetercikan.sayio` ·
   Dil: Türkçe · Uygulama · Ücretsiz · iki beyan kutusu işaretli
   (hesap: **KingSmile Studios**)
2. **Testing → Internal testing** ile başla (kendi telefonunda dene), sonra Production.
3. Doldurulması zorunlu bölümler:
   - **App content → Privacy policy:** aşağıya bak.
   - **Data safety:** "No data collected" / "No data shared" işaretle.
   - **Content rating:** anketi doldur → 3+ çıkar.
   - **Target audience:** 5 yaş altı + 6-8 + 9-12 → **Designed for Families** programına girer.
     Bu program reklam ve veri toplama konusunda ek kurallar koyar; Sayio ikisini de yapmıyor.
   - **Ekran görüntüleri:** telefon (en az 2) + 7" tablet + 10" tablet, ayrıca
     512×512 simge ve 1024×500 öne çıkan görsel.
     Emülatörden: `adb exec-out screencap -p > ekran.png`

---

## 3. Gizlilik politikası

Her iki mağaza da bir **web adresi** istiyor. Sayio hiçbir veri toplamadığı için metin kısa:

> **Sayio Gizlilik Politikası**
> Sayio hiçbir kişisel veri toplamaz, saklamaz veya paylaşmaz. Profil adları, yaş bilgisi ve
> ilerleme kayıtları yalnızca cihazın kendi hafızasında tutulur; hiçbir sunucuya gönderilmez.
> Uygulamada reklam, analiz aracı ve üçüncü taraf izleme yoktur. İnternet bağlantısı gerektirmez.
> İletişim: <e-posta adresin>

Bunu `gizlilik.html` olarak GitHub Pages'e koyup
`https://ahmetercikan.github.io/Sayio/gizlilik.html` adresini verebilirsin.

---

## 4. Simge ve açılış görselini değiştirme

Kaynak çizimler `assets-src/*.svg`. Değiştirdikten sonra:

```bash
npm run assets   # bütün boyutları iOS ve Android için yeniden üretir
```

---

## 5. Sık karşılaşılanlar

| Sorun | Çözüm |
| --- | --- |
| Uygulamada eski arayüz görünüyor | `npm run sync` yapmayı unuttun |
| Xcode "Signing requires a development team" | Xcode → Settings → Accounts → Apple hesabını ekle |
| Gradle "SDK location not found" | `ANDROID_HOME` tanımlı değil; yeni bir terminal aç |
| Play "Your app targets API level X" | `android/variables.gradle` → `targetSdkVersion` yükselt |
| Ses robot gibi çıkıyor | Ses parçaları üretilmemiş → `docs/ses.md` |
