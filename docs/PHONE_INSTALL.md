# Telefonlara yükleme — sunucusuz demo

Bu sürüm örnek katalog ve metraj hesabıdır. Gerçek sipariş, ödeme veya kullanıcı kaydı oluşturmaz. Ürün, fiyat ve stok bilgileri gerçek değildir.

## Android
1. `CERAMICA-demo.apk` dosyasını Android telefona indirin.
2. Dosyayı açın. Telefon isterse yalnız kullandığınız tarayıcı/dosya uygulaması için “Bu kaynaktan yüklemeye izin ver”i açın.
3. Yükle → Aç. İlk açılış için sunucu veya giriş gerekmez.
4. Bir ürünü açın; 47 m² ve %10 fire için 36 koli / 51,84 m² örneğini deneyin.

APK bir **deneme anahtarıyla imzalanmıştır**. Google Play yayınına uygun üretim anahtarı değildir. AAB/mağaza yayını ve gerçek cihaz testleri ayrı aşamadır. Debug imzalı APK, geliştirici seçeneklerini veya USB hata ayıklamayı açmayı gerektirmez.

## iPhone — Apple hesabı gerektirmeyen web demosu
Bu APK iPhone'da çalışmaz. `apps/phone-demo` bağımsız statik web uygulamasıdır; Apple geliştirici hesabı istemez.

GitHub'da `gh-pages` dalı hazırlanmışsa:
1. Depo → Settings → Pages.
2. Build and deployment altında “Deploy from a branch” seçin.
3. Dal: `gh-pages`, klasör: `/ (root)` → Save.
4. GitHub'ın oluşturduğu site adresini iPhone'da **Safari** ile açın.
5. Paylaş → Ana Ekrana Ekle → Ekle.

Site GitHub tarafından yayımlanmadan adresin çalıştığı varsayılamaz. GitHub Pages'ın kullanılabilirliği deponun görünürlüğüne ve GitHub planınıza bağlıdır. **Özel depoyu otomatik olarak herkese açık yapmayın.** Pages kullanılamıyorsa, yalnız demo ZIP'ini statik barındırma hizmetine (örneğin Netlify Drop) yükleyebilirsiniz; backend, .env, veritabanı ve tüm kaynak deposunu yüklemeyin. Hizmetin hesap ve kullanım koşullarını kendi hesabınızdan kontrol edin.

Web demosunun ilk açılışı HTTPS ve internet gerektirir; service worker hazırlandıktan sonra çevrimdışı katalog/hesaplama kullanılabilir. Tarayıcı önbelleğini silmek bu verileri kaldırır. Bu, App Store/TestFlight veya native iOS dağıtımı değildir.

## Sunucu daha sonra nasıl eklenir?
Fiziksel sunucu veya ayrı alan adı satın almak zorunda değilsiniz. Bir bulut sağlayıcıda backend + PostgreSQL + web paneli barındırılabilir; sağlayıcının HTTPS adresi kullanılabilir. Hesap açılması, sağlayıcı seçimi ve ücretli kaynak onayı iş sahibine aittir. Bu oturumda barındırma hesabı, ücretli kaynak veya canlı ticari yayın oluşturulmadı.
Android uygulamasında ayarlar → API adresi (`https://.../api/v1`) → doğrula ve bağlan. Sunucu yalnız yazılmasıyla kurulmaz; health endpoint'i gerçekten çalışmalıdır. Statik iPhone demosu merkezi satış sistemine bağlanmaz; gerçek web paneli ayrıca yayımlanır.
Native iPhone için macOS/Xcode, Apple imzalama hesabı ve TestFlight/App Store süreci ayrıca gerekir.

## Geliştirici için doğrulama
```sh
python3 scripts/install-mobile-sdk.py
python3 scripts/install-mobile-jdk.py
python3 scripts/configure-mobile-build.py
source scripts/mobile-env.sh
cd apps/mobile
flutter pub get
flutter analyze
flutter test
flutter build apk --release --target-platform android-arm64,android-arm --no-pub
```

Tüm adımları ve imza kontrolünü birlikte çalıştırmak için depo kökünde `bash scripts/build-phone-demo.sh` kullanılır. Dart analiz önbelleği `~/.dartServer` yazılabilir olmalıdır; bulut sandbox bu dizini engelliyorsa yalnız bu dizin için yazma izni gerekir. HOME değişkenini başka yere yönlendirmeyin.
SDK: Cirrus Labs'ın Flutter 3.44.0 OCI paketinden yalnız Flutter/Android dizinleri çıkarılır. AMD64 manifest digest sabittir; her indirilen katmanın SHA-256 özeti doğrulanır. Yerel cache `/workspace/toolchains` altında, proje kaynaklarının dışındadır. Gradle resmi dağıtımının SHA-256 özeti wrapper dosyasında sabittir. TLS/karma doğrulaması kapatılmaz. Java için ortamın mevcut proxy'sini gradle.properties üzerinden tanımlamak gerekebilir; proxy kimlik bilgilerini dosyaya kopyalamayın.
