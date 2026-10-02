import { NextRequest } from 'next/server';
import { z } from 'zod';
import { GetOrderStatusService } from '@/core/orders/services/get-order-status.service';
import { createAdminClient } from '@/infrastructure/database/admin';
import { getOrCreateAnonymousUser } from '@/infrastructure/database/anonymous-session';
import { createPixProvider } from '@/infrastructure/payments/pix.factory';
import { OrderRepository } from '@/infrastructure/repositories/order.repository';
import { ok, handleError } from '@/shared/utils/api-handler';
import { checkRateLimit } from '@/shared/utils/rate-limit';

export const runtime = 'nodejs';

const Params = z.object({ id: z.string().uuid() });

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getOrCreateAnonymousUser();
    const { id } = Params.parse(await ctx.params);
    await checkRateLimit(`orders-status:${user.id}`);

    const service = new GetOrderStatusService(
      new OrderRepository(createAdminClient()),
      createPixProvider()
    );

    return ok(await service.execute({ orderId: id, userId: user.id }));
  } catch (err) {
    return handleError(err);
  }
}
