# CERAMICA katalog doğrulaması — 2026-10-19

Aktif kapsam PRODUCT_SCOPE.md ve SHOWROOM.md içinde tanımlıdır.

- Flutter analyze: hata yok. Flutter test: 10 test geçti.
- Android release APK: başarıyla derlendi, v2 imzası doğrulandı. Test imzalama anahtarı kullanılmıştır; Play Store yayını değildir.
- Sürüm 0.2.1+3; Android 7 / API24 ve üstü; ARM32 ve ARM64.
- APK içinde 66 gerçek koleksiyon ve 135 kaynak fotoğrafı doğrulandı. INTERNET izni yoktur; dış bağlantılar tarayıcıya aktarılır.
- Önceki 0.2.0 APK SHA256: `6b58c8254e6dae28cebc8935e8cdc8bcf7c777420db0b18c47494552c204adbf`.
- Flutter web release derlendi. Mobil Chromium üzerinde katalog araması, favori ekleme ve sayfa düzeni kontrol edildi.
- Android fiziksel cihaz kurulumu ve iPhone/Safari cihaz testi yapılmadı. iOS kaynakları paketlendi; macOS/Xcode derlemesi ve Apple imzası yapılmadı. IPA teslim edilmedi.
- Ürün/fotoğraf kaynak kayıtları docs/sources/catalog-provenance.json içindedir. Fiyat, sipariş, hesap ve sunucu ayarı yoktur.

## Android açılış düzeltmesi — 0.2.1

Kullanıcı 0.2.0 sürümünde “Katalog açılamadı / okunamadı” bildirdi. Cihaz logu olmadan cihazdaki asıl exception kesinleştirilmedi. Kod incelemesinde katalog JSON okuma ile favori deposu başlatmanın aynı hata ekranına düştüğü saptandı. Katalog dosyasının APK içinde varlığı doğrulandı.

- Favori deposunun başlatma/okuma hatası artık paketli kataloğu engellemez; gerçek JSON/asset hataları gizlenmez.
- Bozuk türde eski favori değeri açılışı engellemez; sonraki başarılı kayıtta düzelir.
- Depo geçici olarak kullanılamazsa favori işleminde yeniden denenir. Başarısız kayıt kullanıcıya bildirilir ve katalog açık kalır.
- Android shared_preferences_android 2.4.28 sürümüne sabitlendi. Bu sürüm platform kanalı kullanır; 2.5.0 içindeki yeni JNI köprüsü ve JNI bağımlılığı kaldırıldı.
- Yeni regresyon testleri: platform hatasında 66 koleksiyonun yüklenmesi, geçici hata sonrası favori kaydı ve yeniden açılış, bozuk eski favori türünden kurtulma, depolama hatasında katalog ekranının açık kalması.
- Fiziksel kullanıcının telefonunda doğrulama yapılmadı. Paket ve otomatik testler cihaz doğrulamasının yerine geçmez.

- Yeni 0.2.1 APK SHA256: `057dfd3e2a753431a801bf61b684beadd3f742064c172df7fe741de225730fd2`. APK v2 imzası, versionCode 3, 66 koleksiyon ve paketli görseller doğrulandı. JNI native kitaplığı yeni APK içinde yok.
