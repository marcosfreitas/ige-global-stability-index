import type { IPhotoStore } from '@/core/orders/contracts';
import type { IPhotoStylizer } from '../contracts';
import { requiresModel, type StyleId } from '../entities/style';

/**
 * Returns the photo a render should use, applying the AI restyle at most once
 * per (photo, style) pair.
 *
 * The cache is the point. Without it every frame tap on the preview step would
 * be another model call: slow for the buyer and a real cost per tap, for an
 * image that never changes.
 */
export class GetStyledPhotoService {
  constructor(
    private readonly photos: IPhotoStore,
    private readonly stylizer: IPhotoStylizer
  ) {}

  async execute(input: { photoKey: string; styleId: StyleId }): Promise<Uint8Array> {
    if (!requiresModel(input.styleId)) {
      return this.photos.get(input.photoKey);
    }

    const derivedKey = derivedPhotoKey(input.photoKey, input.styleId);

    const cached = await this.photos.getOrNull(derivedKey);
    if (cached) return cached;

    const original = await this.photos.get(input.photoKey);
    const { bytes, applied } = await this.stylizer.stylize({
      photo: original,
      styleId: input.styleId,
    });

    if (!applied) return original;

    // Best effort: a failed cache write costs another model call, not the render.
    try {
      await this.photos.putAt({ key: derivedKey, bytes, contentType: 'image/jpeg' });
    } catch (err) {
      console.error('[GetStyledPhoto] cache write failed', err);
    }

    return bytes;
  }
}

/**
 * Keeps the owner prefix of the source key, so the derived object stays inside
 * the same session's namespace and the ownership check still holds.
 */
export function derivedPhotoKey(photoKey: string, styleId: StyleId): string {
  const dot = photoKey.lastIndexOf('.');
  const stem = dot === -1 ? photoKey : photoKey.slice(0, dot);
  return `${stem}--${styleId}.jpg`;
}
