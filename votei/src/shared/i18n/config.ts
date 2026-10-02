/**
 * i18n configuration (framework-agnostic).
 *
 * Lives in `shared/` because it is cross-cutting: consumed by `app/` (root
 * layout, request config), `features/` (components/hooks) and `shared/` UI —
 * never by `core/`, per the dependency rule.
 */

export const locales = ['pt-BR', 'pt', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'pt-BR';

/** Name of the cookie that persists the visitor's chosen locale. */
export const LOCALE_COOKIE = 'NEXT_LOCALE';

export const localeNames: Record<Locale, string> = {
  'pt-BR': 'Português (Brasil)',
  pt: 'Português (Portugal)',
  en: 'English',
};

export const localeFlags: Record<Locale, string> = {
  'pt-BR': '🇧🇷',
  pt: '🇵🇹',
  en: '🇺🇸',
};

export function isValidLocale(value: string | null | undefined): value is Locale {
  return !!value && locales.includes(value as Locale);
}

/** Resolve any string to a supported locale, falling back to the default. */
export function resolveLocale(value: string | null | undefined): Locale {
  return isValidLocale(value) ? value : defaultLocale;
}

export function getTimeZoneForLocale(locale: Locale): string {
  switch (locale) {
    case 'pt-BR':
      return 'America/Sao_Paulo';
    case 'pt':
      return 'Europe/Lisbon';
    default:
      return 'UTC';
  }
}

export function getCurrencyForLocale(locale: Locale): string {
  switch (locale) {
    case 'pt-BR':
      return 'BRL';
    case 'pt':
      return 'EUR';
    default:
      return 'USD';
  }
}

/** BCP-47 tag for `Intl.*` formatters. */
export function getIntlLocale(locale: Locale): string {
  switch (locale) {
    case 'pt-BR':
      return 'pt-BR';
    case 'pt':
      return 'pt-PT';
    default:
      return 'en-US';
  }
}
