"""Zamanlayıcı süreci: panel kapalıyken de günlük hattı çalıştırır. `python -m app.worker`"""
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger

from sqlalchemy import select

from .config import get_settings
from .db import session_scope
from .logutil import event, log
from .models import DailyRun
from .services import pipeline


def job() -> None:
    try:
        pipeline.run_daily()
    except pipeline.RunInProgress as e:
        log.info("%s", e)
    except Exception as e:  # hata kaydedildi; zamanlayıcı ayakta kalmalı
        log.error("Günlük çalışma başarısız: %s", e)


def retry_job() -> None:
    with session_scope() as db:
        run = db.scalar(select(DailyRun).where(DailyRun.run_date == pipeline.today()))
        done = run is not None and run.passed_qc >= run.target
    if not done:
        job()


def main() -> None:
    s = get_settings()
    sched = BlockingScheduler(timezone=s.timezone)
    sched.add_job(job, CronTrigger(hour=s.daily_run_hour, minute=s.daily_run_minute), id="daily",
                  max_instances=1, coalesce=True, misfire_grace_time=6 * 3600)
    # Gün içinde hedefe ulaşılamadıysa (ör. kaynak hatası) öğleden sonra bir kez daha dener.
    sched.add_job(retry_job, CronTrigger(hour=(s.daily_run_hour + 8) % 24, minute=s.daily_run_minute),
                  id="daily-retry", max_instances=1, coalesce=True)
    event(f"Zamanlayıcı başladı: her gün {s.daily_run_hour:02d}:{s.daily_run_minute:02d} ({s.timezone}).",
          stage="worker")
    sched.start()


if __name__ == "__main__":
    main()
