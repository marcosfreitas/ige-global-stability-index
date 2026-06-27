import * as Tabs from '@radix-ui/react-tabs'
import { RegionSelect } from './ui/RegionSelect.jsx'
import { RegionSummary } from './RegionSummary.jsx'
import { CountryList } from './CountryList.jsx'
import { HeroSection } from './HeroSection.jsx'
import { ChartSection } from './ChartSection.jsx'
import { FactorsSection } from './FactorsSection.jsx'
import { bandColor, bandLabel } from '../lib/bands.js'
import { fmt } from '../lib/format.js'

export function MobileLayout({
  regions, selectedRegion, onRegionChange, regionIge,
  regionSummary, region,
  countries, selectedIso, onSelectCountry,
  search, onSearch,
  selectedEntry, timeSeries,
  countryMap,
}) {
  const color = bandColor(regionIge)
  const label = bandLabel(regionIge)
  const selectedCountryRegion = countryMap[selectedIso]?.region

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minHeight: '100vh' }}>
      {/* Mobile header */}
      <div style={{
        padding: '16px 18px 14px',
        borderBottom: '1px solid var(--ige-divider)',
        background: 'var(--surface-card)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20,
            color: 'var(--ige-accent)', letterSpacing: '0.5px',
          }}>
            IGE
          </div>
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
        </div>
        <RegionSelect regions={regions} value={selectedRegion} onValueChange={onRegionChange} />
      </div>

      {/* Scrollable content */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
        {/* Hero */}
        <HeroSection iso={selectedIso} entry={selectedEntry} region={selectedCountryRegion} mobile />

        {/* Tabs */}
        <Tabs.Root defaultValue="detalhe" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Tabs.List style={{
            display: 'flex', gap: 4,
            background: 'var(--surface-control)',
            border: '1px solid var(--border-control)',
            borderRadius: 'var(--radius-tile)',
            padding: 4,
          }}>
            {[
              { value: 'detalhe', label: 'DETALHE' },
              { value: 'ranking', label: 'RANKING' },
            ].map(tab => (
              <Tabs.Trigger
                key={tab.value}
                value={tab.value}
                style={{
                  flex: 1, textAlign: 'center',
                  fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.5px',
                  padding: '9px',
                  borderRadius: 8,
                  border: 'none', cursor: 'pointer',
                  color: 'var(--ige-text-dim)',
                  background: 'transparent',
                  transition: 'background .12s, color .12s',
                }}
                /* Radix adds data-state=active; we use JS fallback via CSS custom prop trick */
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-strong)' }}
                onMouseLeave={e => {
                  if (e.currentTarget.getAttribute('data-state') !== 'active') {
                    e.currentTarget.style.color = 'var(--ige-text-dim)'
                  }
                }}
              >
                {tab.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <Tabs.Content value="detalhe" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ChartSection timeSeries={timeSeries} mobile />
            <FactorsSection entry={selectedEntry} mobile />
          </Tabs.Content>

          <Tabs.Content value="ranking" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <RegionSummary region={region} summary={regionSummary} />
            <CountryList
              countries={countries}
              selectedIso={selectedIso}
              onSelect={(iso) => { onSelectCountry(iso) }}
              search={search}
              onSearch={onSearch}
            />
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  )
}
