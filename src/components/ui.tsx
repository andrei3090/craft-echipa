import { clsx } from 'clsx';
import { Check, ChevronLeft, Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { back } from '../lib/route';

export function Button({ variant = 'primary', className, children, busy, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'sun' | 'danger'; busy?: boolean }) {
  return (
    <button
      {...p}
      disabled={p.disabled || busy}
      className={clsx(
        'inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-base font-extrabold transition active:scale-[.98] disabled:opacity-50',
        variant === 'primary' && 'bg-jungle text-white shadow-sm hover:bg-jungle-dark',
        variant === 'sun' && 'bg-sun text-ink shadow-sm',
        variant === 'danger' && 'bg-clay text-white',
        variant === 'ghost' && 'border border-line bg-card text-ink',
        className,
      )}
    >
      {busy && <Loader2 className="size-5 animate-spin" />}
      {children}
    </button>
  );
}

export function Card({ className, children, tone }: { className?: string; children: ReactNode; tone?: 'leaf' | 'sun' | 'clay' }) {
  return (
    <div className={clsx('rounded-3xl border p-4 sm:p-5',
      tone === 'leaf' ? 'border-[#cfe0d3] bg-leaf' : tone === 'sun' ? 'border-[#f1dca8] bg-sun-soft' : tone === 'clay' ? 'border-[#efc7b6] bg-clay-soft' : 'border-line bg-card',
      className)}>
      {children}
    </div>
  );
}

export function PageTitle({ emoji, title, sub, backTo = true }: { emoji?: string; title: string; sub?: string; backTo?: boolean }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      {backTo && (
        <button onClick={back} aria-label="Înapoi" className="grid size-12 flex-none place-items-center rounded-2xl border border-line bg-card">
          <ChevronLeft className="size-6" />
        </button>
      )}
      <div className="min-w-0">
        <h1 className="font-display text-2xl leading-tight text-jungle sm:text-3xl">{emoji && <span className="mr-2">{emoji}</span>}{title}</h1>
        {sub && <p className="mt-1 text-muted">{sub}</p>}
      </div>
    </div>
  );
}

export function CheckRow({ checked, onToggle, children, meta }: { checked: boolean; onToggle: () => void; children: ReactNode; meta?: ReactNode }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={clsx('flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition',
        checked ? 'border-[#cfe0d3] bg-leaf' : 'border-line bg-card hover:bg-cream')}
    >
      <span className={clsx('mt-0.5 grid size-8 flex-none place-items-center rounded-xl border-2 transition',
        checked ? 'border-jungle bg-jungle text-white' : 'border-[#cbbfae] bg-white')}>
        {checked && <Check className="size-5" strokeWidth={3.5} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className={clsx('block leading-snug', checked && 'text-jungle-dark')}>{children}</span>
        {meta && <span className="mt-1 block text-sm text-muted">{meta}</span>}
      </span>
    </button>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-bold">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-sm text-muted">{hint}</span>}
    </label>
  );
}

export const inputCls = 'w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-jungle focus:ring-2 focus:ring-jungle/20';

/** Sticky bar at the bottom of a form with the save button. */
export function SaveBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 -mx-4 mt-6 border-t border-line bg-cream/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-end gap-3">{children}</div>
    </div>
  );
}

export function Progress({ done, total }: { done: number; total: number }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-jungle transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-16 text-right text-sm font-bold text-muted">{done}/{total}</span>
    </div>
  );
}
