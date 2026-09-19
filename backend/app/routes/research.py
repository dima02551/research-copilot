import asyncio
import json

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import Response, StreamingResponse
from sqlmodel import Session, select

from ..agent import run_research
from ..db import get_session
from ..export import to_markdown, to_pdf
from ..models import Insight, JobStatus, ResearchJob
from ..schemas import JobOut, RelevanceUpdate, StartResearchRequest
from ..sse import bus

router = APIRouter(prefix="/api/research", tags=["research"])


def _job_to_out(job: ResearchJob, insights: list[Insight]) -> JobOut:
    return JobOut(
        id=job.id,
        topic=job.topic,
        status=job.status.value,
        stage_detail=job.stage_detail,
        error=job.error,
        demo_mode=job.demo_mode,
        insights=[
            {
                "id": i.id,
                "title": i.title,
                "summary": i.summary,
                "evidence_quote": i.evidence_quote,
                "source_url": i.source_url,
                "source_title": i.source_title,
                "relevance": i.relevance,
            }
            for i in insights
        ],
    )


@router.post("", response_model=JobOut)
def start_research(
    req: StartResearchRequest,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
):
    topic = req.topic.strip()
    if not topic:
        raise HTTPException(400, "Topic is required")

    job = ResearchJob(topic=topic, status=JobStatus.PENDING, stage_detail="В очереди...")
    session.add(job)
    session.commit()
    session.refresh(job)

    background_tasks.add_task(asyncio.run, run_research(job.id))

    return _job_to_out(job, [])


@router.get("/{job_id}", response_model=JobOut)
def get_research(job_id: int, session: Session = Depends(get_session)):
    job = session.get(ResearchJob, job_id)
    if job is None:
        raise HTTPException(404, "Job not found")
    insights = session.exec(select(Insight).where(Insight.job_id == job_id)).all()
    return _job_to_out(job, list(insights))


@router.get("/{job_id}/events")
async def research_events(job_id: int, session: Session = Depends(get_session)):
    job = session.get(ResearchJob, job_id)
    if job is None:
        raise HTTPException(404, "Job not found")

    async def event_stream():
        # Replay current status immediately so a client that connects late
        # (or reconnects) doesn't wait forever for the next event.
        initial = json.dumps({"status": job.status.value, "detail": job.stage_detail})
        yield f"event: progress\ndata: {initial}\n\n"
        if job.status in (JobStatus.DONE, JobStatus.FAILED):
            yield f"event: {'done' if job.status == JobStatus.DONE else 'failed'}\ndata: {{}}\n\n"
            return

        queue = bus.subscribe(job_id)
        try:
            while True:
                message = await queue.get()
                yield message
                if "event: done" in message or "event: failed" in message:
                    break
        finally:
            bus.unsubscribe(job_id, queue)

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.patch("/insights/{insight_id}")
def update_relevance(insight_id: int, body: RelevanceUpdate, session: Session = Depends(get_session)):
    insight = session.get(Insight, insight_id)
    if insight is None:
        raise HTTPException(404, "Insight not found")
    insight.relevance = body.relevance
    session.add(insight)
    session.commit()
    return {"ok": True}


@router.get("/{job_id}/export")
def export_report(job_id: int, format: str = "md", session: Session = Depends(get_session)):
    job = session.get(ResearchJob, job_id)
    if job is None:
        raise HTTPException(404, "Job not found")
    insights = session.exec(select(Insight).where(Insight.job_id == job_id)).all()

    if format == "pdf":
        pdf_bytes = to_pdf(job, list(insights))
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="report-{job_id}.pdf"'},
        )

    md = to_markdown(job, list(insights))
    return Response(
        content=md,
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="report-{job_id}.md"'},
    )
