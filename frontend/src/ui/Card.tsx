import React from 'react';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
  <div {...props} className={`bg-card border border-border rounded-xl p-5 ${className}`} />
);
