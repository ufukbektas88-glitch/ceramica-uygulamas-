"""Günlük iş akışı: tara -> puanla -> seç -> (araştır, analiz et, yaz, denetle) -> raporla."""
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import select, update

from ..config import get_settings
from ..db import session_scope
from ..embeddings import Embedder, get_embedder
from ..llm import LLM, ClaudeLLM, LLMError
from ..logutil import event
from ..models import DailyRun, Topic, utcnow
from . import discovery, generation, scoring

STALE_AFTER = timedelta(minutes=45)
_local_lock = threading.Lock()


class RunInProgress(Exception):
    pass


def today() -> date:
    return datetime.now(ZoneInfo(get_settings().timezone)).date()


def _claim_run(run_date: date) -> int:
    """Günün kaydını açar ya da kaldığı yerden devralır. Aynı anda iki çalıştırmaya izin vermez."""
    s = get_settings()
    with session_scope() as db:
        run = db.scalar(select(DailyRun).where(DailyRun.run_date == run_date).with_for_update())
        if run is None:
            run = DailyRun(run_date=run_date, target=s.daily_target)
            db.add(run)
        elif run.status == "running" and utcnow() - _aware(run.heartbeat_at) < STALE_AFTER:
            raise RunInProgress(f"{run_date} için çalışma zaten sürüyor.")
        else:
            run.status, run.error, run.finished_at = "running", None, None
            run.target = s.daily_target
        run.heartbeat_at = utcnow()
        db.flush()
        return run.id


def _aware(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=utcnow().tzinfo)


def _bump(run_id: int, **inc: int) -> None:
    with session_scope() as db:
        vals = {k: getattr(DailyRun, k) + v for k, v in inc.items() if v}
        vals["heartbeat_at"] = utcnow()
        db.execute(update(DailyRun).where(DailyRun.id == run_id).values(**vals))


def _process(topic_id: int, run_id: int, llm: LLM, embedder: Embedder, stop: threading.Event) -> None:
    if stop.is_set():
        return
    try:
        with session_scope() as db:
            out = generation.generate_for_topic(db, llm, embedder, topic_id, run_id)
    except Exception as e:
        with session_scope() as db:
            t = db.get(Topic, topic_id)
            t.status, t.skip_reason = "skipped", f"hata: {e}"[:500]
        event(f"Başlık #{topic_id} işlenemedi: {e}", level="ERROR", stage="generation", run_id=run_id,
              topic_id=topic_id)
        _bump(run_id, analyzed=1, skipped=1)
        if isinstance(e, LLMError) and "anahtar" in str(e):
            stop.set()  # yapılandırma hatası: kalan başlıkları boşa harcamayız
        return
    _bump(run_id, analyzed=1, researched=int(out.researched),
          produced=int(out.draft_id is not None), passed_qc=int(out.status == "drafted"),
          failed_qc=int(out.status == "failed_quality"), rewritten=int(out.rewrites > 0),
          skipped=int(out.status == "skipped"))


def run_daily(run_date: date | None = None, llm: LLM | None = None, embedder: Embedder | None = None,
              fetcher=discovery.fetch_feed) -> int:
    """Günlük hattı çalıştırır; run id döndürür. Aynı gün yeniden çağrılırsa hedefe kadar devam eder."""
    s = get_settings()
    run_date = run_date or today()
    if not _local_lock.acquire(blocking=False):
        raise RunInProgress("Bu süreçte bir çalışma zaten sürüyor.")
    try:
        run_id = _claim_run(run_date)
        try:
            llm = llm or ClaudeLLM()
            embedder = embedder or get_embedder()
            event(f"Günlük çalışma başladı ({run_date}), hedef {s.daily_target}.", stage="pipeline",
                  run_id=run_id)
            with session_scope() as db:
                discovery.expire_stale(db)
                scanned = discovery.discover(db, run_id, fetcher)
                # Yarıda kalmış başlıkları yeniden sıraya al.
                db.execute(update(Topic).where(Topic.status == "processing").values(status="scored"))
            with session_scope() as db:
                db.execute(update(DailyRun).where(DailyRun.id == run_id).values(scanned=scanned))
                scoring.score_pending(db, llm, embedder, run_id)

            stop = threading.Event()
            attempts_left = int(s.daily_target * s.candidate_multiplier)
            while not stop.is_set():
                with session_scope() as db:
                    run = db.get(DailyRun, run_id)
                    missing = run.target - run.passed_qc
                    attempts_left_now = attempts_left - run.analyzed
                    if missing <= 0 or attempts_left_now <= 0:
                        break
                    ids = db.scalars(
                        select(Topic.id).where(Topic.status == "scored",
                                               Topic.priority_score >= s.min_priority_score)
                        .order_by(Topic.priority_score.desc(), Topic.id)
                        .limit(min(missing, attempts_left_now))).all()
                if not ids:
                    break
                with ThreadPoolExecutor(max_workers=max(1, s.pipeline_concurrency)) as pool:
                    list(pool.map(lambda tid: _process(tid, run_id, llm, embedder, stop), ids))

            with session_scope() as db:
                run = db.get(DailyRun, run_id)
                run.status, run.finished_at = "completed", utcnow()
                run.input_tokens += llm.usage.input_tokens
                run.output_tokens += llm.usage.output_tokens
                if stop.is_set():
                    run.status, run.error = "failed", "Claude API yapılandırma hatası; günlükleri inceleyin."
                msg = f"Günlük çalışma bitti: {run.passed_qc}/{run.target} entry kuyruğa alındı."
            event(msg, stage="pipeline", run_id=run_id)
        except Exception as e:
            with session_scope() as db:
                run = db.get(DailyRun, run_id)
                run.status, run.error, run.finished_at = "failed", str(e)[:2000], utcnow()
            event(f"Günlük çalışma hata ile durdu: {e}", level="ERROR", stage="pipeline", run_id=run_id)
            raise
        return run_id
    finally:
        _local_lock.release()
