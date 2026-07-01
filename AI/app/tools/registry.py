"""ToolRegistry — DATA-only. resolve_date chạy local; còn lại gọi BeBridge.

- openai_schemas(state): chỉ phơi tool được phép ở state đó (giảm hallucination).
- execute(): validate input (LLM có thể sai field) -> chạy -> trả DATA dict.
- idempotency_key sinh từ session (KHÔNG cho LLM truyền).
"""
from __future__ import annotations

import dataclasses
import hashlib
import json
from collections.abc import Callable
from datetime import datetime, timedelta, timezone
from typing import Any

from pydantic import BaseModel, ValidationError

from app.nlu import vn_date
from app.session.models import AgentState
from app.tools import schemas as S
from app.tools.be_bridge import BridgeClient

_VN_TZ = timezone(timedelta(hours=7))


def _now_vn() -> datetime:
    return datetime.now(_VN_TZ)


# tên tool -> (input model, mô tả cho LLM, set state được phép gọi)
_S = AgentState
_SPEC: dict[str, tuple[type[BaseModel], str, set[AgentState]]] = {
    "resolve_date": (S.ResolveDateInput, "Đổi cụm thời gian tương đối thành ngày ISO. GỌI TRƯỚC mọi tool lịch.",
                     {_S.IDLE, _S.COLLECTING, _S.CANDIDATE, _S.SLOT}),
    "search_clinics": (S.SearchClinicsInput, "Tìm/liệt kê cơ sở phòng khám. Để q trống để lấy TẤT CẢ cơ sở; lọc theo khu vực qua location.",
                       {_S.IDLE, _S.COLLECTING}),
    "search_services": (S.SearchServicesInput, "Tìm dịch vụ, có thể lọc theo phòng khám.",
                        {_S.IDLE, _S.COLLECTING}),
    "search_doctors": (S.SearchDoctorsInput, "Tìm bác sĩ (fuzzy theo tên), lọc theo dịch vụ.",
                       {_S.IDLE, _S.COLLECTING, _S.CANDIDATE}),
    "get_clinic_detail": (S.GetClinicDetailInput, "Lấy thông tin chi tiết phòng khám (sđt, mô tả, danh sách dịch vụ, số lượng bác sĩ).",
                          {_S.IDLE, _S.COLLECTING, _S.CANDIDATE}),
    "get_doctor_detail": (S.GetDoctorDetailInput, "Lấy thông tin chi tiết bác sĩ (kinh nghiệm, đánh giá trung bình, danh sách chuyên khoa và dịch vụ).",
                          {_S.IDLE, _S.COLLECTING, _S.CANDIDATE}),
    "get_doctor_availability": (S.GetDoctorAvailabilityInput, "Lịch trống của 1 bác sĩ ngày X (date ISO).",
                                {_S.IDLE, _S.COLLECTING, _S.CANDIDATE, _S.SLOT}),
    "find_available_doctors": (S.FindAvailableDoctorsInput, "Tìm bác sĩ rảnh trong ngày/khung giờ.",
                               {_S.IDLE, _S.COLLECTING, _S.CANDIDATE}),
    "search_knowledge": (S.SearchKnowledgeInput, "Tra cứu kiến thức: bệnh/triệu chứng -> gợi ý chuyên khoa; thủ tục/chính sách đặt-huỷ-đổi lịch.",
                         {_S.IDLE, _S.COLLECTING, _S.CANDIDATE, _S.SLOT}),
    "resolve_patient_profile": (S.ResolvePatientProfileInput, "Lấy hồ sơ bệnh nhân của user.",
                                {_S.IDLE, _S.COLLECTING}),
    "create_booking_draft": (S.CreateBookingDraftInput, "Tạo bản nháp đặt lịch (chưa phải lịch thật). Chỉ gọi khi đã đủ bác sĩ + dịch vụ + giờ cụ thể.",
                             {_S.COLLECTING, _S.DRAFT_READY}),
    "get_my_upcoming_appointments": (S.GetUpcomingAppointmentsInput, "Lịch hẹn sắp tới của user.",
                                     {_S.IDLE, _S.COLLECTING, _S.BOOKED, _S.FAILED}),
    "get_patient_history": (S.GetPatientHistoryInput, "Lịch sử khám bệnh gần đây của user bao gồm chẩn đoán, dặn dò và đơn thuốc.",
                            {_S.IDLE, _S.COLLECTING, _S.BOOKED, _S.FAILED}),
    "confirm_booking": (S.ConfirmBookingInput, "Xác nhận draft thành lịch thật (agent gọi).", set()),
    "request_cancel_booking": (S.CancelAppointmentInput, "Yêu cầu hủy lịch khám. Chỉ gọi khi đã xác định được appointment_id cụ thể từ danh sách upcoming.",
                               {_S.IDLE, _S.COLLECTING}),
    "cancel_appointment": (S.CancelAppointmentInput, "Hủy lịch khám thật (agent gọi).", set()),
}


class ToolRegistry:
    def __init__(self, bridge: BridgeClient, retriever: Any = None, now_fn: Callable[[], datetime] = _now_vn) -> None:
        self._bridge = bridge
        self._retriever = retriever
        self._now = now_fn

    @property
    def bridge(self) -> BridgeClient:
        return self._bridge

    def openai_schemas(self, allowed_for_state: AgentState) -> list[dict]:
        out = []
        for name, (model, desc, states) in _SPEC.items():
            if allowed_for_state in states:
                out.append(S.to_openai_tool(name, desc, model))
        return out

    @staticmethod
    def _idem(*parts: object) -> str:
        return hashlib.sha256("|".join(str(p) for p in parts).encode()).hexdigest()[:32]

    async def execute(self, name: str, raw_args: dict | None, *, session_id: str) -> dict:
        spec = _SPEC.get(name)
        if spec is None:
            return {"error_code": "unknown_tool"}
        try:
            args = spec[0](**(raw_args or {}))
        except ValidationError as exc:
            return {"error_code": "invalid_args", "details": json.loads(exc.json())}
        return await self._run(name, args, session_id)

    async def _run(self, name: str, a: BaseModel, session_id: str) -> dict:
        b = self._bridge
        if name == "resolve_date":
            res = vn_date.resolve_vn_date(
                now=self._now(), weekday=a.weekday, week_offset=a.week_offset,
                month_offset=a.month_offset, day_of_month=a.day_of_month,
                relative_days=a.relative_days, period=a.period,
            )
            return dataclasses.asdict(res)
        if name == "search_clinics":
            return await b.search_clinics(a.q, a.location)
        if name == "search_services":
            return await b.search_services(a.q, a.clinic_id)
        if name == "search_doctors":
            return await b.search_doctors(a.q, a.service_id, a.clinic_id)
        if name == "get_clinic_detail":
            return await b.get_clinic_detail(a.clinic_id)
        if name == "get_doctor_detail":
            return await b.get_doctor_detail(a.doctor_id)
        if name == "search_knowledge":
            if not self._retriever:
                return {"error_code": "retriever_not_available"}
            chunks = await self._retriever.retrieve(a.query, top_k=5, filter_types=a.types, allowed_only=True)
            return {"chunks": [{"canonical_name": c.canonical_name, "type": c.type, "text": c.text, "score": c.similarity_score} for c in chunks]}
        if name == "get_doctor_availability":
            return await b.get_doctor_availability(a.doctor_id, a.date, a.service_id)
        if name == "find_available_doctors":
            return await b.find_available_doctors(a.date, a.service_id, a.time_preference, a.clinic_id)
        if name == "resolve_patient_profile":
            return await b.resolve_patient_profile(a.user_id)
        if name == "create_booking_draft":
            key = self._idem(session_id, a.start_time, a.doctor_id)
            return await b.create_booking_draft(a.patient_profile_id, a.doctor_id, a.service_id, a.start_time, key)
        if name == "confirm_booking":
            key = self._idem(session_id, a.draft_id)
            return await b.confirm_booking(a.draft_id, key)
        if name == "get_my_upcoming_appointments":
            return await b.get_upcoming_appointments(a.user_id)
        if name == "get_patient_history":
            return await b.get_patient_history(a.user_id)
        if name == "request_cancel_booking":
            return {"status": "pending_confirmation", "appointment_id": a.appointment_id}
        if name == "cancel_appointment":
            return await b.cancel_appointment(a.appointment_id)
        return {"error_code": "unknown_tool"}
