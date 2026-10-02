import type { IPhotoStylizer } from '@/core/compose/contracts';
import { findStyle, requiresModel, type StyleId } from '@/core/compose/entities/style';

const DEFAULT_MODEL = 'gemini-2.5-flash-image';
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const TIMEOUT_MS = 45_000;

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType?: string; data?: string };
  inline_data?: { mime_type?: string; data?: string };
}

interface GeminiResponse {
  candidates?: { content?: { parts?: GeminiPart[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
}

function extractImage(body: GeminiResponse): Uint8Array | null {
  for (const candidate of body.candidates ?? []) {
    for (const part of candidate.content?.parts ?? []) {
      const data = part.inlineData?.data ?? part.inline_data?.data;
      if (data) return new Uint8Array(Buffer.from(data, 'base64'));
    }
  }
  return null;
}

/**
 * Nano Banana (Gemini image model) restyling.
 *
 * Deliberately total: every failure path — missing key, timeout, refusal,
 * empty response — returns the original photo with `applied: false`. The
 * caller then still has a complete image to sell, and the order never dies
 * because a third-party model had a bad minute.
 */
export class GeminiStylizer implements IPhotoStylizer {
  async stylize({
    photo,
    styleId,
  }: {
    photo: Uint8Array;
    styleId: StyleId;
  }): Promise<{ bytes: Uint8Array; applied: boolean }> {
    if (!requiresModel(styleId)) return { bytes: photo, applied: false };

    const style = findStyle(styleId);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!style || !apiKey) {
      if (!apiKey) console.warn('[GeminiStylizer] GEMINI_API_KEY ausente; devolvendo a foto original.');
      return { bytes: photo, applied: false };
    }

    const model = process.env.GEMINI_IMAGE_MODEL || DEFAULT_MODEL;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(`${ENDPOINT}/${model}:generateContent`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: style.prompt },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: Buffer.from(photo).toString('base64'),
                  },
                },
              ],
            },
          ],
        }),
      });

      if (!res.ok) {
        console.error('[GeminiStylizer] HTTP', res.status, (await res.text()).slice(0, 300));
        return { bytes: photo, applied: false };
      }

      const body = (await res.json()) as GeminiResponse;

      if (body.promptFeedback?.blockReason) {
        console.warn('[GeminiStylizer] bloqueado:', body.promptFeedback.blockReason);
        return { bytes: photo, applied: false };
      }

      const image = extractImage(body);
      if (!image) {
        console.warn('[GeminiStylizer] resposta sem imagem.');
        return { bytes: photo, applied: false };
      }

      return { bytes: image, applied: true };
    } catch (err) {
      console.error('[GeminiStylizer] falhou:', (err as Error).message);
      return { bytes: photo, applied: false };
    } finally {
      clearTimeout(timer);
    }
  }
}
