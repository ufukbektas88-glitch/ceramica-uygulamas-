"""Başlık adayı bulma: izinli RSS kaynakları + kullanıcının elle eklediği başlıklar."""
import re
from datetime import timedelta

import feedparser
import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import get_settings
from ..logutil import event
from ..models import Topic, utcnow
from ..textutil import normalize_title

UA = "eksi-ai-research/1.0 (kisisel RSS okuyucu)"


def fetch_feed(url: str, limit: int) -> list[dict]:
    r = httpx.get(url, headers={"User-Agent": UA}, timeout=20, follow_redirects=True)
    r.raise_for_status()
    parsed = feedparser.parse(r.content)
    source = "trends" if "trends.google" in url else "rss"
    items = []
    for e in parsed.entries[:limit]:
        title = (e.get("title") or "").strip()
        if not title:
            continue
        summary = re.sub(r"<[^>]+>", " ", e.get("summary") or "")
        items.append({"title": title, "summary": re.sub(r"\s+", " ", summary).strip()[:600],
                      "url": e.get("link"), "source": source})
    return items


def upsert_topic(db: Session, *, title: str, source: str, url: str | None = None,
                 summary: str | None = None) -> tuple[Topic | None, bool]:
    norm = normalize_title(title)
    if len(norm) < 3:
        return None, False
    t = db.scalar(select(Topic).where(Topic.title_norm == norm))
    if t:
        t.last_seen_at = utcnow()
        return t, False
    t = Topic(title=title.strip()[:300], title_norm=norm, source_title=title.strip(), source=source,
              source_url=url, summary=summary)
    db.add(t)
    db.flush()
    return t, True


def discover(db: Session, run_id: int | None = None, fetcher=fetch_feed) -> int:
    """Kaynakları tarar; taranan (görülen) aday sayısını döndürür."""
    s = get_settings()
    seen = new = 0
    for url in s.feeds:
        try:
            items = fetcher(url, s.rss_max_items_per_feed)
        except Exception as e:  # tek kaynağın hatası taramayı durdurmaz
            event(f"Kaynak okunamadı: {url}: {e}", level="WARNING", stage="discovery", run_id=run_id)
            continue
        for it in items:
            _, created = upsert_topic(db, title=it["title"], source=it["source"], url=it.get("url"),
                                      summary=it.get("summary"))
            seen += 1
            new += created
    db.commit()
    # Elle eklenip henüz işlenmemiş başlıklar da günün havuzuna dahildir.
    manual = db.scalars(select(Topic).where(Topic.source == "manual",
                                            Topic.status.in_(("discovered", "scored")))).all()
    seen += len(manual)
    event(f"Tarama bitti: {seen} aday görüldü, {new} yeni.", stage="discovery", run_id=run_id)
    return seen


def expire_stale(db: Session, days: int = 3) -> None:
    """Eski, işlenmemiş otomatik adayları havuzdan düşürür (elle eklenenlere dokunmaz)."""
    cutoff = utcnow() - timedelta(days=days)
    for t in db.scalars(select(Topic).where(Topic.status.in_(("discovered", "scored")),
                                            Topic.source != "manual", Topic.last_seen_at < cutoff)):
        t.status, t.skip_reason = "skipped", "güncelliğini yitirdi"
    db.commit()
