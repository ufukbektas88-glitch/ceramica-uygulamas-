# Teslimat durumu
Bu depo 19 Ekim 2026 tarihinde boş depodan yeniden oluşturuldu. Bu sürüm çalışan ticari çekirdektir; 30 başlıklı master promptun tamamı bitmiş değildir. Üretime hazır olarak işaretlenmez.

## Uygulanan
- Next.js responsive açık/koyu tema, yönetim özeti, katalog/marka araması, sunucu tarafı metraj, sepet, adresle sipariş, sipariş takibi ve kontrollü durum değişimi, depo/parti görünümü, CSV/XLSX önizleme-onay arayüzü.
- NestJS v1 API; PostgreSQL/Prisma; oturum açma/kapama; sunucuda rol kontrolü; token özeti; giriş hız sınırı; DTO validasyonu; Helmet; OpenAPI.
- DECIMAL fiyat ve vergi, yukarı yuvarlanan tam koli, sipariş satırında fiyat kopyası; aynı anahtarlı eşzamanlı isteğe tek sipariş; stok satırı kilidi; iptal ve sevk hareketi; denetim izi.
- Graniser/Duratiles dosya adaptörleri; doğrulama, mükerrer SKU kontrolü, onay öncesi staging, atomik uygulama ve ürün önce/sonra denetimi. Görsel veya stok uydurulmaz.
- SQL migration, seed, Docker PostgreSQL/Redis, tekrar çalıştırılabilir kurulum, CI tanımı, yerel yedek/restore betikleri, kurulum ve yönetici belgeleri.

## Kısmi / doğrulanmamış
- Flutter mobil kaynakları: katalog, hesaplama, oturum ve sipariş listesi. SDK yok; analyze/widget/native build çalıştırılmadı. Android/iOS platform kabukları, mobil sipariş oluşturma ve imzalama henüz hazır değil.
- Stok: parti/ton/kalibre alanları mevcut. Çok depolu/partili bölme, stok düzeltme/transfer UI'sı, barkod ve minimum stok uyarısı yok.
- Sipariş: çekirdek 6 durum mevcut. 12 aşamalı tedarik/ödeme akışı, iade ve kısmi sevkiyat yok.
- Kimlik: 5 rol mevcut. Tam 9 rol matrisi, kullanıcı yönetim UI'sı, firma hiyerarşisi, MFA, şifre sıfırlama ve güvenlik denetimi yok.
- Ürün: çekirdek teknik alanlar mevcut. Tam koleksiyon/varyant/doküman/favori/karşılaştırma ve typo toleranslı arama yok.

## Henüz geliştirilmedi
- B2B şirket ve müşteri grubu fiyatları, kredi limiti, vadeli ödeme ve cari hesap.
- Teklif/PDF, tekliften sipariş, proje ve oda ölçüm sihirbazı.
- Maliyet, marj, iskonto/onay motoru, kampanya ve ayrıntılı finans raporları.
- Gerçek ödeme kuruluşu, imzalı webhook, iade ve mutabakat.
- Sevkiyat belge/araç/irsaliye, CRM, satın alma ve tedarik.
- S3, BullMQ işçisi, zamanlanmış üretici senkronizasyonu, ERP ve e-fatura.
- Push/e-posta/SMS, offline taslak, AI öneri ve oda görselleştirme.
- APK/AAB/IPA, staging/production dağıtımı, yük/pentest, otomatik uzak yedekleme.

## Kaynakların kalıcılığı
Master prompt `docs/MASTER_PROMPT.md` olarak saklanır. Kaynak kodu Git'e kaydedilir; kaynak arşivi ayrıca teslim edilir. Gerçek uzak Git kaydı ve test sonuçları final raporda yalnızca başarılıysa bildirilir. Yayınlanan ortam, canlı sunucu ve GitHub commit birbirinden farklıdır.
