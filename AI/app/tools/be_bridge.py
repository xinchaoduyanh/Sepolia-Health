"""Bridge client: AI/ gọi HTTP sang Be/ để lấy DATA (không touch Prisma).

`BridgeClient` là Protocol để inject FakeBridge trong test. `HttpBridgeClient`
là bản thật gọi Be/ /internal/bridge/... kèm X-Internal-Token.
"""
from __future__ import annotations

from typing import Protocol

import httpx


class BridgeError(RuntimeError):
    pass


def _unwrap(body: object) -> dict:
    """Bóc envelope chuẩn của Be/ (ResponseInterceptor / HttpExceptionsFilter).

    Be/ bọc MỌI response:
      - success: {"data": <payload>, "message": "Success", "statusCode": 200}
      - error  : {"success": false, "message": "...", "statusCode": 4xx, "data": null}
    AI/ chỉ cần payload phẳng; lỗi nghiệp vụ quy về {error_code}. Lỗi nghiệp vụ
    "mềm" (vd doctor_off) đi qua success envelope -> nằm sẵn trong data.
    """
    if isinstance(body, dict):
        if body.get("success") is False:  # error envelope
            return {"error_code": str(body.get("message") or "bridge_error")}
        if "data" in body and "statusCode" in body:  # success envelope
            inner = body["data"]
            return inner if isinstance(inner, dict) else {"data": inner}
    return body if isinstance(body, dict) else {"data": body}


class BridgeClient(Protocol):
    async def search_clinics(self, q: str, location: str | None = None) -> dict: ...
    async def search_services(self, q: str, clinic_id: int | None = None) -> dict: ...
    async def search_doctors(self, q: str | None, service_id: int | None, clinic_id: int | None) -> dict: ...
    async def get_doctor_availability(self, doctor_id: int, date: str, service_id: int | None) -> dict: ...
    async def find_available_doctors(self, date: str, service_id: int | None, time_preference: str | None, clinic_id: int | None = None) -> dict: ...
    async def resolve_patient_profile(self, user_id: int) -> dict: ...
    async def create_booking_draft(self, patient_profile_id: int, doctor_id: int, service_id: int, start_time: str, idempotency_key: str) -> dict: ...
    async def confirm_booking(self, draft_id: str, idempotency_key: str) -> dict: ...
    async def get_upcoming_appointments(self, user_id: int) -> dict: ...


# Be/ có global prefix "api" (main.ts setGlobalPrefix('api')) -> path đầy đủ /api/internal/bridge/...


class HttpBridgeClient:
    def __init__(
        self,
        base_url: str,
        shared_secret: str,
        acting_user_id: int | None = None,
        client: httpx.AsyncClient | None = None,
        timeout: float = 10.0,
    ) -> None:
        self._base = base_url.rstrip("/")
        self._shared_secret = shared_secret
        self._acting_user_id = acting_user_id
        self._headers = {"X-Internal-Token": shared_secret}
        # actingUserId LẤY TỪ SESSION (Be/ đã auth), KHÔNG từ LLM. Be/ enforce ownership.
        # NOTE V1: nên khởi tạo client per-session với đúng user_id (xem deps.get_bridge).
        if acting_user_id is not None:
            self._headers["X-Acting-User-Id"] = str(acting_user_id)
        self._client = client
        self._timeout = timeout

    def with_acting_user(self, acting_user_id: int) -> "HttpBridgeClient":
        return HttpBridgeClient(
            self._base,
            self._shared_secret,
            acting_user_id=acting_user_id,
            client=self._client,
            timeout=self._timeout,
        )

    async def _request(self, method: str, path: str, *, params: dict | None = None, json: dict | None = None) -> dict:
        url = self._base + path
        last_err: Exception | None = None
        for _ in range(2):  # 1 retry cho 5xx / lỗi mạng
            try:
                if self._client is not None:
                    resp = await self._client.request(method, url, params=params, json=json, headers=self._headers, timeout=self._timeout)
                else:
                    async with httpx.AsyncClient(timeout=self._timeout) as c:
                        resp = await c.request(method, url, params=params, json=json, headers=self._headers)
            except (httpx.TimeoutException, httpx.TransportError) as exc:
                last_err = exc
                continue
            if resp.status_code >= 500:
                last_err = BridgeError(f"{resp.status_code} {path}")
                continue
            # 4xx vẫn trả body cho LLM tự xử (đã bóc envelope -> {error_code})
            return _unwrap(resp.json())
        raise BridgeError(f"Bridge không phản hồi: {path}") from last_err

    async def search_clinics(self, q, location=None):
        return await self._request("GET", "/api/internal/bridge/clinics", params={"q": q, "location": location})

    async def search_services(self, q, clinic_id=None):
        return await self._request("GET", "/api/internal/bridge/services", params={"q": q, "clinicId": clinic_id})

    async def search_doctors(self, q, service_id, clinic_id):
        return await self._request("GET", "/api/internal/bridge/doctors", params={"q": q, "serviceId": service_id, "clinicId": clinic_id})

    async def get_doctor_availability(self, doctor_id, date, service_id):
        return await self._request("GET", f"/api/internal/bridge/doctors/{doctor_id}/availability", params={"date": date, "serviceId": service_id})

    async def find_available_doctors(self, date, service_id, time_preference, clinic_id=None):
        return await self._request("GET", "/api/internal/bridge/doctors/available", params={"date": date, "serviceId": service_id, "timePreference": time_preference, "clinicId": clinic_id})

    async def resolve_patient_profile(self, user_id):
        return await self._request("GET", f"/api/internal/bridge/patients/{user_id}")

    async def create_booking_draft(self, patient_profile_id, doctor_id, service_id, start_time, idempotency_key):
        return await self._request("POST", "/api/internal/bridge/booking-drafts", json={
            "patientProfileId": patient_profile_id, "doctorId": doctor_id,
            "serviceId": service_id, "startTime": start_time, "idempotencyKey": idempotency_key,
        })

    async def confirm_booking(self, draft_id, idempotency_key):
        return await self._request("POST", f"/api/internal/bridge/booking-drafts/{draft_id}/confirm", json={"idempotencyKey": idempotency_key})

    async def get_upcoming_appointments(self, user_id):
        return await self._request("GET", f"/api/internal/bridge/patients/{user_id}/upcoming-appointments")
