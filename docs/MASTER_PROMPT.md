# MASTER PROMPT — CERAMICA
## Enterprise-Grade Seramik Satış, E-Ticaret, Sipariş ve Bayi Yönetim Platformu

### 1. PROJE TANIMI VE HEDEF

Sen kıdemli bir yazılım mimarı, Flutter mobil uygulama uzmanı, backend mühendisi, UI/UX tasarımcısı, e-ticaret sistemleri mimarı, ERP entegrasyon uzmanı, kalite güvence mühendisi ve siber güvenlik uzmanından oluşan profesyonel bir geliştirme ekibi gibi hareket edeceksin.

**Proje adı:** CERAMICA

**Sektör:** Seramik, porselen karo, granit, yapı malzemeleri ve dekorasyon ürünleri.

**İş modeli:** CERAMICA, Graniser ve Duratiles markalarının bayisi olarak nihai tüketicilere, müteahhitlere, mimarlara, inşaat firmalarına, proje geliştiricilerine ve alt bayilere satış yapan bir işletmedir.

**Üretici referansları:**
- https://www.duratiles.com.tr/ 
- https://www.graniser.com.tr/   https://ceramicabanyo.com/ 
 
**Ana hedef:** Android ve iOS üzerinde çalışan, profesyonel bir seramik e-ticaret ve sipariş uygulaması geliştirmek. Buna ek olarak tüm ticari operasyonların yönetilebildiği bir web yönetim paneli kurmak. 
 
Sadece tasarım veya prototip istemiyorum. Üretime alınabilecek mimariye, çalışan veri tabanına, API altyapısına, yönetim paneline, gerçek iş akışlarına ve testlere sahip bir yazılım geliştirmeni istiyorum. 
 
### 2. TEKNOLOJİ MİMARİSİ 
 
Tercih edilen teknolojiler: 
 
- Mobil: Flutter + Dart. 
- Android çıktı: APK ve Google Play için AAB. 
- iOS çıktı: iOS uygulaması ve uygun Apple geliştirme ortamında IPA/TestFlight dağıtımı. 
- Web yönetim paneli: Next.js + TypeScript. 
- Backend: NestJS + TypeScript. 
- Veri tabanı: PostgreSQL. 
- ORM: Prisma. 
- Cache ve kuyruk: Redis + BullMQ. 
- Dosya yönetimi: S3 uyumlu nesne depolama. 
- Kimlik doğrulama: Güvenli oturum altyapısı, rol bazlı erişim ve gerektiğinde MFA. 
- Bildirim: Firebase Cloud Messaging ve iOS APNs. 
- API: Versiyonlanmış REST API ve OpenAPI dokümantasyonu. 
- Test: Unit, integration, end-to-end ve mobil widget testleri. 
- Dağıtım: Docker, CI/CD, staging ve production ortamları. 
 
Kod modüler, ölçeklenebilir, sürdürülebilir ve güvenli olmalı. 
 
### 3. GÖRSEL TASARIM VE MARKA KİMLİĞİ 
 
CERAMICA ismi uygulamanın ana markası olacak. 
 
Tasarım dili: 
- Premium mimarlık ve modern dekorasyon estetiği. 
- Lüks, sade ve minimalist görünüm. 
- Kırık beyaz, antrasit, doğal taş tonları. 
- İyi tasarlanmış tipografi. 
- Yüksek çözünürlüklü seramik fotoğrafları. 
- Akıcı sayfa geçişleri ve mikro animasyonlar. 
- Hem açık hem koyu tema. 
- Telefon ve tablet uyumlu tasarım. 
- Türkçe ana dil, ileride İngilizce desteği. 
 
Graniser ve Duratiles ayrı üretici markaları olarak görünecek. CERAMICA'nın kurumsal kimliği her iki markanın üzerinde konumlandırılacak. 
 
Uygulamanın tasarım kalitesi premium bir alışveriş deneyimi seviyesinde olmalı. Hazır, sıradan bir e-ticaret şablonunun görünümü kopyalanmamalı. 
 
### 4. ÜRETİCİ SİTELERİ VE ÜRÜN ENTEGRASYONU 
 
Öncelikle her iki üreticinin web sitesini ayrıntılı incele. 
 
İncelenecek unsurlar: 
- Ürün koleksiyonları. 
- Seriler ve modeller. 
- Ürün kodları. 
- Teknik özellikler. 
- Ebat ve ölçüler. 
- Yüzey ve doku bilgileri. 
- Renk seçenekleri. 
- Ürün görselleri. 
- Ürün katalogları. 
- PDF dokümanları. 
- Ürün sınıflandırma sistemi. 
- Yayından kaldırılan ve yeni çıkan ürünler. 
 
Graniser ve Duratiles için birbirinden bağımsız entegrasyon adaptörleri geliştir. 
 
Öncelik sırası: 
1. Üretici tarafından sağlanan yetkili API veya veri aktarımı. 
2. Yetkili bayi ürün ve fiyat dosyaları. 
3. Excel/CSV/XML veri içe aktarma. 
4. İzin verilen, kontrollü web verisi okuma. 
 
Ürün verilerini doğrulanmadan veri tabanına kaydetme. Üreticinin stok ve fiyat bilgilerini web sitesinde görünmediği halde tahmin etme. 
 
Telif haklarına ve kullanım şartlarına uy. Ürün görselleri ve katalogları için kullanım izni ve kaynak kontrolü mekanizması kur. 
 
**Ürün senkronizasyon sistemi:** 
- Manuel senkronizasyon. 
- Zamanlanmış senkronizasyon. 
- Yeni ürün tespiti. 
- Güncellenen ürün tespiti. 
- Silinen/pasife alınan ürün tespiti. 
- Mükerrer kayıt kontrolü. 
- Veri değişiklik geçmişi. 
- Başarısız aktarımlar için tekrar deneme. 
- Senkronizasyon hata raporları. 
- Yönetici onayı gerektiren değişiklikler. 
 
### 5. ÜRÜN KATALOG MODÜLÜ 
 
Ürünleri marka, koleksiyon, seri ve varyant şeklinde hiyerarşik olarak yönet. 
 
Her ürün için: 
- Marka. 
- Koleksiyon. 
- Seri. 
- Ürün adı. 
- Benzersiz ürün kodu/SKU. 
- Barkod. 
- Ölçü. 
- Renk. 
- Yüzey tipi. 
- Doku. 
- Rektifiyeli olup olmadığı. 
- Kalınlık. 
- Kullanım alanı. 
- Kaymazlık sınıfı, mevcutsa. 
- Teknik özellikler. 
- Kutu içindeki adet. 
- Kutu başına m². 
- Palet başına koli. 
- Palet başına m². 
- Kutu ve palet ağırlığı, mevcutsa. 
- Satış birimi. 
- Stok durumu. 
- Liste fiyatı. 
- İndirimli fiyat. 
- KDV oranı. 
- Ürün açıklamaları. 
- Galeri görselleri. 
- PDF teknik dokümanları. 
- Alternatif ve tamamlayıcı ürünler. 
 
Teknik veri alanları ürün tipine göre değişebilir. Bilinmeyen bilgileri boş bırak ve yönetici panelinden tamamlanabilir yap. 
 
**Filtreleme ve arama:** 
 
Müşteriler marka, ürün kodu, koleksiyon, ebat, renk, doku, yüzey, fiyat aralığı, kullanım alanı ve stok durumuna göre arama yapabilsin. 
 
Yazım hatalarını tolere eden hızlı arama oluştur. 
 
Ürünlerin favorilere eklenmesi, karşılaştırılması ve paylaşılması mümkün olsun. 
 
### 6. PROFESYONEL SERAMİK HESAPLAMA MOTORU 
 
Bu modül çok önemli. 
 
Seramik satışlarının m², koli, adet ve palet üzerinden yönetilmesini sağla. 
 
Kullanıcı örneğin 47 m² seramik almak istediğinde: 
1. Ürünün kutu başına m² değerini belirle. 
2. İhtiyaç duyulan tam koli sayısını hesapla. 
3. Yuvarlamayı yukarıya doğru yap. 
4. Gerçek sipariş m² miktarını göster. 
5. Fire oranını hesaba kat. 
6. Toplam fiyatı otomatik hesapla. 
 
Örnek: 
 
- Talep edilen alan: 47 m². 
- Fire oranı: %10. 
- Hesaplanan ihtiyaç: 51,70 m². 
- Koli başına alan: 1,44 m². 
- Gereken koli: 36. 
- Gerçek sipariş miktarı: 51,84 m². 
 
Kullanıcı hem m² hem koli girerek hesaplama yapabilsin. 
 
Köşe, niş, kapı ve pencere boşluklarına göre alan hesabı yapılabilsin. 
 
İleri seviyede bir oda ölçüm sihirbazı oluştur. 
 
Aynı projedeki farklı odalar için ayrı metraj ve birleşik malzeme listesi hazırlanabilsin. 
 
### 7. MOBİL ANA SAYFA 
 
Ana sayfa profesyonel bir dijital showroom olacak. 
 
Bölümler: 
- CERAMICA marka alanı. 
- Güçlü ürün arama çubuğu. 
- Graniser ve Duratiles marka kartları. 
- Yeni koleksiyonlar. 
- Çok satan ürünler. 
- Kampanyalı ürünler. 
- Öne çıkan tasarımlar. 
- Mimari ilham görselleri. 
- Popüler ebatlar. 
- Kategoriler. 
- Son görüntülenen ürünler. 
- Favoriler. 
- Aktif siparişler. 
- Sipariş durumu. 
- Müşteri destek alanı. 
 
Yönetici panelinden ana sayfanın banner, sıralama ve kampanya bölümleri değiştirilebilir olmalı. 
 
### 8. SATIŞ VE SEPET MODÜLÜ 
 
Uygulama doğrudan satış yapabilmeli. 
 
Müşteri: 
- Ürün seçebilmeli. 
- Ölçü ve miktar belirleyebilmeli. 
- Koli ve m² miktarını görebilmeli. 
- Sepete ekleyebilmeli. 
- Sepeti düzenleyebilmeli. 
- Kampanya ve iskonto uygulanmış fiyatı görebilmeli. 
- Farklı markalardan tek sepet oluşturabilmeli. 
- Teslimat yöntemini seçebilmeli. 
- Ödeme yöntemini belirleyebilmeli. 
- Siparişini tamamlayabilmeli. 
 
Fiyatlar sunucu tarafında yeniden hesaplanmalı. 
 
Stok kesinliği kontrol edilmeden ödeme veya sipariş kesinleştirilmemeli. Stokta olmayan ürünler için ayrıca talep ve termin süreci oluşturulmalı. 
 
Siparişlerde ürün, birim fiyat, KDV, miktar, indirim ve toplam tutar değişmez bir işlem kaydı olarak saklanmalı. 
 
### 9. B2B VE B2C SATIŞ YAPISI 
 
İki farklı müşteri modeli oluştur. 
 
**B2C — Bireysel müşteriler** 
 
Bireysel üyelik, ürün inceleme, sepet, sipariş, ödeme, teslimat ve sipariş takibi. 
 
**B2B — Kurumsal müşteriler** 
 
Müteahhit, mimar, proje firması, yapı market ve alt bayi hesapları. 
 
B2B özellikleri: 
- Firma unvanı. 
- VKN ve vergi dairesi. 
- Yetkili kişiler. 
- Birden fazla kullanıcı. 
- Firma bazlı özel fiyat listesi. 
- Müşteri grubu. 
- Sözleşmeli iskonto. 
- Vadeli satış koşulları. 
- Onaylanmış cari limit. 
- Sipariş onay mekanizması. 
- Önceki siparişler. 
- Proje bazlı alımlar. 
- Teklif talebi. 
- Cari bakiye ve ekstre gösterimi. 
- Tahsilat geçmişi. 
- Alt hesaplara yetki verme. 
 
Kredi limitleri, vade ve bakiye bilgileri yalnızca yetkili kullanıcıların görebileceği şekilde tasarlanmalı. 
 
### 10. TEKLİF HAZIRLAMA VE PROJE SATIŞI 
 
Profesyonel teklif sistemi oluştur. 
 
Satış temsilcisi veya yetkili bayi kullanıcısı müşteri adına teklif hazırlayabilsin. 
 
Teklif içeriği: 
- CERAMICA antet ve logosu. 
- Otomatik teklif numarası. 
- Tarih. 
- Müşteri bilgileri. 
- Proje adı. 
- Ürün görselleri. 
- Ürün kodları. 
- Ürün miktarları. 
- Liste fiyatları. 
- İskontolar. 
- KDV. 
- Nakliye. 
- Toplam tutar. 
- Ödeme koşulları. 
- Teklif geçerlilik tarihi. 
- Termin. 
- Açıklamalar. 
 
Teklifler PDF olarak oluşturulabilsin. 
 
E-posta ve WhatsApp paylaşımı desteklensin. 
 
Teklif durumları: 
- Taslak. 
- Onay bekliyor. 
- Müşteriye gönderildi. 
- İnceleniyor. 
- Kabul edildi. 
- Reddedildi. 
- Süresi doldu. 
- Siparişe dönüştürüldü. 
 
Onaylanmış teklif tek işlemle siparişe çevrilebilsin. Fiyat değişikliği veya süresi dolmuş teklif için yeniden onay gereksinimi tanımlanabilsin. 
 
### 11. SİPARİŞ YÖNETİMİ 
 
Tüm siparişler merkezi yönetim panelinde görüntülensin. 
 
Sipariş durumları: 
1. Taslak. 
2. Sipariş alındı. 
3. Kontrol ediliyor. 
4. Ödeme bekleniyor. 
5. Onaylandı. 
6. Stok ayrıldı. 
7. Tedarik sürecinde. 
8. Hazırlanıyor. 
9. Sevkiyata hazır. 
10. Sevk edildi. 
11. Teslim edildi. 
12. Tamamlandı. 
 
İptal, iade ve kısmi teslimat için ayrı durum akışları oluştur. 
 
Her durum geçişinde yetki, iş kuralı ve tarih kontrolü yapılmalı. 
 
Siparişlerde kısmi tedarik, kısmi sevkiyat ve birden fazla depodan karşılama mümkün olmalı. 
 
Müşteri sipariş durumunu uygulamadan takip edebilmeli. 
 
### 12. STOK VE DEPO YÖNETİMİ 
 
Stoklar için birden fazla depo destekle. 
 
Örnek depo türleri: 
- CERAMICA ana depo. 
- Şube deposu. 
- Tedarikçide bulunan ürün. 
- Siparişe özel tedarik. 
 
Stok durumları birbirinden ayrılmalı: 
- Fiziki stok. 
- Rezerve stok. 
- Satılabilir stok. 
- Sipariş verilmiş ancak gelmemiş ürün. 
- Hasarlı ürün. 
- İade ürün. 
 
Üretici deposundaki stok, CERAMICA'nın mülkiyetindeki stok olarak otomatik kabul edilmemeli. 
 
Stok hareketleri kayıt altında tutulmalı. 
 
Ürünlerde parti, ton ve kalibre takibi destekle. Farklı ton veya kalibrelerin aynı proje siparişinde karışması konusunda uyarı oluştur. 
 
Stok sayımı, barkod okuma, transfer, manuel düzeltme ve minimum stok uyarıları geliştir. 
 
### 13. FİYATLANDIRMA VE KÂRLILIK MOTORU 
 
Her iki üreticinin fiyat listeleri ayrı tutulmalı. 
 
Yönetim panelinde: 
- Üretici alış fiyatı. 
- Nakliye maliyeti. 
- Ek maliyetler. 
- Liste satış fiyatı. 
- Perakende satış fiyatı. 
- Toptan fiyat. 
- Proje fiyatı. 
- Özel müşteri fiyatı. 
- Minimum satış fiyatı. 
- İskonto sınırı. 
- Brüt kâr. 
- Brüt kâr marjı. 
 
Fiyatlandırma motoru oluştur. 
 
Örneğin: 
 
Alış maliyeti 400 TL/m² olan bir ürün için hedef brüt kâr marjı %20 seçilirse, KDV hariç satış fiyatı 500 TL/m² olmalı. 
 
Maliyet üzerine eklenen kâr oranı ile satış fiyatı üzerinden hesaplanan kâr marjını birbirine karıştırma. 
 
Müşteri grubu ve satış temsilcisine göre fiyat ve iskonto yetkileri oluştur. 
 
Yetki üzerindeki indirimler yönetici onayına gönderilsin. 
 
### 14. CARİ HESAP VE FİNANS MODÜLÜ 
 
CERAMICA'nın ticari müşterilerine yönelik temel cari yönetim modülü oluştur. 
 
Özellikler: 
- Müşteri cari kartı. 
- Borç ve alacak hareketleri. 
- Fatura referansları. 
- Tahsilat kayıtları. 
- Açık bakiye. 
- Vade tarihi. 
- Gecikmiş bakiye. 
- Cari risk limiti. 
- Yaşlandırma raporu. 
- Müşteri ekstresi. 
- Excel ve PDF dışa aktarma. 
 
Uygulama tam muhasebe yazılımı olarak değil, ERP/muhasebe sistemiyle entegre olabilecek ticari operasyon platformu olarak tasarlanmalı. 
 
Fatura ve e-belge işlemlerinde mevzuata uygun yetkili entegratör veya muhasebe sistemi bağlantısı kullanılmalı. 
 
### 15. ÖDEME SİSTEMİ 
 
Ödeme seçeneklerini yönetilebilir tasarla: 
- Kart ile ödeme. 
- Havale/EFT. 
- Ön ödeme. 
- Kısmi ödeme. 
- Yetkili kurumsal müşteriler için vadeli ödeme. 
- Yönetici onaylı özel ödeme planı. 
 
Kart ödemeleri için Türkiye'de kullanılabilecek lisanslı ödeme kuruluşlarının resmi entegrasyonlarını destekleyen soyut bir ödeme katmanı geliştir. 
 
Ödeme anahtarlarını uygulama içine gömme. 
 
Kart verilerini saklama. 
 
Ödeme başarılı, başarısız, beklemede, iptal, iade ve kısmi iade durumlarını yönet. 
 
Ödeme webhook'larında imza doğrulama, tekrar işleme kontrolü ve mutabakat mekanizması oluştur. 
 
### 16. SEVKİYAT VE LOJİSTİK 
 
Her sipariş için teslimat veya sevkiyat kaydı oluştur. 
 
Alanlar: 
- Çıkış deposu. 
- Teslimat adresi. 
- Ürün ve koli miktarı. 
- Palet sayısı. 
- Toplam ağırlık. 
- Nakliye firması. 
- Araç plakası, gerekiyorsa. 
- Sevk tarihi. 
- Tahmini teslim tarihi. 
- Teslim alan kişi. 
- İrsaliye referansı. 
- Teslimat belgesi. 
- Hasar ve eksiklik kaydı. 
 
Müşteriye siparişin gerçek durumuna göre bildirim gönder. 
 
### 17. MÜŞTERİ İLİŞKİLERİ VE CRM 
 
CRM modülü oluştur. 
 
Özellikler: 
- Yeni müşteri adayı. 
- Müşteri kayıtları. 
- Görüşme geçmişi. 
- Teklif geçmişi. 
- Satış fırsatları. 
- Projeler. 
- Satış temsilcisi ataması. 
- Hatırlatmalar. 
- Müşteri segmentasyonu. 
- Müşteri şikâyetleri. 
- Satış sonrası destek. 
 
Müşteri iletişim izinleri, KVKK ve ticari elektronik ileti yükümlülüklerine uygun tutulmalı. 
 
### 18. PROJE BAZLI SATIŞ 
 
İnşaat firmaları ve mimarlar için ayrı proje alanı oluştur. 
 
Her projeye birden fazla mahal eklenebilsin: 
- Banyo. 
- Mutfak. 
- Salon. 
- Koridor. 
- Balkon. 
- Ortak alan. 
- Ticari alan. 
 
Her mahal için ürün, alan ölçüsü, tahmini fire, koli miktarı, teslimat etabı ve bütçe belirlensin. 
 
Proje bazında toplam malzeme ihtiyacı, teklif, sipariş ve kalan teslimat raporlanabilsin. 
 
### 19. DİJİTAL SHOWROOM VE GÖRSEL DENEYİM 
 
Güçlü ürün görselleştirme deneyimi geliştir. 
 
- Büyük ürün görselleri. 
- Yakınlaştırma. 
- Farklı yüzey seçenekleri. 
- Koleksiyon galerileri. 
- Mekân ilham görselleri. 
- Yan yana ürün karşılaştırması. 
- Favori koleksiyon oluşturma. 
 
İkinci aşama için oda görselleştirme sistemi tasarla. 
 
Müşteri oda fotoğrafı yükleyip uygun seramik tasarımlarını görsel olarak deneyebilsin. 
 
Bu özellik ayrı bir yapay zekâ servisiyle çalışabilir. Görsellerin tahmini tasarım önizlemesi olduğu belirtilmeli; gerçek ürün tonu ve ölçüsünü garanti etmemeli. 
 
### 20. GELİŞMİŞ YÖNETİM PANELİ 
 
Bilgisayardan kullanılabilecek profesyonel CERAMICA Admin Panel oluştur. 
 
Panelde şu modüller olsun: 
 
1. Genel kontrol paneli. 
2. Satış yönetimi. 
3. Sipariş yönetimi. 
4. Teklif yönetimi. 
5. Ürün yönetimi. 
6. Marka ve koleksiyon yönetimi. 
7. Stok ve depo yönetimi. 
8. Satın alma ve tedarik talepleri. 
9. Müşteri yönetimi. 
10. B2B bayi yönetimi. 
11. Cari ve tahsilat yönetimi. 
12. Sevkiyat yönetimi. 
13. Kampanya ve iskonto yönetimi. 
14. Personel ve yetkilendirme. 
15. Finansal raporlar. 
16. Entegrasyon yönetimi. 
17. İçerik yönetimi. 
18. Sistem ayarları. 
19. Log ve denetim kayıtları. 
 
Dashboard üzerinde günlük, haftalık, aylık ve yıllık satış grafikleri olsun. 
 
Satış ve kârlılık verileri marka, ürün, müşteri, personel ve proje bazında analiz edilebilsin. 
 
### 21. YÖNETİCİ DASHBOARD KPI'LARI 
 
Öncelikli göstergeler: 
- Günlük satış. 
- Aylık satış. 
- Toplam ciro. 
- Toplam sipariş. 
- Ortalama sipariş tutarı. 
- Brüt kâr. 
- Kâr marjı. 
- Açık sipariş tutarı. 
- Bekleyen teklifler. 
- Satışa dönüşüm oranı. 
- Graniser satışları. 
- Duratiles satışları. 
- En çok satılan ürünler. 
- Stok değeri. 
- Kritik stoklar. 
- Gecikmiş alacaklar. 
- Bekleyen tahsilatlar. 
 
Raporlarda vergi dahil/hariç tutarlar açıkça ayrıştırılmalı. 
 
### 22. KULLANICI ROLLERİ VE GÜVENLİK 
 
Roller: 
- Süper yönetici. 
- Şirket yöneticisi. 
- Satış müdürü. 
- Satış temsilcisi. 
- Depo personeli. 
- Finans personeli. 
- B2B firma yöneticisi. 
- B2B firma personeli. 
- Bireysel müşteri. 
 
Her role ayrı yetki matrisi oluştur. 
 
Mobil uygulamada yetki gizlemek yeterli değildir; bütün kontroller backend tarafında da zorunlu olarak uygulanmalı. 
 
Özel fiyatlar, müşteri bakiyeleri, maliyet ve kâr marjları yetkisiz kullanıcıya hiçbir API üzerinden açılmamalı. 
 
Hassas işlemler için denetim kaydı ve gerektiğinde ikinci onay oluştur. 
 
### 23. BİLDİRİM SİSTEMİ 
 
Bildirim türleri: 
- Yeni sipariş. 
- Sipariş onayı. 
- Ödeme onayı. 
- Ödeme başarısızlığı. 
- Sevkiyat güncellemesi. 
- Teklif yanıtı. 
- Stok yenilendi. 
- Yeni koleksiyon. 
- Kampanya. 
- Vade hatırlatması. 
- Yönetici onayı bekleniyor. 
 
Push, e-posta ve uygun entegrasyonla SMS kanallarını destekle. 
 
İleti tercihleri ve yasal izinler merkezi olarak yönetilsin. 
 
### 24. VERİ TABANI MİMARİSİ 
 
En az aşağıdaki alanları kapsayan ilişkisel veri modeli oluştur: 
 
- Users 
- Roles 
- Permissions 
- Companies 
- CustomerAccounts 
- CustomerGroups 
- Brands 
- Collections 
- Products 
- ProductVariants 
- ProductImages 
- ProductTechnicalSpecs 
- ProductDocuments 
- PriceLists 
- CustomerPrices 
- Warehouses 
- InventoryLots 
- StockMovements 
- StockReservations 
- Carts 
- CartItems 
- Quotes 
- QuoteItems 
- Orders 
- OrderItems 
- OrderStatusHistory 
- Payments 
- Refunds 
- Invoices 
- Shipments 
- ShipmentItems 
- Projects 
- ProjectAreas 
- PurchaseOrders 
- SupplierIntegrations 
- ImportJobs 
- Notifications 
- AuditLogs 
- SystemSettings 
 
Tablolarda uygun ilişkiler, foreign key, unique constraint, transaction ve index tasarımını uygula. 
 
Finansal hesaplamalarda kayan noktalı sayı yerine hassas decimal veri tipleri kullan. 
 
### 25. ÖZEL YAPAY ZEKÂ ÖZELLİKLERİ 
 
Yapay zekâ fonksiyonlarını ayrı bir servis olarak tasarla. 
 
Özellikler: 
- Doğal dil ile ürün arama. 
- Müşteriye ürün önerisi. 
- Proje ihtiyacına göre ürün önerisi. 
- Ürün karşılaştırma açıklamaları. 
- Satış temsilcisi için teklif hazırlama desteği. 
- Kataloglar içinde akıllı arama. 
- Yöneticiye satış analizi açıklamaları. 
 
Örnek müşteri sorusu: 
 
"120x120 açık bej, mermer görünümlü ve salon için uygun ürünleri göster." 
 
Sistem katalogdaki gerçek ürün verilerine göre sonuç döndürmeli. 
 
Var olmayan ürün, stok, fiyat veya teknik bilgi üretmemeli. 
 
### 26. PERFORMANS VE KALİTE 
 
- Lazy loading. 
- Resim önbellekleme. 
- Sayfalama. 
- API rate limiting. 
- Arama performansı optimizasyonu. 
- Güvenli token yönetimi. 
- Merkezi hata yönetimi. 
- Crash reporting. 
- Erişilebilirlik. 
- Responsive tasarım. 
- Zayıf bağlantıda dayanıklı kullanım. 
- Offline taslak teklif oluşturma ve bağlantı sonrası güvenli senkronizasyon. 
 
Sipariş ve ödeme işlemlerinde çift kayıt oluşmasını önle. 
 
### 27. GELİŞTİRME VE TESLİMAT AŞAMALARI 
 
Projeyi şu sıralamayla geliştir: 
 
**Aşama 1 — Keşif ve mimari** 
- Üretici sitelerinin incelenmesi. 
- İş akışlarının çıkarılması. 
- Veri modellerinin hazırlanması. 
- Teknik mimari. 
- Ekran haritası. 
- API sözleşmeleri. 
 
**Aşama 2 — Tasarım sistemi** 
- CERAMICA kurumsal kimliği. 
- Mobil ekran tasarımları. 
- Yönetim paneli tasarımları. 
- Tekrar kullanılabilir bileşenler. 
 
**Aşama 3 — Çekirdek yazılım** 
- Backend. 
- Veri tabanı. 
- Kimlik doğrulama. 
- Roller. 
- Ürünler. 
- Katalog. 
- Marka ve koleksiyon yönetimi. 
 
**Aşama 4 — Ticari operasyonlar** 
- Fiyatlandırma. 
- Stok. 
- Sepet. 
- Sipariş. 
- Teklif. 
- Müşteri ve proje yönetimi. 
 
**Aşama 5 — Ödeme ve sevkiyat** 
- Ödeme entegrasyonları. 
- Sevkiyat. 
- Bildirimler. 
- Cari kayıtlar. 
- Ticari raporlar. 
 
**Aşama 6 — Entegrasyon** 
- Graniser ürün aktarım altyapısı. 
- Duratiles ürün aktarım altyapısı. 
- Excel/CSV. 
- ERP entegrasyon hazırlığı. 
 
**Aşama 7 — Test ve kalite** 
- Unit testler. 
- API testleri. 
- E2E testleri. 
- Rol ve yetki testleri. 
- Ödeme ve stok eşzamanlılık testleri. 
- Android/iOS uyumluluğu. 
- Güvenlik testleri. 
 
**Aşama 8 — Yayına hazırlık** 
- Android APK. 
- Android AAB. 
- iOS build yapılandırması. 
- Web admin dağıtımı. 
- Ortam değişkenleri. 
- Docker. 
- Kurulum belgeleri. 
- Yönetici kullanım kılavuzu. 
- Veritabanı yedekleme ve kurtarma prosedürü. 
 
### 28. KODLAMA VE ÇALIŞMA KURALLARI 
 
1. İlk olarak mevcut proje klasörünü incele. Var olan kodları gereksiz yere silme. 
2. Tam proje mimarisini oluştur ve belgelendir. 
3. Bileşenleri küçük, test edilebilir modüllere ayır. 
4. Mock veriyi gerçek veri gibi sunma. 
5. API bulunmadığında çalışan Excel içe aktarma alternatifi hazırla. 
6. Üretim ortamındaki gizli anahtarları örnek kodlara yazma. 
7. Her modülün çalışmasını otomatik testlerle doğrula. 
8. Hataları gizlemek veya sahte başarı mesajı göstermek yerine gerçek nedenini kaydet. 
9. Kritik işlemlerde transaction ve audit log kullan. 
10. Her aşamadan sonra build, lint, type-check ve test çalıştır. 
11. Eksik servis ve erişim bilgilerini `SETUP_REQUIRED.md` dosyasında açıkça belirt. 
12. Tamamlanan, kısmen tamamlanan ve henüz geliştirilmeyen özellikleri ayrı ayrı raporla. 
13. Her işlev için kullanıcı deneyimini düşün; yalnızca teknik olarak çalışması yeterli değildir. 
14. Yarım kalmış ekran, çalışmayan buton ve sonuç üretmeyen form bırakma. 
15. Üretime alınabilir seviyeye ulaşmadan projeyi tamamlandı olarak işaretleme. 
 
### 29. BEKLEDİĞİM NİHAİ TESLİMAT 
 
Geliştirme sonunda aşağıdaki çıktılar hazırlanmalı: 
 
- Çalışır Flutter mobil uygulama kaynak kodu. 
- Android APK. 
- Android AAB. 
- iOS proje ve derleme yapılandırması. 
- Uygun Apple ortamında iOS dağıtım paketi. 
- Çalışan web yönetim paneli. 
- Backend kaynak kodu. 
- PostgreSQL veri tabanı şeması. 
- Migration dosyaları. 
- API dokümantasyonu. 
- Üretici entegrasyon adaptörleri. 
- Excel ürün aktarım şablonları. 
- Docker konfigürasyonu. 
- Kurulum kılavuzu. 
- Yönetici kullanım kılavuzu. 
- Test raporları. 
- Güvenlik kontrol listesi. 
- Demo veri seti. 
- Eksik dış entegrasyonlar listesi. 
 
### 30. NİHAİ AMAÇ 
 
CERAMICA yalnızca bir seramik kataloğu olmayacak. 
 
Müşterilerin ürün keşfettiği, mimarların proje oluşturduğu, müteahhitlerin teklif aldığı, kurumsal müşterilerin sipariş verdiği, satış temsilcilerinin satışları yönettiği ve şirket sahibinin tüm ticari faaliyetleri tek panelden kontrol ettiği profesyonel bir ticaret platformu olacak. 
 
Graniser ve Duratiles markalarının ürünleri tek bir CERAMICA deneyimi altında sunulacak. 
 
**Şimdi işe başla.** 
 
Önce üretici web sitelerinin doğrulanabilir özelliklerini araştır, ardından proje klasör yapısını, mimari kararları, veri tabanı tasarımını ve ekran akışlarını oluştur. 
 
Sonrasında modül modül gerçek uygulama kodunu geliştir. 
 
Hedef yalnızca güzel ekranlar üretmek değil; uçtan uca çalışan, gerçek satış süreçlerini karşılayan, güvenilir ve ticari olarak kullanılabilir bir CERAMICA platformu oluşturmaktır. 
