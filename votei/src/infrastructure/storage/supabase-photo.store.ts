import { randomBytes } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { IPhotoStore } from '@/core/orders/contracts';
import type { Database } from '../database/types';
import { AppError, DatabaseError } from '@/shared/errors';

export const PHOTO_BUCKET = 'votei-photos';

/** `<uuid>/<48 hex>.<ext>` — the owner prefix is what makes a key unusable by another session. */
const KEY_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[a-f0-9]{48}\.(jpg|png|webp)$/;

export function isWellFormedPhotoKey(key: string): boolean {
  return KEY_PATTERN.test(key);
}

/**
 * A photo key is unguessable, but binding it to the owner means a leaked key
 * is still useless to a different session.
 */
export function isPhotoKeyOwnedBy(key: string, ownerId: string): boolean {
  return isWellFormedPhotoKey(key) && key.startsWith(`${ownerId}/`);
}

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Private bucket, random keys, service-role access only. Nothing here is
 * reachable from a browser, and the purge job deletes it at the order's TTL.
 */
export class SupabasePhotoStore implements IPhotoStore {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async put({
    bytes,
    contentType,
    ownerId,
  }: {
    bytes: Uint8Array;
    contentType: string;
    ownerId: string;
  }): Promise<{ key: string }> {
    const extension = EXTENSIONS[contentType] ?? 'bin';
    const key = `${ownerId}/${randomBytes(24).toString('hex')}.${extension}`;

    const { error } = await this.db.storage.from(PHOTO_BUCKET).upload(key, bytes, {
      contentType,
      upsert: false,
    });

    if (error) {
      console.error('[SupabasePhotoStore:put]', error);
      throw new DatabaseError('photo upload failed', error.message);
    }

    return { key };
  }

  async get(key: string): Promise<Uint8Array> {
    const { data, error } = await this.db.storage.from(PHOTO_BUCKET).download(key);

    if (error || !data) {
      console.error('[SupabasePhotoStore:get]', error);
      throw new AppError('PHOTO_UNAVAILABLE', 'A foto deste pedido não está mais disponível.', 410);
    }

    return new Uint8Array(await data.arrayBuffer());
  }

  async remove(key: string): Promise<void> {
    const { error } = await this.db.storage.from(PHOTO_BUCKET).remove([key]);
    if (error) {
      console.error('[SupabasePhotoStore:remove]', error);
      throw new DatabaseError('photo removal failed', error.message);
    }
  }
}
