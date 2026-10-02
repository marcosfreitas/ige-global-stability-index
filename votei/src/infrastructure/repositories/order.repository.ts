import type { ComposeSpec } from '@/core/compose/entities/composition';
import type { CreateOrderRecord, IOrderRepository } from '@/core/orders/contracts';
import type { Order, OrderStatus } from '@/core/orders/entities/order';
import { BaseRepository } from './base.repository';

const COLUMNS =
  'id, user_id, status, amount_cents, txid, spec, photo_key, created_at, expires_at, purge_after, delivered_at';

export class OrderRepository extends BaseRepository implements IOrderRepository {
  async create(record: CreateOrderRecord): Promise<Order> {
    const { data, error } = await this.db
      .from('orders')
      .insert({
        user_id: record.userId,
        amount_cents: record.amountCents,
        txid: record.txid,
        spec: record.spec,
        photo_key: record.photoKey,
        expires_at: record.expiresAt,
        purge_after: record.purgeAfter,
      })
      .select(COLUMNS)
      .single();

    if (error || !data) this.handleError(error, 'create');
    return this.map(data!);
  }

  async findByIdForUser(id: string, userId: string): Promise<Order | null> {
    const { data, error } = await this.db
      .from('orders')
      .select(COLUMNS)
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) this.handleError(error, 'findByIdForUser');
    return data ? this.map(data) : null;
  }

  async findByTxid(txid: string): Promise<Order | null> {
    const { data, error } = await this.db
      .from('orders')
      .select(COLUMNS)
      .eq('txid', txid)
      .maybeSingle();

    if (error) this.handleError(error, 'findByTxid');
    return data ? this.map(data) : null;
  }

  async updateStatus(id: string, status: OrderStatus): Promise<void> {
    const { error } = await this.db.from('orders').update({ status }).eq('id', id);
    if (error) this.handleError(error, 'updateStatus');
  }

  async markDelivered(id: string): Promise<void> {
    const { error } = await this.db
      .from('orders')
      .update({ status: 'delivered', delivered_at: new Date().toISOString() })
      .eq('id', id);

    if (error) this.handleError(error, 'markDelivered');
  }

  async purge(id: string): Promise<void> {
    const { error } = await this.db
      .from('orders')
      .update({ spec: null, photo_key: null })
      .eq('id', id);

    if (error) this.handleError(error, 'purge');
  }

  async findPurgeable(limit: number): Promise<Order[]> {
    const { data, error } = await this.db
      .from('orders')
      .select(COLUMNS)
      .lt('purge_after', new Date().toISOString())
      .or('spec.not.is.null,photo_key.not.is.null')
      .limit(limit);

    if (error) this.handleError(error, 'findPurgeable');
    return (data ?? []).map((row) => this.map(row));
  }

  private map(row: Record<string, unknown>): Order {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      status: row.status as OrderStatus,
      amountCents: row.amount_cents as number,
      txid: row.txid as string,
      spec: (row.spec as ComposeSpec | null) ?? null,
      photoKey: (row.photo_key as string | null) ?? null,
      createdAt: row.created_at as string,
      expiresAt: row.expires_at as string,
      purgeAfter: row.purge_after as string,
      deliveredAt: (row.delivered_at as string | null) ?? null,
    };
  }
}
