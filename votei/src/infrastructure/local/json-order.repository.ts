import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { CreateOrderRecord, IOrderRepository } from '@/core/orders/contracts';
import type { Order, OrderStatus } from '@/core/orders/entities/order';
import { LOCAL_STORE_DIR } from './local-backend';

function file(): string {
  return resolve(process.cwd(), LOCAL_STORE_DIR, 'orders.json');
}

/**
 * Single JSON file, rewritten on every change. Fine for one developer on one
 * machine, which is the only place this adapter is ever reachable.
 *
 * Writes are serialised through a promise chain so two concurrent requests
 * cannot read-modify-write over each other.
 */
export class JsonFileOrderRepository implements IOrderRepository {
  private queue: Promise<unknown> = Promise.resolve();

  private async readAll(): Promise<Order[]> {
    try {
      return JSON.parse(await readFile(file(), 'utf8')) as Order[];
    } catch {
      return [];
    }
  }

  private async writeAll(orders: Order[]): Promise<void> {
    await mkdir(dirname(file()), { recursive: true });
    await writeFile(file(), JSON.stringify(orders, null, 2));
  }

  private serialise<T>(work: () => Promise<T>): Promise<T> {
    const next = this.queue.then(work, work);
    this.queue = next.catch(() => undefined);
    return next;
  }

  async create(record: CreateOrderRecord): Promise<Order> {
    return this.serialise(async () => {
      const orders = await this.readAll();
      const order: Order = {
        id: randomUUID(),
        userId: record.userId,
        status: 'pending',
        amountCents: record.amountCents,
        txid: record.txid,
        spec: record.spec,
        photoKey: record.photoKey,
        createdAt: new Date().toISOString(),
        expiresAt: record.expiresAt,
        purgeAfter: record.purgeAfter,
        deliveredAt: null,
      };
      orders.push(order);
      await this.writeAll(orders);
      return order;
    });
  }

  async findByIdForUser(id: string, userId: string): Promise<Order | null> {
    const orders = await this.readAll();
    return orders.find((o) => o.id === id && o.userId === userId) ?? null;
  }

  async findByTxid(txid: string): Promise<Order | null> {
    const orders = await this.readAll();
    return orders.find((o) => o.txid === txid) ?? null;
  }

  async updateStatus(id: string, status: OrderStatus): Promise<void> {
    await this.patch(id, (order) => ({ ...order, status }));
  }

  async markDelivered(id: string): Promise<void> {
    await this.patch(id, (order) => ({
      ...order,
      status: 'delivered' as OrderStatus,
      deliveredAt: new Date().toISOString(),
    }));
  }

  async purge(id: string): Promise<void> {
    await this.patch(id, (order) => ({ ...order, spec: null, photoKey: null }));
  }

  async findPurgeable(limit: number): Promise<Order[]> {
    const now = Date.now();
    const orders = await this.readAll();
    return orders
      .filter((o) => new Date(o.purgeAfter).getTime() < now && (o.spec !== null || o.photoKey !== null))
      .slice(0, limit);
  }

  private async patch(id: string, change: (order: Order) => Order): Promise<void> {
    await this.serialise(async () => {
      const orders = await this.readAll();
      const index = orders.findIndex((o) => o.id === id);
      if (index === -1) return;
      orders[index] = change(orders[index]);
      await this.writeAll(orders);
    });
  }
}
