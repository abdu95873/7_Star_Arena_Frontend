import { forwardRef } from 'react';

export function Spinner({ className = 'h-5 w-5' }) {
  return (
    <svg className={`animate-spin text-current ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function Button({ as: Comp = 'button', variant = 'primary', loading, className = '', children, ...props }) {
  const variants = {
    primary: 'btn-primary',
    accent: 'btn-accent',
    ghost: 'btn-ghost',
    outline: 'btn-outline',
    danger: 'btn bg-red-600 text-white hover:bg-red-700',
  };
  return (
    <Comp className={`${variants[variant] || variants.primary} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </Comp>
  );
}

export const Input = forwardRef(function Input({ className = '', error, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`input ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : ''} ${className}`}
      {...props}
    />
  );
});

export const Textarea = forwardRef(function Textarea({ className = '', error, ...props }, ref) {
  return <textarea ref={ref} className={`input min-h-[90px] ${error ? 'border-red-500' : ''} ${className}`} {...props} />;
});

export const Select = forwardRef(function Select({ className = '', children, ...props }, ref) {
  return (
    <select ref={ref} className={`input ${className}`} {...props}>
      {children}
    </select>
  );
});

export function Field({ label, error, hint, children, required }) {
  return (
    <div>
      {label && (
        <label className="label">
          {label} {required && <span className="text-accent-400">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function Card({ className = '', children }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function Badge({ tone = 'gray', children }) {
  const tones = {
    gray: 'bg-ink-700/60 text-ink-200',
    green: 'bg-turf-500/15 text-turf-300 ring-1 ring-turf-500/30',
    amber: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
    red: 'bg-red-500/15 text-red-300 ring-1 ring-red-500/30',
    blue: 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30',
    orange: 'bg-accent-500/15 text-accent-300 ring-1 ring-accent-500/30',
  };
  return <span className={`badge ${tones[tone] || tones.gray}`}>{children}</span>;
}

export function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="card relative z-10 w-full max-w-md animate-fade-in p-6">
        {title && <h3 className="mb-3 text-lg font-bold text-white">{title}</h3>}
        <div className="text-sm text-ink-300">{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-ink-400">
      <Spinner /> {label}
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-red-400">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', description, icon = '📭', action }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <div className="text-4xl">{icon}</div>
      <p className="font-semibold text-ink-200">{title}</p>
      {description && <p className="max-w-sm text-sm text-ink-400">{description}</p>}
      {action}
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-ink-800 ${className}`} />;
}
