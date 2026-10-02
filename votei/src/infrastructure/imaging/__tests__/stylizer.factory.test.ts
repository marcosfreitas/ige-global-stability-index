/** @jest-environment node */
import { GeminiStylizer } from '../gemini-stylizer';
import { ReplicateStylizer } from '../replicate-stylizer';
import { createStylizer, isStylingAvailable } from '../stylizer.factory';

const ORIGINAL = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL };
});

function env(values: Record<string, string | undefined>) {
  process.env = { ...ORIGINAL, ...values } as NodeJS.ProcessEnv;
}

describe('createStylizer', () => {
  it('prefers Replicate when its token is set', () => {
    env({ REPLICATE_API_TOKEN: 'r8_x', GEMINI_API_KEY: 'g_x' });
    expect(createStylizer()).toBeInstanceOf(ReplicateStylizer);
  });

  it('uses Gemini when only its key is set', () => {
    env({ REPLICATE_API_TOKEN: undefined, GEMINI_API_KEY: 'g_x' });
    expect(createStylizer()).toBeInstanceOf(GeminiStylizer);
  });

  it('degrades to a no-op with no credential, returning the photo untouched', async () => {
    env({ REPLICATE_API_TOKEN: undefined, GEMINI_API_KEY: undefined });

    const photo = new Uint8Array([7, 7, 7]);
    await expect(createStylizer().stylize({ photo, styleId: 'aquarela' })).resolves.toEqual({
      bytes: photo,
      applied: false,
    });
  });

  it('reports availability from the configured credentials', () => {
    env({ REPLICATE_API_TOKEN: undefined, GEMINI_API_KEY: undefined });
    expect(isStylingAvailable()).toBe(false);

    env({ REPLICATE_API_TOKEN: 'r8_x', GEMINI_API_KEY: undefined });
    expect(isStylingAvailable()).toBe(true);
  });
});
