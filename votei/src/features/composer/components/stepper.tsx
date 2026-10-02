'use client';

import { cn } from '@/shared/utils';
import { STEP_ORDER, type Step } from '../hooks/use-composer-store';

const LABELS: Record<Step, string> = {
  photo: 'Foto',
  candidato: 'Número',
  moldura: 'Moldura',
  pagamento: 'Pix',
  pronto: 'Pronto',
};

export function Stepper({ current }: { current: Step }) {
  const index = STEP_ORDER.indexOf(current);

  return (
    <ol className="flex items-center gap-1.5" aria-label="Progresso">
      {STEP_ORDER.map((step, i) => {
        const done = i < index;
        const active = i === index;

        return (
          <li key={step} className="flex flex-1 flex-col gap-1.5">
            <span
              className={cn(
                'h-1 rounded-full',
                done && 'bg-emerald-500',
                active && 'bg-emerald-400',
                !done && !active && 'bg-zinc-800'
              )}
            />
            <span
              className={cn(
                'text-[10px] font-medium uppercase tracking-wide',
                active ? 'text-emerald-400' : 'text-zinc-600'
              )}
            >
              {LABELS[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
