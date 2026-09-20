from pydantic import BaseModel
from typing import List, Literal, Optional

from .models import JobStatus

Relevance = Literal["relevant", "not_relevant"]


class StartResearchRequest(BaseModel):
    topic: str


class InsightOut(BaseModel):
    id: int
    title: str
    summary: str
    evidence_quote: str
    source_url: str
    source_title: str
    relevance: Optional[Relevance] = None


class JobOut(BaseModel):
    id: int
    topic: str
    status: JobStatus
    stage_detail: str
    error: Optional[str] = None
    demo_mode: bool
    insights: List[InsightOut] = []


class RelevanceUpdate(BaseModel):
    relevance: Optional[Relevance]  # null clears it


# ── Schema Claude's structured output must match ──────────────────────────
# One JSON object with a list of insights, each carrying its own evidence.
REPORT_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "insights": {
            "type": "array",
            "minItems": 3,
            "maxItems": 8,
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Short insight headline, <=80 chars"},
                    "summary": {"type": "string", "description": "2-3 sentence explanation of the insight"},
                    "evidence_quote": {"type": "string", "description": "Direct quote from a source backing this insight"},
                    "source_url": {"type": "string", "description": "URL of the source the quote came from"},
                    "source_title": {"type": "string", "description": "Title/name of the source"},
                },
                "required": ["title", "summary", "evidence_quote", "source_url", "source_title"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["insights"],
    "additionalProperties": False,
}
