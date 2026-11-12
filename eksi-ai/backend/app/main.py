"""FastAPI uygulaması: yönetim paneli API'si + derlenmiş arayüzün sunumu."""
import hmac
import threading
from datetime import date
from pathlib import Path

from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import get_settings
from .db import get_db, session_scope
from .embeddings import get_embedder
from .llm import ClaudeLLM, LLMError
from .logutil import event
from .models import CATEGORIES, DailyRun, Draft, LogEvent, Topic, utcnow
from .services import discovery, generation, pipeline, reports
from .services.eksi import get_gateway
from .textutil import word_count

app = FastAPI(title="Ekşi AI", docs_url="/api/docs", openapi_url="/api/openapi.json")


def auth(authorization: str | None = Header(default=None)):
    token = get_settings().panel_token
    if not token:
        return
    given = (authorization or "").removeprefix("Bearer ").strip()
    if not hmac.compare_digest(given.encode(), token.encode()):
        raise HTTPException(401, "Geçersiz panel anahtarı")


api = Depends(auth)
_jobs_lock = threading.Lock()
_jobs: set[str] = set()


def _background(key: str, fn) -> None:
    """Uzun süren LLM işlerini istek döngüsünün dışında, anahtar başına tek kopya çalıştırır."""
    with _jobs_lock:
        if key in _jobs:
            raise HTTPException(409, "Bu işlem zaten sürüyor")
        _jobs.add(key)

    def run():
        try:
            fn()
        except Exception as e:
            event(f"Arka plan işi başarısız ({key}): {e}", level="ERROR", stage="job")
        finally:
            with _jobs_lock:
                _jobs.discard(key)

    threading.Thread(target=run, daemon=True, name=key).start()


def _llm() -> ClaudeLLM:
    try:
        return ClaudeLLM()
    except LLMError as e:
        raise HTTPException(503, str(e))


# ---------- serileştirme ----------
def topic_out(t: Topic) -> dict:
    return {"id": t.id, "title": t.title, "source_title": t.source_title, "source": t.source,
            "source_url": t.source_url, "summary": t.summary, "category": t.category, "status": t.status,
            "skip_reason": t.skip_reason, "priority_score": t.priority_score, "scores": t.scores,
            "score_rationale": t.score_rationale, "existing_entries": t.existing_entries,
            "eksi_url": get_gateway().topic_url(t.title), "first_seen_at": t.first_seen_at,
            "last_drafted_at": t.last_drafted_at, "draft_ids": [d.id for d in t.drafts]}


def draft_out(d: Draft, full: bool = False) -> dict:
    out = {"id": d.id, "topic_id": d.topic_id, "title": d.topic.title, "category": d.topic.category,
           "status": d.status, "word_count": d.word_count, "quality_score": d.quality_score,
           "rewrite_count": d.rewrite_count, "similarity_max": d.similarity_max,
           "created_at": d.created_at, "approved_at": d.approved_at, "published_at": d.published_at,
           "published_url": d.published_url, "reject_reason": d.reject_reason,
           "user_edited": d.user_edited, "eksi_url": get_gateway().topic_url(d.topic.title),
           "busy": f"draft-{d.id}" in _jobs}
    if full:
        srcs = [{"url": s.url, "title": s.title, "page_age": s.page_age, "cited": s.cited} for s in d.sources]
        out |= {"content": d.content, "analysis": d.analysis, "perspective": d.perspective,
                "research_dossier": d.research_dossier, "quality_report": d.quality_report,
                "sources": srcs, "existing_entries": d.topic.existing_entries,
                "copy_text_with_sources": get_gateway().copy_text(d.content, srcs, True)}
    return out


def _draft(db: Session, draft_id: int) -> Draft:
    d = db.get(Draft, draft_id)
    if not d:
        raise HTTPException(404, "Taslak bulunamadı")
    return d


# ---------- genel ----------
@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/settings", dependencies=[api])
def settings_view():
    s = get_settings()
    g = get_gateway()
    return {"claude_configured": bool(s.anthropic_api_key), "embedding": get_embedder().name,
            "daily_target": s.daily_target, "run_time": f"{s.daily_run_hour:02d}:{s.daily_run_minute:02d}",
            "timezone": s.timezone, "quality_threshold": s.quality_threshold, "feeds": s.feeds,
            "eksi_mode": g.mode, "eksi_can_publish": g.can_publish, "categories": CATEGORIES,
            "models": {"research": s.model_research, "writer": s.model_writer, "judge": s.model_judge,
                       "scoring": s.model_scoring}}


@app.get("/api/overview", dependencies=[api])
def overview(db: Session = Depends(get_db)):
    return reports.overview(db, pipeline.today())


# ---------- başlık havuzu ----------
@app.get("/api/topics", dependencies=[api])
def list_topics(status: str | None = None, category: str | None = None, q: str | None = None,
                limit: int = Query(200, le=500), offset: int = 0, db: Session = Depends(get_db)):
    stmt = select(Topic)
    if status:
        stmt = stmt.where(Topic.status == status)
    if category:
        stmt = stmt.where(Topic.category == category)
    if q:
        stmt = stmt.where(Topic.title.ilike(f"%{q}%"))
    stmt = stmt.order_by(Topic.priority_score.desc().nulls_last(), Topic.id.desc()).limit(limit).offset(offset)
    return [topic_out(t) for t in db.scalars(stmt)]


class TopicsIn(BaseModel):
    titles: list[str] = Field(min_length=1, max_length=200)


@app.post("/api/topics", dependencies=[api])
def add_topics(body: TopicsIn, db: Session = Depends(get_db)):
    created = 0
    for title in body.titles:
        if title.strip():
            t, new = discovery.upsert_topic(db, title=title, source="manual")
            created += new
            if t and not new and t.status in ("skipped", "duplicate"):
                t.status, t.skip_reason, t.source = "discovered", None, "manual"  # kullanıcı yeniden istedi
    db.commit()
    return {"created": created}


class TopicPatch(BaseModel):
    existing_entries: str | None = Field(default=None, max_length=generation.MAX_EXISTING_CHARS)
    status: str | None = None
    category: str | None = None


@app.patch("/api/topics/{topic_id}", dependencies=[api])
def patch_topic(topic_id: int, body: TopicPatch, db: Session = Depends(get_db)):
    t = db.get(Topic, topic_id)
    if not t:
        raise HTTPException(404, "Başlık bulunamadı")
    if "existing_entries" in body.model_fields_set:
        t.existing_entries = body.existing_entries or None
    if body.status:
        if body.status not in ("skipped", "scored"):
            raise HTTPException(422, "Yalnızca 'skipped' ya da 'scored' atanabilir")
        if body.status == "scored" and t.priority_score is None:
            t.status = "discovered"
        else:
            t.status = body.status
        t.skip_reason = "kullanıcı havuzdan çıkardı" if body.status == "skipped" else None
    if body.category:
        if body.category not in CATEGORIES:
            raise HTTPException(422, "Bilinmeyen kategori")
        t.category = body.category
    db.commit()
    return topic_out(t)


@app.post("/api/topics/{topic_id}/generate", dependencies=[api], status_code=202)
def generate_topic(topic_id: int, db: Session = Depends(get_db)):
    if not db.get(Topic, topic_id):
        raise HTTPException(404, "Başlık bulunamadı")
    llm = _llm()

    def job():
        with session_scope() as s:
            generation.generate_for_topic(s, llm, get_embedder(), topic_id)

    _background(f"topic-{topic_id}", job)
    return {"started": True}


# ---------- taslaklar / yayın kuyruğu ----------
@app.get("/api/drafts", dependencies=[api])
def list_drafts(status: str | None = None, day: date | None = None, limit: int = Query(100, le=500),
                offset: int = 0, db: Session = Depends(get_db)):
    stmt = select(Draft)
    if status:
        stmt = stmt.where(Draft.status == status)
    if day:
        start, end = reports._day_bounds(day)
        stmt = stmt.where(Draft.created_at >= start, Draft.created_at < end)
    stmt = stmt.order_by(Draft.created_at.desc(), Draft.id.desc()).limit(limit).offset(offset)
    return [draft_out(d) for d in db.scalars(stmt)]


@app.get("/api/drafts/{draft_id}", dependencies=[api])
def get_draft(draft_id: int, db: Session = Depends(get_db)):
    return draft_out(_draft(db, draft_id), full=True)


class DraftPatch(BaseModel):
    content: str = Field(min_length=1, max_length=50000)


@app.patch("/api/drafts/{draft_id}", dependencies=[api])
def edit_draft(draft_id: int, body: DraftPatch, db: Session = Depends(get_db)):
    d = _draft(db, draft_id)
    if d.status == "published":
        raise HTTPException(409, "Yayınlanmış içerik düzenlenemez")
    d.content, d.word_count, d.user_edited = body.content, word_count(body.content), True
    db.commit()
    return draft_out(d, full=True)


@app.post("/api/drafts/{draft_id}/approve", dependencies=[api])
def approve(draft_id: int, db: Session = Depends(get_db)):
    d = _draft(db, draft_id)
    if d.status not in ("pending", "rejected", "failed_quality"):
        raise HTTPException(409, f"'{d.status}' durumundaki taslak onaylanamaz")
    if d.status == "failed_quality" and not d.user_edited:
        raise HTTPException(409, "Kalite eşiğini geçemeyen taslak, düzenlenmeden onaylanamaz")
    d.status, d.approved_at, d.reject_reason = "approved", utcnow(), None
    db.commit()
    return draft_out(d)


class RejectIn(BaseModel):
    reason: str | None = Field(default=None, max_length=1000)


@app.post("/api/drafts/{draft_id}/reject", dependencies=[api])
def reject(draft_id: int, body: RejectIn, db: Session = Depends(get_db)):
    d = _draft(db, draft_id)
    if d.status == "published":
        raise HTTPException(409, "Yayınlanmış içerik reddedilemez")
    d.status, d.reject_reason, d.approved_at = "rejected", body.reason, None
    db.commit()
    return draft_out(d)


class PublishIn(BaseModel):
    url: str = Field(pattern=r"^https://(www\.)?eksisozluk\.com/\S+$", max_length=500)


@app.post("/api/drafts/{draft_id}/publish", dependencies=[api])
def mark_published(draft_id: int, body: PublishIn, db: Session = Depends(get_db)):
    """Elle yayımlanan entry'nin bağlantısını kaydeder. Sistem kendisi yayın yapmaz."""
    d = _draft(db, draft_id)
    if d.status != "approved":
        raise HTTPException(409, "Yalnızca onaylanmış taslak yayımlandı olarak işaretlenebilir")
    d.status, d.published_url, d.published_at = "published", body.url, utcnow()
    db.commit()
    return draft_out(d)


class RegenerateIn(BaseModel):
    instruction: str | None = Field(default=None, max_length=2000)


@app.post("/api/drafts/{draft_id}/regenerate", dependencies=[api], status_code=202)
def regenerate(draft_id: int, body: RegenerateIn, db: Session = Depends(get_db)):
    d = _draft(db, draft_id)
    if d.status == "published":
        raise HTTPException(409, "Yayınlanmış içerik yeniden üretilemez")
    llm = _llm()

    def job():
        with session_scope() as s:
            generation.regenerate_draft(s, llm, get_embedder(), draft_id, body.instruction)

    _background(f"draft-{draft_id}", job)
    return {"started": True}


@app.post("/api/drafts/{draft_id}/recheck", dependencies=[api], status_code=202)
def recheck(draft_id: int, db: Session = Depends(get_db)):
    _draft(db, draft_id)
    llm = _llm()

    def job():
        with session_scope() as s:
            generation.recheck_draft(s, llm, get_embedder(), draft_id)

    _background(f"draft-{draft_id}", job)
    return {"started": True}


# ---------- çalıştırmalar / raporlar ----------
@app.get("/api/runs", dependencies=[api])
def runs(db: Session = Depends(get_db)):
    rows = db.scalars(select(DailyRun).order_by(DailyRun.run_date.desc()).limit(60)).all()
    return [{c.name: getattr(r, c.name) for c in DailyRun.__table__.columns} for r in rows]


@app.post("/api/runs/trigger", dependencies=[api], status_code=202)
def trigger_run():
    _llm()
    _background("daily-run", pipeline.run_daily)
    return {"started": True}


@app.get("/api/reports/daily", dependencies=[api])
def report_daily(day: date | None = None, db: Session = Depends(get_db)):
    return reports.daily_report(db, day or pipeline.today())


@app.get("/api/reports/summary", dependencies=[api])
def report_summary(db: Session = Depends(get_db)):
    return {"weekly": reports.weekly(db, pipeline.today()), "categories": reports.categories(db),
            "similarity": reports.similarity(db)}


@app.get("/api/logs", dependencies=[api])
def logs(level: str | None = None, run_id: int | None = None, limit: int = Query(200, le=1000),
         db: Session = Depends(get_db)):
    stmt = select(LogEvent)
    if level:
        stmt = stmt.where(LogEvent.level == level)
    if run_id:
        stmt = stmt.where(LogEvent.run_id == run_id)
    rows = db.scalars(stmt.order_by(LogEvent.id.desc()).limit(limit)).all()
    return [{"id": r.id, "ts": r.ts, "level": r.level, "stage": r.stage, "run_id": r.run_id,
             "topic_id": r.topic_id, "message": r.message} for r in rows]


# ---------- arayüz ----------
_dist = Path(__file__).resolve().parents[2] / "frontend" / "dist"
if _dist.is_dir():
    app.mount("/assets", StaticFiles(directory=_dist / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str):
        if path.startswith("api/"):
            raise HTTPException(404)
        return FileResponse(_dist / "index.html")
