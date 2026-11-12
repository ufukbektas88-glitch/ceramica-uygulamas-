"""Adayları 100 üzerinden puanlar, kategorize eder ve yinelenenleri ayıklar."""
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import get_settings
from ..embeddings import Embedder, most_similar
from ..llm import LLM
from ..logutil import event
from ..models import CATEGORIES, Topic, utcnow
from ..prompts import SCORE_WEIGHTS, SCORING_SCHEMA, SCORING_SYSTEM
from ..textutil import normalize_title

BATCH = 40


def _clamp(v) -> int:
    return max(0, min(100, int(v)))


def score_pending(db: Session, llm: LLM, embedder: Embedder, run_id: int | None = None) -> int:
    s = get_settings()
    pending = db.scalars(select(Topic).where(Topic.status == "discovered").order_by(Topic.id)).all()
    scored = 0
    for i in range(0, len(pending), BATCH):
        batch = pending[i : i + BATCH]
        lines = []
        for t in batch:
            tag = "ELLE EKLENDİ" if t.source == "manual" else t.source
            lines.append(f"[{t.id}] ({tag}) {t.source_title or t.title}"
                         + (f" — {t.summary[:300]}" if t.summary else ""))
        result = llm.json(system=SCORING_SYSTEM, user="Adaylar:\n" + "\n".join(lines),
                          schema=SCORING_SCHEMA, model=s.model_scoring, effort="low")
        by_id = {it["id"]: it for it in result.get("items", [])}
        for t in batch:
            it = by_id.get(t.id)
            if not it:
                continue  # model atladıysa sonraki çalıştırmada yeniden denenir
            crit = {k: _clamp(it[k]) for k in SCORE_WEIGHTS}
            t.scores = crit
            t.priority_score = round(sum(crit[k] * w for k, w in SCORE_WEIGHTS.items()))
            t.score_rationale = it.get("gerekce")
            t.category = it["kategori"] if it["kategori"] in CATEGORIES else "diğer"
            t.status = "scored"
            scored += 1
            if it.get("tekrar") and t.source != "manual":
                t.status, t.skip_reason = "duplicate", "aynı taramada yinelenen konu"
                continue
            if t.source != "manual":
                _rename(db, t, it["baslik"])
        db.commit()
    _dedupe(db, embedder)
    event(f"{scored} aday puanlandı.", stage="scoring", run_id=run_id)
    return scored


def _rename(db: Session, t: Topic, new_title: str) -> None:
    new_title = new_title.strip()[:300]
    norm = normalize_title(new_title)
    if not norm or norm == t.title_norm:
        return
    other = db.scalar(select(Topic).where(Topic.title_norm == norm, Topic.id != t.id))
    if other:
        t.status, t.skip_reason, t.duplicate_of_id = "duplicate", "aynı başlık zaten havuzda", other.id
        return
    t.title, t.title_norm = new_title, norm


def _dedupe(db: Session, embedder: Embedder) -> None:
    """Puanlanmış adayları, bekleme süresi içindeki işlenmiş başlıklarla ve birbirleriyle karşılaştırır."""
    s = get_settings()
    need = db.scalars(select(Topic).where(Topic.status == "scored", Topic.embedding.is_(None))).all()
    if need:
        for t, v in zip(need, embedder.embed([t.title for t in need])):
            t.embedding = v
    cutoff = utcnow() - timedelta(days=s.topic_cooldown_days)
    recent = db.scalars(select(Topic).where(Topic.status.in_(("drafted", "processing")),
                                            Topic.last_drafted_at >= cutoff,
                                            Topic.embedding.is_not(None))).all()
    kept: list[tuple[int, list[float]]] = [(t.id, t.embedding) for t in recent]
    candidates = db.scalars(select(Topic).where(Topic.status == "scored")
                            .order_by(Topic.priority_score.desc(), Topic.id)).all()
    for t in candidates:
        oid, sim = most_similar(t.embedding, kept)
        if oid is not None and oid != t.id and sim >= embedder.topic_threshold:
            t.status, t.duplicate_of_id = "duplicate", oid
            t.skip_reason = f"benzer başlık işlendi/seçildi (benzerlik {sim:.2f})"
        else:
            kept.append((t.id, t.embedding))
    db.commit()
