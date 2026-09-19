import React from 'react';

type Tone = 'neutral' | 'positive' | 'negative' | 'accent';

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-white/5 text-muted',
  positive: 'bg-emerald-500/15 text-emerald-400',
  negative: 'bg-red-500/15 text-red-400',
  accent: 'bg-accent/15 text-accent',
};

export const Badge: React.FC<{ tone?: Tone; children: React.ReactNode }> = ({ tone = 'neutral', children }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${toneClasses[tone]}`}>
    {children}
  </span>
);
