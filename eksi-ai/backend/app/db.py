from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import get_settings


class Base(DeclarativeBase):
    pass


_engine = None
_Session = None


def init_engine(url: str | None = None):
    global _engine, _Session
    url = url or get_settings().database_url
    kwargs = {"pool_pre_ping": True}
    if url.startswith("sqlite"):
        kwargs["connect_args"] = {"check_same_thread": False}
    _engine = create_engine(url, **kwargs)
    _Session = sessionmaker(_engine, expire_on_commit=False)
    return _engine


def get_engine():
    return _engine or init_engine()


def new_session():
    get_engine()
    return _Session()


@contextmanager
def session_scope():
    s = new_session()
    try:
        yield s
        s.commit()
    except Exception:
        s.rollback()
        raise
    finally:
        s.close()


def get_db():
    s = new_session()
    try:
        yield s
    finally:
        s.close()
