from contextlib import contextmanager
from types import SimpleNamespace as NS

import pytest

from app.config import get_settings
from app.embeddings import LocalEmbedder, cosine
from app.llm import ClaudeLLM, LLMError, LLMRefused


class StubClient:
    """anthropic.Anthropic yerine: sıradaki yanıtı döndüren akış."""

    def __init__(self, responses):
        self.responses, self.requests = list(responses), []
        self.beta = NS(messages=NS(stream=self._stream))
        self.messages = NS(stream=self._stream)

    @contextmanager
    def _stream(self, **kw):
        self.requests.append(kw)
        yield NS(get_final_message=lambda: self.responses.pop(0))


def msg(content, stop="end_turn"):
    return NS(content=content, stop_reason=stop, usage=NS(input_tokens=10, output_tokens=5))


def text(t, citations=None):
    return NS(type="text", text=t, citations=citations)


def test_research_resumes_pause_turn_and_harvests_real_sources():
    results = NS(type="web_search_tool_result", content=[
        NS(url="https://a.test/1", title="A", page_age="2 Kasım 2026"),
        NS(url="https://b.test/2", title="B", page_age=None)])
    failed = NS(type="web_search_tool_result", content=NS(error_code="max_uses_exceeded"))
    client = StubClient([
        msg([NS(type="server_tool_use")], stop="pause_turn"),
        msg([results, failed, text("dosya", [NS(url="https://b.test/2", title="B")])]),
    ])
    llm = ClaudeLLM(client)
    r = llm.research(system="s", user="u", model="m", max_searches=4, blocked_domains=["eksisozluk.com"])
    assert r.dossier == "dosya"
    assert [(s["url"], s["cited"]) for s in r.sources] == [("https://b.test/2", True), ("https://a.test/1", False)]
    first, second = client.requests
    assert first["tools"][0]["blocked_domains"] == ["eksisozluk.com"] and first["fallbacks"] == "default"
    assert [m["role"] for m in second["messages"]] == ["user", "assistant"]  # "devam et" mesajı eklenmez
    assert llm.usage.input_tokens == 20


def test_refusal_and_truncation_raise():
    with pytest.raises(LLMRefused):
        ClaudeLLM(StubClient([msg([], stop="refusal")])).text(system="s", user="u", model="m")
    with pytest.raises(LLMError):
        ClaudeLLM(StubClient([msg([text("yarım")], stop="max_tokens")])).text(system="s", user="u", model="m")


def test_json_uses_structured_output():
    client = StubClient([msg([text('{"a": 1}')])])
    assert ClaudeLLM(client).json(system="s", user="u", schema={"type": "object"}, model="m") == {"a": 1}
    assert client.requests[0]["output_config"]["format"]["type"] == "json_schema"


def test_missing_api_key_is_explicit():
    assert get_settings().anthropic_api_key == ""
    with pytest.raises(LLMError):
        ClaudeLLM()


A = """merkez bankasının faiz kararını herkes enflasyon üzerinden okuyor ama asıl hikâye bankaların mevduat
tarafında. politika faizi yüzde kırkın üzerindeyken mevduata verilen oran haftalarca geriden geldi, çünkü
kredi büyüme sınırı yüzünden bankaların yeni kaynağa ihtiyacı yoktu. tasarruf sahibi dövize dönmedi, çünkü
kur korumalı hesaplardan çıkış takvimi belliydi. sonuçta parasal aktarım faizden çok miktar kısıtlarıyla
işledi ve bunu kimse konuşmadı. tüik verisi açıklandığında manşet enflasyon geriledi ama çekirdek gösterge
hizmet kaleminde yapışkan kaldı; kira ve eğitim kalemleri endeksleme davranışı nedeniyle geriden geliyor."""
B = """süper lig'de hakem tartışması her sezon aynı cümlelerle yapılıyor, oysa veri başka bir şey söylüyor.
var incelemesine giden pozisyonların dağılımına bakınca büyük kulüplerle diğerleri arasındaki fark karar
sayısında değil, inceleme süresinde çıkıyor. uzun inceleme tribün baskısının yüksek olduğu maçlarda
yoğunlaşıyor. federasyonun açıkladığı raporda hata oranı düşmüş görünüyor ama tanım değiştiği için önceki
sezonlarla kıyaslamak mümkün değil. kulüp başkanlarının açıklamaları ise puan kaybından sonraki ilk kırk
sekiz saatte kümeleniyor; yani mesele adaletten çok taraftar yönetimi gibi duruyor."""
A2 = A.replace("herkes", "çoğu kişi").replace("asıl hikâye", "esas mesele").replace("kimse konuşmadı", "pek konuşulmadı")


def test_local_embedder_separates_topics_and_catches_light_paraphrase():
    e = LocalEmbedder()
    a, b, a2 = e.embed([A, B, A2])
    assert cosine(a, b) < 0.25
    assert cosine(a, a2) > e.draft_threshold
