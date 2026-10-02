/** @jest-environment node */
import { ReplicateStylizer } from '../replicate-stylizer';

const PHOTO = new Uint8Array([5, 5, 5]);
const ORIGINAL_ENV = { ...process.env };

let fetchMock: jest.Mock;

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV, REPLICATE_API_TOKEN: 'r8_test' } as NodeJS.ProcessEnv;
  fetchMock = jest.fn();
  global.fetch = fetchMock as unknown as typeof fetch;
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  jest.restoreAllMocks();
});

function prediction(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body, text: async () => JSON.stringify(body) } as unknown as Response;
}

const stylizer = new ReplicateStylizer();

describe('ReplicateStylizer', () => {
  it('downloads the output and reports it applied', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    fetchMock
      .mockResolvedValueOnce(
        prediction({ status: 'succeeded', output: 'https://replicate.delivery/out.jpg' })
      )
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => bytes.buffer,
      } as unknown as Response);

    const result = await stylizer.stylize({ photo: PHOTO, styleId: 'aquarela' });

    expect(result.applied).toBe(true);
    expect(Array.from(result.bytes)).toEqual([1, 2, 3, 4]);
  });

  it('accepts an array output', async () => {
    fetchMock
      .mockResolvedValueOnce(
        prediction({ status: 'succeeded', output: ['https://replicate.delivery/a.jpg'] })
      )
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => new Uint8Array([9]).buffer,
      } as unknown as Response);

    await expect(stylizer.stylize({ photo: PHOTO, styleId: 'vitral' })).resolves.toMatchObject({
      applied: true,
    });
  });

  it('falls back on a style id it does not know', async () => {
    await expect(
      stylizer.stylize({ photo: PHOTO, styleId: 'neon' as never })
    ).resolves.toEqual({ bytes: PHOTO, applied: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never calls out for the no-style option', async () => {
    await expect(stylizer.stylize({ photo: PHOTO, styleId: 'nenhum' })).resolves.toEqual({
      bytes: PHOTO,
      applied: false,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('falls back without a token', async () => {
    process.env = { ...ORIGINAL_ENV, REPLICATE_API_TOKEN: undefined } as NodeJS.ProcessEnv;

    await expect(stylizer.stylize({ photo: PHOTO, styleId: 'vitral' })).resolves.toEqual({
      bytes: PHOTO,
      applied: false,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('falls back on a failed prediction', async () => {
    fetchMock.mockResolvedValue(prediction({ status: 'failed', error: 'NSFW' }));

    await expect(stylizer.stylize({ photo: PHOTO, styleId: 'grafite' })).resolves.toEqual({
      bytes: PHOTO,
      applied: false,
    });
  });

  it('falls back on an HTTP error', async () => {
    fetchMock.mockResolvedValue(prediction({ detail: 'rate limited' }, false, 429));

    await expect(stylizer.stylize({ photo: PHOTO, styleId: 'pop-art' })).resolves.toEqual({
      bytes: PHOTO,
      applied: false,
    });
  });

  it('falls back when the output download fails', async () => {
    fetchMock
      .mockResolvedValueOnce(prediction({ status: 'succeeded', output: 'https://x/out.jpg' }))
      .mockResolvedValueOnce({ ok: false, status: 403 } as unknown as Response);

    await expect(stylizer.stylize({ photo: PHOTO, styleId: 'aquarela' })).resolves.toEqual({
      bytes: PHOTO,
      applied: false,
    });
  });

  it('falls back when the request throws', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(stylizer.stylize({ photo: PHOTO, styleId: 'aquarela' })).resolves.toEqual({
      bytes: PHOTO,
      applied: false,
    });
  });
});
