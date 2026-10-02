import satori from 'satori';
import sharp from 'sharp';
import type { ComposeOptions, IImageComposer } from '@/core/orders/contracts';
import { AppError } from '@/shared/errors';
import { buildFrameTree, type SatoriNode } from './frames';
import { ANTON_400, INTER_500, INTER_700 } from './fonts.generated';

type SatoriElement = Parameters<typeof satori>[0];
type SatoriFont = Parameters<typeof satori>[1]['fonts'][number];

let cachedFonts: SatoriFont[] | null = null;

function decode(base64: string): Buffer {
  return Buffer.from(base64, 'base64');
}

function getFonts(): SatoriFont[] {
  if (!cachedFonts) {
    cachedFonts = [
      { name: 'Anton', data: decode(ANTON_400), weight: 400, style: 'normal' },
      { name: 'Inter', data: decode(INTER_500), weight: 500, style: 'normal' },
      { name: 'Inter', data: decode(INTER_700), weight: 700, style: 'normal' },
    ];
  }
  return cachedFonts;
}

/**
 * Renders the overlay with satori (text becomes vector paths, so the ballot
 * number never depends on a font being installed on the host) and composites
 * it over the photo with sharp.
 */
export class SatoriSharpComposer implements IImageComposer {
  async compose({ spec, photo, size, watermark }: ComposeOptions): Promise<Uint8Array> {
    const tree = buildFrameTree({ spec, size, watermark });
    const overlay = await this.renderOverlay(tree, size);
    const base = await this.normalisePhoto(photo, size);

    try {
      return await sharp(base)
        .composite([{ input: overlay, top: 0, left: 0 }])
        .jpeg({ quality: 92, chromaSubsampling: '4:4:4', mozjpeg: true })
        .toBuffer();
    } catch (err) {
      throw new AppError('COMPOSE_FAILED', 'Não foi possível montar a imagem.', 500, {
        cause: (err as Error).message,
      });
    }
  }

  private async renderOverlay(tree: SatoriNode, size: number): Promise<Buffer> {
    // satori's types expect a React element; the runtime only reads
    // `type`/`props`, which is what buildFrameTree produces.
    const svg = await satori(tree as unknown as SatoriElement, {
      width: size,
      height: size,
      fonts: getFonts(),
    });
    return Buffer.from(svg);
  }

  /**
   * EXIF rotation first, then a square cover crop. Metadata is dropped: a
   * selfie carries GPS coordinates, and this one is attached to a declared
   * vote.
   */
  private async normalisePhoto(photo: Uint8Array, size: number): Promise<Buffer> {
    try {
      return await sharp(photo, { failOn: 'error' })
        .rotate()
        .resize(size, size, { fit: 'cover', position: 'centre' })
        .toFormat('png')
        .toBuffer();
    } catch {
      throw new AppError(
        'INVALID_IMAGE',
        'Não conseguimos ler essa foto. Tente outra imagem.',
        400
      );
    }
  }
}
