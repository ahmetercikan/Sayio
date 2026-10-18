# Mağaza görselleri

Ekran görüntüleri ve tanıtım kartları **üretilir**, git'e girmez (~70 MB). İki komutla yeniden oluşur:

```bash
npm run dev                      # ayrı bir pencerede açık kalsın (port 5290)
npm run magaza:ekran phone       # ham ekranlar → store/screenshots/
npm run magaza:ekran tablet
npm run magaza:ekran iphone
npm run magaza:ekran ipad
npm run magaza:gorsel            # tanıtım kartları → store/promo/
```

`store-shots.mts` gerçek uygulamayı gezer: örnek bir profil (Elif, 8 yaş, 86 yıldız) yazar,
dersi açar, adımları çözer, problemi çözer; 8 ekranı yakalar. `store-promo.mts` bunları
başlıklı kartlara yerleştirir.

**App Store kartları panoramiktir:** sekiz görüntü tek bir geniş şeritten kesilir, arka plan
rengi, defter çizgileri, sayı karoları ve kesik kalem çizgisi karttan karta akar — mağazada
yan yana kaydırınca tek bir resim gibi görünür. (Aynı yöntem İsim Şehir'de de kullanıldı.)

## Ne nereye yüklenir?

| Dosya | Nereye |
| --- | --- |
| `promo/phone-01…08.png` (1080×1920) | Play → Ana mağaza girişi → Telefon ekran görüntüleri |
| `promo/tablet-01…08.png` (1920×1200) | Play → 7" ve 10" tablet |
| `promo/feature-graphic.png` (1024×500) | Play → Öne çıkan grafik |
| `promo/play-icon-512.png` (512×512) | Play → Uygulama simgesi |
| `promo/ios/iphone-6-9-01…08.png` (1290×2796) | App Store → iPhone 6.9" |
| `promo/ios/iphone-6-3-01…08.png` (1206×2622) | App Store → iPhone 6.3" |
| `promo/ios/ipad-13-01…08.png` (2064×2752) | App Store → iPad 13" |

App Store uygulama simgesi ayrıca yüklenmez; yapının içinden (`AppIcon-512@2x.png`) alınır.
