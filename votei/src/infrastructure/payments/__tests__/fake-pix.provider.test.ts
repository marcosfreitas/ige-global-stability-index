/** @jest-environment node */
import { isFakePixEnabled } from '../fake-pix.provider';

const ORIGINAL = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL };
});

function env(values: Record<string, string | undefined>) {
  process.env = { ...ORIGINAL, ...values } as NodeJS.ProcessEnv;
}

describe('isFakePixEnabled', () => {
  it('stays off unless explicitly asked for', () => {
    env({ EFI_FAKE_PIX: undefined, NODE_ENV: 'development' });
    expect(isFakePixEnabled()).toBe(false);
  });

  it('is on in local development', () => {
    env({ EFI_FAKE_PIX: 'true', NODE_ENV: 'development', VERCEL_ENV: undefined });
    expect(isFakePixEnabled()).toBe(true);
  });

  it('is on for a Vercel preview, which also sets NODE_ENV=production', () => {
    env({ EFI_FAKE_PIX: 'true', NODE_ENV: 'production', VERCEL_ENV: 'preview' });
    expect(isFakePixEnabled()).toBe(true);
  });

  it('is off on a Vercel production deployment', () => {
    env({ EFI_FAKE_PIX: 'true', NODE_ENV: 'production', VERCEL_ENV: 'production' });
    expect(isFakePixEnabled()).toBe(false);
  });

  it('is off in production outside Vercel', () => {
    env({ EFI_FAKE_PIX: 'true', NODE_ENV: 'production', VERCEL_ENV: undefined });
    expect(isFakePixEnabled()).toBe(false);
  });
});
