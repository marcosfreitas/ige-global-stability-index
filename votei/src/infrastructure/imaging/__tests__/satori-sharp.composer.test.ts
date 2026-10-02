/** @jest-environment node */
import sharp from 'sharp';
import type { ComposeSpec } from '@/core/compose/entities/composition';
import { FRAMES } from '@/core/compose/entities/frame';
import { SatoriSharpComposer } from '../satori-sharp.composer';

jest.setTimeout(60_000);

async function photo(width = 1200, height = 1600): Promise<Uint8Array> {
  const buffer = await sharp({
    create: { width, height, channels: 3, background: { r: 70, g: 100, b: 150 } },
  })
    .jpeg()
    .toBuffer();
  return new Uint8Array(buffer);
}

const composer = new SatoriSharpComposer();

const spec: ComposeSpec = {
  cargo: 'presidente',
  numero: '13',
  frameId: 'verde-amarela',
  styleId: 'nenhum',
};

describe('SatoriSharpComposer', () => {
  it('renders a square JPEG at the requested size', async () => {
    const bytes = await composer.compose({
      spec,
      photo: await photo(),
      size: 1080,
      watermark: false,
    });

    const meta = await sharp(bytes).metadata();
    expect(meta.format).toBe('jpeg');
    expect(meta.width).toBe(1080);
    expect(meta.height).toBe(1080);
  });

  it('keeps preview and final visually identical apart from the watermark', async () => {
    const source = await photo();

    const clean = await composer.compose({ spec, photo: source, size: 720, watermark: false });
    const marked = await composer.compose({ spec, photo: source, size: 720, watermark: true });

    expect(Buffer.compare(Buffer.from(clean), Buffer.from(marked))).not.toBe(0);

    const cleanMeta = await sharp(clean).metadata();
    const markedMeta = await sharp(marked).metadata();
    expect(markedMeta.width).toBe(cleanMeta.width);
    expect(markedMeta.height).toBe(cleanMeta.height);
  });

  it('renders every frame in the catalogue', async () => {
    const source = await photo(600, 600);

    for (const frame of FRAMES) {
      const bytes = await composer.compose({
        spec: { ...spec, frameId: frame.id },
        photo: source,
        size: 360,
        watermark: false,
      });
      expect(bytes.byteLength).toBeGreaterThan(1000);
    }
  });

  it('renders the longest number and name without throwing', async () => {
    const bytes = await composer.compose({
      spec: {
        cargo: 'deputado-estadual',
        numero: '54321',
        nome: 'Maria da Conceição',
        frameId: 'neon',
        styleId: 'nenhum',
      },
      photo: await photo(),
      size: 1080,
      watermark: false,
    });

    expect((await sharp(bytes).metadata()).width).toBe(1080);
  });

  it('rejects bytes that are not an image', async () => {
    await expect(
      composer.compose({
        spec,
        photo: new Uint8Array([1, 2, 3, 4, 5]),
        size: 720,
        watermark: false,
      })
    ).rejects.toMatchObject({ code: 'INVALID_IMAGE' });
  });
});
