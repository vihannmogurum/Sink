import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
          {
            'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-950 shadow-sm':
              variant === 'primary',
            'bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-400':
              variant === 'secondary',
            'border border-slate-300 bg-transparent text-slate-800 hover:bg-slate-100 focus:ring-slate-400':
              variant === 'outline',
            'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-300':
              variant === 'ghost',
            'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-sm':
              variant === 'danger',
            'text-xs px-2.5 py-1.5 h-8 gap-1.5': size === 'sm',
            'text-sm px-4 py-2 h-9 gap-2': size === 'md',
            'text-base px-5 py-2.5 h-11 gap-2.5': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
