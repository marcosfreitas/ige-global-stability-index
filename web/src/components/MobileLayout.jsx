import { useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { RegionSelect } from './ui/RegionSelect.jsx'
import { SearchInput } from './ui/SearchInput.jsx'
import { RegionSummary } from './RegionSummary.jsx'
import { CountryRow } from './ui/CountryRow.jsx'
import { HeroSection } from './HeroSection.jsx'
import { ChartSection } from './ChartSection.jsx'
import { FactorsSection } from './FactorsSection.jsx'
import { Panel } from './ui/Panel.jsx'
import { Footer } from './Footer.jsx'
import { bandForScore } from '../lib/bands.js'
import { useLang } from '../lib/LangContext.js'
import { fmt } from '../lib/format.js'

const LANGS = ['en', 'es', 'pt']

function formatGeneratedAt(iso, lang) {
  if (!iso) return null
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat(lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es' : 'en', {
      day: '2-digit', month: 'short', year: 'numeric',
    }).format(d).toUpperCase()
  } catch {
    return null
  }
}

export function MobileLayout({
  regions, selectedRegion, onRegionChange, regionIge,
  regionSummary, region,
  countries, selectedIso, onSelectCountry,
  search, onSearch,
  selectedEntry, timeSeries,
  countryMap, generatedAt,
}) {
  const { t, lang, setLang, bandLabel } = useLang()
  const color = `var(--ige-band-${bandForScore(regionIge)})`
  const label = bandLabel(bandForScore(regionIge))
  const selectedCountryRegion = countryMap[selectedIso]?.region
  const syncedDate = formatGeneratedAt(generatedAt, lang)
  const [tab, setTab] = useState('detalhe')

  const handleSelectCountry = (iso) => {
    onSelectCountry(iso)
    onSearch('')
    setTab('detalhe')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Sticky header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--ige-divider)',
        background: 'var(--surface-card)',
        position: 'sticky', top: 0, zIndex: 20,
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {/* Row 1: wordmark + IGE badge + lang switcher */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--ige-accent)', letterSpacing: '0.5px', lineHeight: 1 }}>
              IGE
            </div>
            {syncedDate && (
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 8,
                color: 'var(--ige-text-faint)', letterSpacing: '0.3px', marginTop: 2,
              }}>
                {t('data_updated')} · {syncedDate}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {regionIge != null && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--surface-control)',
                border: '1px solid var(--border-control)',
                borderRadius: 'var(--radius-control)',
                padding: '5px 11px',
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1, color }}>
                  {label.toUpperCase()}
                </span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color, lineHeight: 1 }}>
                  {fmt(regionIge)}
                </span>
              </div>
            )}
            {/* Lang pills — compact on mobile */}
            <div style={{ display: 'flex', gap: 2 }}>
              {LANGS.map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    padding: '4px 7px',
                    borderRadius: 'var(--radius-pill)',
                    border: l === lang
                      ? '1px solid var(--ige-accent)'
                      : '1px solid var(--border-control)',
                    background: l === lang
                      ? 'rgba(95,208,200,0.15)'
                      : 'transparent',
                    color: l === lang ? 'var(--ige-accent)' : 'var(--text-label)',
                    cursor: 'pointer',
                    lineHeight: 1,
                  }}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: region select */}
        <RegionSelect regions={regions} value={selectedRegion} onValueChange={onRegionChange} />

        {/* Row 3: search */}
        <SearchInput
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder={t('search_placeholder')}
        />
      </div>

      {/* Search results overlay */}
      {search.trim() && (
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1, color: 'var(--text-label)', padding: '0 4px 6px' }}>
            {countries.length} {countries.length !== 1 ? t('results_many') : t('results_one')}
          </div>
          <Panel padding="6px 8px">
            {countries.slice(0, 20).map(({ iso, ige }) => (
              <CountryRow
                key={iso}
                iso={iso}
                ige={ige}
                selected={iso === selectedIso}
                onSelect={() => handleSelectCountry(iso)}
              />
            ))}
            {countries.length === 0 && (
              <div style={{ padding: '16px 10px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-label)', textAlign: 'center' }}>
                {t('no_results')}
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* Scrollable content */}
      {!search.trim() && (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <HeroSection iso={selectedIso} entry={selectedEntry} region={selectedCountryRegion} mobile />

          <Tabs.Root value={tab} onValueChange={setTab} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Tabs.List style={{
              display: 'flex', gap: 4,
              background: 'var(--surface-control)',
              border: '1px solid var(--border-control)',
              borderRadius: 'var(--radius-tile)',
              padding: 4,
            }}>
              {[
                { value: 'detalhe', label: t('tab_detail') },
                { value: 'ranking', label: t('tab_ranking') },
              ].map(tb => (
                <Tabs.Trigger
                  key={tb.value}
                  value={tb.value}
                  style={{
                    flex: 1, textAlign: 'center',
                    fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.5px',
                    padding: '9px', borderRadius: 8,
                    border: 'none', cursor: 'pointer',
                    color: 'var(--ige-text-dim)',
                    background: 'transparent',
                    transition: 'background .12s, color .12s',
                  }}
                >
                  {tb.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            <Tabs.Content value="detalhe" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <ChartSection timeSeries={timeSeries} mobile />
              <FactorsSection entry={selectedEntry} mobile />
            </Tabs.Content>

            <Tabs.Content value="ranking" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <RegionSummary region={region} summary={regionSummary} />
              <Panel padding="8px">
                {countries.map(({ iso, ige }) => (
                  <CountryRow
                    key={iso}
                    iso={iso}
                    ige={ige}
                    selected={iso === selectedIso}
                    onSelect={() => handleSelectCountry(iso)}
                  />
                ))}
              </Panel>
            </Tabs.Content>
          </Tabs.Root>
        </div>
      )}
      <div style={{ padding: '0 16px' }}>
        <Footer mobile />
      </div>
    </div>
  )
}
