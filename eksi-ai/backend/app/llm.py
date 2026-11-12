"""Claude API katmanı. Diğer modüller yalnızca LLM arayüzünü görür; testlerde sahtesi kullanılır."""
import json
import threading
from dataclasses import dataclass, field
from typing import Protocol

import anthropic

from .config import get_settings

FALLBACK_BETA = "server-side-fallback-2026-07-01"
MAX_CONTINUATIONS = 5


class LLMError(Exception):
    pass


class LLMRefused(LLMError):
    pass


@dataclass
class ResearchResult:
    dossier: str
    sources: list[dict] = field(default_factory=list)  # {url, title, page_age, cited}


@dataclass
class Usage:
    input_tokens: int = 0
    output_tokens: int = 0
    _lock: threading.Lock = field(default_factory=threading.Lock, repr=False)

    def add(self, u) -> None:
        if u is None:
            return
        with self._lock:
            self.input_tokens += (getattr(u, "input_tokens", 0) or 0) + (
                getattr(u, "cache_read_input_tokens", 0) or 0
            ) + (getattr(u, "cache_creation_input_tokens", 0) or 0)
            self.output_tokens += getattr(u, "output_tokens", 0) or 0


class LLM(Protocol):
    usage: Usage

    def text(self, *, system: str, user: str, model: str, effort: str = "high") -> str: ...

    def json(self, *, system: str, user: str, schema: dict, model: str, effort: str = "medium") -> dict: ...

    def research(self, *, system: str, user: str, model: str, max_searches: int,
                 blocked_domains: list[str]) -> ResearchResult: ...


class ClaudeLLM:
    def __init__(self, client: anthropic.Anthropic | None = None):
        s = get_settings()
        if client is None:
            if not s.anthropic_api_key:
                raise LLMError("ANTHROPIC_API_KEY tanımlı değil; üretim hattı çalıştırılamaz.")
            client = anthropic.Anthropic(api_key=s.anthropic_api_key, max_retries=4)
        self.client = client
        self.fallbacks = s.claude_fallbacks
        self.usage = Usage()

    def _run(self, *, messages: list, **kwargs):
        """Akışla çağırır; sunucu aracı duraklatırsa (pause_turn) kaldığı yerden sürdürür."""
        response = None
        for _ in range(MAX_CONTINUATIONS + 1):
            try:
                if self.fallbacks:
                    cm = self.client.beta.messages.stream(
                        messages=messages, betas=[FALLBACK_BETA], fallbacks="default", **kwargs
                    )
                else:
                    cm = self.client.messages.stream(messages=messages, **kwargs)
                with cm as stream:
                    response = stream.get_final_message()
            except anthropic.AuthenticationError as e:
                raise LLMError("Claude API anahtarı geçersiz.") from e
            except anthropic.BadRequestError as e:
                raise LLMError(f"Claude isteği reddedildi (400): {e.message}") from e
            except anthropic.RateLimitError as e:
                raise LLMError("Claude hız sınırı aşıldı; yeniden denemeler tükendi.") from e
            except anthropic.APIStatusError as e:
                raise LLMError(f"Claude API hatası {e.status_code}: {e.message}") from e
            except anthropic.APIConnectionError as e:
                raise LLMError("Claude API'ye bağlanılamadı.") from e
            self.usage.add(response.usage)
            if response.stop_reason == "refusal":
                raise LLMRefused("Model isteği güvenlik gerekçesiyle yanıtlamadı.")
            if response.stop_reason != "pause_turn":
                break
            messages = [messages[0], {"role": "assistant", "content": response.content}]
        if response.stop_reason == "max_tokens":
            raise LLMError("Yanıt max_tokens sınırında kesildi.")
        if response.stop_reason == "pause_turn":
            raise LLMError("Araştırma turu devam sınırına rağmen tamamlanmadı.")
        return response

    @staticmethod
    def _text_of(response) -> str:
        return "".join(b.text for b in response.content if b.type == "text").strip()

    def text(self, *, system, user, model, effort="high") -> str:
        r = self._run(model=model, max_tokens=32000, system=system,
                      output_config={"effort": effort},
                      messages=[{"role": "user", "content": user}])
        out = self._text_of(r)
        if not out:
            raise LLMError("Model boş yanıt döndürdü.")
        return out

    def json(self, *, system, user, schema, model, effort="medium") -> dict:
        r = self._run(model=model, max_tokens=32000, system=system,
                      output_config={"effort": effort,
                                     "format": {"type": "json_schema", "schema": schema}},
                      messages=[{"role": "user", "content": user}])
        try:
            return json.loads(self._text_of(r))
        except json.JSONDecodeError as e:
            raise LLMError("Model geçerli JSON döndürmedi.") from e

    def research(self, *, system, user, model, max_searches, blocked_domains) -> ResearchResult:
        tool = {"type": "web_search_20260209", "name": "web_search", "max_uses": max_searches}
        if blocked_domains:
            tool["blocked_domains"] = blocked_domains
        r = self._run(model=model, max_tokens=32000, system=system, tools=[tool],
                      output_config={"effort": "medium"},
                      messages=[{"role": "user", "content": user}])
        # Kaynak listesi modelin beyanından değil, arama aracının gerçek sonuçlarından derlenir.
        found: dict[str, dict] = {}
        cited: set[str] = set()
        for b in r.content:
            if b.type == "web_search_tool_result" and isinstance(b.content, list):
                for item in b.content:
                    url = getattr(item, "url", None)
                    if url and url not in found:
                        found[url] = {"url": url, "title": getattr(item, "title", None),
                                      "page_age": getattr(item, "page_age", None)}
            elif b.type == "text":
                for c in getattr(b, "citations", None) or []:
                    url = getattr(c, "url", None)
                    if url:
                        cited.add(url)
                        found.setdefault(url, {"url": url, "title": getattr(c, "title", None),
                                               "page_age": None})
        sources = [{**v, "cited": u in cited} for u, v in found.items()]
        sources.sort(key=lambda x: not x["cited"])
        return ResearchResult(dossier=self._text_of(r), sources=sources)
