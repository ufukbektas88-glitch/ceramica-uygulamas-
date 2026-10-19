# CERAMICA telefon uygulaması

## Android'e kurulum
CERAMICA-katalog.apk dosyasını telefona indirin ve açın. Gerekirse indirdiğiniz tarayıcı/dosya uygulaması için “Bu kaynaktan yüklemeye izin ver” seçin. Yükle → Aç. Giriş, sunucu adresi veya veritabanı kurulumu gerekmez.
Önceki CERAMICA demo APK ile aynı paket kimliği ve yerel imza korunur; yeni sürüm 0.2.0 (versionCode 2) olarak yükseltilebilir. Dağıtım imzası yerel deneme anahtarıdır; Google Play üretim imzası değildir. Fiziksel cihazda kurulum ayrıca kullanıcı tarafından doğrulanmalıdır.

## iPhone — sunucusuz native uygulama
Aynı Flutter kodunun ios platformu hazırdır. Native uygulamanın internet/sunucu ihtiyacı yoktur; fakat iPhone'a yüklenebilmesi için Apple imzalaması gerekir.
Mac/Xcode ile kendi cihazınıza kurulumda kişisel Apple kimliği kullanılabilir; ücretli Apple Developer üyeliği ile TestFlight/App Store süreci ayrıdır. Kişisel imzalamanın süre ve cihaz sınırları Apple tarafından uygulanır; imzanın yenilenmesi gerekebilir.

Mac üzerinde:
1. Flutter 3.44.0 ve Xcode kurulu olsun; Xcode'u açıp ilk kurulum bileşenlerini tamamlayın.
2. Depoyu indirin, apps/mobile içinde `flutter pub get --enforce-lockfile` çalıştırın.
3. `open ios/Runner.xcworkspace` ile Xcode'u açın.
4. Runner → Signing & Capabilities → kendi Apple kimliğinizin Personal Team'ini seçin. Gerekirse benzersiz Bundle Identifier kullanın.
5. iPhone'u bağlayın, Apple'ın istediği geliştirici/güven ayarlarını tamamlayın; hedef cihazı seçip Run yapın.

Mac ve Apple imzalaması olmadan bu Linux ortamından yüklenebilir native IPA verilemez. APK iPhone'a yüklenmez. Apple hesabı parolasını sohbete göndermeyin.

## İsteğe bağlı iPhone web sürümü
Flutter web çıktısı yalnız dosya barındırma ile açılabilir; API/veritabanı gerektirmez. İlk indirme ve Safari ana ekranına ekleme için HTTPS dağıtım adresi gerekir. Bu seçenek native iOS/IPA ile aynı dağıtım türü değildir. Kullanıcı sunucu istemediği için native Android ve iOS kaynakları esas teslimattır; web barındırma zorunlu değildir.

## Geliştirme
Bulut ortamında:
```sh
python3 scripts/install-mobile-sdk.py
python3 scripts/install-mobile-jdk.py
python3 scripts/configure-mobile-build.py
source scripts/mobile-env.sh
cd apps/mobile
flutter pub get --enforce-lockfile
flutter analyze
flutter test
flutter build apk --release --target-platform android-arm64,android-arm --no-pub
flutter build web --release --no-web-resources-cdn --no-pub
```
Dart analiz önbelleği ~/.dartServer yazılabilir olmalıdır. HOME değiştirilmez. Proxy ve sistem CA güveni korunur. APK ve kaynak güncellemeleri Git'e kaydedilir; yerel imza anahtarı veya .env depoya eklenmez.

## Kaynaklar
- Graniser ürün sayfaları ve katalogları: https://www.graniser.com.tr/
- Duratiles resmî referansı: https://www.duratiles.com.tr/
- Duratiles ve banyo ürün detayları, CERAMICA fotoğrafları ve iletişim bilgileri: https://ceramicabanyo.com/
Katalogda 24 Graniser, 24 Duratiles ve 18 CERAMICA banyo seçkisi bulunur. Görsellerin asıl URL'leri, orijinal SHA-256 özetleri ve kaynak tarihleri docs/sources/catalog-provenance.json içinde saklanır. Kamuya açık kaynak erişimi tek başına lisans izni beyanı değildir; üretici/işletme dağıtım hakları sahibindedir.
