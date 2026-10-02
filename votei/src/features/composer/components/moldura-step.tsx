'use client';

import Image from 'next/image';
import type { Frame, FrameId } from '@/core/compose/entities/frame';
import { cn } from '@/shared/utils';
import { Button, ErrorNote, Spinner, StepTitle } from './ui';

function Swatch({
  frame,
  selected,
  onSelect,
}: {
  frame: Frame;
  selected: boolean;
  onSelect: () => void;
}) {
  const { ring, ringAlt, banner } = frame.palette;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex min-w-20 shrink-0 flex-col items-center gap-1.5 rounded-xl p-2 transition-colors',
        selected ? 'bg-zinc-800' : 'hover:bg-zinc-900'
      )}
    >
      <span
        aria-hidden
        className={cn(
          'size-14 rounded-lg border-4',
          selected ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-zinc-950' : ''
        )}
        style={{
          borderColor: ring,
          background: `linear-gradient(135deg, ${ringAlt} 0%, ${banner} 100%)`,
        }}
      />
      <span className={cn('text-[11px] font-medium', selected ? 'text-zinc-100' : 'text-zinc-500')}>
        {frame.label}
      </span>
    </button>
  );
}

export function MolduraStep({
  frames,
  frameId,
  previewUrl,
  previewLoading,
  previewError,
  priceLabel,
  creating,
  createError,
  onFrame,
  onPay,
  onBack,
}: {
  frames: Frame[];
  frameId: FrameId;
  previewUrl: string | null;
  previewLoading: boolean;
  previewError: string | null;
  priceLabel: string;
  creating: boolean;
  createError: string | null;
  onFrame: (id: FrameId) => void;
  onPay: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <StepTitle hint="A marca d'água sai depois do pagamento.">Escolha a moldura</StepTitle>

      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt="Prévia da sua imagem com a moldura"
            fill
            unoptimized
            className="object-cover"
          />
        ) : null}

        {previewLoading ? (
          <span className="absolute inset-0 flex items-center justify-center bg-zinc-950/60">
            <Spinner label="Montando…" />
          </span>
        ) : null}
      </div>

      {previewError ? <ErrorNote>{previewError}</ErrorNote> : null}

      {/* Horizontal scroll keeps every frame one thumb-swipe away. */}
      <div className="-mx-4 mt-4 overflow-x-auto px-4">
        <div className="flex gap-2 pb-1">
          {frames.map((frame) => (
            <Swatch
              key={frame.id}
              frame={frame}
              selected={frame.id === frameId}
              onSelect={() => onFrame(frame.id)}
            />
          ))}
        </div>
      </div>

      {createError ? <ErrorNote>{createError}</ErrorNote> : null}

      <Button className="mt-5" disabled={creating || !previewUrl} onClick={onPay}>
        {creating ? 'Gerando Pix…' : `Liberar sem marca · ${priceLabel}`}
      </Button>
      <Button variant="ghost" className="mt-2" onClick={onBack}>
        Voltar
      </Button>
    </div>
  );
}
