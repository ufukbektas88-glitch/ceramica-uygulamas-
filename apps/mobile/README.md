# CERAMICA Katalog

Flutter 3.44.0; sürüm 0.2.0+2. Katalog ve 135 gerçek görsel uygulama paketindedir. Sipariş, sepet, fiyat, ödeme, üyelik, API veya sunucu ayarı yoktur.

```sh
flutter pub get --enforce-lockfile
flutter analyze
flutter test
flutter build apk --release --target-platform android-arm64,android-arm --no-pub
```

Favoriler yalnız SharedPreferences ile cihazda saklanır. Katalog JSON ve yerel görsellerden yüklenir. Harici bağlantılar url_launcher ile sistem tarayıcısına/dialer/mail uygulamasına gider. Release Android ana manifestinde INTERNET izni yoktur. Native iPhone Apple imzalama gerektirir; kaynak proje Linux'ta IPA üretildiği anlamına gelmez.

Kapsam ve dağıtım: ../../PRODUCT_SCOPE.md ve ../../SHOWROOM.md.
