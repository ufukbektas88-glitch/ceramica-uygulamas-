# Dış bağımlılıklar ve yayın öncesi gereksinimler
- Üretici siteleri için ağ ayarları taslağındaki domainleri ortam ayarlarından kaydedip ortamı yayımlayın. Taslak tek başına ağ politikasını uygulamaz.
- Graniser / Duratiles yetkili API veya bayi dosyaları ve görsel/doküman kullanım izinleri. Fiyat/stok tahmin edilmez.
- Üretim PostgreSQL, Redis erişimi, HTTPS alan adı, secret yönetimi, yedek hedefi, izleme ve staging.
- Ödeme kuruluşu seçimi, merchant hesabı, resmi sandbox ve webhook imza sırrı. Şu an kartla ödeme yok; kart verisi alınmaz.
- S3 bucket, sınırlı yetkili erişim ve yaşam döngüsü kuralları.
- Firebase projesi, FCM/APNs ve Apple geliştirici hesabı; Android imzalama anahtarı.
- Flutter SDK / Android SDK; iOS için macOS ve Xcode.
- ERP / e-fatura yetkili entegratör bilgileri.
- KVKK, ileti izinleri, satış/iade sözleşmeleri ve mevzuat incelemesi.
- Üretime geçmeden önce STATUS.md içindeki eksik modüller, yük/güvenlik testleri ve mobil derlemeler tamamlanmalı.
Gizli anahtarları sohbet mesajına göndermeyin; ortamın güvenli ayarları üzerinden tanımlayın.
