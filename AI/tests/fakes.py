"""Fake provider + bridge để test agent/API offline (không cần Ollama/Be)."""
from __future__ import annotations

from typing import Sequence

from app.providers.base import ChatResponse, ToolCall


def chat_text(text: str) -> ChatResponse:
    return ChatResponse(content=text, tool_calls=[], raw_model="fake", latency_ms=1)


def chat_tools(*calls: tuple[str, dict]) -> ChatResponse:
    return ChatResponse(
        content=None,
        tool_calls=[ToolCall(id=f"c{i}", name=n, arguments=a) for i, (n, a) in enumerate(calls)],
        raw_model="fake",
        latency_ms=1,
    )


class FakeProvider:
    """Trả lần lượt các ChatResponse đã script sẵn."""

    def __init__(self, responses: Sequence[ChatResponse]) -> None:
        self._responses = list(responses)
        self.calls: list[list[dict]] = []

    async def chat(self, model, messages, tools=None, temperature=0.1, max_tokens=1024) -> ChatResponse:
        self.calls.append(messages)
        return self._responses.pop(0)

    async def embed(self, model, texts):
        return [[0.0] * 1024 for _ in texts]


class FakeBridge:
    """Bridge giả với data mặc định; override qua kwargs."""

    def __init__(self, **overrides) -> None:
        self._o = overrides
        self.calls: list[tuple] = []

    async def search_clinics(self, q, location=None):
        return self._o.get("search_clinics", {"clinics": [], "total": 0})

    async def search_services(self, q, clinic_id=None):
        return self._o.get("search_services", {"services": []})

    async def search_doctors(self, q, service_id, clinic_id):
        return self._o.get("search_doctors", {"doctors": [
            {"id": 12, "first_name": "Hữu Canh", "last_name": "Vương", "specialty": "Da liễu"}
        ]})

    async def get_doctor_availability(self, doctor_id, date, service_id):
        return self._o.get("get_doctor_availability", {
            "doctor_id": doctor_id, "date": date, "available_slots": ["09:00", "14:00"]
        })

    async def find_available_doctors(self, date, service_id, time_preference, clinic_id=None):
        return self._o.get("find_available_doctors", {"doctors": []})

    async def resolve_patient_profile(self, user_id):
        return self._o.get("resolve_patient_profile", {"patient_profile_id": 100})

    async def create_booking_draft(self, patient_profile_id, doctor_id, service_id, start_time, idempotency_key):
        self.calls.append(("create_booking_draft", idempotency_key))
        return self._o.get("create_booking_draft", {"draft_id": "draft_1", "expires_at": "soon", "conflicts": []})

    async def confirm_booking(self, draft_id, idempotency_key):
        self.calls.append(("confirm_booking", draft_id))
        return self._o.get("confirm_booking", {"appointment_id": 99, "status": "booked"})

    async def get_upcoming_appointments(self, user_id):
        return self._o.get("get_upcoming_appointments", {"appointments": []})
