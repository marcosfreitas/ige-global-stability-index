import type { IOrderRepository, IPixProvider } from '../contracts';

/**
 * Webhook path. The payload is untrusted — it only tells us which txid to go
 * and verify against the PSP.
 */
export class ConfirmPaymentService {
  constructor(
    private readonly orders: IOrderRepository,
    private readonly pix: IPixProvider
  ) {}

  async execute(input: { txid: string }): Promise<{ confirmed: boolean }> {
    const order = await this.orders.findByTxid(input.txid);
    if (!order) return { confirmed: false };
    if (order.status === 'paid' || order.status === 'delivered') return { confirmed: true };

    const settled = await this.pix.isChargeSettled({
      txid: order.txid,
      expectedAmountCents: order.amountCents,
    });
    if (!settled) return { confirmed: false };

    await this.orders.updateStatus(order.id, 'paid');
    return { confirmed: true };
  }
}
