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

## Telefonlara kurulum
Android/iPhone kurulum adımları: [PHONE_INSTALL.md](docs/PHONE_INSTALL.md).

`apps/mobile` artık Flutter 3.44.0 Android/iOS platformlarını ve sunucusuz demo modunu içerir. Gerçek sunucu yokken örnek katalog ve metraj çalışır; ticari işlemler etkin değildir. `apps/phone-demo` ise statik HTTPS barındırmada iPhone/Android ana ekranına eklenebilen ve ilk yüklemeden sonra çevrimdışı çalışan web demosudur. Apple hesabı bu web demosu için gerekmez.

GitHub Actions'ta **Build phone demo** elle başlatılarak APK ve statik web paketi üretilebilir. Apple native build ve TestFlight için macOS/Xcode ile Apple imzalama hesabı gerekir. Android deneme imzası Google Play üretim anahtarı değildir.

## Yedekleme ve kayıp önleme
Kaynakları Git commit ve GitHub'a push ile saklayın. Ortam yayımlama GitHub kaydından ayrıdır. Docker veritabanı named volume kullanır; `docker compose down -v` veriyi siler.
```sh
bash scripts/backup.sh /tmp/ceramica.dump
bash scripts/restore.sh /tmp/ceramica.dump
```
Restore yeni `ceramica_restored` veritabanı açar, mevcut veriyi silmez. Yedekleri ayrıca güvenli uzak depoda tutun. Üretimde düzenli yedekleme ve restore provası gerekir; bu betikler otomatik uzak yedekleme kurmaz.
