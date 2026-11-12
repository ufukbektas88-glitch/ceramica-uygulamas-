from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..config import get_settings
from ..models import DailyRun, Draft, Topic

QUEUED = ("pending", "approved", "published")


def _day_bounds(d: date):
    tz = ZoneInfo(get_settings().timezone)
    start = datetime.combine(d, time.min, tzinfo=tz)
    return start, start + timedelta(days=1)


def _draft_brief(d: Draft) -> dict:
    return {"id": d.id, "title": d.topic.title, "quality_score": d.quality_score,
            "word_count": d.word_count, "status": d.status}


def daily_report(db: Session, d: date) -> dict:
    run = db.scalar(select(DailyRun).where(DailyRun.run_date == d))
    start, end = _day_bounds(d)
    in_day = (Draft.created_at >= start, Draft.created_at < end)
    drafts = db.scalars(select(Draft).where(*in_day)).all()
    queued = [x for x in drafts if x.status in QUEUED]
    published = db.scalar(select(func.count()).select_from(Draft).where(
        Draft.published_at >= start, Draft.published_at < end)) or 0
    avg = round(sum(x.quality_score or 0 for x in queued) / len(queued), 1) if queued else None
    top = sorted(queued, key=lambda x: x.quality_score or 0, reverse=True)[:5]
    data = {
        "date": d.isoformat(),
        "run_status": run.status if run else "yok",
        "target": run.target if run else get_settings().daily_target,
        "scanned": run.scanned if run else 0,
        "analyzed": run.analyzed if run else 0,
        "researched": run.researched if run else 0,
        "produced": len(drafts),
        "passed_qc": len(queued),
        "rewritten": sum(1 for x in drafts if x.rewrite_count),
        "failed_qc": sum(1 for x in drafts if x.status == "failed_quality"),
        "pending": sum(1 for x in drafts if x.status == "pending"),
        "published": published,
        "avg_quality": avg,
        "input_tokens": run.input_tokens if run else 0,
        "output_tokens": run.output_tokens if run else 0,
        "error": run.error if run else None,
        "top5": [_draft_brief(x) for x in top],
    }
    data["text"] = render_text(data)
    return data


def render_text(r: dict) -> str:
    d = date.fromisoformat(r["date"])
    lines = [
        f"Tarih: {d:%d.%m.%Y}", "",
        f"- Taranan başlık sayısı: {r['scanned']}",
        f"- Analiz edilen başlık sayısı: {r['analyzed']}",
        f"- Araştırması tamamlanan başlık sayısı: {r['researched']}",
        f"- Üretilen entry sayısı: {r['produced']}",
        f"- Kalite kontrolünden geçen: {r['passed_qc']}",
        f"- Yeniden yazılması gereken: {r['rewritten']} (kuyruğa alınmayan: {r['failed_qc']})",
        f"- Onay bekleyen: {r['pending']}",
        f"- Yayınlanan: {r['published']}",
        f"- Günlük ortalama kalite puanı: {r['avg_quality'] if r['avg_quality'] is not None else '-'}",
        "", "Günün en iyi 5 entry'si:",
    ]
    lines += [f"{i}. {t['title']} — {t['quality_score']} puan, {t['word_count']} kelime"
              for i, t in enumerate(r["top5"], 1)] or ["(bugün kuyruğa giren entry yok)"]
    return "\n".join(lines)


def overview(db: Session, today: date) -> dict:
    start, end = _day_bounds(today)
    count = lambda *w: db.scalar(select(func.count()).select_from(Draft).where(*w)) or 0  # noqa: E731
    run = db.scalar(select(DailyRun).where(DailyRun.run_date == today))
    target = run.target if run else get_settings().daily_target
    today_n = count(Draft.created_at >= start, Draft.created_at < end, Draft.status.in_(QUEUED))
    avg = db.scalar(select(func.avg(Draft.quality_score)).where(Draft.status.in_(QUEUED)))
    return {
        "today_produced": today_n,
        "total_produced": count(Draft.status.in_(QUEUED)),
        "researching": db.scalar(select(func.count()).select_from(Topic)
                                 .where(Topic.status == "processing")) or 0,
        "pending": count(Draft.status == "pending"),
        "approved": count(Draft.status == "approved"),
        "published": count(Draft.status == "published"),
        "avg_quality": round(float(avg), 1) if avg is not None else None,
        "target": target,
        "target_pct": round(100 * today_n / target) if target else 0,
        "run_status": run.status if run else "bekliyor",
        "run_error": run.error if run else None,
    }


def weekly(db: Session, today: date) -> list[dict]:
    return [{k: v for k, v in daily_report(db, today - timedelta(days=i)).items()
             if k not in ("text", "top5")} for i in range(6, -1, -1)]


def categories(db: Session) -> list[dict]:
    rows = db.execute(
        select(Topic.category, func.count(Draft.id), func.avg(Draft.quality_score))
        .join(Draft, Draft.topic_id == Topic.id).where(Draft.status.in_(QUEUED))
        .group_by(Topic.category).order_by(func.count(Draft.id).desc())).all()
    return [{"category": c, "count": n, "avg_quality": round(float(a), 1) if a is not None else None}
            for c, n, a in rows]


def similarity(db: Session) -> dict:
    rows = db.scalars(select(Draft).where(Draft.similarity_max.is_not(None))
                      .order_by(Draft.similarity_max.desc()).limit(15)).all()
    dup_topics = db.scalar(select(func.count()).select_from(Topic).where(Topic.status == "duplicate")) or 0
    avg = db.scalar(select(func.avg(Draft.similarity_max)).where(Draft.status.in_(QUEUED)))
    return {"duplicate_topics_blocked": dup_topics,
            "avg_similarity": round(float(avg), 3) if avg is not None else None,
            "most_similar": [{**_draft_brief(d), "similarity": round(d.similarity_max, 3),
                              "similar_to": d.similar_to_draft_id} for d in rows]}
