/** @jest-environment node */
import type { IImageComposer, IOrderRepository, IPhotoStore, IPixProvider } from '../../contracts';
import type { Order } from '../../entities/order';
import { DeliverOrderService } from '../deliver-order.service';

const SPEC = { cargo: 'presidente', numero: '13', frameId: 'vermelha', styleId: 'nenhum' } as const;

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    userId: 'user-1',
    status: 'pending',
    amountCents: 290,
    txid: 'tx-1',
    spec: { ...SPEC },
    photoKey: 'user-1/abc.jpg',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    purgeAfter: new Date(Date.now() + 7_200_000).toISOString(),
    deliveredAt: null,
    ...overrides,
  };
}

function harness(order: Order | null, settled: boolean) {
  const updateStatus = jest.fn().mockResolvedValue(undefined);
  const markDelivered = jest.fn().mockResolvedValue(undefined);

  const orders: IOrderRepository = {
    create: jest.fn(),
    findByIdForUser: jest.fn().mockResolvedValue(order),
    findByTxid: jest.fn(),
    updateStatus,
    markDelivered,
    purge: jest.fn(),
    findPurgeable: jest.fn(),
  };

  const isChargeSettled = jest.fn().mockResolvedValue(settled);
  const pix: IPixProvider = { createCharge: jest.fn(), isChargeSettled };

  const photos: IPhotoStore = {
    put: jest.fn(),
    putAt: jest.fn(),
    get: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    getOrNull: jest.fn().mockResolvedValue(null),
    remove: jest.fn(),
  };

  const compose = jest.fn().mockResolvedValue(new Uint8Array([9, 9, 9]));
  const composer: IImageComposer = { compose };

  return {
    service: new DeliverOrderService(orders, pix, photos, composer),
    updateStatus,
    markDelivered,
    isChargeSettled,
    compose,
  };
}

const INPUT = { orderId: 'order-1', userId: 'user-1' };

describe('DeliverOrderService', () => {
  it('refuses an order that is not settled at the PSP', async () => {
    const { service, compose } = harness(makeOrder(), false);

    await expect(service.execute(INPUT)).rejects.toMatchObject({ code: 'PAYMENT_PENDING' });
    expect(compose).not.toHaveBeenCalled();
  });

  it('does not trust a row marked paid without asking the PSP', async () => {
    // A forged webhook is the threat here: the row says paid, so the service
    // must not need to re-check, but it also must never render on a pending
    // row just because something wrote to it.
    const { service, compose, isChargeSettled } = harness(makeOrder({ status: 'paid' }), false);

    await expect(service.execute(INPUT)).resolves.toEqual(new Uint8Array([9, 9, 9]));
    expect(isChargeSettled).not.toHaveBeenCalled();
    expect(compose).toHaveBeenCalled();
  });

  it('settles a pending order against the PSP and delivers', async () => {
    const { service, updateStatus, markDelivered, compose } = harness(makeOrder(), true);

    await expect(service.execute(INPUT)).resolves.toEqual(new Uint8Array([9, 9, 9]));
    expect(updateStatus).toHaveBeenCalledWith('order-1', 'paid');
    expect(markDelivered).toHaveBeenCalledWith('order-1');
    expect(compose).toHaveBeenCalledWith(
      expect.objectContaining({ watermark: false, spec: expect.objectContaining({ numero: '13' }) })
    );
  });

  it('allows a re-download without marking delivered twice', async () => {
    const { service, markDelivered } = harness(makeOrder({ status: 'delivered' }), true);

    await service.execute(INPUT);
    expect(markDelivered).not.toHaveBeenCalled();
  });

  it('still delivers a paid order after the charge window closed', async () => {
    // The charge expiring must not take the paid file with it: purge_after is
    // what governs how long the buyer can come back for it.
    const settled = makeOrder({
      status: 'paid',
      expiresAt: new Date(Date.now() - 1_000).toISOString(),
    });
    const { service, compose } = harness(settled, false);

    await expect(service.execute(INPUT)).resolves.toEqual(new Uint8Array([9, 9, 9]));
    expect(compose).toHaveBeenCalled();
  });

  it('expires a pending order whose charge window has closed', async () => {
    const stale = makeOrder({ expiresAt: new Date(Date.now() - 1_000).toISOString() });
    const { service, updateStatus } = harness(stale, false);

    await expect(service.execute(INPUT)).rejects.toMatchObject({ code: 'ORDER_EXPIRED' });
    expect(updateStatus).toHaveBeenCalledWith('order-1', 'expired');
  });

  it('reports a purged order rather than rendering a blank', async () => {
    const purged = makeOrder({ status: 'paid', spec: null, photoKey: null });
    const { service } = harness(purged, true);

    await expect(service.execute(INPUT)).rejects.toMatchObject({ code: 'ORDER_EXPIRED' });
  });

  it('does not leak another session’s order', async () => {
    const { service } = harness(null, true);

    await expect(service.execute(INPUT)).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' });
  });
});
