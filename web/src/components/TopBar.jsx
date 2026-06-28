import { RegionSelect } from './ui/RegionSelect.jsx'
import { bandForScore } from '../lib/bands.js'
import { useLang } from '../lib/LangContext.js'
import { fmt } from '../lib/format.js'

const LANGS = ['en', 'es', 'pt']

export function TopBar({ regions, selectedRegion, onRegionChange, regionIge }) {
  const { lang, setLang, t, bandLabel } = useLang()
  const color = `var(--ige-band-${bandForScore(regionIge)})`
  const label = bandLabel(bandForScore(regionIge))

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
            {t('title')}
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--text-label)', letterSpacing: '0.5px', marginTop: 2,
          }}>
            {t('tagline')}
          </div>
        </div>
      </div>

      {/* Controls: region select + IGE badge + lang switcher */}
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
                {t('region_ige')}
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

        {/* Language switcher — three pills */}
        <div style={{ display: 'flex', gap: 4 }}>
          {LANGS.map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.08em',
                padding: '6px 10px',
                borderRadius: 'var(--radius-pill)',
                border: l === lang
                  ? '1px solid var(--ige-accent)'
                  : '1px solid var(--border-control)',
                background: l === lang
                  ? 'rgba(95,208,200,0.15)'
                  : 'var(--surface-control)',
                color: l === lang ? 'var(--ige-accent)' : 'var(--text-label)',
                cursor: 'pointer',
                transition: 'background .12s, color .12s, border-color .12s',
                lineHeight: 1,
              }}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
