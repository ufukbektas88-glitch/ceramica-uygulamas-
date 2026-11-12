"""Ortam değişkenlerinden okunan ayarlar. Gizli değerler yalnızca buradan gelir."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_FEEDS = ",".join(
    [
        "https://trends.google.com/trending/rss?geo=TR",
        "https://feeds.bbci.co.uk/turkce/rss.xml",
        "https://rss.dw.com/rdf/rss-tur-all",
        "https://www.aa.com.tr/tr/rss/default?cat=guncel",
        "https://www.ntv.com.tr/gundem.rss",
    ]
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://eksi:eksi@localhost:5432/eksi_ai"
    panel_token: str = ""  # boşsa panel kimlik doğrulamasız çalışır (yalnızca yerel kullanım)
    timezone: str = "Europe/Istanbul"

    # Claude
    anthropic_api_key: str = ""
    model_research: str = "claude-opus-5-5"
    model_writer: str = "claude-opus-5-5"
    model_judge: str = "claude-opus-5-5"
    model_scoring: str = "claude-opus-5-5"
    claude_fallbacks: bool = True  # ret durumunda sunucu taraflı yedek model
    research_max_searches: int = 6

    # Günlük üretim
    daily_target: int = 50
    daily_run_hour: int = 6
    daily_run_minute: int = 30
    scheduler_enabled: bool = True
    pipeline_concurrency: int = 3
    candidate_multiplier: float = 1.6  # hedefin kaç katı aday denenebilir
    topic_cooldown_days: int = 30
    min_priority_score: int = 55

    # Kalite
    quality_threshold: int = 80
    max_rewrites: int = 2
    min_words: int = 250
    max_words: int = 1100
    min_sources: int = 2

    # Benzerlik
    embedding_provider: str = "auto"  # auto | voyage | local
    voyage_api_key: str = ""
    voyage_model: str = "voyage-3.5"
    topic_dup_threshold: float = 0.0  # 0 => sağlayıcıya göre varsayılan
    draft_dup_threshold: float = 0.0

    # Kaynaklar
    rss_feeds: str = DEFAULT_FEEDS
    rss_max_items_per_feed: int = 30
    # Ekşi Sözlük: izinli erişim olmadığı sürece "manual" kalmalı.
    eksi_access_mode: str = "manual"

    @property
    def feeds(self) -> list[str]:
        return [f.strip() for f in self.rss_feeds.split(",") if f.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
