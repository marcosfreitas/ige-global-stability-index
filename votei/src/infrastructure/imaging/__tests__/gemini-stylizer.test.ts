/** @jest-environment node */
import { GeminiStylizer } from '../gemini-stylizer';

const PHOTO = new Uint8Array([9, 9, 9]);
const ORIGINAL_ENV = { ...process.env };

let fetchMock: jest.Mock;

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV, GEMINI_API_KEY: 'test-key' } as NodeJS.ProcessEnv;
  fetchMock = jest.fn();
  global.fetch = fetchMock as unknown as typeof fetch;
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  jest.restoreAllMocks();
});

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

const stylizer = new GeminiStylizer();

describe('GeminiStylizer', () => {
  it('never calls the model for the no-style option', async () => {
    const result = await stylizer.stylize({ photo: PHOTO, styleId: 'nenhum' });

    expect(result).toEqual({ bytes: PHOTO, applied: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns the restyled bytes when the model answers with an image', async () => {
    const png = Buffer.from([1, 2, 3, 4]).toString('base64');
    fetchMock.mockResolvedValue(
      jsonResponse({ candidates: [{ content: { parts: [{ inlineData: { data: png } }] } }] })
    );

    const result = await stylizer.stylize({ photo: PHOTO, styleId: 'aquarela' });

    expect(result.applied).toBe(true);
    expect(Buffer.from(result.bytes).toString('base64')).toBe(png);
  });

  it('falls back to the original photo when the key is missing', async () => {
    process.env = { ...ORIGINAL_ENV, GEMINI_API_KEY: undefined } as NodeJS.ProcessEnv;

    const result = await stylizer.stylize({ photo: PHOTO, styleId: 'aquarela' });

    expect(result).toEqual({ bytes: PHOTO, applied: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('falls back when the model refuses the prompt', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ promptFeedback: { blockReason: 'SAFETY' } }));

    await expect(stylizer.stylize({ photo: PHOTO, styleId: 'grafite' })).resolves.toEqual({
      bytes: PHOTO,
      applied: false,
    });
  });

  it('falls back on an HTTP error', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'quota' }, false, 429));

    await expect(stylizer.stylize({ photo: PHOTO, styleId: 'vitral' })).resolves.toEqual({
      bytes: PHOTO,
      applied: false,
    });
  });

  it('falls back when the response carries no image', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ candidates: [{ content: { parts: [{ text: 'cannot do that' }] } }] })
    );

    await expect(stylizer.stylize({ photo: PHOTO, styleId: 'pop-art' })).resolves.toEqual({
      bytes: PHOTO,
      applied: false,
    });
  });

  it('falls back when the request throws', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    await expect(stylizer.stylize({ photo: PHOTO, styleId: 'aquarela' })).resolves.toEqual({
      bytes: PHOTO,
      applied: false,
    });
  });
});
