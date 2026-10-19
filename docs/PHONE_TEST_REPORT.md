> Tarihsel belge. Güncel ürün kapsamı için [PRODUCT_SCOPE.md](../PRODUCT_SCOPE.md), kurulum için [SHOWROOM.md](../SHOWROOM.md) geçerlidir.

# Telefon sürümü doğrulaması — 19 Ekim 2026

- Flutter 3.44.0, Dart 3.12.0; Temurin JDK 21.0.12.1 ve Android SDK kuruldu. OCI SDK katmanları ve resmî JDK arşivi SHA-256 ile doğrulandı. Gradle 9.1.0 dağıtım checksum'u wrapper'da sabittir.
- `flutter pub get --enforce-lockfile`: kilit dosyasıyla paket çözümü başarılı.
- `flutter analyze`: sorun yok.
- `flutter test`: 7 test geçti. Demo katalog/arama, kesin koli ve vergi hesabı, Türkçe sayı girdisi, tam koli sınırı, geçersiz değerler, demo modunda ticari işlem reddi, showroom ve ürün detayından hesaplama ekranı.
- `flutter build apk --release --target-platform android-arm64,android-arm --no-pub`: exit 0, yaklaşık 31.6 MB APK üretildi.
- Android `apksigner verify`: başarılı. Deneme sertifikası Android Debug'dır; Google Play üretim imzası değildir.
- Android `aapt dump badging`: paket com.ceramica.ceramica, sürüm 0.1.0, etiket CERAMICA Demo, minimum API 24 (Android 7), hedef API 36; INTERNET izni mevcut.
- Root JavaScript testleri: 9/9, yeni telefon web demosunun BigInt tabanlı hesaplama ve Türkçe ondalık testleri dahil.
- Mobil Chromium 390×844 gerçek tarayıcı kontrolü: 6 ürün, hesaplama modalı, 47 m²/%10 → 36 koli/51.84 m², 4,32 m² → 3 koli, marka filtresi, sonuçsuz arama, service worker kontrolü, internet kapalıyken yeniden açılma ve hesaplama başarılı. JavaScript pageerror yok. Ekran görüntüsü alındı.
- Statik web paketinde harici font/ürün görseli/ağ API bağımlılığı yok. İlk HTTPS yüklemesi ve tarayıcı önbelleğinin tamamlanması gerekir.

## Düzeltmeler
Önceki mobil kaynaklar henüz derlenmemişti; ilk analizdeki sözdizimi ve lint sorunları düzeltildi. Testteki kaydırma hedefi birden fazla Scrollable içerdiği için açık hedefle düzeltildi. İlk Android derlemesinde Java proxy ayarı ve JDK eksikliği giderildi. Eksik NDK/platform/CMake paketleri doğrulanmış SDK araçlarıyla kuruldu; doğrulama kapatılmadı.

## Sınırlar
Fiziksel Android cihazda kurulum/başlatma, iPhone Safari gerçek cihaz kontrolü, iOS native build, TestFlight ve mağaza yayını çalıştırılmadı. Chromium testi Safari testi olarak değerlendirilmez. Canlı ticari backend yayımlanmadı; demo verisiyle ödeme veya sipariş alınmaz. GitHub Pages etkinleşmesi/erişilebilirliği ayrıca doğrulanmalıdır. CI mobil workflow'u elle başlatılacak şekilde kaydedildi; GitHub'da çalıştırıldığı iddia edilmez.

## İndirilecek Android dosyası
- Dosya: CERAMICA-demo.apk
- SHA-256: `c751626abe044cbdd0c265a9c3d8dd2640e6a21b9c641fd61058ea2b13150057`
- `scripts/build-phone-demo.sh` baştan sona ikinci çalıştırmada da başarılı; 7 test, 6.9 saniyelik tekrarlı APK derlemesi ve APK Signature Scheme v2 kontrolü geçti.
