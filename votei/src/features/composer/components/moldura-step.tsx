'use client';

import Image from 'next/image';
import type { Frame, FrameId } from '@/core/compose/entities/frame';
import type { StyleId } from '@/core/compose/entities/style';
import type { StyleOption } from '../lib/api';
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
  styles,
  styleId,
  previewUrl,
  previewLoading,
  previewError,
  priceLabel,
  creating,
  createError,
  onFrame,
  onStyle,
  onPay,
  onBack,
}: {
  frames: Frame[];
  frameId: FrameId;
  styles: StyleOption[];
  styleId: StyleId;
  previewUrl: string | null;
  previewLoading: boolean;
  previewError: string | null;
  priceLabel: string;
  creating: boolean;
  createError: string | null;
  onFrame: (id: FrameId) => void;
  onStyle: (id: StyleId) => void;
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

      {styles.length > 1 ? (
        <fieldset className="mt-4">
          <legend className="mb-2 text-sm font-medium text-zinc-400">Estilo da foto</legend>
          <div className="flex flex-wrap gap-2">
            {styles.map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => onStyle(style.id)}
                aria-pressed={style.id === styleId}
                disabled={previewLoading}
                className={cn(
                  'min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors disabled:opacity-50',
                  style.id === styleId
                    ? 'border-emerald-500 bg-emerald-500 text-emerald-950'
                    : 'border-zinc-700 text-zinc-300 hover:border-zinc-500'
                )}
              >
                {style.label}
              </button>
            ))}
          </div>
          {styleId !== 'nenhum' ? (
            <p className="mt-2 text-xs text-zinc-500">
              O estilo é gerado por IA e leva alguns segundos na primeira vez. Se não der certo,
              a foto original é usada.
            </p>
          ) : null}
        </fieldset>
      ) : null}

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
