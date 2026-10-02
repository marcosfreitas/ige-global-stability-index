'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import type { CreatedOrder, OrderStatusResponse } from '../lib/api';
import { formatCountdown } from '../lib/countdown';
import { Button, Card, ErrorNote, Spinner, StepTitle } from './ui';

function useCountdown(expiresAt: string | undefined) {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!expiresAt) return;

    const tick = () => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      setRemaining(Math.max(0, Math.floor(ms / 1000)));
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  return { remaining, label: formatCountdown(remaining) };
}

export function PagamentoStep({
  order,
  status,
  statusError,
  priceLabel,
  onBack,
}: {
  order: CreatedOrder;
  status: OrderStatusResponse | undefined;
  statusError: string | null;
  priceLabel: string;
  onBack: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const { remaining, label } = useCountdown(status?.expiresAt ?? order.expiresAt);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(order.pix.qrCodeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard blocked (insecure context or denied) — the text stays
      // selectable below, so this is not worth surfacing as an error.
    }
  }, [order.pix.qrCodeText]);

  const expired = status?.status === 'expired' || remaining === 0;

  return (
    <div>
      <StepTitle hint={`Pague ${priceLabel} no Pix e a imagem libera sozinha.`}>
        Pagamento
      </StepTitle>

      {order.pix.qrCodeImage ? (
        <div className="mx-auto w-full max-w-64">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-white p-3">
            <Image
              src={
                order.pix.qrCodeImage.startsWith('data:')
                  ? order.pix.qrCodeImage
                  : `data:image/png;base64,${order.pix.qrCodeImage}`
              }
              alt="QR Code do Pix"
              fill
              unoptimized
              className="object-contain p-3"
            />
          </div>
        </div>
      ) : null}

      <Card className="mt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          Pix copia e cola
        </p>
        <p className="break-all font-mono text-[11px] leading-relaxed text-zinc-300">
          {order.pix.qrCodeText}
        </p>
        <Button className="mt-3" onClick={copy}>
          {copied ? 'Copiado ✓' : 'Copiar código'}
        </Button>
      </Card>

      <div className="mt-4 flex items-center justify-between text-sm">
        {expired ? (
          <span className="text-red-400">Pix expirado.</span>
        ) : (
          <Spinner label="Aguardando pagamento…" />
        )}
        {!expired ? <span className="font-mono text-zinc-500">expira em {label}</span> : null}
      </div>

      {statusError ? <ErrorNote>{statusError}</ErrorNote> : null}

      <p className="mt-4 text-xs leading-relaxed text-zinc-500">
        Pode fechar e voltar: o pedido fica salvo neste navegador. Se pagar e a tela não virar
        sozinha, volte para esta aba que a confirmação é verificada de novo.
      </p>

      <Button variant="ghost" className="mt-3" onClick={onBack}>
        {expired ? 'Gerar outro Pix' : 'Mudar a moldura'}
      </Button>
    </div>
  );
}
