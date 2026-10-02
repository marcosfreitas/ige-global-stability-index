import type { ComposeSpec } from '@/core/compose/entities/composition';
import type { Order, OrderStatus, PixCharge } from '../entities/order';

export interface CreateOrderRecord {
  userId: string;
  amountCents: number;
  txid: string;
  spec: ComposeSpec;
  photoKey: string;
  expiresAt: string;
}

export interface IOrderRepository {
  create(record: CreateOrderRecord): Promise<Order>;
  /** Scoped to the owner — an order is never readable across users. */
  findByIdForUser(id: string, userId: string): Promise<Order | null>;
  findByTxid(txid: string): Promise<Order | null>;
  updateStatus(id: string, status: OrderStatus): Promise<void>;
  markDelivered(id: string): Promise<void>;
  /** Drops the spec and photo key, leaving only the billing record. */
  purge(id: string): Promise<void>;
  /** Orders past their TTL that still carry a spec or photo. */
  findPurgeable(limit: number): Promise<Order[]>;
}

export interface IPixProvider {
  createCharge(params: {
    amountCents: number;
    expiresInSeconds: number;
    reference: string;
  }): Promise<PixCharge>;
  /** Authoritative status straight from the PSP; webhooks are only a nudge. */
  isChargeSettled(params: { txid: string; expectedAmountCents: number }): Promise<boolean>;
}

export interface IPhotoStore {
  put(params: { bytes: Uint8Array; contentType: string; ownerId: string }): Promise<{ key: string }>;
  putAt(params: { key: string; bytes: Uint8Array; contentType: string }): Promise<void>;
  get(key: string): Promise<Uint8Array>;
  /** Null instead of throwing, so a cache miss is not an error. */
  getOrNull(key: string): Promise<Uint8Array | null>;
  remove(key: string): Promise<void>;
}

export interface ComposeOptions {
  spec: ComposeSpec;
  photo: Uint8Array;
  size: number;
  watermark: boolean;
}

export interface IImageComposer {
  compose(options: ComposeOptions): Promise<Uint8Array>;
}
