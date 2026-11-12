# Ekşi AI

Gündemi izleyen, başlık başına araştırma yapan, tartışmayı analiz eden ve Ekşi Sözlük için uzun,
kaynaklı entry **taslakları** üreten kişisel içerik platformu. Taslaklar kalite kontrolünden
geçer, panelde onayınızı bekler; yayın sizin elinizle yapılır.

Mimari, Ekşi Sözlük erişim değerlendirmesi, güvenlik ve maliyet: [docs/MIMARI.md](docs/MIMARI.md).

## Kurulum (sunucu)

```bash
cp .env.example .env        # ANTHROPIC_API_KEY, PANEL_TOKEN, POSTGRES_PASSWORD doldurun
docker compose up -d --build
```

Panel: `http://127.0.0.1:8000` (uzaktan erişim için SSH tüneli ya da TLS'li ters vekil kullanın).
`worker` servisi her gün 06:30'da (Europe/Istanbul) günlük hattı çalıştırır.

İlk kullanımda `.env` içinde `DAILY_TARGET=5` ile bir deneme çalıştırması yapıp panelden
"Günlük çalışmayı şimdi başlat" deyin; maliyeti ve kaliteyi görmeden 50'ye çıkmayın.

## Günlük kullanım

1. **Başlık Havuzu** – otomatik bulunan adayları görün; Ekşi gündeminden istediğiniz başlıkları
   toplu ekleyin; bir başlığın altına okuduğunuz entry'leri yapıştırın (isteğe bağlı).
2. **Yayın Kuyruğu → Entry Editörü** – taslağı, analizini, kaynaklarını ve kalite raporunu
   inceleyin; düzenleyin, yeniden ürettirin, onaylayın ya da reddedin.
3. Onayladığınız entry'yi kopyalayın, "Başlığı Ekşi'de aç" ile siteye gidip kendiniz yayımlayın,
   bağlantıyı panele kaydedin.
4. **Raporlama** – günlük rapor, haftalık performans, kategori dağılımı, benzerlik analizi.

## Geliştirme

```bash
# backend (PostgreSQL gerekir)
cd backend && python -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt
export DATABASE_URL=postgresql+psycopg://eksi:eksi@localhost:5432/eksi_ai
alembic upgrade head
uvicorn app.main:app --reload            # API + (derlenmişse) panel
python -m app.worker                     # zamanlayıcı
python -m app.cli run                    # günlük hattı elle çalıştır
python -m app.cli report 2026-11-11      # günlük rapor metni
python -m pytest -q                      # testler (eksi_ai_test veritabanı)

# panel
cd frontend && npm install && npm run dev   # /api isteklerini :8000'e vekiller
```

## Sınırlar

- Sistem eksisozluk.com'a istek göndermez; gündem ve mevcut entry'ler elle aktarılır.
- Gerçek Claude anahtarıyla uçtan uca çalıştırma ve varsayılan RSS adresleri geliştirme
  ortamında doğrulanamadı; ilk çalıştırmada **İşlem Kayıtları** sayfasını kontrol edin.
- Kalite ve hukuki risk puanları model değerlendirmesidir; yayımlanan her entry'nin sorumluluğu
  onaylayan kişidedir.
