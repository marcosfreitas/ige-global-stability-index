'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatBrl } from '@/config/pricing';
import { ApiRequestError, type CreatedOrder, type SpecPayload } from '../lib/api';
import { useCatalogue } from '../hooks/use-catalogue';
import { useComposerHydrated, useComposerStore } from '../hooks/use-composer-store';
import { useCreateOrder, useOrderStatus } from '../hooks/use-order';
import { usePreview } from '../hooks/use-preview';
import { CandidatoStep } from './candidato-step';
import { MolduraStep } from './moldura-step';
import { PagamentoStep } from './pagamento-step';
import { PhotoStep } from './photo-step';
import { ProntoStep } from './pronto-step';
import { Stepper } from './stepper';
import { ErrorNote, Spinner } from './ui';

export function ComposerFlow() {
  const store = useComposerStore();
  const catalogue = useCatalogue();
  const [order, setOrder] = useState<CreatedOrder | null>(null);

  // Zustand's persist layer hydrates after mount; rendering before that would
  // flash step one at someone returning mid-payment.
  const hydrated = useComposerHydrated();

  const cargos = catalogue.data?.cargos ?? [];
  const frames = catalogue.data?.frames ?? [];
  const priceCents = catalogue.data?.priceCents;

  const digits = cargos.find((item) => item.id === store.cargo)?.digits;
  const specComplete =
    Boolean(store.photoKey) && digits !== undefined && store.numero.length === digits;

  const specPayload: SpecPayload | null = useMemo(() => {
    if (!specComplete || !store.photoKey) return null;
    return {
      photoKey: store.photoKey,
      cargo: store.cargo,
      numero: store.numero,
      nome: store.nome.trim() || undefined,
      frameId: store.frameId,
    };
  }, [specComplete, store.photoKey, store.cargo, store.numero, store.nome, store.frameId]);

  // Only render previews on the step that shows one.
  const preview = usePreview(store.step === 'moldura' ? specPayload : null);

  const createOrder = useCreateOrder((created) => {
    setOrder(created);
    store.setOrderId(created.orderId);
    store.setStep('pagamento');
  });

  const status = useOrderStatus(store.step === 'pagamento' ? store.orderId : null);

  const { step, setStep } = store;
  useEffect(() => {
    if (status.data?.downloadReady && step === 'pagamento') {
      setStep('pronto');
    }
  }, [status.data?.downloadReady, step, setStep]);

  if (!hydrated || catalogue.isLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center">
        <Spinner label="Carregando…" />
      </div>
    );
  }

  if (catalogue.isError || priceCents === undefined) {
    return <ErrorNote>Não foi possível carregar o app. Recarregue a página.</ErrorNote>;
  }

  const priceLabel = formatBrl(priceCents);

  // A persisted order id with the charge details gone (new tab, cleared
  // memory) still resolves: the status poll decides whether it is payable.
  if (store.step === 'pagamento' && !order) {
    if (!store.orderId) {
      store.setStep('moldura');
    } else if (status.data?.downloadReady) {
      store.setStep('pronto');
    } else {
      return (
        <div>
          <Stepper current="pagamento" />
          <div className="mt-6">
            <p className="mb-4 text-sm text-zinc-400">
              Você tem um Pix em aberto neste navegador.
            </p>
            {status.isLoading ? <Spinner label="Verificando pagamento…" /> : null}
            {status.data?.status === 'expired' ? (
              <ErrorNote>Esse Pix expirou. Volte e gere outro.</ErrorNote>
            ) : null}
            <button
              type="button"
              onClick={() => {
                store.setOrderId(null);
                store.setStep('moldura');
              }}
              className="mt-4 min-h-12 w-full rounded-xl border border-zinc-700 text-base font-semibold text-zinc-100"
            >
              Voltar e gerar outro Pix
            </button>
          </div>
        </div>
      );
    }
  }

  return (
    <div>
      <Stepper current={store.step} />

      <div className="mt-6">
        {store.step === 'photo' ? (
          <PhotoStep
            photoKey={store.photoKey}
            onUploaded={store.setPhotoKey}
            onNext={() => store.setStep('candidato')}
          />
        ) : null}

        {store.step === 'candidato' ? (
          <CandidatoStep
            cargos={cargos}
            cargo={store.cargo}
            numero={store.numero}
            nome={store.nome}
            onCargo={store.setCargo}
            onNumero={store.setNumero}
            onNome={store.setNome}
            onNext={() => store.setStep('moldura')}
            onBack={() => store.setStep('photo')}
          />
        ) : null}

        {store.step === 'moldura' ? (
          <MolduraStep
            frames={frames}
            frameId={store.frameId}
            previewUrl={preview.url}
            previewLoading={preview.loading}
            previewError={preview.error}
            priceLabel={priceLabel}
            creating={createOrder.isPending}
            createError={
              createOrder.error instanceof ApiRequestError ? createOrder.error.message : null
            }
            onFrame={store.setFrameId}
            onPay={() => specPayload && createOrder.mutate(specPayload)}
            onBack={() => store.setStep('candidato')}
          />
        ) : null}

        {store.step === 'pagamento' && order ? (
          <PagamentoStep
            order={order}
            status={status.data}
            statusError={
              status.error instanceof ApiRequestError ? status.error.message : null
            }
            priceLabel={priceLabel}
            onBack={() => {
              setOrder(null);
              store.setOrderId(null);
              store.setStep('moldura');
            }}
          />
        ) : null}

        {store.step === 'pronto' && store.orderId ? (
          <ProntoStep
            orderId={store.orderId}
            onRestart={() => {
              setOrder(null);
              store.reset();
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
