"""The research agent.

Two modes, chosen automatically:

- **Live mode** (ANTHROPIC_API_KEY set): a real Claude Opus 5 call with the
  native `web_search` server tool. Claude searches the web itself, reads
  results, and returns a structured JSON report (see schemas.REPORT_JSON_SCHEMA)
  of insights, each backed by a quoted source. We stream the response and
  turn Claude's own tool-use events into progress updates — not a fake
  progress bar, an honest reflection of what the model is doing.

- **Demo mode** (no key): a deterministic, topic-flavored fake run. Same
  stages, same timing shape, same DB writes — lets the whole app (including
  the Playwright e2e test) run without API cost or network flakiness.
"""
import asyncio
import json
import os
import time
from typing import Optional

from sqlmodel import Session

from .db import engine
from .models import Insight, JobStatus, ResearchJob
from .schemas import REPORT_JSON_SCHEMA
from .sse import bus

MODEL = "claude-opus-5"


def _client():
    import anthropic

    return anthropic.Anthropic()


async def run_research(job_id: int) -> None:
    with Session(engine) as session:
        job = session.get(ResearchJob, job_id)
        assert job is not None
        demo_mode = not bool(os.getenv("ANTHROPIC_API_KEY"))
        job.demo_mode = demo_mode
        session.add(job)
        session.commit()

    try:
        if demo_mode:
            insights = await _run_demo(job_id)
        else:
            insights = await _run_live(job_id)

        with Session(engine) as session:
            job = session.get(ResearchJob, job_id)
            assert job is not None
            for item in insights:
                session.add(
                    Insight(
                        job_id=job_id,
                        title=item["title"],
                        summary=item["summary"],
                        evidence_quote=item["evidence_quote"],
                        source_url=item["source_url"],
                        source_title=item["source_title"],
                    )
                )
            job.status = JobStatus.DONE
            job.stage_detail = "Готово"
            session.add(job)
            session.commit()

        await bus.publish(job_id, "done", {"status": "done"})
    except Exception as exc:  # noqa: BLE001 - surface any failure to the client
        with Session(engine) as session:
            job = session.get(ResearchJob, job_id)
            if job is not None:
                job.status = JobStatus.FAILED
                job.error = str(exc)
                session.add(job)
                session.commit()
        await bus.publish(job_id, "failed", {"status": "failed", "error": str(exc)})


async def _set_stage(job_id: int, status: JobStatus, detail: str) -> None:
    with Session(engine) as session:
        job = session.get(ResearchJob, job_id)
        if job is not None:
            job.status = status
            job.stage_detail = detail
            session.add(job)
            session.commit()
    await bus.publish(job_id, "progress", {"status": status.value, "detail": detail})


async def _run_live(job_id: int) -> list[dict]:
    with Session(engine) as session:
        job = session.get(ResearchJob, job_id)
        assert job is not None
        topic = job.topic

    await _set_stage(job_id, JobStatus.SEARCHING, "Ищу источники...")

    client = _client()
    search_count = 0

    def _stream_once():
        return client.messages.stream(
            model=MODEL,
            max_tokens=16000,
            thinking={"type": "adaptive", "display": "summarized"},
            tools=[{"type": "web_search_20260209", "name": "web_search", "max_uses": 8}],
            output_config={
                "effort": "high",
                "format": {"type": "json_schema", "schema": REPORT_JSON_SCHEMA},
            },
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"Research this topic and produce 4-8 well-evidenced insights: {topic}\n\n"
                        "For each insight, include a direct quote from a real source you found via "
                        "web search, plus that source's URL and title. Prefer recent, credible "
                        "sources. Be concrete — no generic filler insights."
                    ),
                }
            ],
        )

    # Run the blocking SDK stream in a thread so the event loop (and SSE
    # delivery) stay responsive while Claude is searching/thinking.
    loop = asyncio.get_event_loop()

    def _consume():
        nonlocal search_count
        events = []
        with _stream_once() as stream:
            for event in stream:
                events.append(event)
            final = stream.get_final_message()
        return events, final

    events, final = await loop.run_in_executor(None, _consume)

    for event in events:
        if event.type == "content_block_start":
            block = event.content_block
            if getattr(block, "type", None) == "server_tool_use" and getattr(block, "name", "") == "web_search":
                search_count += 1
                await _set_stage(job_id, JobStatus.SEARCHING, f"Ищу источники ({search_count})...")
            elif getattr(block, "type", None) == "web_search_tool_result":
                await _set_stage(job_id, JobStatus.SEARCHING, f"Читаю результаты поиска {search_count}...")
            elif getattr(block, "type", None) == "text":
                await _set_stage(job_id, JobStatus.SYNTHESIZING, "Формирую инсайты...")

    if final.stop_reason == "refusal":
        raise RuntimeError("Claude declined this request (safety refusal).")

    text_block = next((b for b in final.content if b.type == "text"), None)
    if text_block is None:
        raise RuntimeError("No structured report returned by Claude.")

    data = json.loads(text_block.text)
    return data["insights"]


# ── Demo mode ──────────────────────────────────────────────────────────────

_DEMO_STAGES = [
    (JobStatus.SEARCHING, "Ищу источники (1)...", 1.0),
    (JobStatus.SEARCHING, "Ищу источники (2)...", 1.0),
    (JobStatus.SEARCHING, "Читаю результаты поиска...", 1.2),
    (JobStatus.SYNTHESIZING, "Формирую инсайты...", 1.2),
]


async def _run_demo(job_id: int) -> list[dict]:
    with Session(engine) as session:
        job = session.get(ResearchJob, job_id)
        assert job is not None
        topic = job.topic

    for status, detail, delay in _DEMO_STAGES:
        await _set_stage(job_id, status, detail)
        await asyncio.sleep(delay)

    return [
        {
            "title": f"«{topic}» — растущий интерес за последний год",
            "summary": (
                f"Демо-инсайт: в реальном режиме здесь будет вывод, синтезированный Claude "
                f"по вашим источникам про «{topic}». Добавьте ANTHROPIC_API_KEY, чтобы включить "
                "живой поиск."
            ),
            "evidence_quote": "Это пример цитаты-доказательства из источника.",
            "source_url": "https://example.com/demo-source-1",
            "source_title": "Demo Source 1",
        },
        {
            "title": "Ключевые игроки рынка расширяют присутствие",
            "summary": "Второй демо-инсайт — структура отчёта одинакова в демо- и живом режиме.",
            "evidence_quote": "Ещё одна демонстрационная цитата.",
            "source_url": "https://example.com/demo-source-2",
            "source_title": "Demo Source 2",
        },
        {
            "title": "Есть открытые вопросы, требующие уточнения",
            "summary": "Третий демо-инсайт, чтобы показать, как выглядит список из нескольких карточек.",
            "evidence_quote": "Третья демонстрационная цитата с указанием источника.",
            "source_url": "https://example.com/demo-source-3",
            "source_title": "Demo Source 3",
        },
    ]
