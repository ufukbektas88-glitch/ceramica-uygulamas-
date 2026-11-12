# Ekşi AI – Mimari ve Plan

Bu belge, kod yazılmadan önce yapılan değerlendirmeyi ve uygulanan mimariyi kaydeder.

## 1. Çalışma ortamı incelemesi

- Depo, ilgisiz bir Flutter katalog uygulaması (CERAMICA) barındırıyor. Ekşi AI bu yüzden kendi
  içinde bağımsız `eksi-ai/` dizininde yaşar; mevcut uygulamanın hiçbir dosyasına dokunulmadı.
- Geliştirme ortamında Python 3.13, Node 22, PostgreSQL 16 ve Docker mevcut.
- Geliştirme oturumunda Claude API anahtarı yoktu ve dış sitelere (haber siteleri, eksisozluk.com)
  ağ erişimi kapalıydı. Bu nedenle Claude ve RSS katmanları sahte istemcilerle test edildi;
  **gerçek anahtarla uçtan uca çalıştırma henüz yapılmadı** (bkz. §7, Aşama 0).

## 2. Teknik mimari

```
                ┌──────────── worker (APScheduler, her gün 06:30) ───────────┐
                │                                                            │
 RSS / Trends ──► discovery ─► scoring ─► seçim ─► generation ─► quality ─► PostgreSQL
 Elle eklenen ──►   (aday)     (Claude)  (dedup)   araştırma     kural +        ▲
 başlıklar                                         analiz        editör         │
                                                   yazım         modeli         │
                                                   (Claude + web araması)       │
                                                                                │
 Tarayıcı ◄── React paneli ◄── FastAPI (/api) ──────────────────────────────────┘
     │
     └─► kullanıcı entry'yi kopyalar, eksisozluk.com'da ELLE yayımlar, bağlantıyı panele kaydeder
```

| Katman | Teknoloji | Not |
|---|---|---|
| API | FastAPI | `backend/app/main.py`; derlenmiş paneli de sunar |
| Veritabanı | PostgreSQL 16 + SQLAlchemy 2 + Alembic | şema göçleri `backend/migrations` |
| Zamanlayıcı | APScheduler (ayrı `worker` süreci) | Celery/Redis yerine: tek kullanıcı, günde bir iş; ek altyapı gerektirmez |
| Yapay zekâ | Claude API (`anthropic` SDK) | yapılandırılmış çıktı, sunucu taraflı web araması, ret durumunda yedek model |
| Benzerlik | Voyage embedding (anahtar varsa) / yerel n-gram vektörü | bkz. §5 |
| Panel | React + Vite + TypeScript | `frontend/` |
| Dağıtım | Docker Compose (`db`, `api`, `worker`) | bilgisayar kapalıyken çalışması için bir VPS'e kurulur |

## 3. Modüller ve veri akışı

| Modül | Dosya | Görev |
|---|---|---|
| Başlık bulma | `services/discovery.py` | RSS/Trends akışlarını okur, elle eklenenlerle birlikte `topics` tablosuna yazar |
| Puanlama | `services/scoring.py` | 6 ölçütle 100 üzerinden öncelik puanı, kategori, Ekşi biçimli başlık önerisi; benzer başlık ayıklama |
| Araştırma | `services/generation.py: do_research` | Claude + web araması ile tarihli, kaynaklı araştırma dosyası. Kaynak listesi modelin beyanından değil, arama aracının döndürdüğü gerçek sonuçlardan derlenir |
| Entry analizi | `do_analysis` | Görüş haritası (hâkim/yaygın/azınlık, tekrarlar, çelişkiler, boşluklar, doğru/varsayım/yanlış ayrımı) ve savunulabilir bakış açısı. Araştırma yetersizse başlık **atlanır** |
| Yazım | `do_write` | Yalnızca araştırma dosyasındaki olgularla, her seferinde farklı kuruluş önerisiyle uzun entry |
| Kalite kontrol | `services/quality.py` | Kural denetimleri + editör modeli; 80 altı geri bildirimle yeniden yazılır (en çok 2 kez), geçemeyen kuyruğa girmez |
| Hat | `services/pipeline.py` | Günlük kayıt, eşzamanlılık, kaldığı yerden devam, sayaçlar |
| Raporlama | `services/reports.py` | Günlük rapor metni, haftalık tablo, kategori dağılımı, benzerlik analizi |
| Ekşi entegrasyonu | `services/eksi.py` | Yalnızca bağlantı üretir ve kopyalanacak metni hazırlar (bkz. §4) |
| Claude katmanı | `llm.py` | Tek giriş noktası; `pause_turn` sürdürme, ret/kesilme/hata ayrımı, token sayacı |
| İşlem kaydı | `logutil.py` | Her adım hem stdout'a hem `log_events` tablosuna yazılır |

Durum makineleri:

- Başlık: `discovered → scored → processing → drafted | skipped | duplicate`
- Taslak: `pending → approved → published`, `pending → rejected`, kaliteyi geçemeyen `failed_quality`
  (elle düzenlenmeden onaylanamaz). `published` yalnızca `approved` taslağa ve yalnızca
  `https://eksisozluk.com/...` bağlantısıyla verilebilir.

Kalite kontrolünde puandan bağımsız **engeller**: 250 kelimenin altı, ikiden az kaynak, mevcut
entry'lerle birebir örtüşen ifadeler, önceki bir taslakla aşırı benzerlik, yüksek hukuki risk.

## 4. Ekşi Sözlük erişim ve kullanım koşulları

Değerlendirme (Kasım 2026):

- **Resmî API yok.** Bulunabilen tüm "Ekşi API" projeleri resmî olmayan, siteyi kazıyan topluluk
  araçları. Bunlar kullanılmadı.
- Kullanıcı sözleşmesinin ve site kurallarının güncel metni bu geliştirme ortamından
  okunamadı (ağ erişimi kapalı). Yapay zekâ ile üretilmiş içeriğe ya da günde çok sayıda entry
  girilmesine dair kuralın **ne dediği doğrulanmadı**; yayına başlamadan önce
  `eksisozluk.com/registration/eula` ve güncel site kuralları sizin tarafınızdan okunmalı.
  Hesabın kapatılması riski kullanıcıya aittir.
- Bu nedenle sistem "izinli erişim yok" varsayımıyla tasarlandı:
  - Siteye **hiçbir otomatik istek gönderilmez**: gündem ve entry'ler kazınmaz, oturum açılmaz,
    CAPTCHA/güvenlik önlemi aşılmaz, otomatik gönderim yapılmaz.
  - Araştırma motorunun web aramasında `eksisozluk.com` alan adı engellidir.
  - **Gündem**: açık RSS akışları ve Google Trends'ten türetilir; Ekşi gündemindeki başlıkları
    panelden elle (toplu yapıştırarak) ekleyebilirsiniz.
  - **Mevcut entry'ler**: okuduğunuz entry'leri başlık kaydına elle yapıştırırsanız analiz ve
    kopya denetimi bunlara göre yapılır. Yapıştırılmazsa görüş haritası açık kaynaklardaki
    tartışmadan çıkarılır ve panel bunu açıkça belirtir.
  - **Yayın**: "Entry'yi kopyala" + "Başlığı Ekşi'de aç" ile elle yapılır; sonra bağlantı kaydedilir.
- Ekşi Teknoloji'den yazılı izin ya da resmî API alınırsa `EksiGateway` alt sınıfı yazılır;
  yayın yine panelde açık onay gerektirir.

Bu tasarımın sonucu: şartnamedeki "Ekşi gündemini otomatik tara" ve "başlıktaki entry'leri
otomatik oku" maddeleri, izinli erişim olmadığı için **bilinçli olarak** elle aktarıma bağlandı.

## 5. Gerekli API ve servisler

| Servis | Zorunlu mu | Amaç |
|---|---|---|
| Anthropic Claude API anahtarı | Evet | puanlama, araştırma (web araması dahil), analiz, yazım, kalite |
| PostgreSQL | Evet | Compose ile birlikte gelir |
| 7/24 açık sunucu (1 vCPU / 2 GB yeterli) | Evet (bilgisayar kapalıyken çalışması için) | `docker compose up -d` |
| Voyage AI anahtarı | Hayır | gerçek anlamsal embedding. Anthropic'in embedding uç noktası olmadığı için ayrı servis gerekir |

Voyage anahtarı yoksa benzerlik denetimi yerel n-gram vektörüyle yapılır. Bu yöntem birebir ve
hafifçe değiştirilmiş tekrarları yakalar, **aynı fikrin bambaşka sözcüklerle tekrarını
yakalayamaz**; fikir tekrarı o durumda yalnızca editör modelinin "özgünlük" ölçütüne kalır.

## 6. Güvenlik ve maliyet

Güvenlik:

- Tüm gizli değerler `.env` içinde, ortam değişkeni olarak okunur; `.env` depoya girmez. Kaynak
  kodda anahtar, parola, oturum bilgisi yoktur. Ekşi Sözlük parolası sistemde **hiç tutulmaz**
  (sistemin siteye girişi yok).
- Panel `PANEL_TOKEN` ile korunur (sabit zamanlı karşılaştırma). Compose bu değişken olmadan
  başlamaz ve API'yi yalnızca `127.0.0.1`'e bağlar; internete açılacaksa önüne TLS'li ters vekil
  (Caddy/nginx) konmalıdır.
- Web'den gelen metin (araştırma sonuçları, yapıştırılan entry'ler) modele veri olarak verilir;
  modelin araç yetkisi yalnızca web aramasıdır, sistemde eylem yapabilecek bir aracı yoktur.
- Hukuki risk: yazım istemi kişilik haklarını gözetir, editör modeli ayrıca denetler; "yüksek"
  risk puandan bağımsız engeldir. Bu otomatik bir ön eleme olup hukuki görüş değildir; son
  sorumluluk onaylayan kullanıcıdadır.

Maliyet (ölçülmemiş kaba tahmin; gerçek kullanım panelde gün bazında token olarak raporlanır):

- Başlık başına 4–6 Claude çağrısı: araştırma (arama sonuçları girdi token'ı sayılır, en pahalı
  adım), analiz, yazım, kalite; gerekirse yeniden yazım + yeniden denetim.
- Varsayılan `claude-opus-5-5` ($4 / $20 milyon token) ile başlık başına kabaca $0,5–1;
  günde 50 entry için **günlük ~$35–60, aylık ~$1.000–1.800** mertebesi. Web araması ayrıca
  arama başına ücretlendirilir.
- Düşürme yolları (`.env`): `MODEL_*` ile aşamaları `claude-sonnet-5-5`'e almak (yaklaşık yarı
  fiyat), `RESEARCH_MAX_SEARCHES` ve `MAX_REWRITES` değerlerini azaltmak, `DAILY_TARGET`'ı
  düşürmek. Önce 5–10 başlıkla ölçüm yapılması önerilir.

## 7. Geliştirme aşamaları

| Aşama | Kapsam | Durum |
|---|---|---|
| 1 | Veri modeli, göçler, yapılandırma, işlem kaydı | tamam |
| 2 | Claude katmanı, benzerlik katmanı | tamam (sahte istemciyle test edildi) |
| 3 | Başlık bulma, puanlama, tekrar ayıklama | tamam |
| 4 | Araştırma, analiz, yazım, kalite döngüsü | tamam |
| 5 | Günlük hat, zamanlayıcı, raporlar | tamam |
| 6 | API ve yönetim paneli | tamam (tarayıcıda uçtan uca denendi) |
| 7 | Docker Compose, CI | yazıldı; imaj derlemesi bu ortamda denenemedi |
| 0 (sizde) | Gerçek anahtarla `DAILY_TARGET=5` deneme çalıştırması; RSS adreslerinin doğrulanması; istem ve eşik ayarı | **yapılmadı** |
