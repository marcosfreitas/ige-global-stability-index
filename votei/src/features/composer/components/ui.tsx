'use client';

import { cn } from '@/shared/utils';

/**
 * Local primitives. `components.json` points shadcn at
 * `src/shared/components/ui`, but nothing is installed there yet and this
 * flow needs five elements, so these stay local and dependency-free.
 */

export function Button({
  variant = 'primary',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'outline' }) {
  return (
    <button
      {...props}
      className={cn(
        // 48px floor: this is a thumb-driven flow.
        'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold',
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400',
        variant === 'outline' && 'border border-zinc-700 bg-transparent text-zinc-100 hover:bg-zinc-800',
        variant === 'ghost' && 'bg-transparent text-zinc-400 hover:text-zinc-100',
        className
      )}
    />
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4', className)}>
      {children}
    </div>
  );
}

export function StepTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold tracking-tight text-zinc-50">{children}</h2>
      {hint ? <p className="mt-1 text-sm text-zinc-400">{hint}</p> : null}
    </div>
  );
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="mt-3 rounded-lg bg-red-950/60 px-3 py-2 text-sm text-red-300">
      {children}
    </p>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-zinc-400">
      <span
        aria-hidden
        className="size-4 animate-spin rounded-full border-2 border-zinc-600 border-t-emerald-400"
      />
      {label}
    </span>
  );
}
