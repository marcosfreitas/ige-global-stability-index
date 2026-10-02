/** @jest-environment node */
import type { IPhotoStylizer } from '../../contracts';
import type { IPhotoStore } from '@/core/orders/contracts';
import { GetStyledPhotoService, derivedPhotoKey } from '../get-styled-photo.service';

const ORIGINAL = new Uint8Array([1, 1, 1]);
const STYLED = new Uint8Array([2, 2, 2]);
const CACHED = new Uint8Array([3, 3, 3]);

const KEY = '11111111-1111-4111-8111-111111111111/abc.jpg';

function harness(options: { cached?: Uint8Array | null; applied?: boolean } = {}) {
  const putAt = jest.fn().mockResolvedValue(undefined);
  const photos: IPhotoStore = {
    put: jest.fn(),
    putAt,
    get: jest.fn().mockResolvedValue(ORIGINAL),
    getOrNull: jest.fn().mockResolvedValue(options.cached ?? null),
    remove: jest.fn(),
  };

  const stylize = jest
    .fn()
    .mockResolvedValue({ bytes: STYLED, applied: options.applied ?? true });
  const stylizer: IPhotoStylizer = { stylize };

  return { service: new GetStyledPhotoService(photos, stylizer), stylize, putAt, photos };
}

describe('GetStyledPhotoService', () => {
  it('skips the model entirely when no style is chosen', async () => {
    const { service, stylize } = harness();

    await expect(service.execute({ photoKey: KEY, styleId: 'nenhum' })).resolves.toBe(ORIGINAL);
    expect(stylize).not.toHaveBeenCalled();
  });

  it('calls the model once and caches the result', async () => {
    const { service, stylize, putAt } = harness();

    await expect(service.execute({ photoKey: KEY, styleId: 'aquarela' })).resolves.toBe(STYLED);
    expect(stylize).toHaveBeenCalledTimes(1);
    expect(putAt).toHaveBeenCalledWith(
      expect.objectContaining({ key: derivedPhotoKey(KEY, 'aquarela') })
    );
  });

  it('serves the cache without touching the model', async () => {
    const { service, stylize } = harness({ cached: CACHED });

    await expect(service.execute({ photoKey: KEY, styleId: 'aquarela' })).resolves.toBe(CACHED);
    expect(stylize).not.toHaveBeenCalled();
  });

  it('falls back to the original when the model declines', async () => {
    const { service, putAt } = harness({ applied: false });

    await expect(service.execute({ photoKey: KEY, styleId: 'pop-art' })).resolves.toBe(ORIGINAL);
    expect(putAt).not.toHaveBeenCalled();
  });

  it('still returns the render when the cache write fails', async () => {
    const { service, putAt } = harness();
    putAt.mockRejectedValueOnce(new Error('storage down'));

    await expect(service.execute({ photoKey: KEY, styleId: 'vitral' })).resolves.toBe(STYLED);
  });

  it('keeps the owner prefix on the derived key', () => {
    const derived = derivedPhotoKey(KEY, 'grafite');

    expect(derived.startsWith('11111111-1111-4111-8111-111111111111/')).toBe(true);
    expect(derived).toBe('11111111-1111-4111-8111-111111111111/abc--grafite.jpg');
  });
});
