import type { IPhotoStylizer } from '@/core/compose/contracts';
import { findStyle, requiresModel, type StyleId } from '@/core/compose/entities/style';

const DEFAULT_MODEL = 'google/nano-banana';
const ENDPOINT = 'https://api.replicate.com/v1/models';
const TIMEOUT_MS = 90_000;

interface Prediction {
  status?: string;
  output?: string | string[];
  error?: string;
}

function firstOutputUrl(output: Prediction['output']): string | null {
  if (typeof output === 'string') return output;
  if (Array.isArray(output)) {
    const found = output.find((entry) => typeof entry === 'string');
    return found ?? null;
  }
  return null;
}

/**
 * Nano Banana through Replicate.
 *
 * `Prefer: wait` makes the prediction synchronous, so there is no queue to
 * poll — at the cost of a long request, hence the 90s ceiling and the
 * `maxDuration` on the routes that call this.
 *
 * Like the Gemini provider, every failure returns the original photo: the
 * buyer loses a style, never their purchase.
 */
export class ReplicateStylizer implements IPhotoStylizer {
  async stylize({
    photo,
    styleId,
  }: {
    photo: Uint8Array;
    styleId: StyleId;
  }): Promise<{ bytes: Uint8Array; applied: boolean }> {
    if (!requiresModel(styleId)) return { bytes: photo, applied: false };

    const style = findStyle(styleId);
    const token = process.env.REPLICATE_API_TOKEN;
    if (!style || !token) return { bytes: photo, applied: false };

    const model = process.env.REPLICATE_IMAGE_MODEL || DEFAULT_MODEL;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(`${ENDPOINT}/${model}/predictions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Prefer: 'wait',
        },
        body: JSON.stringify({
          input: {
            prompt: style.prompt,
            image_input: [`data:image/jpeg;base64,${Buffer.from(photo).toString('base64')}`],
            output_format: 'jpg',
          },
        }),
      });

      if (!res.ok) {
        console.error('[ReplicateStylizer] HTTP', res.status, (await res.text()).slice(0, 300));
        return { bytes: photo, applied: false };
      }

      const prediction = (await res.json()) as Prediction;

      if (prediction.status !== 'succeeded') {
        console.warn('[ReplicateStylizer] prediction', prediction.status, prediction.error ?? '');
        return { bytes: photo, applied: false };
      }

      const url = firstOutputUrl(prediction.output);
      if (!url) {
        console.warn('[ReplicateStylizer] prediction sem output de imagem.');
        return { bytes: photo, applied: false };
      }

      const file = await fetch(url, { signal: controller.signal });
      if (!file.ok) {
        console.error('[ReplicateStylizer] download falhou:', file.status);
        return { bytes: photo, applied: false };
      }

      return { bytes: new Uint8Array(await file.arrayBuffer()), applied: true };
    } catch (err) {
      console.error('[ReplicateStylizer] falhou:', (err as Error).message);
      return { bytes: photo, applied: false };
    } finally {
      clearTimeout(timer);
    }
  }
}
