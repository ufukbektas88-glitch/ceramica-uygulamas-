# CERAMICA mimarisi ve geliştirme sözleşmesi

## Kurtarma araştırması — 19 Ekim 2026
Bu oturumdaki /workspace altındaki dosyalar, yerel Git referansları, reflog ve erişilebilir GitHub origin incelendi. Uzak depo `git ls-remote origin` ile başarıyla sorgulandı ve boş sonuç verdi. Yerel HEAD doğmamış `work` dalıydı. `git fsck --full --no-reflogs` kurtarılabilecek nesne bulmadı. Önceki sohbetlerin dosya sistemlerine veya kullanıcının bilgisayarına erişim yoktur; önceki çalışmanın küresel olarak silindiği sonucuna varılamaz.

## Sistem
- Next.js / TypeScript: responsive yönetim ve satış web istemcisi; API çağrıları aynı origin üzerinden NestJS'e yönlendirilir.
- NestJS / REST v1: doğrulama, oturum, rol kontrolü, katalog, sunucu tarafı fiyat/metraj, sipariş ve onaylı dosya aktarımı.
- PostgreSQL / Prisma: kalıcı veri, satır kilitleri, foreign key, benzersizlik, transaction ve audit log.
- Prisma JS driver + pg adapter: native Rust motoru gerektirmeden sorgulama. İstemci eşlenmiş 6.19.0 generator/internals ile üretilir. Hiçbir checksum/TLS kontrolü kapatılmaz.
- SQL migration runner: sıralı dosyalar, SHA-256 kontrolü, migration değişikliklerini reddetme, advisory lock ve transaction. `_CeramicaMigration` kullanır. **Bu projede `prisma migrate deploy` ile karıştırmayın.** Geçiş yapılacaksa baseline ayrı bir migration çalışmasıdır.
- Flutter: katalog, sunucuda metraj, güvenli token depolama, giriş ve sipariş listeleme kaynakları. Native proje üretimi ve derleme henüz doğrulanmadı.
- Redis: geliştirme servisi mevcut; BullMQ işçisi henüz yok. S3, ödeme, FCM/APNs, ERP ve AI entegrasyonu henüz yok.

## Ekran akışları
Misafir → katalog / marka araması → ürün → metraj hesaplama → web sepeti → giriş → teslimat adresi → sipariş → takip.
Yönetici → oturum → operasyon özeti → sipariş → izinli durum geçişi → sevkiyat / teslimat.
Yönetici → yetkili CSV/XLSX → validasyon → önizleme kaydı → açık onay → katalog güncellemesi + değişiklik denetimi.
Depo → yetkili stok listesi → hazırlama / sevk / teslimat.

## Veri sınırları ve güvenlik
Finansal tutarlar Decimal ile hesaplanır ve PostgreSQL DECIMAL sütunlarında tutulur. Sipariş satırları o andaki ad, SKU, fiyat, koli, alan ve verginin kopyasını içerir. Fiyat istemciden kabul edilmez. Satış fiyatları KDV hariçtir; KDV ve toplam ayrıca belirtilir.
Sipariş isteği kullanıcı + idempotency UUID ile işlem kilidi alır; tekrar eden istek mevcut kaydı döndürür. Stok satırları kilitlenir. Tek satır için yeterli aynı parti seçilir; farklı tonlar sessizce karıştırılmaz. Çok partili bölme henüz desteklenmez. İptalde rezervasyon bırakılır; sevkte fiziki stok ve rezervasyon birlikte düşer.

Roller: ADMIN, SALES, WAREHOUSE, FINANCE, CUSTOMER. CUSTOMER yalnız kendi siparişini görür. Maliyet ve müşteri risk verileri henüz modellenmediği için API'ye eklenmemiştir. Kullanıcı rolü sunucudan okunur. Oturum token'ının SHA-256 özeti saklanır, token 8 saatte sona erer. Web cookie HttpOnly, SameSite Strict, production'da Secure; mobil bearer token güvenli depolamada. Parolalar bcrypt. MFA ve ayrıntılı izin matrisi sonraki aşamadır.

## Durum makinesi
RECEIVED → CONFIRMED → PREPARING → SHIPPED → DELIVERED.
SHIPPED öncesi CANCELLED mümkün; iptalden veya teslimattan geri dönüş yoktur. Her geçiş audit ve status history üretir. Bu çekirdek akış master prompttaki 12 aşamalı tedarik/ödeme akışının tamamı değildir. Ödeme alınmaz ve ödeme onayı iddia edilmez.

## Üretici araştırması
19 Ekim 2026 tarihinde https://www.graniser.com.tr/, https://www.duratiles.com.tr/ ve https://ceramicabanyo.com/ GET denemeleri proxy 403 ile engellendi. Site içerikleri doğrulanmadı; ürün adları, fiyat, stok, katalog ve görsel lisansları hakkında gerçek veri çıkarımı yapılmadı. Taslağa ilgili domainler eklendi. Kullanıcının ortam ayarlarında kaydetmesi ve yayımlaması ayrı işlemdir. Yetkili bayi dosyası aktarımı gerçek alternatif olarak uygulanmıştır. SKU benzersizliği, zorunlu fiyat/alan/vergi kontrolü ve onay öncesi staging vardır. Otomatik web kazıma, senkronizasyon takvimi ve silinen ürün tespiti yoktur.
