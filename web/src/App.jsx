import { useState, useMemo, useEffect, useCallback } from 'react'
import { useIgeData, bestEntry, regionCountriesFor, regionSummaryFor } from './hooks/useIgeData.js'
import { useMediaQuery } from './hooks/useMediaQuery.js'
import { AGGREGATE_ISOS } from './lib/constants.js'
import { LangContext, buildLangContext } from './lib/LangContext.js'
import { t } from './lib/i18n.js'
import { TopBar } from './components/TopBar.jsx'
import { DesktopLayout } from './components/DesktopLayout.jsx'
import { MobileLayout } from './components/MobileLayout.jsx'

// ── Language initialisation ────────────────────────────────────────────────────
const VALID_LANGS = ['en', 'es', 'pt']

function detectLang() {
  // 1. URL param
  const urlLang = new URLSearchParams(window.location.search).get('lang')
  if (VALID_LANGS.includes(urlLang)) return urlLang
  // 2. localStorage
  const stored = localStorage.getItem('ige_lang')
  if (VALID_LANGS.includes(stored)) return stored
  // 3. Browser language
  const nav = (navigator.language || '').toLowerCase()
  if (nav.startsWith('pt')) return 'pt'
  if (nav.startsWith('es')) return 'es'
  return 'en'
}

// ── URL helpers ────────────────────────────────────────────────────────────────
function readURLParams() {
  const p = new URLSearchParams(window.location.search)
  return {
    region:  p.get('region')  || null,
    country: p.get('country') || null,
    lang:    p.get('lang')    || null,
  }
}

function pushURL(region, country, lang) {
  const p = new URLSearchParams()
  if (region)  p.set('region', region)
  if (country) p.set('country', country)
  if (lang)    p.set('lang', lang)
  const qs = p.toString()
  history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
}

// ── Loading / Error screens ────────────────────────────────────────────────────
function LoadingScreen({ lang }) {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--surface-page)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-mono)',
    }}>
      <div style={{ color: 'var(--ige-accent)', fontSize: 36, fontWeight: 700, letterSpacing: '0.12em', marginBottom: 4 }}>
        IGE
      </div>
      <div style={{ color: 'var(--text-label)', fontSize: 10, letterSpacing: '0.2em', marginBottom: 48 }}>
        {t(lang, 'subtitle')}
      </div>
      <div style={{ color: 'var(--text-label)', fontSize: 13 }}>
        {t(lang, 'loading')}
      </div>
      <div style={{ color: 'var(--ige-text-faint)', fontSize: 10, marginTop: 10, letterSpacing: '0.1em' }}>
        {t(lang, 'tagline')}
      </div>
    </div>
  )
}

function ErrorScreen({ message, lang }) {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--surface-page)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-mono)', color: 'var(--ige-alert)', fontSize: 12,
    }}>
      {t(lang, 'error')}: {message}
    </div>
  )
}

// ── Main App ───────────────────────────────────────────────────────────────────
export default function App() {
  const { loading, error, countryMap, regions } = useIgeData()
  const isMobile = useMediaQuery('(max-width: 768px)')

  // Language state
  const [lang, setLangState] = useState(detectLang)

  const setLang = useCallback((newLang) => {
    if (!VALID_LANGS.includes(newLang)) return
    setLangState(newLang)
    localStorage.setItem('ige_lang', newLang)
  }, [])

  // Region / country selection
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [selectedIso, setSelectedIso]       = useState(null)
  const [search, setSearch]                  = useState('')

  // Whether we've already applied URL params (so we don't stomp on user navigation)
  const [urlApplied, setUrlApplied] = useState(false)

  const effectiveRegion = selectedRegion || regions[0] || null

  // Apply URL params once data is loaded
  useEffect(() => {
    if (loading || urlApplied || !Object.keys(countryMap).length) return
    setUrlApplied(true)

    const { region, country } = readURLParams()

    // Validate region
    const validRegion = region && regions.includes(region) ? region : null
    const targetRegion = validRegion || regions[0] || null

    if (targetRegion) setSelectedRegion(targetRegion)

    // Validate country — must exist in countryMap and belong to the target region
    if (country && countryMap[country]) {
      const countryRegion = countryMap[country].region
      if (!validRegion || countryRegion === targetRegion || !validRegion) {
        setSelectedIso(country)
        if (!validRegion && countryRegion) setSelectedRegion(countryRegion)
      } else {
        // Country not in the specified region — ignore country, pick best in region
        pickBestInRegion(targetRegion)
      }
    } else {
      pickBestInRegion(targetRegion)
    }
  }, [loading, countryMap, regions])

  function pickBestInRegion(region) {
    if (!region) return
    const pool = Object.entries(countryMap)
      .filter(([iso, c]) => c.region === region && !AGGREGATE_ISOS.has(iso))
      .map(([iso, c]) => ({ iso, ige: bestEntry(c.entries)?.ige ?? -1 }))
      .sort((a, b) => b.ige - a.ige)
    if (pool[0]) setSelectedIso(pool[0].iso)
  }

  // Auto-select best country on first load (when no URL params)
  useEffect(() => {
    if (!loading && !selectedIso && effectiveRegion && Object.keys(countryMap).length > 0) {
      pickBestInRegion(effectiveRegion)
    }
  }, [loading, effectiveRegion])

  // Sync URL whenever region, country, or lang changes (after initial load)
  useEffect(() => {
    if (loading) return
    pushURL(effectiveRegion, selectedIso, lang)
  }, [effectiveRegion, selectedIso, lang, loading])

  const handleRegionChange = useCallback((r) => {
    setSearch('')
    setSelectedRegion(r)
    const pool = Object.entries(countryMap)
      .filter(([iso, c]) => c.region === r && !AGGREGATE_ISOS.has(iso))
      .map(([iso, c]) => ({ iso, ige: bestEntry(c.entries)?.ige ?? -1 }))
      .sort((a, b) => b.ige - a.ige)
    if (pool[0]) setSelectedIso(pool[0].iso)
  }, [countryMap])

  const countries = useMemo(
    () => regionCountriesFor(countryMap, effectiveRegion, search),
    [countryMap, effectiveRegion, search]
  )

  const regionSummary = useMemo(
    () => regionSummaryFor(countryMap, effectiveRegion),
    [countryMap, effectiveRegion]
  )

  const selectedEntry = useMemo(() => {
    if (!selectedIso || !countryMap[selectedIso]) return null
    return bestEntry(countryMap[selectedIso].entries)
  }, [countryMap, selectedIso])

  const timeSeries = useMemo(() => {
    if (!selectedIso || !countryMap[selectedIso]) return []
    const entries = countryMap[selectedIso].entries
    // Use ≥3 factors when the country has at least one such entry (filters out
    // incomplete-year spikes like RUS 2025 with only 2 factors).
    // Fall back to ≥1 for countries that structurally never reach 3 factors
    // (e.g. Taiwan, absent from WB APIs for political reasons) so the chart
    // still renders using whatever legitimate data exists.
    const hasMeaningful = entries.some(e => (e.factors_used?.length ?? 0) >= 3)
    const minFactors = hasMeaningful ? 3 : 1
    return entries
      .filter(e => e.ige != null && (e.factors_used?.length ?? 0) >= minFactors)
      .map(e => ({ year: e.year, ige: e.ige, nivel: e.nivel, momentum: e.momentum }))
  }, [countryMap, selectedIso])

  const handleSelectCountry = useCallback((iso) => {
    setSelectedIso(iso)
    const r = countryMap[iso]?.region
    if (r && r !== effectiveRegion) setSelectedRegion(r)
    setSearch('')
  }, [countryMap, effectiveRegion])

  // Build context value
  const langCtx = useMemo(() => buildLangContext(lang, setLang), [lang, setLang])

  if (loading) return <LoadingScreen lang={lang} />
  if (error)   return <ErrorScreen message={error} lang={lang} />

  const sharedProps = {
    region: effectiveRegion,
    regionSummary,
    countries,
    selectedIso,
    onSelectCountry: handleSelectCountry,
    search,
    onSearch: setSearch,
    selectedEntry,
    timeSeries,
    countryMap,
  }

  return (
    <LangContext.Provider value={langCtx}>
      {isMobile ? (
        <MobileLayout
          {...sharedProps}
          regions={regions}
          selectedRegion={effectiveRegion}
          onRegionChange={handleRegionChange}
          regionIge={regionSummary?.medIge}
        />
      ) : (
        <div style={{
          minHeight: '100vh',
          background: 'var(--surface-page)',
          padding: 'var(--layout-pad)',
        }}>
          <div style={{ maxWidth: 'var(--layout-max)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--layout-gap)' }}>
            <TopBar
              regions={regions}
              selectedRegion={effectiveRegion}
              onRegionChange={handleRegionChange}
              regionIge={regionSummary?.medIge}
            />
            <DesktopLayout {...sharedProps} />
          </div>
        </div>
      )}
    </LangContext.Provider>
  )
}
