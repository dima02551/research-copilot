"""Tiny in-memory pub/sub for per-job SSE progress streams.

Good enough for a single-process demo. In a real deployment with multiple
workers you'd back this with Redis pub/sub instead — noted in the README.
"""
import asyncio
import json
from typing import Dict


class JobEventBus:
    def __init__(self) -> None:
        self._queues: Dict[int, list[asyncio.Queue]] = {}

    def _get_queues(self, job_id: int) -> list[asyncio.Queue]:
        return self._queues.setdefault(job_id, [])

    def subscribe(self, job_id: int) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue()
        self._get_queues(job_id).append(q)
        return q

    def unsubscribe(self, job_id: int, q: asyncio.Queue) -> None:
        queues = self._queues.get(job_id, [])
        if q in queues:
            queues.remove(q)

    async def publish(self, job_id: int, event: str, data: dict) -> None:
        payload = json.dumps(data)
        for q in list(self._get_queues(job_id)):
            await q.put(f"event: {event}\ndata: {payload}\n\n")


bus = JobEventBus()
