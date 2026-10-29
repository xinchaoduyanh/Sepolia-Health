"""Schema input cho từng tool (validate args do LLM sinh).

Quy tắc DATA-only: output tool KHÔNG có message/prose/emoji; lỗi -> error_code.
Output bridge tin tưởng (internal) nên validate nhẹ; có thể siết sau.
"""
from __future__ import annotations

import re
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

KnowledgeTypeLiteral = Literal["disease", "symptom", "faq", "policy"]
TimePreferenceLiteral = Literal["morning", "noon", "afternoon", "evening", "office"]
_ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
_ISO_DT = re.compile(
    r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}"
    r"(?:\.\d+)?"
    r"(?:Z|[+-]\d{2}:\d{2})$"
)


def _check_iso_date(v: str) -> str:
    """YYYY-MM-DD và là ngày lịch hợp lệ (2026-02-31 bị loại)."""
    if not _ISO_DATE.match(v or ""):
        raise ValueError("date must be YYYY-MM-DD")
    try:
        date.fromisoformat(v)
    except ValueError as exc:
        raise ValueError("date is not a valid calendar date") from exc
    return v


# ---- input models ----------------------------------------------------------
class ResolveDateInput(BaseModel):
    weekday: str | None = Field(None, description="mon|tue|wed|thu|fri|sat|sun (map từ t2/thứ ba...)")
    week_offset: int = Field(0, description="tuần này=0, tuần sau=1, tuần sau nữa=2")
    month_offset: int = Field(0, description="tháng này=0, tháng sau=1")
    day_of_month: int | None = Field(None, description="khi user nói thẳng 'ngày 23'")
    relative_days: int | None = Field(None, description="ngày mai=1, ngày kia=2")
    period: str | None = Field(None, description="weekend|early_week|mid_week (cuối/đầu/giữa tuần)")


class SearchKnowledgeInput(BaseModel):
    query: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Câu hỏi hoặc từ khóa cần tra cứu kiến thức/quy trình/chính sách.",
    )
    types: list[KnowledgeTypeLiteral] = Field(
        ...,
        min_length=1,
        max_length=4,
        description="Các loại kiến thức cần tra cứu. Chỉ chọn trong số: 'disease', 'symptom', 'faq', 'policy'.",
    )


class GetClinicDetailInput(BaseModel):
    clinic_id: int = Field(..., gt=0, description="ID của phòng khám/cơ sở y tế cần xem chi tiết.")


class GetDoctorDetailInput(BaseModel):
    doctor_id: int = Field(..., gt=0, description="ID của bác sĩ cần xem chi tiết.")


class SearchClinicsInput(BaseModel):
    q: str | None = Field(None, max_length=200, description="Từ khoá tên cơ sở. Để TRỐNG (None) để liệt kê TẤT CẢ cơ sở.")
    location: str | None = Field(None, max_length=200, description="Lọc theo địa chỉ/khu vực, vd 'Hoàn Kiếm', 'Cầu Giấy'.")


class SearchServicesInput(BaseModel):
    q: str | None = Field(None, max_length=200, description="Từ khoá tên dịch vụ. Để TRỐNG để liệt kê dịch vụ (kết hợp clinic_id).")
    clinic_id: int | None = Field(None, gt=0)


class SearchDoctorsInput(BaseModel):
    q: str | None = Field(None, max_length=200)
    service_id: int | None = Field(None, gt=0)
    clinic_id: int | None = Field(None, gt=0)


class GetDoctorAvailabilityInput(BaseModel):
    doctor_id: int = Field(..., gt=0)
    date: str = Field(..., description="ISO date 'YYYY-MM-DD' (từ resolve_date)")
    service_id: int | None = Field(None, gt=0)

    @field_validator("date")
    @classmethod
    def _iso_date(cls, v: str) -> str:
        return _check_iso_date(v)


class FindAvailableDoctorsInput(BaseModel):
    date: str = Field(..., description="ISO date 'YYYY-MM-DD' (từ resolve_date)")
    service_id: int | None = Field(None, gt=0)
    time_preference: TimePreferenceLiteral | None = Field(
        None, description="Buổi mong muốn: morning|noon|afternoon|evening|office (sáng/trưa/chiều/tối/giờ hành chính)."
    )
    clinic_id: int | None = Field(None, gt=0, description="Lọc bác sĩ theo cơ sở (lấy id từ search_clinics).")

    @field_validator("date")
    @classmethod
    def _iso_date(cls, v: str) -> str:
        return _check_iso_date(v)


class ResolvePatientProfileInput(BaseModel):
    user_id: int = Field(..., gt=0)


class CreateBookingDraftInput(BaseModel):
    patient_profile_id: int = Field(..., gt=0)
    doctor_id: int = Field(..., gt=0)
    service_id: int = Field(..., gt=0)
    start_time: str = Field(..., description="ISO datetime, vd 2026-06-23T09:00:00+07:00")

    @field_validator("start_time")
    @classmethod
    def _iso_datetime(cls, v: str) -> str:
        if not _ISO_DT.match(v or ""):
            raise ValueError("start_time must be ISO-8601 with timezone, e.g. 2026-06-23T09:00:00+07:00")
        try:
            datetime.fromisoformat(v.replace("Z", "+00:00"))
        except ValueError as exc:
            raise ValueError("start_time is not a valid datetime") from exc
        return v


class ConfirmBookingInput(BaseModel):
    draft_id: str = Field(..., min_length=1, max_length=64, pattern=r"^[A-Za-z0-9_-]+$")


class GetUpcomingAppointmentsInput(BaseModel):
    user_id: int = Field(..., gt=0)


class GetPatientHistoryInput(BaseModel):
    user_id: int = Field(..., gt=0)


class CancelAppointmentInput(BaseModel):
    appointment_id: int = Field(..., gt=0)


# ---- helper: pydantic model -> OpenAI tool schema --------------------------
def _simplify(node):
    """Làm phẳng schema cho Ollama: gộp anyOf-có-null thành type đơn, bỏ title/default.

    Pydantic sinh `X | None` thành anyOf:[{type:X},{type:null}] — parser tool của
    Ollama (0.30) lỗi 400 với dạng này. Bỏ null + làm phẳng để Qwen nuốt được.
    """
    if isinstance(node, list):
        return [_simplify(x) for x in node]
    if not isinstance(node, dict):
        return node
    node = dict(node)
    if "anyOf" in node:
        variants = [v for v in node["anyOf"] if not (isinstance(v, dict) and v.get("type") == "null")]
        if len(variants) == 1 and isinstance(variants[0], dict):
            desc = node.get("description")
            node = dict(variants[0])
            if desc and "description" not in node:
                node["description"] = desc
        else:
            node["anyOf"] = variants
    node.pop("title", None)
    node.pop("default", None)
    return {k: _simplify(v) for k, v in node.items()}


def to_openai_tool(name: str, description: str, model: type[BaseModel]) -> dict:
    schema = _simplify(model.model_json_schema())
    return {
        "type": "function",
        "function": {"name": name, "description": description, "parameters": schema},
    }
