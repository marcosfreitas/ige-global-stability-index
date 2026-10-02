import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { defaultLocale, resolveLocale, type Locale } from '@/shared/i18n/config';
import { setLocale as persistLocaleCookie } from '@/shared/i18n/locale';

/**
 * User-facing preferences that live on the client and pair with the i18n layer.
 *
 * Lives in `shared/` (cross-cutting client state, used across features).
 * `locale` is mirrored to the `NEXT_LOCALE` cookie via the i18n Server Action
 * so that server-rendered content (next-intl `getRequestConfig`) stays in sync
 * with the client's choice. Persisted to localStorage for instant hydration.
 */

interface PreferencesState {
  locale: Locale;
  reducedMotion: boolean;

  setLocale: (locale: Locale) => Promise<void>;
  setReducedMotion: (value: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      locale: defaultLocale,
      reducedMotion: false,

      setLocale: async (locale) => {
        const resolved = resolveLocale(locale);
        set({ locale: resolved });
        await persistLocaleCookie(resolved);
      },

      setReducedMotion: (value) => set({ reducedMotion: value }),
    }),
    {
      name: 'preferences',
      partialize: (state) => ({ locale: state.locale, reducedMotion: state.reducedMotion }),
    }
  )
);
