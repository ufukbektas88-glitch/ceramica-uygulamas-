# REST API v1
Çalışan sunucuda OpenAPI: `/api/docs`; JSON: `/api/docs-json`. Sayısal hassasiyet için parasal alanlar JSON'da string döner.

| Yöntem | Yol /api/v1 altında | Erişim / davranış |
|---|---|---|
| GET | /health | DB sorgusu başarılıysa ok |
| POST | /auth/login | email/password → token ve HttpOnly oturum cookie |
| GET | /auth/me | Giriş yapmış kullanıcı; hash/token döndürmez |
| POST | /auth/logout | Oturumu siler |
| GET | /products?q=&brand=&page=1 | Açık katalog; 24 kayıt/sayfa, aktif ürün |
| POST | /calculator | productId, area, waste; DB fiyatı/vergi/metraj |
| GET | /orders | CUSTOMER kendi kayıtları; personel operasyon listesi, en çok 100 |
| POST | /orders | Oturum; items[{productId,boxes}], deliveryAddress, idempotencyKey UUID |
| PATCH | /orders/:id/status | ADMIN/SALES/WAREHOUSE; depo yalnız hazırlama/sevk/teslim |
| GET | /inventory | ADMIN/SALES/WAREHOUSE; depo/parti/ton/kalibre |
| GET | /dashboard | ADMIN/SALES/FINANCE; iptaller hariç sipariş tutarları |
| POST | /imports/preview | ADMIN; brand, format(csv/xlsx), content, source |
| GET | /imports | ADMIN; son 50 aktarım |
| POST | /imports/:id/approve | ADMIN; atomik, tekrar onayda aynı job |

401: oturum yok/geçersiz. 403: rol yetersiz. 400: validasyon. 404: bulunamadı. 409: stok/durum/SKU çakışması. 429: hız sınırı. Başarı görünümü yalnız sunucu yanıtından sonra oluşturulur.

Hesaplama örneği: `{ "productId":"ürün-uuid", "area":47, "waste":10 }`. 1.44 m² koli, 500 TL/m² ve %20 KDV için 36 koli, 51.84 m², 25920 TL net, 5184 TL KDV, 31104 TL toplam.

CSV aktarımı UTF-8 virgül ayırıcı kullanır; XLSX content base64'dür. Yalnız veri önizlemesi staging tablosuna kaydolur; ürünleri değiştirmek için ayrı açık onay gerekir. Dosya kaynağı güvenilir bayi referansı olmalıdır. Otomatik internet kazıması yapılmaz.
