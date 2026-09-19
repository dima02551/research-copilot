import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../api/client';
import { Button, Card } from '../ui';

const EXAMPLES = [
  'Рынок кредитования малого бизнеса в России',
  'Тренды в антифрод-технологиях банков 2026',
  'Конкуренты в сегменте BNPL в СНГ',
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');

  const startResearch = useMutation({
    mutationFn: (t: string) => api.startResearch(t),
    onSuccess: (job) => navigate(`/report/${job.id}`),
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-xl">
        <h1 className="text-2xl font-semibold mb-1">Research Copilot</h1>
        <p className="text-muted text-sm mb-6">
          Опишите тему — агент найдёт источники в интернете и соберёт отчёт с доказательствами.
        </p>

        <Card>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (topic.trim()) startResearch.mutate(topic.trim());
            }}
          >
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Например: тренды в антифрод-технологиях банков в 2026"
              rows={3}
              data-testid="topic-input"
              className="w-full bg-transparent border border-border rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-accent/60"
            />
            <div className="flex items-center justify-between mt-4">
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setTopic(ex)}
                    className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-muted hover:text-white"
                  >
                    {ex}
                  </button>
                ))}
              </div>
              <Button type="submit" disabled={!topic.trim() || startResearch.isPending} data-testid="start-button">
                {startResearch.isPending ? 'Запускаю...' : 'Начать исследование'}
              </Button>
            </div>
            {startResearch.isError && (
              <p className="text-red-400 text-xs mt-3">Не удалось запустить исследование. Попробуйте ещё раз.</p>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
};
