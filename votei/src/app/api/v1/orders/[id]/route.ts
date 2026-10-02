import { NextRequest } from 'next/server';
import { z } from 'zod';
import { GetOrderStatusService } from '@/core/orders/services/get-order-status.service';
import { getSessionUserId } from '@/infrastructure/auth/session';
import { createOrderRepository } from '@/infrastructure/local/backend.factory';
import { createPixProvider } from '@/infrastructure/payments/pix.factory';
import { ok, handleError } from '@/shared/utils/api-handler';
import { checkRateLimit } from '@/shared/utils/rate-limit';

export const runtime = 'nodejs';

const Params = z.object({ id: z.string().uuid() });

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getSessionUserId();
    const { id } = Params.parse(await ctx.params);
    await checkRateLimit(`orders-status:${userId}`);

    const service = new GetOrderStatusService(createOrderRepository(), createPixProvider());

    return ok(await service.execute({ orderId: id, userId }));
  } catch (err) {
    return handleError(err);
  }
}
