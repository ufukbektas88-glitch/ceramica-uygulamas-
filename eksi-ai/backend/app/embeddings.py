"""Anlamsal benzerlik. Voyage anahtarı varsa gerçek embedding, yoksa yerel n-gram vektörü."""
import hashlib
import math
import re
from typing import Protocol

import httpx

from .config import get_settings
from .textutil import normalize_title, tr_lower


def _norm_long(text: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s]", " ", tr_lower(text)))


class Embedder(Protocol):
    name: str
    topic_threshold: float
    draft_threshold: float

    def embed(self, texts: list[str]) -> list[list[float]]: ...


class LocalEmbedder:
    """Karakter n-gram'larını sabit boyutlu vektöre hash'ler. Anlamı değil yüzey benzerliğini
    yakalar; Türkçe ekleri tolere eder. Dış servis gerektirmez."""

    name = "local"
    topic_threshold = 0.55
    draft_threshold = 0.60
    dim = 2048

    def _features(self, text: str) -> list[str]:
        t = normalize_title(text) if len(text) < 400 else _norm_long(text)
        if len(text) < 400:  # başlık: karakter n-gram
            t = f" {t} "
            return [t[i : i + n] for n in (3, 4, 5) for i in range(len(t) - n + 1)]
        # uzun metin: kısa/işlevsel sözcükler atılır, kök benzeri önekler ve ikilileri kullanılır
        w = [x[:6] for x in t.split() if len(x) > 4]
        return w + [f"{a}_{b}" for a, b in zip(w, w[1:])]

    def _one(self, text: str) -> list[float]:
        v = [0.0] * self.dim
        for f in self._features(text):
            h = int.from_bytes(hashlib.blake2b(f.encode(), digest_size=4).digest(), "big")
            v[h % self.dim] += 1.0
        v = [math.log1p(x) for x in v]
        norm = math.sqrt(sum(x * x for x in v)) or 1.0
        return [round(x / norm, 5) for x in v]

    def embed(self, texts):
        return [self._one(t) for t in texts]


class VoyageEmbedder:
    name = "voyage"
    topic_threshold = 0.86
    draft_threshold = 0.88

    def __init__(self, api_key: str, model: str):
        self.api_key, self.model = api_key, model

    def embed(self, texts):
        out: list[list[float]] = []
        for i in range(0, len(texts), 64):
            r = httpx.post(
                "https://api.voyageai.com/v1/embeddings",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={"input": [t[:16000] for t in texts[i : i + 64]], "model": self.model},
                timeout=60,
            )
            r.raise_for_status()
            out.extend(d["embedding"] for d in sorted(r.json()["data"], key=lambda d: d["index"]))
        return out


def get_embedder() -> Embedder:
    s = get_settings()
    use_voyage = s.embedding_provider == "voyage" or (s.embedding_provider == "auto" and s.voyage_api_key)
    e: Embedder = VoyageEmbedder(s.voyage_api_key, s.voyage_model) if use_voyage else LocalEmbedder()
    if s.topic_dup_threshold:
        e.topic_threshold = s.topic_dup_threshold
    if s.draft_dup_threshold:
        e.draft_threshold = s.draft_dup_threshold
    return e


def cosine(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0  # farklı sağlayıcıdan kalan vektörler karşılaştırılmaz
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    return dot / (na * nb) if na and nb else 0.0


def most_similar(vec: list[float], others: list[tuple[int, list[float]]]) -> tuple[int | None, float]:
    best_id, best = None, 0.0
    for oid, o in others:
        c = cosine(vec, o)
        if c > best:
            best_id, best = oid, c
    return best_id, best
