import { RegionSelect } from './ui/RegionSelect.jsx'
import { bandColor, bandLabel } from '../lib/bands.js'
import { fmt } from '../lib/format.js'

export function TopBar({ regions, selectedRegion, onRegionChange, regionIge }) {
  const color = bandColor(regionIge)
  const label = bandLabel(regionIge)
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 24, flexWrap: 'wrap',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-card)',
      borderRadius: 'var(--radius-panel)',
      padding: '18px 24px',
    }}>
      {/* Wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28,
          letterSpacing: 1, color: 'var(--ige-accent)', lineHeight: 1,
        }}>
          IGE
        </div>
        <div style={{ borderLeft: '1px solid var(--ige-divider)', paddingLeft: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text-body)', fontWeight: 600, lineHeight: 1.3 }}>
            Índice Global de Estabilidade
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--text-label)', letterSpacing: '0.5px', marginTop: 2,
          }}>
            259 PAÍSES · 1962–2025
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <RegionSelect regions={regions} value={selectedRegion} onValueChange={onRegionChange} />

        {regionIge != null && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'var(--surface-control)',
            border: '1px solid var(--border-control)',
            borderRadius: 'var(--radius-tile)',
            padding: '8px 16px',
          }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1, color: 'var(--text-label)' }}>
                IGE REGIONAL
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1, color, marginTop: 1 }}>
                {label.toUpperCase()}
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, lineHeight: 1, color }}>
              {fmt(regionIge)}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
