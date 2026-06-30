from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


KnowledgeType = Literal["disease", "symptom", "faq", "policy"]


class RetrievedChunk(BaseModel):
    file_id: str
    canonical_name: str
    type: KnowledgeType
    text: str
    metadata: dict
    similarity_score: float


class PolicyCheckResult(BaseModel):
    violated: bool = False
    found: list[str] = []


class EmergencyMatch(BaseModel):
    emergency: bool = False
    matched: list[str] = []
