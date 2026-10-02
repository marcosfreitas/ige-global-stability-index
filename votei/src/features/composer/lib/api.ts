import type { Cargo } from '@/core/compose/entities/composition';
import type { Frame } from '@/core/compose/entities/frame';

export interface ApiFailure {
  code: string;
  message: string;
}

export class ApiRequestError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

async function unwrap<T>(res: Response): Promise<T> {
  const body = (await res.json()) as
    | { success: true; data: T }
    | { success: false; error: ApiFailure };

  if (!res.ok || body.success === false) {
    const error = body.success === false ? body.error : undefined;
    throw new ApiRequestError(
      error?.code ?? 'UNKNOWN',
      error?.message ?? 'Algo deu errado. Tente de novo.',
      res.status
    );
  }

  return body.data;
}

async function unwrapImage(res: Response): Promise<Blob> {
  if (res.ok) return res.blob();

  let failure: ApiFailure | undefined;
  try {
    const body = (await res.json()) as { error?: ApiFailure };
    failure = body.error;
  } catch {
    // Non-JSON error body; fall back to the status.
  }

  throw new ApiRequestError(
    failure?.code ?? 'UNKNOWN',
    failure?.message ?? 'Algo deu errado. Tente de novo.',
    res.status
  );
}

export interface CatalogueResponse {
  frames: Frame[];
  cargos: Cargo[];
  priceCents: number;
}

export function fetchCatalogue(): Promise<CatalogueResponse> {
  return fetch('/api/v1/frames').then((res) => unwrap<CatalogueResponse>(res));
}

export async function uploadPhoto(file: File, signal?: AbortSignal): Promise<{ photoKey: string }> {
  const form = new FormData();
  form.append('photo', file);

  const res = await fetch('/api/v1/photos', { method: 'POST', body: form, signal });
  return unwrap<{ photoKey: string }>(res);
}

export interface SpecPayload {
  photoKey: string;
  cargo: string;
  numero: string;
  nome?: string;
  frameId: string;
}

export async function fetchPreview(payload: SpecPayload, signal?: AbortSignal): Promise<Blob> {
  const res = await fetch('/api/v1/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });
  return unwrapImage(res);
}

export interface CreatedOrder {
  orderId: string;
  amountCents: number;
  expiresAt: string;
  pix: { qrCodeText: string; qrCodeImage: string };
}

export async function createOrder(payload: SpecPayload): Promise<CreatedOrder> {
  const res = await fetch('/api/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return unwrap<CreatedOrder>(res);
}

export interface OrderStatusResponse {
  id: string;
  status: 'pending' | 'paid' | 'delivered' | 'expired';
  amountCents: number;
  expiresAt: string;
  downloadReady: boolean;
}

export async function fetchOrderStatus(orderId: string): Promise<OrderStatusResponse> {
  const res = await fetch(`/api/v1/orders/${orderId}`);
  return unwrap<OrderStatusResponse>(res);
}

export async function downloadFinalImage(orderId: string): Promise<Blob> {
  const res = await fetch(`/api/v1/orders/${orderId}/image`);
  return unwrapImage(res);
}
