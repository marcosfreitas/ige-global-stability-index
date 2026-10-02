import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_CARGO_ID,
  type CargoId,
} from '@/core/compose/entities/composition';
import { DEFAULT_FRAME_ID, type FrameId } from '@/core/compose/entities/frame';

/**
 * The flow is persisted to localStorage because paying by Pix means leaving
 * the browser for a banking app. On the way back the page is remounted, and
 * without this the buyer would land on an empty form holding a paid charge.
 *
 * The number is the voter's political opinion, so `reset()` clears it and the
 * done step offers it explicitly.
 */

export type Step = 'photo' | 'candidato' | 'moldura' | 'pagamento' | 'pronto';

export const STEP_ORDER: Step[] = ['photo', 'candidato', 'moldura', 'pagamento', 'pronto'];

interface ComposerState {
  step: Step;
  photoKey: string | null;
  cargo: CargoId;
  numero: string;
  nome: string;
  frameId: FrameId;
  orderId: string | null;

  setStep: (step: Step) => void;
  setPhotoKey: (key: string | null) => void;
  setCargo: (cargo: CargoId) => void;
  setNumero: (numero: string) => void;
  setNome: (nome: string) => void;
  setFrameId: (frameId: FrameId) => void;
  setOrderId: (orderId: string | null) => void;
  reset: () => void;
}

const INITIAL = {
  step: 'photo' as Step,
  photoKey: null,
  cargo: DEFAULT_CARGO_ID,
  numero: '',
  nome: '',
  frameId: DEFAULT_FRAME_ID,
  orderId: null,
};

export const useComposerStore = create<ComposerState>()(
  persist(
    (set) => ({
      ...INITIAL,

      setStep: (step) => set({ step }),
      setPhotoKey: (photoKey) => set({ photoKey }),
      setCargo: (cargo) => set({ cargo, numero: '' }),
      setNumero: (numero) => set({ numero }),
      setNome: (nome) => set({ nome }),
      setFrameId: (frameId) => set({ frameId }),
      setOrderId: (orderId) => set({ orderId }),
      reset: () => set({ ...INITIAL }),
    }),
    {
      name: 'votei-composer',
      partialize: (state) => ({
        step: state.step,
        photoKey: state.photoKey,
        cargo: state.cargo,
        numero: state.numero,
        nome: state.nome,
        frameId: state.frameId,
        orderId: state.orderId,
      }),
    }
  )
);

/**
 * Whether the persisted flow has been read back from localStorage. Subscribing
 * to zustand's own hydration signal avoids a setState-in-effect and gives the
 * server render a stable `false`.
 */
export function useComposerHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useComposerStore.persist.onFinishHydration(onChange),
    () => useComposerStore.persist.hasHydrated(),
    () => false
  );
}
