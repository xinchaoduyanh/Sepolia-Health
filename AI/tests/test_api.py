"""Smoke test API bằng TestClient — override provider/bridge bằng fake."""
from fastapi.testclient import TestClient

from app.config import Settings, get_settings
from app.deps import get_bridge, get_provider, get_store
from app.session.store import InMemorySessionStore
from app.main import app
from tests.fakes import FakeBridge, FakeProvider, chat_text

_TEST_TOKEN = "test-internal-token"

app.dependency_overrides[get_provider] = lambda: FakeProvider([chat_text("Em chào anh/chị ạ.")])
app.dependency_overrides[get_bridge] = lambda: FakeBridge()
shared_store = InMemorySessionStore()
app.dependency_overrides[get_store] = lambda: shared_store
# Test độc lập với secret thật trong .env: ép secret = token test.
app.dependency_overrides[get_settings] = lambda: Settings(internal_shared_secret=_TEST_TOKEN)

client = TestClient(app)
AUTH = {"X-Internal-Token": _TEST_TOKEN}


def test_health_public():
    assert client.get("/health").json() == {"status": "ok"}


def test_internal_requires_token():
    r = client.post("/internal/ai/chat/sessions", json={"user_id": 1})
    assert r.status_code == 401


def test_internal_rejects_wrong_length_token():
    # compare_digest không throw khi độ dài khác nhau (khác strcmp thường).
    r = client.post(
        "/internal/ai/chat/sessions", json={"user_id": 1}, headers={"X-Internal-Token": "short"}
    )
    assert r.status_code == 401


def test_session_flow():
    r = client.post("/internal/ai/chat/sessions", json={"user_id": 7}, headers=AUTH)
    assert r.status_code == 200
    sid = r.json()["session_id"]

    r2 = client.get(f"/internal/ai/chat/sessions/{sid}", headers=AUTH)
    assert r2.status_code == 200 and r2.json()["user_id"] == 7

    r3 = client.post(
        f"/internal/ai/chat/sessions/{sid}/messages", json={"message": "chào em"}, headers=AUTH
    )
    assert r3.status_code == 200
    body = r3.json()
    assert "trace_id" in body and body["session_state"]["session_id"] == sid


def test_message_unknown_session_404():
    r = client.post(
        "/internal/ai/chat/sessions/nope/messages", json={"message": "hi"}, headers=AUTH
    )
    assert r.status_code == 404


def test_session_reconnection_by_channel():
    # Clear shared store to start fresh for this test
    shared_store._data.clear()
    
    # 1. Create a session with a channel_id
    r1 = client.post("/internal/ai/chat/sessions", json={"user_id": 8, "channel_id": "chan_abc"}, headers=AUTH)
    assert r1.status_code == 200
    sid1 = r1.json()["session_id"]
    
    # 2. Try to create again with same channel_id -> should return the same session id
    r2 = client.post("/internal/ai/chat/sessions", json={"user_id": 8, "channel_id": "chan_abc"}, headers=AUTH)
    assert r2.status_code == 200
    sid2 = r2.json()["session_id"]
    assert sid1 == sid2
    
    # 3. Create with different channel_id -> should return a new session id
    r3 = client.post("/internal/ai/chat/sessions", json={"user_id": 8, "channel_id": "chan_xyz"}, headers=AUTH)
    assert r3.status_code == 200
    sid3 = r3.json()["session_id"]
    assert sid1 != sid3


def test_stale_session_not_reconnected():
    # Session mở nhưng last_updated quá hạn reconnect -> phải mở session MỚI,
    # không nối lại state cũ (requirement/state nhiều ngày trước chỉ gây kẹt).
    from datetime import datetime, timedelta, timezone

    shared_store._data.clear()
    r1 = client.post("/internal/ai/chat/sessions", json={"user_id": 8, "channel_id": "chan_old"}, headers=AUTH)
    sid1 = r1.json()["session_id"]
    shared_store._data[sid1].last_updated = datetime.now(timezone.utc) - timedelta(days=3)

    r2 = client.post("/internal/ai/chat/sessions", json={"user_id": 8, "channel_id": "chan_old"}, headers=AUTH)
    assert r2.status_code == 200
    assert r2.json()["session_id"] != sid1


def test_stream_message():
    r = client.post("/internal/ai/chat/sessions", json={"user_id": 9}, headers=AUTH)
    sid = r.json()["session_id"]

    r2 = client.post(
        f"/internal/ai/chat/sessions/{sid}/messages/stream", json={"message": "hello"}, headers=AUTH
    )
    assert r2.status_code == 200
    lines = r2.text.strip().split("\n\n")
    assert any("type" in line and "final" in line for line in lines)


def test_session_conflict_error():
    from unittest.mock import patch
    from app.session.store import SessionConflictError
    
    r = client.post("/internal/ai/chat/sessions", json={"user_id": 10}, headers=AUTH)
    sid = r.json()["session_id"]
    
    with patch("app.session.store.InMemorySessionStore.update", side_effect=SessionConflictError):
        r2 = client.post(
            f"/internal/ai/chat/sessions/{sid}/messages", json={"message": "hello"}, headers=AUTH
        )
        assert r2.status_code == 409
