import type { ComposeSpec } from '@/core/compose/entities/composition';

export const ORDER_STATUSES = ['pending', 'paid', 'delivered', 'expired'] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  amountCents: number;
  /** EFI charge id. */
  txid: string;
  /**
   * Null once the order has been delivered: the office, number and photo are
   * the voter's political opinion, so they are erased as soon as the render
   * has been handed over.
   */
  spec: ComposeSpec | null;
  photoKey: string | null;
  createdAt: string;
  expiresAt: string;
  deliveredAt: string | null;
}

export interface PixCharge {
  txid: string;
  /** Pix copia-e-cola payload. */
  qrCodeText: string;
  /** Base64 data URI of the QR image, as returned by the PSP. */
  qrCodeImage: string;
  expiresAt: string;
}

export function isOrderExpired(order: Order, now = new Date()): boolean {
  return new Date(order.expiresAt).getTime() <= now.getTime();
}

export function isDeliverable(order: Order): boolean {
  return order.status === 'paid' && order.spec !== null && order.photoKey !== null;
}
