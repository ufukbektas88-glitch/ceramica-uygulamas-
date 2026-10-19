# Güvenlik durumu

## Uygulanan kontroller
- Parola bcrypt hash, oturum token özeti ve zaman aşımı.
- Sunucu tarafı rol ve müşteri sahipliği kontrolleri; maliyet/cari veri mevcut public DTO'ya eklenmedi.
- DTO whitelist ve bilinmeyen alan reddi; finansal fiyat istemciden alınmaz.
- Cookie HttpOnly/SameSite Strict ve production Secure; native bearer desteği.
- Genel hız sınırı ve girişte dakikada 10 istek.
- PostgreSQL stok constraint, transaction, satır/advisory kilidi; idempotency anahtarı.
- Kaynak bilgili aktarım, önizleme/onay, formül reddi ve veri değişiklik denetimi.
- Seed verileri demo işaretli; gizli bilgiler .gitignore kapsamında.

## Yayın öncesi zorunlu çalışma
MFA, kullanıcı davet/kayıt ve parola sıfırlama, oturumların yönetimi/iptali, kurumsal tenant sınırları, 9 rol izin matrisi, ayrıntılı DTO/sözleşme gözden geçirmesi, CSRF ve XSS incelemesi, CSP düzenlemesi, HTTPS reverse proxy, merkezi log maskeleme/retention, performans ve sızma testi tamamlanmalı. OpenAPI erişimi prod ortamda ayrıca sınırlandırılmalı. Demo seed prod ortamda çalıştırılmamalı.
Dosya içe aktarma yalnız ADMIN'e açıktır. Dosya boyutu ve satır sınırı vardır; XLSX arşiv şişmesi için ayrı sandbox/işçi ve açılmış veri boyutu sınırı eklenmeden kamuya dosya yükleme açılmamalıdır.
Kart ödemesi yoktur; webhook imzası veya PCI uyumluluğu uygulanmış gibi değerlendirilmemelidir. Mevcut sipariş onayı ödeme onayı değildir.

## Bağımlılıklar
Kilitleme dosyasıyla sürümler korunur; `npm audit` sonucu TEST_REPORT.md içinde kayıtlıdır. Her tarama bilinen açıkların anlık bilgisidir; pentest yerine geçmez. Transitive overrides (PostCSS, js-yaml, deepmerge-ts, effect ve uuid) güvenlik düzeltmeleri için sabitlenmiştir ve build/test ile kontrol edilir. ExcelJS eski transitif paketler için deprecation uyarıları verebilir; deprecation güvenlik taraması sonucu ile karıştırılmaz.
