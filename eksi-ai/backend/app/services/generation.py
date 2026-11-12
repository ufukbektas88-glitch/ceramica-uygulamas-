"""Tek başlık için uçtan uca üretim: araştırma -> analiz -> yazım -> kalite döngüsü."""
import random
import threading
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import get_settings
from ..embeddings import Embedder, most_similar
from ..llm import LLM, ResearchResult
from ..logutil import event
from ..models import Draft, Source, Topic, utcnow
from ..prompts import ANALYSIS_SCHEMA, ANALYSIS_SYSTEM, RESEARCH_SYSTEM, STRUCTURES, WRITER_SYSTEM
from ..textutil import word_count
from . import quality
from .eksi import research_blocked_domains

MAX_EXISTING_CHARS = 60000
_commit_lock = threading.Lock()


@dataclass
class Outcome:
    status: str  # drafted | failed_quality | skipped
    draft_id: int | None = None
    reason: str = ""
    researched: bool = False
    rewrites: int = 0


def do_research(llm: LLM, topic: Topic) -> ResearchResult:
    s = get_settings()
    user = f"Konu (Ekşi Sözlük başlığı): {topic.title}"
    if topic.source_title and topic.source_title != topic.title:
        user += f"\nKonunun çıktığı haber/trend: {topic.source_title}"
    if topic.summary:
        user += f"\nÖzet: {topic.summary}"
    return llm.research(system=RESEARCH_SYSTEM, user=user, model=s.model_research,
                        max_searches=s.research_max_searches, blocked_domains=research_blocked_domains())


def do_analysis(llm: LLM, topic: Topic, dossier: str) -> dict:
    s = get_settings()
    user = f"BAŞLIK: {topic.title}\n\nARAŞTIRMA DOSYASI:\n{dossier}\n\n"
    if topic.existing_entries:
        if len(topic.existing_entries) > MAX_EXISTING_CHARS:
            raise ValueError("Aktarılan mevcut entry metni çok uzun; kısaltıp yeniden deneyin.")
        user += f"BAŞLIKTAKİ MEVCUT ENTRY'LER (kullanıcı aktardı):\n{topic.existing_entries}"
    else:
        user += ("BAŞLIKTAKİ MEVCUT ENTRY'LER: aktarılmadı. Görüş haritasını araştırma dosyasının "
                 "'kamuoyundaki görüşler' bölümünden çıkar.")
    return llm.json(system=ANALYSIS_SYSTEM, user=user, schema=ANALYSIS_SCHEMA, model=s.model_research,
                    effort="high")


def do_write(llm: LLM, topic: Topic, analysis: dict, dossier: str, *, recent_openings: list[str],
             previous: str | None = None, feedback: str | None = None,
             instruction: str | None = None) -> str:
    s = get_settings()
    length = "500-800 kelime" if analysis.get("derinlik") == "derin" else "300-500 kelime"
    views = "\n".join(f"- ({g['yayginlik']}) {g['gorus']}" for g in analysis.get("gorusler", []))
    user = (
        f"BAŞLIK: {topic.title}\n\nBAŞLIKTAKİ MEVCUT GÖRÜŞLER:\n{views}\n\n"
        f"TEKRAR EDEN FİKİRLER (bunları yinelemeyeceksin):\n- "
        + "\n- ".join(analysis.get("tekrar_eden_fikirler", []))
        + f"\n\nSAVUNACAĞIN BAKIŞ AÇISI: {analysis.get('bakis_acisi')}\n"
        f"DAYANAĞI: {analysis.get('bakis_acisi_dayanagi')}\n\n"
        f"ARAŞTIRMA DOSYASI:\n{dossier}\n\n"
        f"Hedef uzunluk: {length}.\nBu yazı için kuruluş önerisi: {random.choice(STRUCTURES)}."
    )
    if recent_openings:
        user += "\n\nSon yazdığın entry'lerin açılışları (bunlara benzemeyen bir giriş kur):\n- " + \
                "\n- ".join(recent_openings)
    if topic.existing_entries:
        user += f"\n\nMEVCUT ENTRY'LER (tekrar etmemen için):\n{topic.existing_entries}"
    if instruction:
        user += f"\n\nKULLANICININ EK TALİMATI: {instruction}"
    if previous and feedback:
        user += (f"\n\nÖNCEKİ TASLAĞIN:\n{previous}\n\nEditör bu taslağı yetersiz buldu. Sorunlar:\n- {feedback}\n\n"
                 "Yama yapma; sorunları gidererek entry'yi baştan yaz.")
    return llm.text(system=WRITER_SYSTEM, user=user, model=s.model_writer, effort="high").strip()


def _recent_openings(db: Session, n: int = 6) -> list[str]:
    rows = db.scalars(select(Draft.content).where(Draft.status != "failed_quality")
                      .order_by(Draft.id.desc()).limit(n)).all()
    return [" ".join(c.split()[:18]) for c in rows if c]


def write_with_qc(db: Session, llm: LLM, embedder: Embedder, topic: Topic, analysis: dict, dossier: str,
                  n_sources: int, *, instruction: str | None = None, exclude_draft_id: int | None = None):
    """Yaz, denetle, eşik altındaysa geri bildirimle yeniden yaz. (içerik, QCResult, yeniden yazım sayısı)"""
    s = get_settings()
    openings = _recent_openings(db)
    content = do_write(llm, topic, analysis, dossier, recent_openings=openings, instruction=instruction)
    rewrites = 0
    while True:
        qc = quality.evaluate(db=db, llm=llm, embedder=embedder, title=topic.title, content=content,
                              analysis=analysis, dossier=dossier, existing_entries=topic.existing_entries,
                              n_sources=n_sources, exclude_draft_id=exclude_draft_id)
        # Kaynak eksikliği yeniden yazımla düzelmez; boşuna denemeyiz.
        fixable = not any("kaynak var" in b for b in qc.blocking)
        if qc.passed or rewrites >= s.max_rewrites or not fixable:
            return content, qc, rewrites
        rewrites += 1
        content = do_write(llm, topic, analysis, dossier, recent_openings=openings, previous=content,
                           feedback=qc.feedback(), instruction=instruction)


def apply_qc(d: Draft, content: str, qc, rewrites: int) -> None:
    d.content, d.word_count = content, word_count(content)
    d.quality_score, d.quality_report = qc.score, qc.report
    d.embedding, d.similarity_max, d.similar_to_draft_id = qc.embedding, qc.similarity_max, qc.similar_to
    d.rewrite_count = (d.rewrite_count or 0) + rewrites
    d.status = "pending" if qc.passed else "failed_quality"


def generate_for_topic(db: Session, llm: LLM, embedder: Embedder, topic_id: int,
                       run_id: int | None = None) -> Outcome:
    topic = db.get(Topic, topic_id)
    topic.status = "processing"
    db.commit()
    log = dict(stage="generation", run_id=run_id, topic_id=topic.id)

    research = do_research(llm, topic)
    if not research.dossier or not research.sources:
        return _skip(db, topic, "araştırma sonuç vermedi (kaynak bulunamadı)", log)

    analysis = do_analysis(llm, topic, research.dossier)
    if not analysis.get("arastirma_yeterli"):
        return _skip(db, topic, "araştırma yetersiz: " + (analysis.get("yetersizlik_nedeni") or ""), log)

    content, qc, rewrites = write_with_qc(db, llm, embedder, topic, analysis, research.dossier,
                                          len(research.sources))
    d = Draft(topic_id=topic.id, run_id=run_id, analysis=analysis, perspective=analysis.get("bakis_acisi"),
              research_dossier=research.dossier,
              sources=[Source(url=x["url"], title=x.get("title"), page_age=x.get("page_age"),
                              cited=bool(x.get("cited"))) for x in research.sources[:25]])
    # Eşzamanlı işlenen başlıklar birbirinin taslağını göremez; kayıttan hemen önce benzerliği
    # kilit altında yeniden ölçeriz ki aynı gün iki ikiz metin kuyruğa giremesin.
    with _commit_lock:
        sim_id, sim = most_similar(qc.embedding, quality.previous_draft_vectors(db))
        if sim >= embedder.draft_threshold and qc.passed:
            msg = f"Aynı çalışmada üretilen #{sim_id} numaralı taslakla fazla benzer (benzerlik {sim:.2f})."
            qc.passed, qc.similarity_max, qc.similar_to = False, sim, sim_id
            qc.blocking.append(msg)
            qc.report["engeller"] = qc.blocking
        apply_qc(d, content, qc, rewrites)
        db.add(d)
        topic.status, topic.last_drafted_at = "drafted", utcnow()
        db.commit()
    event(f"'{topic.title}': {d.status}, puan {qc.score}, {rewrites} yeniden yazım.", **log,
          data={"draft_id": d.id, "engeller": qc.blocking})
    return Outcome(status="drafted" if qc.passed else "failed_quality", draft_id=d.id, researched=True,
                   rewrites=rewrites)


def _skip(db: Session, topic: Topic, reason: str, log: dict) -> Outcome:
    topic.status, topic.skip_reason = "skipped", reason[:500]
    db.commit()
    event(f"'{topic.title}' atlandı: {reason}", **log)
    return Outcome(status="skipped", reason=reason)


def regenerate_draft(db: Session, llm: LLM, embedder: Embedder, draft_id: int,
                     instruction: str | None = None) -> Draft:
    """Mevcut araştırma ve analizle entry'yi baştan yazar (yeni araştırma maliyeti yok)."""
    d = db.get(Draft, draft_id)
    content, qc, rewrites = write_with_qc(db, llm, embedder, d.topic, d.analysis or {},
                                          d.research_dossier or "", len(d.sources),
                                          instruction=instruction, exclude_draft_id=d.id)
    apply_qc(d, content, qc, rewrites + 1)
    d.user_edited, d.approved_at, d.reject_reason = False, None, None
    db.commit()
    event(f"Taslak #{d.id} yeniden üretildi: puan {qc.score}.", stage="generation", topic_id=d.topic_id)
    return d


def recheck_draft(db: Session, llm: LLM, embedder: Embedder, draft_id: int) -> Draft:
    """Kullanıcı düzenlemesinden sonra kalite kontrolünü yeniden çalıştırır (metni değiştirmez)."""
    d = db.get(Draft, draft_id)
    qc = quality.evaluate(db=db, llm=llm, embedder=embedder, title=d.topic.title, content=d.content,
                          analysis=d.analysis or {}, dossier=d.research_dossier or "",
                          existing_entries=d.topic.existing_entries, n_sources=len(d.sources),
                          exclude_draft_id=d.id)
    keep = d.status
    apply_qc(d, d.content, qc, 0)
    if keep in ("approved", "published", "rejected"):  # kullanıcının kararı korunur
        d.status = keep
    db.commit()
    return d
