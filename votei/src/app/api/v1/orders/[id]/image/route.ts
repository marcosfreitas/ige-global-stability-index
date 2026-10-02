import { NextRequest } from 'next/server';
import { z } from 'zod';
import { DeliverOrderService } from '@/core/orders/services/deliver-order.service';
import { getSessionUserId } from '@/infrastructure/auth/session';
import { createOrderRepository, createPhotoStore } from '@/infrastructure/local/backend.factory';
import { SatoriSharpComposer } from '@/infrastructure/imaging/satori-sharp.composer';
import { createPixProvider } from '@/infrastructure/payments/pix.factory';
import { handleError } from '@/shared/utils/api-handler';
import { checkRateLimit } from '@/shared/utils/rate-limit';

export const runtime = 'nodejs';

const Params = z.object({ id: z.string().uuid() });

/**
 * The paid artefact. Payment is re-verified against the PSP on every call, so
 * this stays safe even if the webhook is spoofed or never fires.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getSessionUserId();
    const { id } = Params.parse(await ctx.params);
    await checkRateLimit(`orders-image:${userId}`);

    const service = new DeliverOrderService(
      createOrderRepository(),
      createPixProvider(),
      createPhotoStore(),
      new SatoriSharpComposer()
    );

    const bytes = await service.execute({ orderId: id, userId });

    return new Response(new Uint8Array(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="votei-${id.slice(0, 8)}.jpg"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    return handleError(err);
  }
}
