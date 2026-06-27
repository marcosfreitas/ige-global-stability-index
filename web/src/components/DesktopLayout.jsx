import { RegionSummary } from './RegionSummary.jsx'
import { CountryList } from './CountryList.jsx'
import { HeroSection } from './HeroSection.jsx'
import { ChartSection } from './ChartSection.jsx'
import { FactorsSection } from './FactorsSection.jsx'

export function DesktopLayout({
  region, regionSummary,
  countries, selectedIso, onSelectCountry,
  search, onSearch,
  selectedEntry, timeSeries,
  countryMap,
}) {
  const selectedRegion = countryMap[selectedIso]?.region
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'var(--layout-rail) 1fr',
      gap: 'var(--layout-gap)',
      alignItems: 'start',
    }}>
      {/* Left rail — sticky */}
      <aside style={{
        display: 'flex', flexDirection: 'column', gap: 18,
        position: 'sticky', top: 22,
      }}>
        <RegionSummary region={region} summary={regionSummary} />
        <CountryList
          countries={countries}
          selectedIso={selectedIso}
          onSelect={onSelectCountry}
          search={search}
          onSearch={onSearch}
          style={{ flex: 1 }}
        />
      </aside>

      {/* Main content */}
      <main style={{ display: 'flex', flexDirection: 'column', gap: 'var(--layout-gap)', minWidth: 0 }}>
        <HeroSection iso={selectedIso} entry={selectedEntry} region={selectedRegion} />
        <ChartSection timeSeries={timeSeries} />
        <FactorsSection entry={selectedEntry} />
      </main>
    </div>
  )
}
