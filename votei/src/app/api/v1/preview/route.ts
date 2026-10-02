import { NextRequest } from 'next/server';
import { z } from 'zod';
import { PREVIEW_SIZE } from '@/config/limits';
import { GetStyledPhotoService } from '@/core/compose/services/get-styled-photo.service';
import { ValidateComposeSpecService } from '@/core/compose/services/validate-compose-spec.service';
import { createAdminClient } from '@/infrastructure/database/admin';
import { getOrCreateAnonymousUser } from '@/infrastructure/database/anonymous-session';
import { createStylizer } from '@/infrastructure/imaging/stylizer.factory';
import { SatoriSharpComposer } from '@/infrastructure/imaging/satori-sharp.composer';
import {
  SupabasePhotoStore,
  isPhotoKeyOwnedBy,
} from '@/infrastructure/storage/supabase-photo.store';
import { ForbiddenError } from '@/shared/errors';
import { handleError } from '@/shared/utils/api-handler';
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

/**
 * Rendered server-side on purpose. A watermark applied in the browser is a
 * suggestion, and the watermarked preview is the only thing standing between
 * the free path and the paid one.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateAnonymousUser();
    await checkRateLimit(`preview:${user.id}`);

    const input = Schema.parse(await req.json());
    if (!isPhotoKeyOwnedBy(input.photoKey, user.id)) {
      throw new ForbiddenError('Esta foto não pertence à sua sessão.');
    }

    const spec = new ValidateComposeSpecService().execute(input);

    const store = new SupabasePhotoStore(createAdminClient());
    const photo = await new GetStyledPhotoService(store, createStylizer()).execute({
      photoKey: input.photoKey,
      styleId: spec.styleId,
    });

    const bytes = await new SatoriSharpComposer().compose({
      spec,
      photo,
      size: PREVIEW_SIZE,
      watermark: true,
    });

    return new Response(new Uint8Array(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    return handleError(err);
  }
}
