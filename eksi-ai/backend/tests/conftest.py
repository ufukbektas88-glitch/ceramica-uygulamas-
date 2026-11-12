import hashlib
import os

os.environ.setdefault("DATABASE_URL", os.environ.get(
    "TEST_DATABASE_URL", "postgresql+psycopg://eksi:eksi@localhost:5432/eksi_ai_test"))
os.environ["PANEL_TOKEN"] = ""
os.environ["ANTHROPIC_API_KEY"] = ""
os.environ["VOYAGE_API_KEY"] = ""
os.environ["DAILY_TARGET"] = "3"
os.environ["PIPELINE_CONCURRENCY"] = "2"

import pytest  # noqa: E402

from app import db as dbmod  # noqa: E402
from app.llm import ResearchResult, Usage  # noqa: E402
from app.models import Base  # noqa: E402

FILLER = ("enflasyon sepetindeki ağırlıklar değişince manşet rakamı da değişiyor ve bunu kimse "
          "konuşmuyor çünkü hesap yöntemi sıkıcı bulunuyor ").split()


def make_entry(seed: str, n: int = 320) -> str:
    """Başlığa özgü, birbirine benzemeyen uzun metin üretir."""
    tok = lambda i: hashlib.md5(f"{seed}{i}".encode()).hexdigest()[:9]  # noqa: E731
    words = [tok(i) if i % 3 == 0 else FILLER[i % len(FILLER)] for i in range(n)]
    return " ".join(words)


class FakeLLM:
    """Claude yerine geçen deterministik sahte istemci."""

    def __init__(self):
        self.usage = Usage()
        self.judge_scores = []  # sırayla tüketilir; bitince 88
        self.insufficient = set()
        self.no_sources = set()
        self.fail_on = set()
        self.calls = []
        self.write_text = None

    @staticmethod
    def _title(user: str) -> str:
        line = next(l for l in user.splitlines() if l.startswith(("BAŞLIK:", "Konu")))
        return line.split(":", 1)[1].strip()

    def research(self, *, system, user, model, max_searches, blocked_domains):
        title = self._title(user)
        self.calls.append(("research", title, blocked_domains))
        if title in self.fail_on:
            raise RuntimeError("ağ hatası")
        if title in self.no_sources:
            return ResearchResult(dossier="bulunamadı", sources=[])
        return ResearchResult(dossier=f"OLGULAR: {title} hakkında tüik ekim 2026 verisi.", sources=[
            {"url": f"https://data.tuik.gov.tr/{abs(hash(title))}", "title": "TÜİK", "page_age": None, "cited": True},
            {"url": f"https://www.tcmb.gov.tr/{abs(hash(title))}", "title": "TCMB", "page_age": None, "cited": False},
        ])

    def json(self, *, system, user, schema, model, effort="medium"):
        props = schema["properties"]
        if "items" in props:  # puanlama
            items = []
            for line in user.splitlines()[1:]:
                tid = int(line[1 : line.index("]")])
                title = line.split(") ", 1)[1].split(" — ")[0]
                base = 90 if "önemli" in title else 70
                items.append({"id": tid, "baslik": title.lower(), "kategori": "ekonomi", "guncellik": base,
                              "tartisma": base, "arastirilabilirlik": base, "ozgunluk": base,
                              "cesitlilik": base, "bilgi_degeri": base, "tekrar": False, "gerekce": "test"})
            return {"items": items}
        title = self._title(user)
        if "arastirma_yeterli" in props:
            ok = title not in self.insufficient
            return {"arastirma_yeterli": ok, "yetersizlik_nedeni": "" if ok else "kaynak yok",
                    "gorusler": [{"gorus": "herkes zam diyor", "yayginlik": "hâkim"}],
                    "tekrar_eden_fikirler": ["zam az"], "ortak_noktalar": [], "zit_gorusler": [],
                    "eksik_konular": ["sepet ağırlıkları"], "dogrulanmis_bilgiler": [], "varsayimlar": [],
                    "yanlis_bilgiler": [], "bakis_acisi": f"{title} için sepet ağırlığı açısı",
                    "bakis_acisi_dayanagi": "tüik", "derinlik": "standart"}
        score = self.judge_scores.pop(0) if self.judge_scores else 88
        self.calls.append(("judge", title, score))
        return {"ozgunluk": score * 20 // 100, "derinlik": score * 20 // 100, "dogruluk": score * 20 // 100,
                "dil": score * 15 // 100, "ilgi": 10, "yogunluk": 5, "hukuk": 10,
                "hukuki_risk": getattr(self, "risk", "düşük"), "dayanaksiz_iddialar": [],
                "sorunlar": ["yüzeysel"] if score < 80 else [], "guclu_yanlar": [],
                "duzeltme_talimati": "derinleştir"}

    def text(self, *, system, user, model, effort="high"):
        title = self._title(user)
        self.calls.append(("write", title, "ÖNCEKİ TASLAĞIN" in user))
        if self.write_text:
            return self.write_text
        return make_entry(title + ("v2" if "ÖNCEKİ TASLAĞIN" in user else ""))


@pytest.fixture()
def fresh_db():
    engine = dbmod.init_engine(os.environ["DATABASE_URL"])
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield
    engine.dispose()


@pytest.fixture()
def llm():
    return FakeLLM()


def feed(titles):
    return lambda url, limit: [{"title": t, "summary": "", "url": "https://ornek.test/x", "source": "rss"}
                               for t in titles] if "bbc" in url else []
