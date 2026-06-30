from pathlib import Path

from app.rag.emergency import EmergencyDetector
from app.rag.policy import KnowledgePolicy


KNOWLEDGE = Path(__file__).resolve().parents[1] / "knowledge"


def test_policy_blocks_mentions_outside_allowlist():
    policy = KnowledgePolicy(KNOWLEDGE)

    result = policy.check_response_mentions("Bạn nên đi khám, không thể kết luận HIV-AIDS qua chat.")

    assert result.violated is True
    # blocked term lưu dạng prose "hiv aids" (khớp cả HIV-AIDS / HIV/AIDS / HIV AIDS)
    assert "hiv aids" in {item.lower() for item in result.found}


def test_policy_allows_seed_allowed_disease():
    policy = KnowledgePolicy(KNOWLEDGE)

    result = policy.check_response_mentions("Triệu chứng này có thể liên quan cảm cúm thông thường.")

    assert result.violated is False


def test_emergency_detector_matches_high_fever_and_seizure():
    detector = EmergencyDetector(KNOWLEDGE)

    result = detector.detect("Bé sốt 40 độ và co giật.")

    assert result.emergency is True
    assert result.matched
