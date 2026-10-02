import { ResourceNotFoundError } from '@/shared/errors';
import type { IOrderRepository, IPixProvider } from '../contracts';
import { isOrderExpired, type Order, type OrderStatus } from '../entities/order';

export interface OrderStatusView {
  id: string;
  status: OrderStatus;
  amountCents: number;
  expiresAt: string;
  downloadReady: boolean;
}

/**
 * Reconciles our row against the PSP. Called by the client while it waits for
 * the Pix to land, so it must tolerate a webhook that never arrives.
 */
export class GetOrderStatusService {
  constructor(
    private readonly orders: IOrderRepository,
    private readonly pix: IPixProvider
  ) {}

  async execute(input: { orderId: string; userId: string }): Promise<OrderStatusView> {
    const order = await this.orders.findByIdForUser(input.orderId, input.userId);
    if (!order) throw new ResourceNotFoundError('Pedido', input.orderId);

    const reconciled = await this.reconcile(order);

    return {
      id: reconciled.id,
      status: reconciled.status,
      amountCents: reconciled.amountCents,
      expiresAt: reconciled.expiresAt,
      downloadReady: reconciled.status === 'paid' || reconciled.status === 'delivered',
    };
  }

  private async reconcile(order: Order): Promise<Order> {
    if (order.status !== 'pending') return order;

    const settled = await this.pix.isChargeSettled({
      txid: order.txid,
      expectedAmountCents: order.amountCents,
    });

    if (settled) {
      await this.orders.updateStatus(order.id, 'paid');
      return { ...order, status: 'paid' };
    }

    if (isOrderExpired(order)) {
      await this.orders.updateStatus(order.id, 'expired');
      return { ...order, status: 'expired' };
    }

    return order;
  }
}
