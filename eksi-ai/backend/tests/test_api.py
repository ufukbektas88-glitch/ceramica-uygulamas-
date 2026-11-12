import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app import main
from app.config import get_settings
from app.db import session_scope
from app.models import Draft, Source, Topic

from .conftest import make_entry


@pytest.fixture()
def client(fresh_db):
    with session_scope() as db:
        t = Topic(title="faiz kararı", title_norm="faiz kararı", status="drafted", category="ekonomi")
        db.add(t)
        db.flush()
        db.add(Draft(topic_id=t.id, content=make_entry("faiz"), word_count=320, quality_score=86,
                     status="pending", sources=[Source(url="https://tcmb.gov.tr/x", title="TCMB")]))
        db.add(Draft(topic_id=t.id, content="kısa", word_count=1, quality_score=40, status="failed_quality"))
    return TestClient(main.app)


def test_publish_requires_explicit_approval_and_eksi_url(client):
    assert client.post("/api/drafts/1/publish", json={"url": "https://eksisozluk.com/entry/1"}).status_code == 409
    assert client.post("/api/drafts/1/approve").json()["status"] == "approved"
    assert client.post("/api/drafts/1/publish", json={"url": "https://evil.test/entry/1"}).status_code == 422
    r = client.post("/api/drafts/1/publish", json={"url": "https://eksisozluk.com/entry/1"}).json()
    assert r["status"] == "published" and r["published_url"].endswith("/entry/1")
    assert client.patch("/api/drafts/1", json={"content": "x"}).status_code == 409
    assert client.get("/api/overview").json()["published"] == 1


def test_failed_quality_cannot_be_approved_unedited(client):
    assert client.post("/api/drafts/2/approve").status_code == 409
    assert client.patch("/api/drafts/2", json={"content": make_entry("elle")}).json()["word_count"] == 320
    assert client.post("/api/drafts/2/approve").status_code == 200


def test_reject_and_detail(client):
    assert client.post("/api/drafts/1/reject", json={"reason": "zayıf"}).json()["status"] == "rejected"
    d = client.get("/api/drafts/1").json()
    assert d["reject_reason"] == "zayıf" and d["eksi_url"] == "https://eksisozluk.com/?q=faiz+karar%C4%B1"
    assert "[https://tcmb.gov.tr/x TCMB]" in d["copy_text_with_sources"]
    assert client.get("/api/drafts/99").status_code == 404


def test_manual_topics_and_existing_entries(client):
    assert client.post("/api/topics", json={"titles": ["Yeni Başlık", "yeni başlık", "  "]}).json()["created"] == 1
    t = [x for x in client.get("/api/topics").json() if x["title"] == "Yeni Başlık"][0]
    assert t["source"] == "manual"
    r = client.patch(f"/api/topics/{t['id']}", json={"existing_entries": "biri şöyle demiş"}).json()
    assert r["existing_entries"] == "biri şöyle demiş"
    assert client.patch(f"/api/topics/{t['id']}", json={"status": "drafted"}).status_code == 422


def test_generation_needs_api_key(client):
    assert client.post("/api/runs/trigger").status_code == 503
    assert client.post("/api/drafts/1/regenerate", json={}).status_code == 503


def test_panel_token_enforced(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "panel_token", "gizli")
    assert client.get("/api/overview").status_code == 401
    assert client.get("/api/overview", headers={"Authorization": "Bearer yanlis"}).status_code == 401
    assert client.get("/api/overview", headers={"Authorization": "Bearer gizli"}).status_code == 200
    assert client.get("/api/reports/summary", headers={"Authorization": "Bearer gizli"}).status_code == 200
    with session_scope() as db:
        assert db.scalar(select(Draft).where(Draft.id == 1)).status == "pending"
