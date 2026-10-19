# CERAMICA — güncel ürün kapsamı

Kullanıcının son düzeltmesi önceki MASTER_PROMPT ve ticaret odaklı belgelerin kapsamını değiştirir.

## İstenen uygulama
- CERAMICA tasarımında bağımsız katalog/showroom.
- Graniser, Duratiles ve ceramicabanyo.com referansları.
- Gerçek kaynaklardan alınmış seçili koleksiyonlar ve görseller APK içine gömülü.
- Çevrimdışı katalog, marka/kategori/ebat arama ve cihazda saklanan favoriler.
- Ürün detayı, yakınlaştırma, PDF ve üç referans siteye bağlantı.
- Android APK ve aynı uygulamanın iOS kaynak/platform yapılandırması.

## Kapsam dışı
Sipariş, sepet, fiyat, ödeme, hesap/üyelik, sunucu ayarı, API bağlantısı, PostgreSQL, Redis ve yönetim paneli güncel telefon uygulamasının parçası değildir. Önceki ticari çekirdek kodları Git geçmişinde ve eski klasörlerde korunur; güncel APK'ye dahil edilmez. Eski ticari CI yalnız elle başlatılabilir.

Ana ürün kaynakları apps/mobile/lib, apps/mobile/assets, apps/mobile/android ve apps/mobile/ios altındadır. iPhone web çıktısı da aynı Flutter kaynaklarından üretilir; ayrı sahte katalog veya fiyat listesi tutulmaz. Güncel kurulum SHOWROOM.md dosyasındadır.

## Dağıtım sınırı
Uygulamanın kendisi sunucu gerektirmez. Kaynak site/PDF/harita bağlantıları internet gerektirir. Native iPhone kurulumu Apple imzalaması ve macOS/Xcode gerektirir; kişisel Apple kimliğiyle kendi cihazına Xcode kurulumu ile TestFlight/App Store dağıtımı ayrı süreçlerdir. Linux'ta üretilemeyen imzalı IPA varmış gibi sunulmaz.
