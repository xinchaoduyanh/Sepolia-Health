"""Contract tests for tool input schemas (Phase 3)."""
import pytest
from pydantic import ValidationError

from app.tools.schemas import (
    CreateBookingDraftInput,
    GetDoctorAvailabilityInput,
    SearchKnowledgeInput,
    SearchServicesInput,
)


def test_search_knowledge_types_enum():
    ok = SearchKnowledgeInput(query="ho khan", types=["symptom", "disease"])
    assert ok.types == ["symptom", "disease"]
    with pytest.raises(ValidationError):
        SearchKnowledgeInput(query="x", types=["unknown"])
    with pytest.raises(ValidationError):
        SearchKnowledgeInput(query="", types=["faq"])


def test_search_services_optional_clinic():
    s = SearchServicesInput(q="mắt", clinic_id=3)
    assert s.clinic_id == 3
    with pytest.raises(ValidationError):
        SearchServicesInput(q="mắt", clinic_id=0)


def test_availability_iso_date():
    GetDoctorAvailabilityInput(doctor_id=1, date="2026-07-20")
    with pytest.raises(ValidationError):
        GetDoctorAvailabilityInput(doctor_id=1, date="20/07/2026")


def test_create_draft_requires_tz_datetime():
    CreateBookingDraftInput(
        patient_profile_id=1,
        doctor_id=2,
        service_id=3,
        start_time="2026-07-20T09:00:00+07:00",
    )
    with pytest.raises(ValidationError):
        CreateBookingDraftInput(
            patient_profile_id=1,
            doctor_id=2,
            service_id=3,
            start_time="2026-07-20 09:00",
        )


def test_gemini_schema_has_no_exclusive_bounds():
    """Regression: gt=0 sinh exclusiveMinimum -> Vertex 400 làm chatbot chết hoàn toàn."""
    import json

    from app.providers.gemini_provider import _to_tools
    from app.tools.registry import ToolRegistry
    from app.session.models import AgentState
    from tests.fakes import FakeBridge

    tools = ToolRegistry(FakeBridge()).openai_schemas(AgentState.IDLE)
    blob = json.dumps(_to_tools(tools))
    assert "exclusiveMinimum" not in blob and "exclusiveMaximum" not in blob
