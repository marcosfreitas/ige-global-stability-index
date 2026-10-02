'use client';

import Image from 'next/image';
import { useCallback } from 'react';
import { useFinalImage } from '../hooks/use-final-image';
import { Button, ErrorNote, Spinner, StepTitle } from './ui';

export function ProntoStep({
  orderId,
  onRestart,
}: {
  orderId: string;
  onRestart: () => void;
}) {
  const { url, blob, loading, error } = useFinalImage(orderId);

  const share = useCallback(async () => {
    if (!blob || !url) return;

    const file = new File([blob], 'votei.jpg', { type: 'image/jpeg' });

    // The share sheet is the real destination on a phone; a download lands in
    // a folder the buyer then has to go and find.
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return;
      } catch {
        // Cancelled or unsupported — fall through to the download.
      }
    }

    const link = document.createElement('a');
    link.href = url;
    link.download = 'votei.jpg';
    link.click();
  }, [blob, url]);

  return (
    <div>
      <StepTitle hint="Sem marca d'água, 1080×1080.">Pronto! 🎉</StepTitle>

      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        {url ? (
          <Image src={url} alt="Sua imagem final" fill unoptimized className="object-cover" />
        ) : null}

        {loading ? (
          <span className="absolute inset-0 flex items-center justify-center">
            <Spinner label="Carregando sua imagem…" />
          </span>
        ) : null}
      </div>

      {error ? <ErrorNote>{error}</ErrorNote> : null}

      <Button className="mt-4" disabled={!url} onClick={share}>
        Salvar / compartilhar
      </Button>

      {url ? (
        <a
          href={url}
          download="votei.jpg"
          className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-zinc-700 text-base font-semibold text-zinc-100 hover:bg-zinc-800"
        >
          Baixar imagem
        </a>
      ) : null}

      <Button variant="ghost" className="mt-2" onClick={onRestart}>
        Fazer outra
      </Button>

      <p className="mt-4 text-xs leading-relaxed text-zinc-500">
        Você pode voltar e baixar de novo por 2 horas. Depois disso a foto e o número são
        apagados dos nossos servidores. &ldquo;Fazer outra&rdquo; também limpa os dados salvos
        neste navegador.
      </p>
    </div>
  );
}
