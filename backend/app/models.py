from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from sqlmodel import SQLModel, Field


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class JobStatus(str, Enum):
    PENDING = "pending"
    SEARCHING = "searching"
    SYNTHESIZING = "synthesizing"
    DONE = "done"
    FAILED = "failed"


class ResearchJob(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    topic: str
    status: JobStatus = Field(default=JobStatus.PENDING)
    stage_detail: str = Field(default="")
    error: Optional[str] = None
    demo_mode: bool = Field(default=False)
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)


class Insight(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    job_id: int = Field(foreign_key="researchjob.id")
    title: str
    summary: str
    evidence_quote: str
    source_url: str
    source_title: str
    relevance: Optional[str] = Field(default=None)  # "relevant" | "not_relevant" | None
    created_at: datetime = Field(default_factory=utcnow)
