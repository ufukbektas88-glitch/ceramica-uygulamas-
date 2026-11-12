"""Hem standart logger'a hem veritabanına yazan işlem kaydı."""
import logging

from .db import session_scope
from .models import LogEvent

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("eksi_ai")


def event(message: str, *, level: str = "INFO", stage: str = "", run_id: int | None = None,
          topic_id: int | None = None, data: dict | None = None) -> None:
    log.log(getattr(logging, level, logging.INFO), "[%s] %s", stage, message)
    try:
        with session_scope() as s:
            s.add(LogEvent(level=level, stage=stage, run_id=run_id, topic_id=topic_id,
                           message=message[:4000], data=data))
    except Exception:  # loglama asıl işi asla düşürmemeli
        log.exception("log_events tablosuna yazılamadı")
