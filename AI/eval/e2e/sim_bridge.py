"""SimBridge — bridge giả CÓ TRẠNG THÁI, mô phỏng Be/ai-bridge (shape khớp Be thật).

Dùng cho pipeline E2E hermetic: LLM thật (Gemini) nói chuyện với một "phòng khám"
có dữ liệu cố định, nên kết quả tái lập được và không ghi gì vào DB thật.
Cuối kịch bản, runner đọc `bridge.appointments` để khẳng định hậu quả nghiệp vụ.
"""
from __future__ import annotations

import itertools
from datetime import datetime, timedelta, timezone

VN = timezone(timedelta(hours=7))

CLINICS = [
    {"id": 1, "name": "Sepolia Hoàn Kiếm", "address": "12 Tràng Tiền, Hoàn Kiếm, Hà Nội", "phone": "02411111111", "email": "hk@sepolia.vn", "description": "Phòng khám đa khoa"},
    {"id": 2, "name": "Sepolia Cầu Giấy", "address": "88 Xuân Thủy, Cầu Giấy, Hà Nội", "phone": "02422222222", "email": "cg@sepolia.vn", "description": "Phòng khám đa khoa"},
]
SERVICES = [
    {"id": 10, "name": "Khám da liễu", "price": 200000, "duration_min": 30, "specialty": "Da liễu", "clinic_id": 1},
    {"id": 11, "name": "Khám tổng quát", "price": 300000, "duration_min": 30, "specialty": "Nội tổng quát", "clinic_id": 1},
    {"id": 12, "name": "Khám tai mũi họng", "price": 250000, "duration_min": 30, "specialty": "Tai mũi họng", "clinic_id": 2},
    {"id": 13, "name": "Khám tiêu hóa", "price": 280000, "duration_min": 30, "specialty": "Tiêu hóa", "clinic_id": 2},
]
DOCTORS = [
    {"id": 21, "first_name": "Canh", "last_name": "Vương Hữu", "experience": 12, "specialties": ["Da liễu"], "service_ids": [10], "clinic_id": 1},
    {"id": 22, "first_name": "Lan", "last_name": "Nguyễn Thị", "experience": 8, "specialties": ["Nội tổng quát"], "service_ids": [11], "clinic_id": 1},
    {"id": 23, "first_name": "Hùng", "last_name": "Trần Văn", "experience": 15, "specialties": ["Tai mũi họng"], "service_ids": [12], "clinic_id": 2},
    {"id": 24, "first_name": "Mai", "last_name": "Lê Thị", "experience": 10, "specialties": ["Tiêu hóa"], "service_ids": [13], "clinic_id": 2},
]
WORK_START, WORK_END = 8 * 60, 17 * 60 + 30  # 08:00–17:30, slot 30'
LUNCH = (12 * 60, 13 * 60 + 30)
PERIODS = {"morning": (6 * 60, 12 * 60), "noon": (11 * 60, 13 * 60 + 30), "afternoon": (12 * 60, 17 * 60 + 30), "evening": (17 * 60, 21 * 60)}


def _hhmm(m: int) -> str:
    return f"{m // 60:02d}:{m % 60:02d}"


def _doctor_out(d: dict) -> dict:
    svcs = [s for s in SERVICES if s["id"] in d["service_ids"]]
    return {
        "id": d["id"], "first_name": d["first_name"], "last_name": d["last_name"],
        "experience": d["experience"], "specialties": d["specialties"],
        "services": [{"id": s["id"], "name": s["name"], "price": s["price"]} for s in svcs],
        "clinic_id": d["clinic_id"],
    }


class SimBridge:
    """Hỗ trợ đủ BridgeClient Protocol. `profile` = hồ sơ bệnh nhân của user test."""

    def __init__(self, *, now: datetime | None = None, fail_tools: set[str] | None = None) -> None:
        self.now = now or datetime.now(VN)
        self.fail_tools = fail_tools or set()  # mô phỏng Be lỗi: tool → trả error_code
        self.appointments: dict[int, dict] = {}
        self.drafts: dict[str, dict] = {}
        self._idem: dict[str, str] = {}
        self._aid = itertools.count(1001)
        self._did = itertools.count(1)
        self.calls: list[tuple] = []
        self.profile = {
            "patient_profile_id": 100, "first_name": "An", "last_name": "Nguyễn Văn",
            "dob": "1995-05-20", "gender": "MALE", "phone": "0900000000",
        }

    # --- helpers ---
    def _guard(self, name: str) -> dict | None:
        self.calls.append((name,))
        return {"error_code": "bridge_unavailable"} if name in self.fail_tools else None

    def _busy(self, doctor_id: int, date: str) -> set[int]:
        out = set()
        for a in self.appointments.values():
            if a["doctor_id"] == doctor_id and a["status"] != "CANCELLED" and a["start_time"][:10] == date:
                out.add(int(a["start_time"][11:13]) * 60 + int(a["start_time"][14:16]))
        return out

    def _slots(self, doctor_id: int, date: str) -> list[str] | str:
        try:
            d = datetime.strptime(date, "%Y-%m-%d").replace(tzinfo=VN)
        except ValueError:
            return "invalid_date"
        if d.weekday() == 6:  # Chủ nhật nghỉ
            return "doctor_off"
        busy = self._busy(doctor_id, date)
        now_min = self.now.hour * 60 + self.now.minute
        res = []
        for m in range(WORK_START, WORK_END, 30):
            if LUNCH[0] <= m < LUNCH[1] or m in busy:
                continue
            if d.date() < self.now.date() or (d.date() == self.now.date() and m <= now_min):
                continue
            res.append(_hhmm(m))
        return res

    # --- catalog ---
    async def search_clinics(self, q, location=None):
        if (g := self._guard("search_clinics")):
            return g
        t = (q or "").lower()
        cl = [c for c in CLINICS if not t or t in c["name"].lower() or t in c["address"].lower() or t in (location or "").lower()] or CLINICS
        return {"clinics": cl, "total": len(cl)}

    async def search_services(self, q, clinic_id=None):
        if (g := self._guard("search_services")):
            return g
        t = (q or "").lower()
        sv = [s for s in SERVICES if (not clinic_id or s["clinic_id"] == clinic_id)
              and (not t or t in s["name"].lower() or t in s["specialty"].lower())]
        return {"services": [{k: v for k, v in s.items() if k != "clinic_id"} for s in sv], "clinic_id": clinic_id}

    async def search_doctors(self, q, service_id, clinic_id):
        if (g := self._guard("search_doctors")):
            return g
        toks = (q or "").lower().split()  # như Be: mọi token phải khớp tên/chuyên khoa
        def hit(d):
            hay = (d["first_name"] + " " + d["last_name"] + " " + " ".join(d["specialties"])).lower()
            return all(t in hay for t in toks)
        ds = [d for d in DOCTORS if (not service_id or service_id in d["service_ids"])
              and (not clinic_id or d["clinic_id"] == clinic_id) and hit(d)]
        return {"doctors": [_doctor_out(d) for d in ds]}

    async def get_clinic_detail(self, clinic_id):
        if (g := self._guard("get_clinic_detail")):
            return g
        c = next((c for c in CLINICS if c["id"] == clinic_id), None)
        if not c:
            return {"error_code": "clinic_not_found"}
        return {**c, "services": [s for s in SERVICES if s["clinic_id"] == clinic_id]}

    async def get_doctor_detail(self, doctor_id):
        if (g := self._guard("get_doctor_detail")):
            return g
        d = next((d for d in DOCTORS if d["id"] == doctor_id), None)
        return _doctor_out(d) if d else {"error_code": "doctor_not_found"}

    # --- availability ---
    async def get_doctor_availability(self, doctor_id, date, service_id):
        if (g := self._guard("get_doctor_availability")):
            return g
        s = self._slots(doctor_id, date)
        empty = {"doctor_id": doctor_id, "date": date, "available_slots": []}
        if isinstance(s, str):
            return {**empty, "error_code": s}
        return {"doctor_id": doctor_id, "date": date, "working_hours": {"start": "08:00", "end": "17:30"},
                "available_slots": s, "occupied_slots": sorted(_hhmm(m) for m in self._busy(doctor_id, date))}

    async def find_available_doctors(self, date, service_id, time_preference, clinic_id=None):
        if (g := self._guard("find_available_doctors")):
            return g
        out = []
        for d in DOCTORS:
            if service_id and service_id not in d["service_ids"]:
                continue
            if clinic_id and d["clinic_id"] != clinic_id:
                continue
            s = self._slots(d["id"], date)
            if isinstance(s, str):
                continue
            if time_preference in PERIODS:
                lo, hi = PERIODS[time_preference]
                s = [x for x in s if lo <= int(x[:2]) * 60 + int(x[3:]) < hi]
            if s:
                out.append({"doctor_id": d["id"], "first_name": d["first_name"], "last_name": d["last_name"],
                            "clinic_id": d["clinic_id"], "slot_count": len(s), "sample_slots": s[:12]})
        return {"doctors": out}

    # --- patient ---
    async def resolve_patient_profile(self, user_id):
        return self._guard("resolve_patient_profile") or dict(self.profile)

    async def get_patient_summary(self, user_id):
        return self._guard("get_patient_summary") or {**self.profile, "full_name": "Nguyễn Văn An", "age": 31, "last_visit": None}

    async def get_patient_history(self, user_id):
        return self._guard("get_patient_history") or {"history": []}

    async def get_upcoming_appointments(self, user_id):
        if (g := self._guard("get_upcoming_appointments")):
            return g
        ap = [a for a in self.appointments.values() if a["status"] != "CANCELLED"]
        return {"appointments": [{"id": a["id"], "doctor_name": a["doctor_name"], "service_name": a["service_name"],
                                  "start_time": a["start_time"], "status": a["status"]} for a in sorted(ap, key=lambda x: x["start_time"])]}

    # --- booking ---
    async def create_booking_draft(self, patient_profile_id, doctor_id, service_id, start_time, idempotency_key):
        if (g := self._guard("create_booking_draft")):
            return g
        doc = next((d for d in DOCTORS if d["id"] == doctor_id), None)
        svc = next((s for s in SERVICES if s["id"] == service_id), None)
        if not svc:
            return {"error_code": "service_not_found"}
        if not doc:
            return {"error_code": "doctor_not_found"}
        if service_id not in doc["service_ids"]:
            return {"error_code": "doctor_service_mismatch"}
        try:
            dt = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
        except ValueError:
            return {"error_code": "invalid_start_time"}
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=VN)
        dt = dt.astimezone(VN)
        if dt <= self.now:
            return {"error_code": "slot_in_past"}
        slots = self._slots(doctor_id, dt.strftime("%Y-%m-%d"))
        if isinstance(slots, str):
            return {"error_code": slots}
        if dt.strftime("%H:%M") not in slots:
            return {"error_code": "slot_taken" if dt.strftime("%H:%M") not in slots and WORK_START <= dt.hour * 60 + dt.minute < WORK_END else "slot_outside_working_hours"}
        if idempotency_key in self._idem:
            did = self._idem[idempotency_key]
        else:
            did = f"draft_{next(self._did)}"
            self._idem[idempotency_key] = did
        clinic = next(c for c in CLINICS if c["id"] == doc["clinic_id"])
        recap = {
            "doctor_id": doctor_id, "doctor_name": f"{doc['first_name']} {doc['last_name']}",
            "service_id": service_id, "service_name": svc["name"], "start_time": dt.isoformat(),
            "price": svc["price"], "clinic_id": clinic["id"], "clinic_name": clinic["name"],
            "patient_profile_id": patient_profile_id, "patient_name": "Nguyễn Văn An", "appointment_type": "OFFLINE",
        }
        self.drafts[did] = {"status": "PENDING", "recap": recap, "appointment_id": None}
        return {"draft_id": did, "expires_at": (self.now + timedelta(minutes=10)).isoformat(), "conflicts": [], "recap_data": recap}

    async def confirm_booking(self, draft_id, idempotency_key):
        if (g := self._guard("confirm_booking")):
            return g
        d = self.drafts.get(draft_id)
        if not d:
            return {"error_code": "draft_not_found"}
        if d["status"] == "CONFIRMED":
            return {"appointment_id": d["appointment_id"], "status": "booked", "already_confirmed": True}
        r = d["recap"]
        if r["start_time"][11:16] not in (self._slots(r["doctor_id"], r["start_time"][:10]) or []):
            return {"error_code": "slot_taken"}
        aid = next(self._aid)
        self.appointments[aid] = {"id": aid, "doctor_id": r["doctor_id"], "doctor_name": r["doctor_name"],
                                  "service_id": r["service_id"], "service_name": r["service_name"],
                                  "start_time": r["start_time"], "status": "BOOKED"}
        d.update(status="CONFIRMED", appointment_id=aid)
        return {"appointment_id": aid, "status": "booked"}

    async def cancel_appointment(self, appointment_id):
        self.calls.append(("cancel_appointment_args", appointment_id))
        if (g := self._guard("cancel_appointment")):
            return g
        a = self.appointments.get(appointment_id)
        if not a:
            return {"error_code": "appointment_not_found"}
        a["status"] = "CANCELLED"
        return {"success": True}

    def seed_appointment(self, doctor_id: int, service_id: int, start_iso: str) -> int:
        """Tạo sẵn lịch (để test hủy lịch / slot bận)."""
        d = next(x for x in DOCTORS if x["id"] == doctor_id)
        s = next(x for x in SERVICES if x["id"] == service_id)
        aid = next(self._aid)
        self.appointments[aid] = {"id": aid, "doctor_id": doctor_id, "doctor_name": f"{d['first_name']} {d['last_name']}",
                                  "service_id": service_id, "service_name": s["name"], "start_time": start_iso, "status": "BOOKED"}
        return aid
