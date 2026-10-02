import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { getOrCreateAnonymousUser } from '@/infrastructure/database/anonymous-session';
import { isLocalBackendEnabled } from '@/infrastructure/local/local-backend';

const LOCAL_COOKIE = 'votei_local_uid';
const ONE_DAY = 60 * 60 * 24;

/**
 * The only thing the app needs from a session is a stable id to scope a
 * visitor's orders to their browser. Supabase anonymous auth provides it in
 * production; the local backend issues a cookie instead.
 */
export async function getSessionUserId(): Promise<string> {
  if (!isLocalBackendEnabled()) {
    return (await getOrCreateAnonymousUser()).id;
  }

  const store = await cookies();
  const existing = store.get(LOCAL_COOKIE)?.value;
  if (existing && /^[0-9a-f-]{36}$/.test(existing)) return existing;

  const id = randomUUID();
  store.set(LOCAL_COOKIE, id, { path: '/', maxAge: ONE_DAY, sameSite: 'lax', httpOnly: true });
  return id;
}
