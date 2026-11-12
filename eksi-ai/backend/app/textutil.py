import re
import unicodedata

_TR_LOWER = str.maketrans({"I": "ı", "İ": "i"})


def tr_lower(s: str) -> str:
    return s.translate(_TR_LOWER).lower()


def normalize_title(s: str) -> str:
    s = unicodedata.normalize("NFKC", tr_lower(s))
    s = re.sub(r"[^\w\s]", " ", s)
    return re.sub(r"\s+", " ", s).strip()[:300]


def word_count(s: str) -> int:
    return len(s.split())


def shingles(s: str, n: int = 6) -> set[tuple[str, ...]]:
    w = normalize_title(s).split()
    return {tuple(w[i : i + n]) for i in range(max(0, len(w) - n + 1))}


def copied_ratio(text: str, reference: str, n: int = 6) -> float:
    """text içindeki n-kelimelik dizilerin ne kadarı reference'ta birebir geçiyor."""
    a = shingles(text, n)
    if not a:
        return 0.0
    return len(a & shingles(reference, n)) / len(a)
