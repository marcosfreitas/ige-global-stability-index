import { NextRequest } from 'next/server';
import sharp from 'sharp';
import {
  ACCEPTED_PHOTO_TYPES,
  MAX_PHOTO_BYTES,
  STORED_PHOTO_MAX_EDGE,
} from '@/config/limits';
import { getOrCreateAnonymousUser } from '@/infrastructure/database/anonymous-session';
import { createAdminClient } from '@/infrastructure/database/admin';
import { SupabasePhotoStore } from '@/infrastructure/storage/supabase-photo.store';
import { PayloadTooLargeError, ValidationError } from '@/shared/errors';
import { created, handleError } from '@/shared/utils/api-handler';
import { checkRateLimit } from '@/shared/utils/rate-limit';
import { getRequestIp } from '@/shared/utils/request-ip';

export const runtime = 'nodejs';

/**
 * Takes the raw upload and stores a normalised JPEG. Re-encoding is not an
 * optimisation here: it applies EXIF rotation, caps the dimensions, and drops
 * the metadata block — a phone selfie carries GPS coordinates, and this one is
 * about to be paired with a declared vote.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateAnonymousUser();
    await checkRateLimit(`photos:${getRequestIp(req)}`);

    const form = await req.formData();
    const file = form.get('photo');

    if (!(file instanceof File)) {
      throw new ValidationError('Envie a foto no campo "photo".');
    }
    if (file.size === 0) {
      throw new ValidationError('A foto está vazia.');
    }
    if (file.size > MAX_PHOTO_BYTES) {
      throw new PayloadTooLargeError('A foto deve ter no máximo 12 MB.');
    }
    if (!(ACCEPTED_PHOTO_TYPES as readonly string[]).includes(file.type)) {
      throw new ValidationError('Formato não suportado. Use JPEG, PNG ou WebP.');
    }

    const incoming = new Uint8Array(await file.arrayBuffer());

    let normalised: Buffer;
    try {
      normalised = await sharp(incoming, { failOn: 'error' })
        .rotate()
        .resize(STORED_PHOTO_MAX_EDGE, STORED_PHOTO_MAX_EDGE, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 90 })
        .toBuffer();
    } catch {
      throw new ValidationError('Não conseguimos ler essa imagem. Tente outra foto.');
    }

    const store = new SupabasePhotoStore(createAdminClient());
    const { key } = await store.put({
      bytes: normalised,
      contentType: 'image/jpeg',
      ownerId: user.id,
    });

    return created({ photoKey: key, userId: user.id });
  } catch (err) {
    return handleError(err);
  }
}
