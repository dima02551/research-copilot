# Research Copilot

A background research agent for non-technical users: describe a topic,
watch it search the web and read sources in real time, review a report of
evidence-backed insights, mark what's relevant, export the result.

Built to mirror the shape of an internal analyst-copilot tool — the kind
banks and other regulated orgs build so analysts get a fast, checkable
first draft instead of hours of manual search, with a human still
reviewing every insight against its source before it's used.

**Why this exists:** built end-to-end with Claude Code as a practical
demonstration of agentic development — real Claude Opus 5 tool use (native
`web_search`, streamed structured output), a hand-rolled component library
instead of a UI kit, typed REST + SSE, and tests — the stack and workflow
described in Alfa-Bank's "Инженер агентной разработки" posting.

## How it works

```
┌─────────────┐   POST /api/research    ┌──────────────────┐   web_search tool   ┌─────────┐
│   React SPA │ ───────────────────────>│   FastAPI backend │────────────────────>│ Claude  │
│  (wizard,   │                         │  (background task) │<────────────────────│ Opus 5  │
│  progress,  │<─── SSE progress ───────│                    │  structured insights └─────────┘
│  report)    │<─── GET report/export ──│   SQLite           │
└─────────────┘                         └──────────────────┘
```

- **Wizard → background job.** Starting a research job returns immediately;
  the actual work runs as a FastAPI background task.
- **Real progress, not a fake bar.** The backend streams Claude's own
  tool-use events (search started, results read, synthesizing) over SSE —
  the frontend's progress stages reflect what the model is actually doing.
- **Evidence, not just claims.** Every insight in the report carries a
  direct quote and source link, because "trust me" isn't good enough for
  something a bank analyst would act on.
- **Two modes, one code path.** Without `ANTHROPIC_API_KEY` the backend runs
  a deterministic **demo mode** — same stages, same shapes, same DB writes,
  no API cost. This is what the Playwright e2e test runs against. Set the
  key and the exact same endpoints do real research.

## Соответствие вакансии

Для быстрой сверки при скрининге — что из "Инженер агентной разработки" (Альфа-Банк) уже есть в этом репозитории и где именно:

| Пункт вакансии | Где в репозитории |
|---|---|
| Мастер запуска исследования | `frontend/src/pages/HomePage.tsx` |
| Прогресс фонового прогона | SSE: `backend/app/sse.py` + `frontend/src/hooks/useResearchEvents.ts` → `ProgressStage` |
| Отчёт с инсайтами и доказательствами | `ReportPage.tsx` — каждый инсайт несёт `evidence_quote` + `source_url` |
| Разметка релевантности | `PATCH /api/research/insights/{id}` + кнопки 👍/👎 на карточке и в строке таблицы |
| Экспорт | `backend/app/export.py` (Markdown, PDF) |
| Перевод с мок-данных на реальный API | Никаких моков — SPA всегда говорит с настоящим FastAPI; демо-режим подменяет только вызов Claude, не транспорт |
| Типы, зеркалирующие контракт API | `npm run gen:types` → `frontend/src/api/schema.ts` (OpenAPI-generated), `types.ts` — тонкие алиасы поверх него |
| REST + SSE | REST — `backend/app/routes/research.py`; SSE — `GET /api/research/{id}/events` |
| Своя библиотека компонентов (без UI-кита) | `frontend/src/ui/` — Button, Card, Badge, EmptyState, ProgressStage |
| Состояния пустоты и ошибок | `EmptyState.tsx` (нет инсайтов), явный блок `job.status === 'failed'` в `ReportPage.tsx` |
| Доступность | `role="status" aria-live="polite"` на прогрессе (скринридер озвучивает смену стадии, не декоративный степпер), `aria-pressed` на переключателе вида |
| Таблицы/отчёты (плюсом) | Переключатель "Карточки / Таблица" на странице отчёта — одни и те же данные, два представления |
| Тесты | Vitest — `frontend/src/ui/*.test.tsx` (8 тестов); Playwright — `frontend/e2e/research-flow.spec.ts` (2 сценария, оба вида отчёта) |
| Базовый Python на стороне API (плюсом) | Весь бэкенд — Python/FastAPI, не "чуть-чуть" |
| Инструменты агентной разработки | Весь репозиторий построен в Claude Code — от первого коммита до этой таблицы |

Не закрыто честно: экраны "второй очереди" (конструктор сценариев, чат по результатам, расписания, шаблоны отчётов) — см. "What's next" ниже. Банковского опыта как такового нет — только осознанная имитация того, как выглядела бы внутренняя аналитик-копилот система.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + TypeScript + Vite + Tailwind | fast iteration, small bundle |
| Components | Hand-built (`src/ui/`) | shadcn-style — own the code, no UI-kit dependency/bloat |
| State/data | TanStack Query + native `EventSource` (SSE) | typed cache + simple real-time progress |
| Backend | FastAPI (Python) | native OpenAPI schema, trivial `StreamingResponse` for SSE, async-friendly |
| Agent | Claude Opus 5, native `web_search` tool, `output_config.format` for structured JSON | real search + reasoning, schema-guaranteed output — no manual JSON parsing fragility |
| Storage | SQLite via SQLModel | zero ops for a project this size |
| Export | Markdown + PDF (reportlab) | |
| Tests | Vitest (components) + Playwright (e2e, against demo mode) | |

## Running locally

### Backend
```bash
cd backend
python -m venv .venv && .venv/Scripts/activate  # or source .venv/bin/activate on macOS/Linux
pip install -r requirements.txt
cp .env.example .env   # leave ANTHROPIC_API_KEY empty to run in demo mode
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:5173 (or 5183 when run via the Playwright config).

### Tests
```bash
cd frontend
npm run test        # Vitest, component tests
npm run test:e2e     # Playwright — needs the backend running on :8000 first
```

## Deployment

- Frontend → Vercel (static Vite build)
- Backend → Railway/Fly (Docker; see `backend/Dockerfile`)
- Set `ANTHROPIC_API_KEY` on the backend to switch from demo to live mode —
  no code or redeploy needed beyond the env var.

## What's next (scoped out of this MVP)

- Scenario/agent builder, chat-over-results, scheduled runs, report
  templates — the "second wave" screens from the job posting; same
  architecture, bigger surface.
- Redis-backed SSE (current pub/sub is in-process, fine for one instance).
