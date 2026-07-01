"""Schema input cho từng tool (validate args do LLM sinh).

Quy tắc DATA-only: output tool KHÔNG có message/prose/emoji; lỗi -> error_code.
Output bridge tin tưởng (internal) nên validate nhẹ; có thể siết sau.
"""
from __future__ import annotations

from pydantic import BaseModel, Field


# ---- input models ----------------------------------------------------------
class ResolveDateInput(BaseModel):
    weekday: str | None = Field(None, description="mon|tue|wed|thu|fri|sat|sun (map từ t2/thứ ba...)")
    week_offset: int = Field(0, description="tuần này=0, tuần sau=1, tuần sau nữa=2")
    month_offset: int = Field(0, description="tháng này=0, tháng sau=1")
    day_of_month: int | None = Field(None, description="khi user nói thẳng 'ngày 23'")
    relative_days: int | None = Field(None, description="ngày mai=1, ngày kia=2")
    period: str | None = Field(None, description="weekend|early_week|mid_week (cuối/đầu/giữa tuần)")


class SearchKnowledgeInput(BaseModel):
    query: str = Field(..., description="Câu hỏi hoặc từ khóa cần tra cứu kiến thức/quy trình/chính sách.")
    types: list[str] = Field(
        ...,
        description="Các loại kiến thức cần tra cứu. Chỉ chọn trong số: 'disease', 'symptom', 'faq', 'policy'."
    )


class GetClinicDetailInput(BaseModel):
    clinic_id: int = Field(..., description="ID của phòng khám/cơ sở y tế cần xem chi tiết.")


class GetDoctorDetailInput(BaseModel):
    doctor_id: int = Field(..., description="ID của bác sĩ cần xem chi tiết.")


class SearchClinicsInput(BaseModel):
    q: str | None = Field(None, description="Từ khoá tên cơ sở. Để TRỐNG (None) để liệt kê TẤT CẢ cơ sở.")
    location: str | None = Field(None, description="Lọc theo địa chỉ/khu vực, vd 'Hoàn Kiếm', 'Cầu Giấy'.")


class SearchServicesInput(BaseModel):
    q: str
    clinic_id: int | None = None


class SearchDoctorsInput(BaseModel):
    q: str | None = None
    service_id: int | None = None
    clinic_id: int | None = None


class GetDoctorAvailabilityInput(BaseModel):
    doctor_id: int
    date: str = Field(..., description="ISO date 'YYYY-MM-DD' (từ resolve_date)")
    service_id: int | None = None


class FindAvailableDoctorsInput(BaseModel):
    date: str
    service_id: int | None = None
    time_preference: str | None = Field(
        None, description="Buổi mong muốn: morning|noon|afternoon|evening|office (sáng/trưa/chiều/tối/giờ hành chính)."
    )
    clinic_id: int | None = Field(None, description="Lọc bác sĩ theo cơ sở (lấy id từ search_clinics).")


class ResolvePatientProfileInput(BaseModel):
    user_id: int


class CreateBookingDraftInput(BaseModel):
    patient_profile_id: int
    doctor_id: int
    service_id: int
    start_time: str = Field(..., description="ISO datetime, vd 2026-06-23T09:00:00+07:00")


class ConfirmBookingInput(BaseModel):
    draft_id: str


class GetUpcomingAppointmentsInput(BaseModel):
    user_id: int


class GetPatientHistoryInput(BaseModel):
    user_id: int


class CancelAppointmentInput(BaseModel):
    appointment_id: int


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
