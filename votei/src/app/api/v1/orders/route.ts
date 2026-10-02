import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getPriceBrlCents } from '@/config/pricing';
import { CreateOrderService } from '@/core/orders/services/create-order.service';
import { createAdminClient } from '@/infrastructure/database/admin';
import { getOrCreateAnonymousUser } from '@/infrastructure/database/anonymous-session';
import { createPixProvider } from '@/infrastructure/payments/pix.factory';
import { OrderRepository } from '@/infrastructure/repositories/order.repository';
import { isPhotoKeyOwnedBy } from '@/infrastructure/storage/supabase-photo.store';
import { ForbiddenError } from '@/shared/errors';
import { created, handleError } from '@/shared/utils/api-handler';
import { checkRateLimit } from '@/shared/utils/rate-limit';

export const runtime = 'nodejs';

const Schema = z.object({
  photoKey: z.string().min(8).max(128),
  cargo: z.string(),
  numero: z.string(),
  nome: z.string().optional(),
  frameId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateAnonymousUser();
    await checkRateLimit(`orders-create:${user.id}`);

    const input = Schema.parse(await req.json());
    if (!isPhotoKeyOwnedBy(input.photoKey, user.id)) {
      throw new ForbiddenError('Esta foto não pertence à sua sessão.');
    }

    // Price is read server-side; the client never states what it owes.
    const amountCents = getPriceBrlCents();

    const service = new CreateOrderService(
      new OrderRepository(createAdminClient()),
      createPixProvider()
    );

    const { order, charge } = await service.execute({
      userId: user.id,
      photoKey: input.photoKey,
      amountCents,
      spec: input,
    });

    return created({
      orderId: order.id,
      amountCents: order.amountCents,
      expiresAt: order.expiresAt,
      pix: {
        qrCodeText: charge.qrCodeText,
        qrCodeImage: charge.qrCodeImage,
      },
    });
  } catch (err) {
    return handleError(err);
  }
}
