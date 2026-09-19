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

export const ReportPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const id = Number(jobId);
  const queryClient = useQueryClient();

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
          <div className="flex gap-2 mb-6">
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

          {job.insights.length === 0 ? (
            <EmptyState title="Инсайтов не найдено" description="Попробуйте переформулировать тему." />
          ) : (
            <div className="space-y-4">
              {job.insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} jobId={id} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
