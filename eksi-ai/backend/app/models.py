from datetime import date, datetime, timezone

from sqlalchemy import JSON, Date, DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


TOPIC_STATUSES = ("discovered", "scored", "processing", "drafted", "skipped", "duplicate")
DRAFT_STATUSES = ("pending", "approved", "rejected", "published", "failed_quality")
CATEGORIES = (
    "siyaset", "ekonomi", "teknoloji", "bilim", "kültür", "sanat", "spor",
    "gündelik yaşam", "toplum", "dünya", "diğer",
)


class Topic(Base):
    __tablename__ = "topics"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(300))
    title_norm: Mapped[str] = mapped_column(String(300), unique=True, index=True)
    source_title: Mapped[str | None] = mapped_column(Text)
    source: Mapped[str] = mapped_column(String(40), default="manual")
    source_url: Mapped[str | None] = mapped_column(Text)
    summary: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(40), default="diğer", index=True)
    status: Mapped[str] = mapped_column(String(20), default="discovered", index=True)
    skip_reason: Mapped[str | None] = mapped_column(Text)
    priority_score: Mapped[int | None] = mapped_column(Integer, index=True)
    scores: Mapped[dict | None] = mapped_column(JSON)
    score_rationale: Mapped[str | None] = mapped_column(Text)
    # Kullanıcının başlıktan elle aktardığı mevcut entry'ler / notlar (otomatik kazıma yok).
    existing_entries: Mapped[str | None] = mapped_column(Text)
    embedding: Mapped[list | None] = mapped_column(JSON)
    duplicate_of_id: Mapped[int | None] = mapped_column(ForeignKey("topics.id"))
    first_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    last_drafted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    drafts: Mapped[list["Draft"]] = relationship(back_populates="topic")


class DailyRun(Base):
    __tablename__ = "daily_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    run_date: Mapped[date] = mapped_column(Date, unique=True, index=True)
    status: Mapped[str] = mapped_column(String(20), default="running")  # running|completed|failed
    target: Mapped[int] = mapped_column(Integer, default=50)
    scanned: Mapped[int] = mapped_column(Integer, default=0)
    analyzed: Mapped[int] = mapped_column(Integer, default=0)
    researched: Mapped[int] = mapped_column(Integer, default=0)
    produced: Mapped[int] = mapped_column(Integer, default=0)
    passed_qc: Mapped[int] = mapped_column(Integer, default=0)
    rewritten: Mapped[int] = mapped_column(Integer, default=0)
    failed_qc: Mapped[int] = mapped_column(Integer, default=0)
    skipped: Mapped[int] = mapped_column(Integer, default=0)
    input_tokens: Mapped[int] = mapped_column(Integer, default=0)
    output_tokens: Mapped[int] = mapped_column(Integer, default=0)
    error: Mapped[str | None] = mapped_column(Text)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    heartbeat_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Draft(Base):
    __tablename__ = "drafts"

    id: Mapped[int] = mapped_column(primary_key=True)
    topic_id: Mapped[int] = mapped_column(ForeignKey("topics.id"), index=True)
    run_id: Mapped[int | None] = mapped_column(ForeignKey("daily_runs.id"), index=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)
    analysis: Mapped[dict | None] = mapped_column(JSON)
    perspective: Mapped[str | None] = mapped_column(Text)
    research_dossier: Mapped[str | None] = mapped_column(Text)
    content: Mapped[str] = mapped_column(Text, default="")
    word_count: Mapped[int] = mapped_column(Integer, default=0)
    quality_score: Mapped[int | None] = mapped_column(Integer)
    quality_report: Mapped[dict | None] = mapped_column(JSON)
    similarity_max: Mapped[float | None] = mapped_column(Float)
    similar_to_draft_id: Mapped[int | None] = mapped_column(Integer)
    rewrite_count: Mapped[int] = mapped_column(Integer, default=0)
    embedding: Mapped[list | None] = mapped_column(JSON)
    user_edited: Mapped[bool] = mapped_column(default=False)
    reject_reason: Mapped[str | None] = mapped_column(Text)
    published_url: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    topic: Mapped[Topic] = relationship(back_populates="drafts")
    sources: Mapped[list["Source"]] = relationship(
        back_populates="draft", cascade="all, delete-orphan", order_by="Source.id"
    )


class Source(Base):
    __tablename__ = "sources"

    id: Mapped[int] = mapped_column(primary_key=True)
    draft_id: Mapped[int] = mapped_column(ForeignKey("drafts.id", ondelete="CASCADE"), index=True)
    url: Mapped[str] = mapped_column(Text)
    title: Mapped[str | None] = mapped_column(Text)
    page_age: Mapped[str | None] = mapped_column(String(80))
    cited: Mapped[bool] = mapped_column(default=False)

    draft: Mapped[Draft] = relationship(back_populates="sources")


class LogEvent(Base):
    __tablename__ = "log_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
    level: Mapped[str] = mapped_column(String(10), default="INFO")
    stage: Mapped[str] = mapped_column(String(30), default="")
    run_id: Mapped[int | None] = mapped_column(Integer, index=True)
    topic_id: Mapped[int | None] = mapped_column(Integer)
    message: Mapped[str] = mapped_column(Text)
    data: Mapped[dict | None] = mapped_column(JSON)


Index("ix_drafts_status_created", Draft.status, Draft.created_at)
