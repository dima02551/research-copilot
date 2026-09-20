import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useResearchEvents } from '../hooks/useResearchEvents';
import { Badge, Button, Card, EmptyState, ProgressStage } from '../ui';
import type { Insight } from '../api/types';

const InsightCard: React.FC<{ insight: Insight; jobId: number }> = ({ insight, jobId }) => {
  const queryClient = useQueryClient();
  const setRelevance = useMutation({
    mutationFn: (relevance: 'relevant' | 'not_relevant' | null) => api.setRelevance(insight.id, relevance),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job', jobId] }),
  });

  return (
    <Card className="space-y-3" data-testid="insight-card">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium">{insight.title}</h3>
        {insight.relevance === 'relevant' && <Badge tone="positive">Релевантно</Badge>}
        {insight.relevance === 'not_relevant' && <Badge tone="negative">Не релевантно</Badge>}
      </div>
      <p className="text-sm text-muted">{insight.summary}</p>
      <blockquote className="border-l-2 border-accent/50 pl-3 text-sm text-muted italic">
        «{insight.evidence_quote}»
      </blockquote>
      <a
        href={insight.source_url}
        target="_blank"
        rel="noreferrer"
        className="text-xs text-accent hover:underline inline-block"
      >
        {insight.source_title} ↗
      </a>
      <div className="flex gap-2 pt-1">
        <Button
          variant={insight.relevance === 'relevant' ? 'primary' : 'secondary'}
          onClick={() => setRelevance.mutate(insight.relevance === 'relevant' ? null : 'relevant')}
          className="text-xs px-3 py-1.5"
        >
          👍 Релевантно
        </Button>
        <Button
          variant={insight.relevance === 'not_relevant' ? 'primary' : 'secondary'}
          onClick={() => setRelevance.mutate(insight.relevance === 'not_relevant' ? null : 'not_relevant')}
          className="text-xs px-3 py-1.5"
        >
          👎 Не релевантно
        </Button>
      </div>
    </Card>
  );
};

const RELEVANCE_LABEL: Record<string, string> = {
  relevant: 'Релевантно',
  not_relevant: 'Не релевантно',
};

const InsightRow: React.FC<{ insight: Insight; jobId: number }> = ({ insight, jobId }) => {
  const queryClient = useQueryClient();
  const setRelevance = useMutation({
    mutationFn: (relevance: 'relevant' | 'not_relevant' | null) => api.setRelevance(insight.id, relevance),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job', jobId] }),
  });

  return (
    <tr className="border-b border-border last:border-0 align-top" data-testid="insight-row">
      <td className="py-3 pr-4">
        <p className="font-medium">{insight.title}</p>
        <p className="text-xs text-muted mt-1">{insight.summary}</p>
      </td>
      <td className="py-3 pr-4">
        <a
          href={insight.source_url}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-accent hover:underline"
        >
          {insight.source_title} ↗
        </a>
      </td>
      <td className="py-3 pr-4">
        {insight.relevance ? (
          <Badge tone={insight.relevance === 'relevant' ? 'positive' : 'negative'}>
            {RELEVANCE_LABEL[insight.relevance]}
          </Badge>
        ) : (
          <span className="text-xs text-muted">—</span>
        )}
      </td>
      <td className="py-3">
        <div className="flex gap-2">
          <Button
            variant={insight.relevance === 'relevant' ? 'primary' : 'secondary'}
            onClick={() => setRelevance.mutate(insight.relevance === 'relevant' ? null : 'relevant')}
            className="text-xs px-2.5 py-1"
          >
            👍
          </Button>
          <Button
            variant={insight.relevance === 'not_relevant' ? 'primary' : 'secondary'}
            onClick={() => setRelevance.mutate(insight.relevance === 'not_relevant' ? null : 'not_relevant')}
            className="text-xs px-2.5 py-1"
          >
            👎
          </Button>
        </div>
      </td>
    </tr>
  );
};

// Карточки хороши для чтения одного-двух инсайтов вдумчиво; таблица — чтобы
// быстро просканировать весь отчёт и сравнить источники/релевантность разом.
// Оба режима читают одни и те же данные, разница только в разметке.
type ReportView = 'cards' | 'table';

export const ReportPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const id = Number(jobId);
  const queryClient = useQueryClient();
  const [view, setView] = React.useState<ReportView>('cards');

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => api.getJob(id),
  });

  const progress = useResearchEvents(job && job.status !== 'done' && job.status !== 'failed' ? id : null, () =>
    queryClient.invalidateQueries({ queryKey: ['job', id] }),
  );

  if (isLoading || !job) {
    return <div className="p-8 text-muted text-sm">Загрузка...</div>;
  }

  const isRunning = job.status !== 'done' && job.status !== 'failed';

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Link to="/" className="text-xs text-muted hover:text-white">
        ← Новое исследование
      </Link>
      <h1 className="text-xl font-semibold mt-2 mb-1">{job.topic}</h1>
      {job.demo_mode && (
        <p className="text-xs text-amber-400 mb-4">
          Демо-режим: показаны примерные данные. Добавьте ANTHROPIC_API_KEY на бэкенде для живого поиска.
        </p>
      )}

      {isRunning && (
        <Card className="mb-6">
          <ProgressStage status={progress?.status ?? job.status} detail={progress?.detail ?? job.stage_detail} />
        </Card>
      )}

      {job.status === 'failed' && (
        <Card className="mb-6 border-red-500/30">
          <p className="text-red-400 text-sm">Исследование не удалось: {job.error}</p>
        </Card>
      )}

      {job.status === 'done' && (
        <>
          <div className="flex items-center justify-between gap-2 mb-6 flex-wrap">
            <div className="flex gap-2">
              <a href={api.exportUrl(id, 'md')} download>
                <Button variant="secondary" className="text-xs">
                  Экспорт в Markdown
                </Button>
              </a>
              <a href={api.exportUrl(id, 'pdf')} download>
                <Button variant="secondary" className="text-xs">
                  Экспорт в PDF
                </Button>
              </a>
            </div>
            {job.insights.length > 0 && (
              <div className="flex gap-1 p-1 rounded-lg bg-card border border-border" role="group" aria-label="Вид отчёта">
                <Button
                  variant={view === 'cards' ? 'primary' : 'ghost'}
                  onClick={() => setView('cards')}
                  className="text-xs px-3 py-1.5"
                  aria-pressed={view === 'cards'}
                >
                  Карточки
                </Button>
                <Button
                  variant={view === 'table' ? 'primary' : 'ghost'}
                  onClick={() => setView('table')}
                  className="text-xs px-3 py-1.5"
                  aria-pressed={view === 'table'}
                >
                  Таблица
                </Button>
              </div>
            )}
          </div>

          {job.insights.length === 0 ? (
            <EmptyState title="Инсайтов не найдено" description="Попробуйте переформулировать тему." />
          ) : view === 'cards' ? (
            <div className="space-y-4">
              {job.insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} jobId={id} />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted border-b border-border">
                    <th className="pb-2 pr-4 font-medium">Инсайт</th>
                    <th className="pb-2 pr-4 font-medium">Источник</th>
                    <th className="pb-2 pr-4 font-medium">Релевантность</th>
                    <th className="pb-2 font-medium">Отметить</th>
                  </tr>
                </thead>
                <tbody>
                  {job.insights.map((insight) => (
                    <InsightRow key={insight.id} insight={insight} jobId={id} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};
