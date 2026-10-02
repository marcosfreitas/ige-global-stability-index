import { randomBytes } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import type { IPhotoStore } from '@/core/orders/contracts';
import { AppError } from '@/shared/errors';
import { LOCAL_STORE_DIR } from './local-backend';

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function root(): string {
  return resolve(process.cwd(), LOCAL_STORE_DIR, 'photos');
}

/**
 * Keys are `<owner>/<random>.<ext>`, same shape the Supabase store produces, so
 * the ownership check behaves identically in both backends. Resolved paths are
 * checked against the root so a crafted key cannot escape it.
 */
function pathFor(key: string): string {
  const full = resolve(root(), key);
  if (full !== root() && !full.startsWith(root() + '/')) {
    throw new AppError('INVALID_KEY', 'Chave de foto inválida.', 400);
  }
  return full;
}

export class FileSystemPhotoStore implements IPhotoStore {
  async put({
    bytes,
    contentType,
    ownerId,
  }: {
    bytes: Uint8Array;
    contentType: string;
    ownerId: string;
  }): Promise<{ key: string }> {
    const key = `${ownerId}/${randomBytes(24).toString('hex')}.${EXTENSIONS[contentType] ?? 'bin'}`;
    await this.putAt({ key, bytes, contentType });
    return { key };
  }

  async putAt({ key, bytes }: { key: string; bytes: Uint8Array; contentType: string }): Promise<void> {
    const file = pathFor(key);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, bytes);
  }

  async get(key: string): Promise<Uint8Array> {
    const bytes = await this.getOrNull(key);
    if (!bytes) {
      throw new AppError('PHOTO_UNAVAILABLE', 'A foto deste pedido não está mais disponível.', 410);
    }
    return bytes;
  }

  async getOrNull(key: string): Promise<Uint8Array | null> {
    try {
      return new Uint8Array(await readFile(pathFor(key)));
    } catch {
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    await rm(pathFor(key), { force: true });
  }
}

export const LOCAL_PHOTOS_PATH = join(LOCAL_STORE_DIR, 'photos');
