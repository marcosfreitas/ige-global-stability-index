import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getPriceBrlCents } from '@/config/pricing';
import { CreateOrderService } from '@/core/orders/services/create-order.service';
import { getSessionUserId } from '@/infrastructure/auth/session';
import { createOrderRepository } from '@/infrastructure/local/backend.factory';
import { createPixProvider } from '@/infrastructure/payments/pix.factory';
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
  styleId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
    await checkRateLimit(`orders-create:${userId}`);

    const input = Schema.parse(await req.json());
    if (!isPhotoKeyOwnedBy(input.photoKey, userId)) {
      throw new ForbiddenError('Esta foto não pertence à sua sessão.');
    }

    // Price is read server-side; the client never states what it owes.
    const amountCents = getPriceBrlCents();

    const service = new CreateOrderService(createOrderRepository(), createPixProvider());

    const { order, charge } = await service.execute({
      userId,
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
