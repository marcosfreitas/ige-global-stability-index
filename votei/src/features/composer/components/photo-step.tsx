'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { usePhotoUpload } from '../hooks/use-photo-upload';
import { Button, ErrorNote, Spinner, StepTitle } from './ui';

export function PhotoStep({
  photoKey,
  onUploaded,
  onNext,
}: {
  photoKey: string | null;
  onUploaded: (key: string) => void;
  onNext: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { select, uploading, error, localPreviewUrl } = usePhotoUpload(onUploaded);

  return (
    <div>
      <StepTitle hint="Vale selfie, foto antiga, qualquer uma. Ela é recortada em quadrado.">
        Escolha sua foto
      </StepTitle>

      <input
        ref={inputRef}
        type="file"
        // `image/*` so iOS offers the camera and the library; HEIC is converted
        // in the browser before upload.
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void select(file);
          event.target.value = '';
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900/60 transition-colors hover:border-emerald-500/60"
      >
        {localPreviewUrl ? (
          <Image
            src={localPreviewUrl}
            alt="Prévia da foto escolhida"
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <span className="flex flex-col items-center gap-2 px-6 text-center">
            <span aria-hidden className="text-4xl">
              📷
            </span>
            <span className="text-base font-semibold text-zinc-200">Toque para escolher</span>
            <span className="text-sm text-zinc-500">ou tirar uma foto agora</span>
          </span>
        )}
      </button>

      {uploading ? (
        <p className="mt-3">
          <Spinner label="Enviando sua foto…" />
        </p>
      ) : null}

      {error ? <ErrorNote>{error}</ErrorNote> : null}

      {localPreviewUrl && !uploading ? (
        <Button variant="outline" className="mt-3" onClick={() => inputRef.current?.click()}>
          Trocar foto
        </Button>
      ) : null}

      <Button className="mt-3" disabled={!photoKey || uploading} onClick={onNext}>
        Continuar
      </Button>

      <p className="mt-4 text-xs leading-relaxed text-zinc-500">
        A foto é usada só para montar a sua imagem e apagada automaticamente em 2 horas. A
        localização embutida no arquivo é removida antes do envio.
      </p>
    </div>
  );
}
