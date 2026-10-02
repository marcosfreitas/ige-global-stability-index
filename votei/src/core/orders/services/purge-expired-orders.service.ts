import type { IOrderRepository, IPhotoStore } from '../contracts';

/**
 * Erases the photo and the spec once an order is past its TTL. The billing row
 * stays; the voter's photo and declared number do not.
 */
export class PurgeExpiredOrdersService {
  constructor(
    private readonly orders: IOrderRepository,
    private readonly photos: IPhotoStore
  ) {}

  async execute(input: { limit?: number } = {}): Promise<{ purged: number }> {
    const batch = await this.orders.findPurgeable(input.limit ?? 200);
    let purged = 0;

    for (const order of batch) {
      if (order.photoKey) {
        try {
          await this.photos.remove(order.photoKey);
        } catch (err) {
          console.error('[PurgeExpiredOrders] photo removal failed', order.id, err);
          continue;
        }
      }
      await this.orders.purge(order.id);
      purged += 1;
    }

    return { purged };
  }
}
