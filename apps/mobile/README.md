# CERAMICA telefon istemcisi
Flutter 3.44.0 / Dart 3.12.0. Varsayılan açılış sunucusuz demodur; örnek katalog ve kesin tam koli/KDV hesabı çalışır. Giriş, sipariş ve ödeme taklidi yapılmaz.

Android, iOS ve web platform klasörleri oluşturulmuştur. iOS native derlemesi bu Linux ortamında yapılmaz. İmzalı Android deneme APK'sı üretimi, test durumu ve telefon kurulumu için [telefon kılavuzunu](../../docs/PHONE_INSTALL.md) okuyun. iPhone için sunucu gerektirmeyen statik demo `../phone-demo` altındadır; native iOS uygulamasıyla aynı dağıtım türü değildir.

```sh
flutter pub get --enforce-lockfile
flutter analyze
flutter test
flutter build apk --release --target-platform android-arm64,android-arm --no-pub
```

API_URL derleme parametresi verilmezse demo başlar. Uygulama ayarlarından HTTPS sunucu adresi sonradan eklenebilir; sunucu health isteği doğrulanmadan kaydedilmez. Oturum token'ı platformun güvenli depolamasında tutulur. Android INTERNET izni mevcuttur; release içinde HTTP adresi kabul edilmez. iOS Keychain entitlement eklendi, Apple imzalama henüz yapılmadı.

Demo aritmetiği ölçeklenmiş tamsayılar kullanır; fiyat veya stok gerçek veri olarak sunulmaz. Gerçek ticari işlemlerin doğrulaması her zaman backend'de yapılır.
