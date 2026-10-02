import { NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { PurgeExpiredOrdersService } from '@/core/orders/services/purge-expired-orders.service';
import { createAdminClient } from '@/infrastructure/database/admin';
import { OrderRepository } from '@/infrastructure/repositories/order.repository';
import { SupabasePhotoStore } from '@/infrastructure/storage/supabase-photo.store';
import { assertEnv } from '@/shared/config/assert-env';
import { UnauthorizedError } from '@/shared/errors';
import { ok, handleError } from '@/shared/utils/api-handler';

export const runtime = 'nodejs';

function isAuthorized(req: NextRequest): boolean {
  const expected = assertEnv('CRON_SECRET');
  const header = req.headers.get('authorization') ?? '';
  const provided = header.startsWith('Bearer ') ? header.slice(7) : '';

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Wire to Vercel Cron. Erases photos and specs once an order is past its TTL. */
export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req)) throw new UnauthorizedError();

    const admin = createAdminClient();
    const service = new PurgeExpiredOrdersService(
      new OrderRepository(admin),
      new SupabasePhotoStore(admin)
    );

    return ok(await service.execute({ limit: 500 }));
  } catch (err) {
    return handleError(err);
  }
}

export const GET = POST;
