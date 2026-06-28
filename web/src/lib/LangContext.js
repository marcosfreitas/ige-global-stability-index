import { createContext, useContext } from 'react'
import { t, regionLabelI18n, bandLabelI18n } from './i18n.js'

export const LangContext = createContext({
  lang: 'pt',
  setLang: () => {},
  t: (key) => key,
  regionLabel: (region) => region ?? '—',
  bandLabel: (bandKey) => bandKey,
})

/** Hook to access translations and lang state from any component. */
export function useLang() {
  return useContext(LangContext)
}

/** Build the context value object for a given lang + setter. */
export function buildLangContext(lang, setLang) {
  return {
    lang,
    setLang,
    t:           (key) => t(lang, key),
    regionLabel: (region) => regionLabelI18n(lang, region),
    bandLabel:   (bandKey) => bandLabelI18n(lang, bandKey),
  }
}
