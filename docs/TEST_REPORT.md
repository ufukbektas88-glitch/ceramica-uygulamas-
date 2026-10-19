# Çekirdek doğrulaması — 19 Ekim 2026

Telefon sürümü daha sonra doğrulandı; güncel mobil sonuçlar [PHONE_TEST_REPORT.md](PHONE_TEST_REPORT.md) dosyasında.

## Başarılı
- `npm run typecheck`: API ve web TypeScript kontrolü.
- `npm run build`: NestJS TypeScript ve Next.js 15.5.28 üretim derlemesi. Next sayfa üretimi 4/4.
- `npm test`: 7/7 birim testi. Metraj örneği, tam koli sınırı, kuruş yuvarlama, geçersiz değerler, iki üretici adaptörü, mükerrer/eksik veri ve gerçek XLSX çalışma kitabı okuması.
- `npm run test:integration`: PostgreSQL üzerinde 10 alt senaryo + ana test, runner sonucu 11/11. Gerçek HTTP ve veri kalıcılığı kullanıldı. Yetki, yanlış parola, DTO reddi, fiyat/metraj, aynı anahtarla paralel istek, stok aşımı, müşteri izolasyonu, geçersiz durum, rezervasyon bırakma, eşzamanlı stok ve sevk/teslim, onaylı içe aktarma, oturum iptali. Test kayıtları temizlendi.
- Web HTTP kontrolü: ana sayfa 200 ve CERAMICA içeriği; Next proxy üzerinden 6 ürün 200; giriş 201 ve HttpOnly cookie; yetkili dashboard 200. Kontrol oturumu kapatıldı.
- `npm audit`: toplam 0 bilinen açık (info/low/moderate/high/critical tümü 0), son lockfile üzerinde.
- Migration runner tekrar çalıştırıldı; uygulanmış migration yeniden çalıştırılmadı. Seed tekrarlandı; aynı ürünlerden mükerrer oluşmadı.
- `backup.sh` ile pg_dump, `restore.sh` ile yeni `ceramica_restored` veritabanına geri yükleme: 6 ürün. Deneme veritabanı kontrol sonrası silindi; asıl DB korundu.
- Docker PostgreSQL healthcheck ve Redis başlatma başarılı.

- `bash scripts/setup.sh`: temiz npm ci, JS client üretimi, servis sağlığı, migration, seed, tam build ve test baştan sona exit 0 ile geçti.
- Sunucular yeniden başlatıldı; entegrasyon testleri tekrar 11/11, OpenAPI LoginDto/OrderDto alanları ve web proxy yanıtı doğrulandı.

## Bulunan ve düzeltilen
İlk eşzamanlı aynı sipariş testi ikinci istekte stok çakışması yakaladı. Kullanıcı+idempotency anahtarı için PostgreSQL işlem kilidi eklendi; aynı test ve farklı siparişlerin stok yarış testi tekrar geçiyor.
Prisma native motor indirmesi ağ tarafından reddedildi. Checksum doğrulaması kapatılmadı. JS driver adapter + sürüm eşlenmiş generator kullanılarak motor indirme ihtiyacı kaldırıldı. SQL migration runner uygulanıp PostgreSQL üzerinde test edildi.
İlk bağımlılık taraması açıklar bildirdi; doğrudan bağımlılıklar ve transitif düzeltmeler güncellendi. Temiz kurulum, build ve test sonrasında tarama sıfır sonuç verdi.

Kurulum tekrarında açık Next dev sunucusunun `.next` derleme çıktılarıyla çakıştığı görüldü. Dev çıktısı `.next-dev` olarak ayrıldı; üretim çıktısı `.next` içinde kalır.

## Çalıştırılmayan / sınırlar
- Bu ilk çekirdek kontrolü sırasında Flutter kontrolleri çalıştırılmamıştı. Sonraki Android/demo sonuçları PHONE_TEST_REPORT.md içindedir. iOS native, AAB ve mağaza yayını hâlâ doğrulanmadı.
- Tarayıcı otomasyonuyla tıklama/erişilebilirlik ve görsel regresyon testi çalıştırılmadı; web HTTP/proxy ve derleme doğrulaması yapıldı.
- Gerçek üretici, ödeme, ERP, SMS/push, yük ve sızma testleri yok.
- CI dosyası eklendi; GitHub üzerinde çalıştığı bu raporda iddia edilmez.
- Yeni bir bulut görevinin snapshot'tan geri yüklenmesi ve ortam publication bu oturumda yapılmadı.
