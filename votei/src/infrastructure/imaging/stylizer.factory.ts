import type { IPhotoStylizer } from '@/core/compose/contracts';
import type { StyleId } from '@/core/compose/entities/style';
import { GeminiStylizer } from './gemini-stylizer';
import { ReplicateStylizer } from './replicate-stylizer';

/** Used when no provider is configured, so the style picker degrades to a no-op. */
class NoopStylizer implements IPhotoStylizer {
  async stylize({ photo }: { photo: Uint8Array; styleId: StyleId }) {
    return { bytes: photo, applied: false };
  }
}

/**
 * Picks whichever provider has a credential. Replicate wins when both are set,
 * because it is the explicit choice; Gemini is the direct-to-Google path.
 * Neither configured means the styles quietly do nothing, which is what keeps
 * the product shippable without an image model at all.
 */
export function createStylizer(): IPhotoStylizer {
  if (process.env.REPLICATE_API_TOKEN) return new ReplicateStylizer();
  if (process.env.GEMINI_API_KEY) return new GeminiStylizer();
  return new NoopStylizer();
}

export function isStylingAvailable(): boolean {
  return Boolean(process.env.REPLICATE_API_TOKEN || process.env.GEMINI_API_KEY);
}
