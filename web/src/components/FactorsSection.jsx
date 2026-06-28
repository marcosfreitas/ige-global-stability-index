import { Panel, PanelHeader } from './ui/Panel.jsx'
import { FactorCard } from './ui/FactorCard.jsx'
import { BANDS } from '../lib/bands.js'
import { useLang } from '../lib/LangContext.js'
import { fmt, fmtInt } from '../lib/format.js'

function buildFactors(entry, t) {
  if (!entry) return []
  return [
    {
      key: 'inflation',
      label: t('inflation'),
      value: entry.inflation != null ? `${fmt(entry.inflation, 2)}%` : '—',
      highlight: false,
    },
    {
      key: 'gdp_growth',
      label: t('gdp'),
      value: entry.gdp_growth != null ? `${fmt(entry.gdp_growth, 2)}%` : '—',
      highlight: false,
    },
    {
      key: 'unemployment',
      label: t('unemployment'),
      value: entry.unemployment != null ? `${fmt(entry.unemployment, 1)}%` : '—',
      highlight: false,
    },
    {
      key: 'debt',
      label: t('debt'),
      value: entry.debt != null ? `${fmt(entry.debt, 1)}%` : '—',
      highlight: false,
    },
    {
      key: 'conflict_deaths',
      label: t('conflict'),
      value: entry.conflict_deaths != null ? fmtInt(entry.conflict_deaths) : '—',
      highlight: entry.conflict_deaths != null && entry.conflict_deaths > 0,
    },
    {
      key: 'governance_cpi',
      label: t('governance'),
      value: entry.governance_cpi != null ? String(entry.governance_cpi) : '—',
      highlight: false,
    },
  ]
}

export function FactorsSection({ entry, mobile = false, style }) {
  const { t, bandLabel } = useLang()
  if (!entry) return null
  const factors = buildFactors(entry, t)
  const missing = entry.data_quality || []
  const hasMissing = missing.length > 0

  return (
    <Panel padding={mobile ? '18px' : '24px 28px'} style={style}>
      <PanelHeader
        title={`${t('factors_label')} · ${entry.year}`}
        meta={entry.factors_used?.length ? entry.factors_used.join(' · ') : undefined}
      />

      {hasMissing && (
        <div style={{
          display: 'flex', gap: 12, alignItems: 'flex-start',
          background: 'rgba(216,168,75,0.08)',
          border: '1px solid rgba(216,168,75,0.3)',
          borderRadius: 'var(--radius-tile)',
          padding: '14px 18px',
          marginBottom: 18,
        }}>
          <span style={{ color: 'var(--ige-amber)', fontSize: 16, lineHeight: 1.2, flexShrink: 0 }}>⚠</span>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, color: 'var(--ige-amber)' }}>
              {t('incomplete_data')}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-body)', marginTop: 4, lineHeight: 1.5 }}>
              {`${t('missing_factors')}: ${missing.join(', ')}. ${t('rebalanced')}`}
            </div>
          </div>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: 14,
      }}>
        {factors.map(f => (
          <FactorCard key={f.key} label={f.label} value={f.value} highlight={f.highlight} />
        ))}
      </div>

      {/* Band legend — translated labels */}
      <div style={{
        display: 'flex', gap: 18, flexWrap: 'wrap',
        marginTop: 20, paddingTop: 18,
        borderTop: '1px solid var(--ige-divider)',
        flexDirection: mobile ? 'column' : 'row',
      }}>
        {BANDS.map(b => (
          <div key={b.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: b.color, flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-label)', letterSpacing: '0.5px' }}>
              {bandLabel(b.key)} · {b.range}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  )
}
