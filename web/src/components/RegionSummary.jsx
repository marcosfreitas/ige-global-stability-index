import { Panel } from './ui/Panel.jsx'
import { regionLabel } from '../lib/constants.js'
import { fmtSigned, fmtPct, fmtInt, fmt } from '../lib/format.js'
import { bandColor } from '../lib/bands.js'

export function RegionSummary({ region, summary, style }) {
  if (!summary) return null
  const { totalDeaths, inConflict, inCrise, medInflation, medGdp, medUnem, medIge, n } = summary

  const stats = [
    {
      label: 'Mortes',
      value: totalDeaths > 0 ? fmtInt(totalDeaths) : '0',
      color: totalDeaths > 0 ? 'var(--ige-alert-soft)' : 'var(--ige-text-code)',
    },
    {
      label: 'Conflito',
      value: inConflict > 0 ? `${inConflict} países` : '—',
      color: 'var(--ige-text-code)',
    },
    {
      label: 'Inflação',
      value: fmtPct(medInflation),
      color: medInflation != null && medInflation > 10 ? 'var(--ige-amber)' : 'var(--ige-text-code)',
    },
    {
      label: 'PIB',
      value: fmtSigned(medGdp),
      color: medGdp != null && medGdp < 0
        ? 'var(--ige-band-crise)'
        : medGdp != null && medGdp > 2
          ? 'var(--ige-band-estavel)'
          : 'var(--ige-text-code)',
    },
    {
      label: 'Desemprego',
      value: medUnem != null ? `${medUnem.toFixed(1)}%` : '—',
      color: 'var(--ige-text-code)',
    },
    {
      label: 'IGE médio',
      value: fmt(medIge),
      color: bandColor(medIge),
    },
  ]

  return (
    <Panel padding="22px" style={style}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '1.5px', color: 'var(--text-label)', textTransform: 'uppercase' }}>
        {regionLabel(region)}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-label)', marginTop: 5 }}>
        {n} países · ordenado por IGE
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px 12px', marginTop: 20 }}>
        {stats.map(s => (
          <div key={s.label}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.5px', color: 'var(--text-label)', textTransform: 'uppercase' }}>
              {s.label}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 19, marginTop: 3, color: s.color }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {inCrise > 0 && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 18,
          background: 'rgba(232,113,78,0.12)',
          border: '1px solid rgba(232,113,78,0.35)',
          borderRadius: 'var(--radius-pill)',
          padding: '6px 12px',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--ige-alert)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.5px', color: 'var(--ige-alert-soft)' }}>
            {inCrise} EM CRISE
          </span>
        </div>
      )}
    </Panel>
  )
}
