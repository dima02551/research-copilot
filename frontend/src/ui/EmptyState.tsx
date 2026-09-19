import React from 'react';

export const EmptyState: React.FC<{ title: string; description?: string; action?: React.ReactNode }> = ({
  title,
  description,
  action,
}) => (
  <div className="text-center py-16 px-6 border border-dashed border-border rounded-xl">
    <p className="text-white font-medium">{title}</p>
    {description && <p className="text-muted text-sm mt-1 max-w-sm mx-auto">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
