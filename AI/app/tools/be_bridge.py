"""Bridge client: AI/ gọi HTTP sang Be/ để lấy DATA (không touch Prisma).

`BridgeClient` là Protocol để inject FakeBridge trong test. `HttpBridgeClient`
là bản thật gọi Be/ /internal/bridge/... kèm X-Internal-Token.
"""
from __future__ import annotations

import re
import threading
from typing import Protocol

import httpx

from app.config import Settings, get_settings
from app.resilience.circuit_breaker import CircuitBreaker, CircuitOpenError


class BridgeError(RuntimeError):
    pass


# Chỉ error_code ổn định (snake_case) mới được tới LLM; message tự do/stack của Be/
# (vd "Missing X-Acting-User-Id", chuỗi Prisma) bị thay bằng mã chung.
_STABLE_CODE = re.compile(r"^[a-z][a-z0-9_]{2,63}$")


def _stable_code(value: object, default: str = "bridge_error") -> str:
    text = str(value) if value is not None else ""
    return text if _STABLE_CODE.match(text) else default


# Shared across clients — thresholds from Settings (AI_BRIDGE_CIRCUIT_*).
_BRIDGE_CIRCUIT: CircuitBreaker | None = None
_BRIDGE_CIRCUIT_LOCK = threading.Lock()
_BRIDGE_CIRCUIT_CFG: tuple[int, float] | None = None


def get_bridge_circuit(settings: Settings | None = None) -> CircuitBreaker:
    """Circuit breaker đọc AI_BRIDGE_CIRCUIT_FAILURES / RECOVERY_SEC.

    Re-create nếu settings threshold đổi (vd test override).
    """
    global _BRIDGE_CIRCUIT, _BRIDGE_CIRCUIT_CFG
    s = settings or get_settings()
    failures = int(s.bridge_circuit_failures)
    recovery = float(s.bridge_circuit_recovery_sec)
    # 0 / âm = tắt breaker (threshold rất cao, hầu như không open).
    threshold = failures if failures > 0 else 10**9
    cfg = (threshold, recovery)
    with _BRIDGE_CIRCUIT_LOCK:
        if _BRIDGE_CIRCUIT is None or _BRIDGE_CIRCUIT_CFG != cfg:
            _BRIDGE_CIRCUIT = CircuitBreaker(
                "be_bridge",
                failure_threshold=threshold,
                recovery_timeout_sec=max(1.0, recovery),
                half_open_successes=2,
            )
            _BRIDGE_CIRCUIT_CFG = cfg
        return _BRIDGE_CIRCUIT


def reset_bridge_circuit_for_tests() -> None:
    """Test helper: drop singleton để lần get sau đọc settings mới."""
    global _BRIDGE_CIRCUIT, _BRIDGE_CIRCUIT_CFG
    with _BRIDGE_CIRCUIT_LOCK:
        _BRIDGE_CIRCUIT = None
        _BRIDGE_CIRCUIT_CFG = None


def _unwrap(body: object) -> dict:
    """Bóc envelope chuẩn của Be/ (ResponseInterceptor / HttpExceptionsFilter).

    Be/ bọc MỌI response:
      - success: {"data": <payload>, "message": "Success", "statusCode": 200}
      - error  : {"success": false, "message": "...", "statusCode": 4xx, "data": null}
    AI/ chỉ cần payload phẳng; lỗi nghiệp vụ quy về {error_code}. Lỗi nghiệp vụ
    "mềm" (vd doctor_off) đi qua success envelope -> nằm sẵn trong data.
    """
    if isinstance(body, dict):
        # HttpException object body: { error_code, message }
        if body.get("error_code"):
            return {"error_code": _stable_code(body["error_code"])}
        if body.get("success") is False:  # error envelope
            msg = body.get("message")
            if isinstance(msg, dict) and msg.get("error_code"):
                return {"error_code": _stable_code(msg["error_code"])}
            return {"error_code": _stable_code(msg)}
        if "data" in body and "statusCode" in body:  # success envelope
            inner = body["data"]
            return inner if isinstance(inner, dict) else {"data": inner}
        # Nest default: { statusCode, message: {...} | string }
        msg = body.get("message")
        if isinstance(msg, dict) and msg.get("error_code"):
            return {"error_code": _stable_code(msg["error_code"])}
        if isinstance(msg, str) and body.get("statusCode", 0) >= 400:
            return {"error_code": _stable_code(msg)}
    return body if isinstance(body, dict) else {"data": body}


class BridgeClient(Protocol):
    async def search_clinics(self, q: str | None, location: str | None = None) -> dict: ...
    async def search_services(self, q: str | None, clinic_id: int | None = None) -> dict: ...
    async def search_doctors(self, q: str | None, service_id: int | None, clinic_id: int | None) -> dict: ...
    async def get_clinic_detail(self, clinic_id: int) -> dict: ...
    async def get_doctor_detail(self, doctor_id: int) -> dict: ...
    async def get_doctor_availability(self, doctor_id: int, date: str, service_id: int | None) -> dict: ...
    async def find_available_doctors(self, date: str, service_id: int | None, time_preference: str | None, clinic_id: int | None = None) -> dict: ...
    async def resolve_patient_profile(self, user_id: int) -> dict: ...
    async def create_booking_draft(self, patient_profile_id: int, doctor_id: int, service_id: int, start_time: str, idempotency_key: str) -> dict: ...
    async def confirm_booking(self, draft_id: str, idempotency_key: str) -> dict: ...
    async def get_upcoming_appointments(self, user_id: int) -> dict: ...
    async def get_patient_summary(self, user_id: int) -> dict: ...
    async def get_patient_history(self, user_id: int) -> dict: ...
    async def cancel_appointment(self, appointment_id: int) -> dict: ...


# Be/ có global prefix "api" (main.ts setGlobalPrefix('api')) -> path đầy đủ /api/internal/bridge/...


class HttpBridgeClient:
    def __init__(
        self,
        base_url: str,
        shared_secret: str,
        acting_user_id: int | None = None,
        client: httpx.AsyncClient | None = None,
        timeout: float = 10.0,
        circuit: CircuitBreaker | None = None,
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
        # Inject circuit theo settings (deps.get_bridge); fallback lazy get_bridge_circuit().
        self._circuit = circuit

    def _get_circuit(self) -> CircuitBreaker:
        return self._circuit if self._circuit is not None else get_bridge_circuit()

    def with_acting_user(self, acting_user_id: int) -> "HttpBridgeClient":
        return HttpBridgeClient(
            self._base,
            self._shared_secret,
            acting_user_id=acting_user_id,
            client=self._client,
            timeout=self._timeout,
            circuit=self._circuit,
        )

    async def _request(self, method: str, path: str, *, params: dict | None = None, json: dict | None = None) -> dict:
        # httpx serialize None thành chuỗi rỗng ("serviceId=") — bỏ hẳn key để
        # Be/ nhận undefined thay vì "" (đỡ rủi ro ParseIntPipe/validation 400).
        if params:
            params = {k: v for k, v in params.items() if v is not None}
        url = self._base + path
        circuit = self._get_circuit()
        try:
            circuit.before_call()
        except CircuitOpenError:
            return {"error_code": "bridge_unavailable"}

        # Retry nội bộ: CHỈ record_failure MỘT LẦN sau khi cả vòng retry fail.
        # (Trước: mỗi attempt = 1 failure → threshold 5 mở sau ~3 logical request.)
        last_err: Exception | None = None
        last_error_code: str | None = None
        for attempt in range(2):  # 1 retry cho 5xx / lỗi mạng
            try:
                if self._client is not None:
                    resp = await self._client.request(
                        method, url, params=params, json=json, headers=self._headers, timeout=self._timeout
                    )
                else:
                    async with httpx.AsyncClient(timeout=self._timeout) as c:
                        resp = await c.request(
                            method, url, params=params, json=json, headers=self._headers
                        )
            except (httpx.TimeoutException, httpx.TransportError) as exc:
                last_err = exc
                last_error_code = "bridge_internal_error"
                if attempt == 0:
                    continue
                break
            if resp.status_code >= 500:
                # Prefer stable error_code (vd bridge_internal_error từ confirm).
                try:
                    parsed = _unwrap(resp.json())
                    if isinstance(parsed, dict) and parsed.get("error_code"):
                        last_error_code = str(parsed["error_code"])
                        last_err = BridgeError(
                            f"{resp.status_code} {path} {last_error_code}"
                        )
                        if attempt == 0:
                            continue
                        break
                except Exception:  # noqa: BLE001
                    pass
                last_err = BridgeError(f"{resp.status_code} {path}")
                last_error_code = "bridge_internal_error"
                if attempt == 0:
                    continue
                break
            # 2xx/4xx: success for circuit (4xx = business error, Be còn sống).
            circuit.record_success()
            return _unwrap(resp.json())

        # Cả request + retry đều fail → đúng 1 failure cho 1 logical call.
        circuit.record_failure()
        return {"error_code": last_error_code or "bridge_internal_error"}

    async def search_clinics(self, q, location=None):
        return await self._request("GET", "/api/internal/bridge/clinics", params={"q": q, "location": location})

    async def search_services(self, q, clinic_id=None):
        return await self._request("GET", "/api/internal/bridge/services", params={"q": q, "clinicId": clinic_id})

    async def search_doctors(self, q, service_id, clinic_id):
        return await self._request("GET", "/api/internal/bridge/doctors", params={"q": q, "serviceId": service_id, "clinicId": clinic_id})

    async def get_clinic_detail(self, clinic_id):
        return await self._request("GET", f"/api/internal/bridge/clinics/{clinic_id}")

    async def get_doctor_detail(self, doctor_id):
        return await self._request("GET", f"/api/internal/bridge/doctors/{doctor_id}")

    async def get_doctor_availability(self, doctor_id, date, service_id):
        return await self._request("GET", f"/api/internal/bridge/doctors/{doctor_id}/availability", params={"date": date, "serviceId": service_id})

    async def find_available_doctors(self, date, service_id, time_preference, clinic_id=None):
        return await self._request("GET", "/api/internal/bridge/doctors/available", params={"date": date, "serviceId": service_id, "timePreference": time_preference, "clinicId": clinic_id})

    def _uid(self, user_id):
        """ID định danh user LUÔN lấy từ session (acting user) — KHÔNG tin giá trị
        LLM truyền (LLM hay bịa id -> 403 forbidden_cross_user)."""
        return self._acting_user_id if self._acting_user_id is not None else user_id

    async def resolve_patient_profile(self, user_id):
        return await self._request("GET", f"/api/internal/bridge/patients/{self._uid(user_id)}")

    async def create_booking_draft(self, patient_profile_id, doctor_id, service_id, start_time, idempotency_key):
        return await self._request("POST", "/api/internal/bridge/booking-drafts", json={
            "patientProfileId": patient_profile_id, "doctorId": doctor_id,
            "serviceId": service_id, "startTime": start_time, "idempotencyKey": idempotency_key,
        })

    async def confirm_booking(self, draft_id, idempotency_key):
        return await self._request("POST", f"/api/internal/bridge/booking-drafts/{draft_id}/confirm", json={"idempotencyKey": idempotency_key})

    async def get_upcoming_appointments(self, user_id):
        return await self._request("GET", f"/api/internal/bridge/patients/{self._uid(user_id)}/upcoming-appointments")

    async def get_patient_summary(self, user_id):
        return await self._request("GET", f"/api/internal/bridge/patients/{self._uid(user_id)}/summary")

    async def get_patient_history(self, user_id):
        return await self._request("GET", f"/api/internal/bridge/patients/{self._uid(user_id)}/history")

    async def cancel_appointment(self, appointment_id):
        return await self._request("POST", f"/api/internal/bridge/appointments/{appointment_id}/cancel")
