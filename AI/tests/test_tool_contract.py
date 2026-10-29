"""Contract tests cho tool layer (Phase 3): mỗi tool có success / error / invalid args,
clinic_id đổi kết quả search_services, và error chỉ là code ổn định."""
import httpx
import pytest
from pydantic import ValidationError

from app.tools import schemas as S
from app.tools.be_bridge import HttpBridgeClient, _unwrap
from app.tools.registry import _SPEC, ToolRegistry
from tests.fakes import FakeBridge

_NOW_ARGS = {"relative_days": 1}
VALID_ARGS: dict[str, dict] = {
    "resolve_date": _NOW_ARGS,
    "search_clinics": {"q": "Sepolia"},
    "search_services": {"q": "mắt", "clinic_id": 1},
    "search_doctors": {"q": "Canh", "service_id": 1},
    "get_clinic_detail": {"clinic_id": 1},
    "get_doctor_detail": {"doctor_id": 1},
    "get_doctor_availability": {"doctor_id": 1, "date": "2030-01-02"},
    "find_available_doctors": {"date": "2030-01-02", "time_preference": "morning"},
    "resolve_patient_profile": {"user_id": 1},
    "create_booking_draft": {"patient_profile_id": 1, "doctor_id": 2, "service_id": 3,
                             "start_time": "2030-01-02T09:00:00+07:00"},
    "get_my_upcoming_appointments": {"user_id": 1},
    "get_patient_history": {"user_id": 1},
    "confirm_booking": {"draft_id": "cabc123"},
    "request_cancel_booking": {"appointment_id": 5},
    "cancel_appointment": {"appointment_id": 5},
}
# tool cần dữ liệu ngoài bridge (RAG) được test riêng.
_FAKE_KEY = {"get_my_upcoming_appointments": "get_upcoming_appointments"}
BRIDGE_TOOLS = [n for n in _SPEC if n not in ("search_knowledge", "resolve_date", "request_cancel_booking")]


def test_every_tool_has_contract_case():
    assert set(VALID_ARGS) | {"search_knowledge"} == set(_SPEC)


@pytest.mark.parametrize("name", sorted(VALID_ARGS))
async def test_tool_success(name):
    out = await ToolRegistry(FakeBridge()).execute(name, VALID_ARGS[name], session_id="s")
    assert isinstance(out, dict)
    assert not out.get("error_code")


INVALID_ARGS: dict[str, dict] = {
    "resolve_date": {"relative_days": "bad<script>"},
    "search_clinics": {"q": "bad<script>" * 40},
    "search_services": {"clinic_id": -1},
    "search_doctors": {"service_id": 0},
    "get_clinic_detail": {"clinic_id": "bad<script>"},
    "get_doctor_detail": {"doctor_id": 0},
    "get_doctor_availability": {"doctor_id": 1, "date": "bad<script>"},
    "find_available_doctors": {"date": "2030-01-02", "time_preference": "bad<script>"},
    "resolve_patient_profile": {"user_id": -5},
    "create_booking_draft": {"patient_profile_id": 1, "doctor_id": 2, "service_id": 3, "start_time": "bad<script>"},
    "get_my_upcoming_appointments": {"user_id": 0},
    "get_patient_history": {"user_id": 0},
    "confirm_booking": {"draft_id": "bad<script>"},
    "request_cancel_booking": {"appointment_id": 0},
    "cancel_appointment": {"appointment_id": -1},
}


@pytest.mark.parametrize("name", sorted(VALID_ARGS))
async def test_tool_invalid_args_returns_stable_code_without_raw_input(name):
    bad = INVALID_ARGS[name]
    out = await ToolRegistry(FakeBridge()).execute(name, bad, session_id="s")
    assert out["error_code"] == "invalid_args"
    assert all(set(d) == {"field", "reason"} for d in out["details"])
    assert "bad<script>" not in str(out["details"])


@pytest.mark.parametrize("name", BRIDGE_TOOLS)
async def test_tool_bridge_error_passthrough(name):
    err = {"error_code": "slot_taken"}
    bridge = FakeBridge(**{_FAKE_KEY.get(name, name): err})
    out = await ToolRegistry(bridge).execute(name, VALID_ARGS[name], session_id="s")
    assert out == err


async def test_unknown_tool():
    out = await ToolRegistry(FakeBridge()).execute("drop_database", {}, session_id="s")
    assert out == {"error_code": "unknown_tool"}


async def test_search_knowledge_contract():
    reg = ToolRegistry(FakeBridge(), retriever=None)
    out = await reg.execute("search_knowledge", {"query": "ho", "types": ["symptom"]}, session_id="s")
    assert out["error_code"] == "retriever_not_available"
    bad = await reg.execute("search_knowledge", {"query": "ho", "types": ["secrets"]}, session_id="s")
    assert bad["error_code"] == "invalid_args"


def test_schema_tightening():
    with pytest.raises(ValidationError):
        S.FindAvailableDoctorsInput(date="2030-01-02", time_preference="midnight")
    with pytest.raises(ValidationError):
        S.GetDoctorAvailabilityInput(doctor_id=1, date="2030-02-31")  # không phải ngày lịch
    with pytest.raises(ValidationError):
        S.CreateBookingDraftInput(patient_profile_id=1, doctor_id=1, service_id=1,
                                  start_time="2030-13-45T99:00:00+07:00")
    with pytest.raises(ValidationError):
        S.SearchClinicsInput(q="x" * 201)
    with pytest.raises(ValidationError):
        S.ConfirmBookingInput(draft_id="../etc/passwd")
    assert S.SearchServicesInput(clinic_id=2).q is None


# ---- HTTP bridge contract ---------------------------------------------------
def _be_handler(request: httpx.Request) -> httpx.Response:
    """Be/ giả: search_services lọc theo clinicId như contract."""
    if request.url.path.endswith("/services"):
        clinic = request.url.params.get("clinicId")
        data = {"services": [{"id": 1}], "clinic_id": 1} if clinic == "1" else {
            "services": [{"id": 1}, {"id": 2}], "clinic_id": None}
        return httpx.Response(200, json={"data": data, "message": "Success", "statusCode": 200})
    return httpx.Response(404, json={"success": False, "statusCode": 404, "message": "Cannot GET"})


async def test_search_services_clinic_id_changes_result():
    async with httpx.AsyncClient(transport=httpx.MockTransport(_be_handler)) as c:
        bridge = HttpBridgeClient("http://be", "s", client=c)
        reg = ToolRegistry(bridge)
        all_ = await reg.execute("search_services", {"q": "mắt"}, session_id="s")
        one = await reg.execute("search_services", {"q": "mắt", "clinic_id": 1}, session_id="s")
    assert len(all_["services"]) == 2
    assert [s["id"] for s in one["services"]] == [1]


@pytest.mark.parametrize("body,expected", [
    ({"success": False, "statusCode": 400, "message": "Missing X-Acting-User-Id"}, "bridge_error"),
    ({"success": False, "statusCode": 403, "message": "forbidden_cross_user"}, "forbidden_cross_user"),
    ({"statusCode": 500, "message": "PrismaClientKnownRequestError: connect ECONNREFUSED 10.0.0.1"}, "bridge_error"),
    ({"error_code": "slot_taken", "message": "x"}, "slot_taken"),
    ({"success": False, "message": {"error_code": "draft_expired", "message": "internal"}}, "draft_expired"),
])
def test_unwrap_only_stable_error_codes(body, expected):
    assert _unwrap(body) == {"error_code": expected}


async def test_5xx_does_not_leak_stack():
    def handler(_req):
        return httpx.Response(500, text="Error: at Object.<anonymous> (/srv/app/dist/main.js:1:1)")

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as c:
        from app.resilience.circuit_breaker import CircuitBreaker
        bridge = HttpBridgeClient("http://be", "s", client=c, circuit=CircuitBreaker("t", failure_threshold=99))
        out = await bridge.get_clinic_detail(1)
    assert out == {"error_code": "bridge_internal_error"}
