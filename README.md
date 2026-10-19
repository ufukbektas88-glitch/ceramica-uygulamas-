# CERAMICA

Seramik ticareti için yeniden oluşturulan geliştirme projesi. Orijinal gereksinim: [MASTER_PROMPT](docs/MASTER_PROMPT.md). **Üretime hazır değildir.** Gerçek ürün, ödeme veya muhasebe entegrasyonu açık değildir. Tamamlanan ve eksik işleri [STATUS](docs/STATUS.md) dosyasında görün.

## Web ve API kurulumu
Node.js 24, npm 11 ve çalışan Docker Compose gerekir.

```sh
bash scripts/setup.sh
npm run dev:api
# İkinci terminalde, depo kökünde:
npm run dev:web
```

Kurulum `.env` yoksa rastgele yerel DB ve demo yönetici parolası oluşturur; mevcut dosyaya dokunmaz. API 4000, web 3000 portunda çalışır. Yönetici e-postası `admin@ceramica.local`. Parola `.env` içindeki yerel `DEMO_ADMIN_PASSWORD` alanındadır; gizli değeri Git'e veya mesajlara koymayın. Yeni parola belirlemek için Bash terminalinde:

```sh
read -rs -p 'Yeni yönetici parolası (en az 12 karakter): ' NEW_ADMIN_PASSWORD
export NEW_ADMIN_PASSWORD
npm run admin:password
unset NEW_ADMIN_PASSWORD
```

API sağlık kontrolü `/api/v1/health`, OpenAPI `/api/docs`. Node API derlemesi decorator metadata gerektirdiği için `npm run dev:api` önce TypeScript derler; doğrudan `tsx main.ts` kullanmayın. Web, API'ye sunucu tarafında proxy olur, API adresi `API_URL` ile değiştirilebilir.

## Kontroller
```sh
npm run typecheck
npm run build
npm test
# API çalışırken, demo seed sonrasında:
npm run test:integration
```
Entegrasyon testleri izole TEST kayıtları oluşturup siler; demo ürünlerini değiştirmez. Test veritabanında çalıştırın. CI otomatik olarak ayrı PostgreSQL servisi kullanır.

## Ürün aktarımı
Yönetici girişi → Ürün aktarımı → üretici, yetkili dosya kaynağı, CSV veya XLSX → doğrula → önizlemeyi incele → kataloğa uygula. CSV sütunları [şablonda](templates/products.csv). Şablon demo verisidir. Excel ilk çalışma sayfasında aynı sütun adlarını kullanır; formüller reddedilir. Fiyatlar KDV hariçtir. Aktarım stok yaratmaz. Web görselleri telif belirsizliği nedeniyle kullanılmadı; renk ve malzeme kompozisyonları CSS ile çizildi.

## Mobil
`apps/mobile` Flutter kaynak projesidir. Flutter SDK bu ortamda kurulu değildir. Derleme ve widget testi **çalıştırılmadı**. Uygun makinede:
```sh
cd apps/mobile
flutter create --platforms=android,ios --org com.ceramica .
flutter pub get
flutter analyze
flutter test
flutter run --dart-define=API_URL=https://YOUR_STAGING_HOST/api/v1
flutter build apk --dart-define=API_URL=https://YOUR_STAGING_HOST/api/v1
flutter build appbundle --dart-define=API_URL=https://YOUR_STAGING_HOST/api/v1
```
Üretilen platform dosyaları, cleartext debug izni, Android release imzası, iOS Keychain entitlement ve Apple signing ayrıca incelenmelidir. Yayında HTTPS zorunludur; iOS IPA/TestFlight macOS/Xcode ve Apple hesabı gerektirir.

## Yedekleme ve kayıp önleme
Kaynakları Git commit ve GitHub'a push ile saklayın. Ortam yayımlama GitHub kaydından ayrıdır. Docker veritabanı named volume kullanır; `docker compose down -v` veriyi siler.
```sh
bash scripts/backup.sh /tmp/ceramica.dump
bash scripts/restore.sh /tmp/ceramica.dump
```
Restore yeni `ceramica_restored` veritabanı açar, mevcut veriyi silmez. Yedekleri ayrıca güvenli uzak depoda tutun. Üretimde düzenli yedekleme ve restore provası gerekir; bu betikler otomatik uzak yedekleme kurmaz.
