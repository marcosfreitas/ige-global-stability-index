import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { LOCALE_COOKIE, getTimeZoneForLocale, resolveLocale } from '@/shared/i18n/config';

/**
 * next-intl request configuration — cookie/header based (no URL locale prefix).
 *
 * We intentionally avoid `[locale]` path segments so the existing `(marketing)`
 * and `(authenticated)` route groups keep their structure. The active locale is
 * read from the `NEXT_LOCALE` cookie and falls back to the default locale.
 *
 * Referenced by `next.config.ts` via `createNextIntlPlugin`.
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value);

  return {
    locale,
    timeZone: getTimeZoneForLocale(locale),
    now: new Date(),
    messages: (await import(`@/shared/i18n/messages/${locale}.json`)).default,
  };
});
