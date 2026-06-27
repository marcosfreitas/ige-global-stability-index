import { bandForScore } from '../../lib/bands.js'

const BAND_DEF = {
  crise:   { label: 'Crise',   color: 'var(--ige-band-crise)'   },
  atencao: { label: 'Atenção', color: 'var(--ige-band-atencao)' },
  estavel: { label: 'Estável', color: 'var(--ige-band-estavel)' },
  robusta: { label: 'Robusta', color: 'var(--ige-band-robusta)' },
}

export function BandTag({ band, score, label, style, ...rest }) {
  const key = band || bandForScore(score ?? 0)
  const b = BAND_DEF[key] || BAND_DEF.atencao
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: `color-mix(in srgb, ${b.color} 14%, transparent)`,
        border: `1px solid ${b.color}`,
        borderRadius: 'var(--radius-pill)',
        padding: '6px 13px',
        fontFamily: 'var(--font-mono)', fontSize: 12,
        letterSpacing: 1, textTransform: 'uppercase',
        color: b.color,
        ...style,
      }}
      {...rest}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
      {label || b.label}
    </span>
  )
}
