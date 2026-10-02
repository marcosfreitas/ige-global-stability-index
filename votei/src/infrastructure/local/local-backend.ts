/**
 * Local development backend.
 *
 * Supabase is a network dependency, and there are plenty of moments — a new
 * contributor, a demo, a locked-down network — where the right answer is to
 * run the whole flow without provisioning anything. The ports in `core/` make
 * that a matter of swapping three adapters.
 *
 * Gated exactly like the fake Pix provider: never active on a production
 * deployment, whatever the env says.
 */
export function isLocalBackendEnabled(): boolean {
  if (process.env.LOCAL_DEV_BACKEND !== 'true') return false;

  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv) return vercelEnv !== 'production';

  return process.env.NODE_ENV !== 'production';
}

export const LOCAL_STORE_DIR = '.local-store';
