import React from 'react';

const STAGES = [
  { key: 'pending', label: 'В очереди' },
  { key: 'searching', label: 'Поиск' },
  { key: 'synthesizing', label: 'Синтез' },
  { key: 'done', label: 'Готово' },
];

export const ProgressStage: React.FC<{ status: string; detail: string }> = ({ status, detail }) => {
  const activeIndex = Math.max(
    0,
    STAGES.findIndex((s) => s.key === status),
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {STAGES.map((stage, i) => (
          <React.Fragment key={stage.key}>
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors ${
                i <= activeIndex ? 'bg-accent text-white' : 'bg-white/5 text-muted'
              }`}
            >
              {i + 1}
            </div>
            {i < STAGES.length - 1 && (
              <div className={`flex-1 h-0.5 rounded transition-colors ${i < activeIndex ? 'bg-accent' : 'bg-white/10'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-60" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
        </span>
        <p className="text-sm text-muted" data-testid="stage-detail">
          {detail}
        </p>
      </div>
    </div>
  );
};
