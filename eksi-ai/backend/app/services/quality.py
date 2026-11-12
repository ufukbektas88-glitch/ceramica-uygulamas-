"""Kalite kontrol: kural tabanlı denetimler + editör modeli. 80 altı kuyruğa giremez."""
from dataclasses import dataclass, field

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import get_settings
from ..embeddings import Embedder, most_similar
from ..llm import LLM
from ..models import Draft
from ..prompts import BANNED_PHRASES, JUDGE_MAX, JUDGE_SCHEMA, JUDGE_SYSTEM
from ..textutil import copied_ratio, tr_lower, word_count


@dataclass
class QCResult:
    score: int
    passed: bool
    blocking: list[str] = field(default_factory=list)  # puandan bağımsız engeller
    report: dict = field(default_factory=dict)
    embedding: list[float] | None = None
    similarity_max: float = 0.0
    similar_to: int | None = None

    def feedback(self) -> str:
        parts = list(self.blocking) + self.report.get("sorunlar", [])
        if self.report.get("dayanaksiz_iddialar"):
            parts.append("Araştırma dosyasında dayanağı olmayan iddialar: "
                         + "; ".join(self.report["dayanaksiz_iddialar"]))
        if self.report.get("duzeltme_talimati"):
            parts.append(self.report["duzeltme_talimati"])
        return "\n- ".join(parts)


def previous_draft_vectors(db: Session, exclude_id: int | None = None, limit: int = 1500):
    q = select(Draft.id, Draft.embedding).where(
        Draft.embedding.is_not(None), Draft.status.in_(("pending", "approved", "published"))
    ).order_by(Draft.id.desc()).limit(limit)
    return [(i, e) for i, e in db.execute(q) if i != exclude_id]


def evaluate(*, db: Session, llm: LLM, embedder: Embedder, title: str, content: str, analysis: dict,
             dossier: str, existing_entries: str | None, n_sources: int,
             exclude_draft_id: int | None = None) -> QCResult:
    s = get_settings()
    blocking: list[str] = []
    notes: list[str] = []
    penalty = 0

    wc = word_count(content)
    if wc < s.min_words:
        blocking.append(f"Metin {wc} kelime; en az {s.min_words} kelime olmalı.")
    if wc > s.max_words:
        penalty += 5
        notes.append(f"Metin {wc} kelime; {s.max_words} sınırını aşıyor, sıkılaştır.")
    low = tr_lower(content)
    hits = [p for p in BANNED_PHRASES if p in low]
    if hits:
        penalty += min(10, 3 * len(hits))
        notes.append("Kalıp ifadeleri çıkar: " + ", ".join(hits))
    if any(m in content for m in ("**", "\n#", "\n- ", "\n* ")):
        penalty += 3
        notes.append("Markdown biçimi (kalın, başlık, madde) kullanma; düz metin yaz.")
    if n_sources < s.min_sources:
        blocking.append(f"Yalnızca {n_sources} kaynak var; en az {s.min_sources} gerekli.")
    if existing_entries:
        ratio = copied_ratio(content, existing_entries)
        if ratio > 0.03:
            blocking.append(f"Mevcut entry'lerle birebir örtüşen ifadeler var (%{ratio * 100:.0f}); "
                            "bu bölümleri tamamen kendi kuruluşunla yeniden yaz.")

    vec = embedder.embed([content])[0]
    sim_id, sim = most_similar(vec, previous_draft_vectors(db, exclude_draft_id))
    if sim >= embedder.draft_threshold:
        blocking.append(f"Daha önce üretilen #{sim_id} numaralı taslakla fazla benzer (benzerlik {sim:.2f}); "
                        "farklı bir açı ve kuruluş kullan.")

    user = (f"BAŞLIK: {title}\n\nSAVUNULMASI İSTENEN BAKIŞ AÇISI: {analysis.get('bakis_acisi', '')}\n\n"
            f"BAŞLIKTA TEKRAR EDEN FİKİRLER:\n- " + "\n- ".join(analysis.get("tekrar_eden_fikirler", []))
            + f"\n\nARAŞTIRMA DOSYASI:\n{dossier}\n\nDEĞERLENDİRİLECEK ENTRY:\n{content}")
    j = llm.json(system=JUDGE_SYSTEM, user=user, schema=JUDGE_SCHEMA, model=s.model_judge, effort="medium")
    criteria = {k: max(0, min(mx, int(j.get(k, 0)))) for k, mx in JUDGE_MAX.items()}
    if j.get("hukuki_risk") == "yüksek":
        blocking.append("Hukuki/kişilik hakları riski yüksek; riskli ifadeleri çıkar.")
    score = max(0, sum(criteria.values()) - penalty)
    report = {
        "olcutler": criteria, "olcut_tavanlari": JUDGE_MAX, "ceza": penalty, "kelime": wc,
        "hukuki_risk": j.get("hukuki_risk"), "kalip_ifadeler": hits,
        "dayanaksiz_iddialar": j.get("dayanaksiz_iddialar", []),
        "sorunlar": notes + j.get("sorunlar", []), "guclu_yanlar": j.get("guclu_yanlar", []),
        "duzeltme_talimati": j.get("duzeltme_talimati", ""), "engeller": blocking,
        "benzerlik": round(sim, 3), "benzer_taslak": sim_id, "benzerlik_yontemi": embedder.name,
    }
    return QCResult(score=score, passed=score >= s.quality_threshold and not blocking, blocking=blocking,
                    report=report, embedding=vec, similarity_max=sim, similar_to=sim_id)
