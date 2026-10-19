# CERAMICA katalog doğrulaması — 2026-10-19

Aktif kapsam PRODUCT_SCOPE.md ve SHOWROOM.md içinde tanımlıdır.

- Flutter analyze: hata yok. Flutter test: 7 test geçti.
- Android release APK: başarıyla derlendi, v2 imzası doğrulandı. Test imzalama anahtarı kullanılmıştır; Play Store yayını değildir.
- Sürüm 0.2.0+2; Android 7 / API24 ve üstü; ARM32 ve ARM64.
- APK içinde 66 gerçek koleksiyon ve 135 kaynak fotoğrafı doğrulandı. INTERNET izni yoktur; dış bağlantılar tarayıcıya aktarılır.
- SHA256: `6b58c8254e6dae28cebc8935e8cdc8bcf7c777420db0b18c47494552c204adbf`.
- Flutter web release derlendi. Mobil Chromium üzerinde katalog araması, favori ekleme ve sayfa düzeni kontrol edildi.
- Android fiziksel cihaz kurulumu ve iPhone/Safari cihaz testi yapılmadı. iOS kaynakları paketlendi; macOS/Xcode derlemesi ve Apple imzası yapılmadı. IPA teslim edilmedi.
- Ürün/fotoğraf kaynak kayıtları docs/sources/catalog-provenance.json içindedir. Fiyat, sipariş, hesap ve sunucu ayarı yoktur.
