'use server';

import { cookies } from 'next/headers';
import { LOCALE_COOKIE, type Locale, defaultLocale, resolveLocale } from '@/shared/i18n/config';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Read the active locale from the request cookie (server-side). */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value);
}

/**
 * Persist the visitor's locale choice in a cookie. Server Action — safe to call
 * from a client component. Invalid values fall back to the default locale.
 */
export async function setLocale(locale: Locale): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, resolveLocale(locale), {
    path: '/',
    maxAge: ONE_YEAR_SECONDS,
    sameSite: 'lax',
  });
}

export { defaultLocale };
