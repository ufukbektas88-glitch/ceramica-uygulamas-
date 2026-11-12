"""Ekşi Sözlük entegrasyon modülü.

Ekşi Sözlük'ün herkese açık resmî bir API'si ya da açıkça izin verdiği bir otomasyon yöntemi
bulunmadığı için bu modül bilinçli olarak siteye hiçbir istek göndermez: okuma (kazıma), oturum
açma ve otomatik gönderim yoktur. Yaptığı tek şey başlık bağlantısı üretmek ve kopyalanacak
metni hazırlamaktır. Yayın, kullanıcının kendi tarayıcısında elle yapılır; sonrasında bağlantı
panele kaydedilir.

İleride Ekşi Teknoloji'den yazılı izin/resmî API alınırsa EksiGateway alt sınıfı yazılıp
get_gateway() içinde seçilmesi yeterlidir; yayın yine panelde açık kullanıcı onayı gerektirir.
"""
from urllib.parse import quote_plus

from ..config import get_settings

EKSI_DOMAIN = "eksisozluk.com"


class EksiGateway:
    mode = "manual"
    can_read_entries = False
    can_publish = False

    def topic_url(self, title: str) -> str:
        return f"https://{EKSI_DOMAIN}/?q={quote_plus(title)}"

    def fetch_entries(self, title: str) -> list[str]:
        raise PermissionError("İzinli erişim yok: mevcut entry'ler yalnızca panelden elle aktarılabilir.")

    def publish(self, title: str, content: str) -> str:
        raise PermissionError("İzinli yayın entegrasyonu yok: entry elle yayımlanmalı.")

    def copy_text(self, content: str, sources: list[dict], with_sources: bool) -> str:
        if not with_sources or not sources:
            return content
        lines = [f"[{s['url']} {s.get('title') or 'kaynak'}]" for s in sources]
        return content.rstrip() + "\n\nkaynaklar:\n" + "\n".join(lines)


def get_gateway() -> EksiGateway:
    mode = get_settings().eksi_access_mode
    if mode != "manual":
        raise RuntimeError(f"EKSI_ACCESS_MODE={mode} için izinli bir entegrasyon tanımlı değil.")
    return EksiGateway()


def research_blocked_domains() -> list[str]:
    # İzin alınana kadar araştırma motoru da siteyi kaynak olarak taramaz.
    return [EKSI_DOMAIN] if get_settings().eksi_access_mode == "manual" else []
