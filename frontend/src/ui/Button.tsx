import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent/90 disabled:bg-accent/40',
  secondary: 'bg-card border border-border text-white hover:border-accent/50',
  ghost: 'text-muted hover:text-white',
};

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', className = '', ...props }) => (
  <button
    {...props}
    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
  />
);
