import { DomainError, ResourceNotFoundError } from '@/shared/errors';
import { OUTPUT_SIZE } from '@/config/limits';
import type { IImageComposer, IOrderRepository, IPhotoStore, IPixProvider } from '../contracts';
import { isOrderExpired, type Order } from '../entities/order';

/**
 * Hands over the paid render. Payment is confirmed against the PSP rather than
 * trusting the row, so a forged or replayed webhook cannot unlock a download.
 *
 * Re-downloadable until the order's TTL: the buyer who closes the tab has not
 * lost what they paid for. The spec and photo are erased at TTL by
 * PurgeExpiredOrdersService.
 */
export class DeliverOrderService {
  constructor(
    private readonly orders: IOrderRepository,
    private readonly pix: IPixProvider,
    private readonly photos: IPhotoStore,
    private readonly composer: IImageComposer
  ) {}

  async execute(input: { orderId: string; userId: string }): Promise<Uint8Array> {
    const order = await this.orders.findByIdForUser(input.orderId, input.userId);
    if (!order) throw new ResourceNotFoundError('Pedido', input.orderId);

    const paid = await this.ensurePaid(order);

    if (!paid.spec || !paid.photoKey) {
      throw new DomainError(
        'ORDER_EXPIRED',
        'Esta imagem já expirou e os dados foram apagados.',
        410
      );
    }

    const photo = await this.photos.get(paid.photoKey);
    const bytes = await this.composer.compose({
      spec: paid.spec,
      photo,
      size: OUTPUT_SIZE,
      watermark: false,
    });

    if (paid.status !== 'delivered') {
      await this.orders.markDelivered(paid.id);
    }

    return bytes;
  }

  private async ensurePaid(order: Order): Promise<Order> {
    if (order.status === 'paid' || order.status === 'delivered') return order;

    if (order.status === 'expired') {
      throw new DomainError('ORDER_EXPIRED', 'Este Pix expirou. Gere um novo.', 410);
    }

    const settled = await this.pix.isChargeSettled({
      txid: order.txid,
      expectedAmountCents: order.amountCents,
    });

    if (!settled) {
      if (isOrderExpired(order)) {
        await this.orders.updateStatus(order.id, 'expired');
        throw new DomainError('ORDER_EXPIRED', 'Este Pix expirou. Gere um novo.', 410);
      }
      throw new DomainError('PAYMENT_PENDING', 'Pagamento ainda não identificado.', 402);
    }

    await this.orders.updateStatus(order.id, 'paid');
    return { ...order, status: 'paid' };
  }
}
