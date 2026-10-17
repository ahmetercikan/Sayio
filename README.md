# Sayio — Matematiği Kolay Yoldan Öğren

🌐 **Canlı:** https://ahmetercikan.github.io/Sayio/

4-14 yaş çocuklar için dört işlemin **kolay yollarını** öğreten, Çizio ile aynı tasarım dilinde bir uygulama.

## Neler var?
- **Püf Noktaları (28 adet, 4 yaş grubu):** Saymadan Gör, 10'a Tamamla, İkizler +1, Farkı Bul, Soldan Topla,
  Sabit Fark, Parçala Çarp, 9'un Sihri, 5'e Bölme, 11'in Sırrı, Çapraz Çarpım, Kutu Yöntemi, Yüzde, İşlem Sırası,
  Negatif Pullar, Bölünebilme… Her ders: **Keşfet → Birlikte → Sen yap → Yıldızlar**. 3 yıldızda sorular zorlaşır.
- **Kolay yol defteri:** her püf noktası çizgili kâğıda kalemle çiziliyormuş gibi adım adım eskizle anlatılır.
- **Çarpım Tablosu:** ezber değil kolay yollar. 100 kutuluk tablo aslında 55 çarpım (3×7 = 7×3),
  kolay aileler çıkınca geriye **sadece 21 zor çarpım** kalır — çocuk bunu haritada gözüyle görür.
  10 aile dersi (1'ler, 10'lar, 2'ler, 5'ler, 9'lar, 4'ler, 3'ler, 6'lar, 8'ler, 7'ler), her biri bir
  türetme stratejisi öğretir (6 × 7 → 5 kere al, bir kere daha ekle). "Günün turu" aralıklı tekrarla
  (Leitner) hangi çarpımın tekrar zamanı geldiğini bilir. **Süre tutulmaz.**
- **Problem Çözme:** Polya'nın 4 adımı (Anla, Planla, Uygula, Kontrol) ve Singapur çubuk modeli.
- **Oyunlar:** Şimşek Tur (60 sn), Sayı Arkadaşları, Tahmin Ustası.
- **Ödüller:** yıldız, seviye, seri, rozetler. **Ebeveyn bölümü:** haftalık rapor, yaş, ses ayarları.

## Öğretim ilkeleri
Somuttan soyuta (CPA — her soruda "göz" düğmesi), iskeleleme, Bilişsel Yük Teorisi, hataya nazik geri bildirim,
4-7 yaşta klavyesiz cevap, gelişim zihniyeti (çaba ve strateji övülür).

Çarpım tablosunda ayrıca: **türetme stratejileri** (Baroody; Gray & Tall — ezberleyen çocuk tıkanır,
strateji öğrenen unuttuğunda yeniden bulur), **aralıklı hatırlama pratiği** (Roediger & Karpicke),
**harmanlama** (Rohrer & Taylor — aynı aileyi blok hâlinde çalışmak kısa vadede kolay, uzun vadede zayıf)
ve **süresiz pratik** (Boaler; Ramirez ve ark. — süreli test matematik kaygısını büyütür).

## Doğal ses
Yönergeler telefonun robot sesiyle değil, önceden üretilmiş **doğal bir insan sesiyle** okunur.
Sayılar her soruda değiştiği için cümleler "metin parçası + sayı" olarak bölünür ve çalarken
birleştirilir — ~2.572 ses parçası bütün cümleleri karşılar, internet gerekmez.
Kurulum ve komutlar: [docs/ses.md](docs/ses.md).

## Çalıştırma
```
npm install
npm run dev      # http://localhost:5290
npm test
npm run build    # dist/ klasörü (PWA, çevrimdışı çalışır)
```

## Telefon ve tablet uygulaması
iOS ve Android sürümleri aynı koddan Capacitor ile üretilir; telefon ve tabletlerde çalışır.
```
npm run sync     # web derlemesini iOS ve Android projelerine kopyalar
npm run ios      # Xcode'da açar
npm run android  # Android Studio'da açar
```
Mağazaya gönderme adımları: [docs/yayin.md](docs/yayin.md).
