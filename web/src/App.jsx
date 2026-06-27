import { useState, useMemo, useEffect } from 'react'
import { useIgeData, bestEntry, regionCountriesFor, regionSummaryFor } from './hooks/useIgeData.js'
import { useMediaQuery } from './hooks/useMediaQuery.js'
import { AGGREGATE_ISOS } from './lib/constants.js'
import { TopBar } from './components/TopBar.jsx'
import { DesktopLayout } from './components/DesktopLayout.jsx'
import { MobileLayout } from './components/MobileLayout.jsx'

function LoadingScreen() {
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
        ÍNDICE GLOBAL DE ESTABILIDADE
      </div>
      <div style={{ color: 'var(--text-label)', fontSize: 13 }}>
        CARREGANDO DATASET…
      </div>
      <div style={{ color: 'var(--ige-text-faint)', fontSize: 10, marginTop: 10, letterSpacing: '0.1em' }}>
        259 PAÍSES · 1962–2025
      </div>
    </div>
  )
}

function ErrorScreen({ message }) {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--surface-page)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-mono)', color: 'var(--ige-alert)', fontSize: 12,
    }}>
      ERRO AO CARREGAR DADOS: {message}
    </div>
  )
}

export default function App() {
  const { loading, error, countryMap, regions } = useIgeData()
  const isMobile = useMediaQuery('(max-width: 768px)')

  const [selectedRegion, setSelectedRegion] = useState(null)
  const [selectedIso, setSelectedIso]       = useState(null)
  const [search, setSearch]                  = useState('')

  // Initialise defaults once data is loaded
  const effectiveRegion = selectedRegion || regions[0] || null

  // When region changes, pick highest-IGE country in that region
  const handleRegionChange = (r) => {
    setSearch('')
    setSelectedRegion(r)
    const pool = Object.entries(countryMap)
      .filter(([iso, c]) => c.region === r && !AGGREGATE_ISOS.has(iso))
      .map(([iso, c]) => {
        const e = bestEntry(c.entries)
        return { iso, ige: e?.ige ?? -1 }
      })
      .sort((a, b) => b.ige - a.ige)
    if (pool[0]) setSelectedIso(pool[0].iso)
  }

  // Auto-select best country on first load
  useEffect(() => {
    if (!loading && !selectedIso && effectiveRegion && Object.keys(countryMap).length > 0) {
      const pool = Object.entries(countryMap)
        .filter(([iso, c]) => c.region === effectiveRegion && !AGGREGATE_ISOS.has(iso))
        .map(([iso, c]) => {
          const e = bestEntry(c.entries)
          return { iso, ige: e?.ige ?? -1 }
        })
        .sort((a, b) => b.ige - a.ige)
      if (pool[0]) setSelectedIso(pool[0].iso)
    }
  }, [loading, effectiveRegion])

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
    return countryMap[selectedIso].entries
      .filter(e => e.ige != null || e.nivel != null)
      .map(e => ({ year: e.year, ige: e.ige, nivel: e.nivel, momentum: e.momentum }))
  }, [countryMap, selectedIso])

  const handleSelectCountry = (iso) => {
    setSelectedIso(iso)
    const r = countryMap[iso]?.region
    if (r && r !== effectiveRegion) setSelectedRegion(r)
    setSearch('')
  }

  if (loading) return <LoadingScreen />
  if (error)   return <ErrorScreen message={error} />

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

  if (isMobile) {
    return (
      <MobileLayout
        {...sharedProps}
        regions={regions}
        selectedRegion={effectiveRegion}
        onRegionChange={handleRegionChange}
        regionIge={regionSummary?.medIge}
      />
    )
  }

  return (
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
  )
}
