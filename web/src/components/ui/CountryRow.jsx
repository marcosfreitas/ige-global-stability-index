import { bandForScore, BAND_COLORS } from '../../lib/bands.js'
import { countryName } from '../../lib/constants.js'

export function CountryRow({ iso, ige, selected = false, onSelect, style }) {
  const score = ige ?? 0
  const color = BAND_COLORS[bandForScore(score)]
  const name = countryName(iso)
  return (
    <button
      onClick={onSelect}
      style={{
        all: 'unset',
        boxSizing: 'border-box',
        cursor: 'pointer',
        display: 'grid',
        gridTemplateColumns: '64px 1fr 44px',
        alignItems: 'center',
        gap: 12,
        padding: '11px 10px',
        borderRadius: 'var(--radius-control)',
        background: selected ? 'rgba(95,208,200,0.10)' : 'transparent',
        transition: 'background .12s',
        width: '100%',
        ...style,
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent' }}
    >
      <div>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14,
          lineHeight: 1.1,
          color: selected ? 'var(--ige-accent)' : 'var(--text-strong)',
        }}>
          {iso}
        </div>
        <div style={{
          fontSize: 10, color: 'var(--text-label)', lineHeight: 1.2,
          marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {name}
        </div>
      </div>
      <div style={{ height: 6, borderRadius: 4, background: 'var(--ige-track)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 4 }} />
      </div>
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15,
        textAlign: 'right',
        color: selected ? 'var(--ige-accent)' : 'var(--ige-text-code)',
      }}>
        {ige != null ? ige.toFixed(1) : '—'}
      </div>
    </button>
  )
}
