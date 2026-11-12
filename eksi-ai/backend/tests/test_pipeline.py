from datetime import date

import pytest
from sqlalchemy import select

from app.db import session_scope
from app.embeddings import LocalEmbedder
from app.models import DailyRun, Draft, Topic
from app.services import pipeline, reports

from .conftest import feed, make_entry

TITLES = ["önemli faiz kararı", "önemli asgari ücret tartışması", "önemli kira artış sınırı",
          "önemli deprem vergileri", "sıradan magazin haberi"]


def run(llm, titles=TITLES, day=date(2026, 11, 11)):
    return pipeline.run_daily(day, llm=llm, embedder=LocalEmbedder(), fetcher=feed(titles))


def test_daily_run_reaches_target_and_reports(fresh_db, llm):
    run_id = run(llm)
    with session_scope() as db:
        r = db.get(DailyRun, run_id)
        assert (r.status, r.scanned, r.passed_qc, r.target) == ("completed", 5, 3, 3)
        drafts = db.scalars(select(Draft)).all()
        assert len(drafts) == 3 and all(d.status == "pending" for d in drafts)
        assert all(d.quality_score >= 80 and d.word_count >= 250 and len(d.sources) == 2 for d in drafts)
        # En yüksek puanlılar seçildi; düşük puanlı aday dokunulmadan kaldı.
        assert db.scalar(select(Topic).where(Topic.title == "sıradan magazin haberi")).status == "scored"
        rep = reports.daily_report(db, date(2026, 11, 11))
        assert "Tarih: 11.11.2026" in rep["text"] and "- Kalite kontrolünden geçen: 3" in rep["text"]
    # Ekşi Sözlük araştırmada kaynak olarak engelli.
    assert all(c[2] == ["eksisozluk.com"] for c in llm.calls if c[0] == "research")


def test_same_day_rerun_does_not_duplicate(fresh_db, llm):
    run(llm)
    run(llm)
    with session_scope() as db:
        assert len(db.scalars(select(Draft)).all()) == 3
        assert len(db.scalars(select(DailyRun)).all()) == 1


def test_low_quality_is_rewritten_then_passes(fresh_db, llm):
    llm.judge_scores = [60, 90]
    run(llm, ["önemli tek başlık"])
    with session_scope() as db:
        d = db.scalars(select(Draft)).one()
        assert (d.status, d.rewrite_count) == ("pending", 1) and d.quality_score >= 80
    assert ("write", "önemli tek başlık", True) in llm.calls


def test_persistently_low_quality_never_queued(fresh_db, llm):
    llm.judge_scores = [50, 55, 60]
    run(llm, ["önemli tek başlık"])
    with session_scope() as db:
        d = db.scalars(select(Draft)).one()
        assert (d.status, d.rewrite_count) == ("failed_quality", 2)
        assert reports.daily_report(db, date(2026, 11, 11))["passed_qc"] == 0


def test_insufficient_research_skips_instead_of_inventing(fresh_db, llm):
    llm.insufficient = {"önemli faiz kararı"}
    llm.no_sources = {"önemli kira artış sınırı"}
    llm.fail_on = {"önemli deprem vergileri"}
    run(llm, TITLES[:4])
    with session_scope() as db:
        by = {t.title: t for t in db.scalars(select(Topic))}
        assert by["önemli faiz kararı"].status == "skipped" and "yetersiz" in by["önemli faiz kararı"].skip_reason
        assert by["önemli kira artış sınırı"].status == "skipped"
        assert by["önemli deprem vergileri"].status == "skipped" and "hata" in by["önemli deprem vergileri"].skip_reason
        assert [d.topic.title for d in db.scalars(select(Draft))] == ["önemli asgari ücret tartışması"]
        assert db.scalars(select(DailyRun)).one().status == "completed"


def test_high_legal_risk_blocks_queue(fresh_db, llm):
    llm.risk = "yüksek"
    run(llm, ["önemli tek başlık"])
    with session_scope() as db:
        d = db.scalars(select(Draft)).one()
        assert d.status == "failed_quality" and d.quality_report["hukuki_risk"] == "yüksek"


def test_near_duplicate_text_is_blocked(fresh_db, llm):
    llm.write_text = make_entry("aynı metin")
    run(llm, ["önemli birinci konu", "önemli bambaşka ikinci mesele"])
    with session_scope() as db:
        statuses = sorted(d.status for d in db.scalars(select(Draft)))
        assert statuses == ["failed_quality", "pending"]


def test_copying_existing_entries_is_blocked(fresh_db, llm):
    with session_scope() as db:
        db.add(Topic(title="önemli elle konu", title_norm="önemli elle konu", source="manual",
                     existing_entries=make_entry("kopya")))
    llm.write_text = make_entry("kopya")
    run(llm, [])
    with session_scope() as db:
        d = db.scalars(select(Draft)).one()
        assert d.status == "failed_quality" and any("birebir" in b for b in d.quality_report["engeller"])


def test_similar_topic_not_repeated_next_day(fresh_db, llm):
    run(llm, ["önemli merkez bankası faiz kararı"])
    run(llm, ["önemli merkez bankasının faiz kararı açıklandı"], day=date(2026, 11, 12))
    with session_scope() as db:
        assert len(db.scalars(select(Draft)).all()) == 1
        t = db.scalar(select(Topic).where(Topic.title.like("%açıklandı")))
        assert t.status == "duplicate"


def test_concurrent_run_rejected(fresh_db, llm):
    with session_scope() as db:
        db.add(DailyRun(run_date=date(2026, 11, 11), status="running"))
    with pytest.raises(pipeline.RunInProgress):
        run(llm)
