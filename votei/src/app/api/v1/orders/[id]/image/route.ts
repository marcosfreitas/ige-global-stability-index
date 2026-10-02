import { NextRequest } from 'next/server';
import { z } from 'zod';
import { DeliverOrderService } from '@/core/orders/services/deliver-order.service';
import { createAdminClient } from '@/infrastructure/database/admin';
import { getOrCreateAnonymousUser } from '@/infrastructure/database/anonymous-session';
import { SatoriSharpComposer } from '@/infrastructure/imaging/satori-sharp.composer';
import { createPixProvider } from '@/infrastructure/payments/pix.factory';
import { OrderRepository } from '@/infrastructure/repositories/order.repository';
import { SupabasePhotoStore } from '@/infrastructure/storage/supabase-photo.store';
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
    const user = await getOrCreateAnonymousUser();
    const { id } = Params.parse(await ctx.params);
    await checkRateLimit(`orders-image:${user.id}`);

    const admin = createAdminClient();
    const service = new DeliverOrderService(
      new OrderRepository(admin),
      createPixProvider(),
      new SupabasePhotoStore(admin),
      new SatoriSharpComposer()
    );

    const bytes = await service.execute({ orderId: id, userId: user.id });

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
